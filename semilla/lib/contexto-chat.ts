// Arma, EN EL SERVIDOR, el contexto que se inyecta al system prompt del chat.
//
// Todo se deriva del usuario autenticado (auth_user_id), nunca de datos que
// venga del cliente. Usa la service role para leer el diagnóstico — solo entra
// al prompt información agregada/curricular (temas y niveles), nunca PII como
// nombres o CURP. Cualquier fallo degrada con elegancia: el chat sigue sin
// contexto.

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { AudienciaChat } from "@/lib/gemini";

interface TemaEmbed {
  nombre: string | null;
  materia: { nombre: string | null } | null;
}

interface DiagRow {
  nivel_dominio: number;
  requiere_repaso: boolean;
  semana_id: number;
  alumno_id: number;
  tema: TemaEmbed | null;
}

function etiquetaTema(r: DiagRow): string {
  const tema = r.tema?.nombre ?? "Tema";
  const materia = r.tema?.materia?.nombre;
  return materia ? `${tema} (${materia})` : tema;
}

/** Deja una sola fila por tema: la del diagnóstico más reciente (mayor semana). */
function ultimoPorTema(rows: DiagRow[]): DiagRow[] {
  const porTema = new Map<string, DiagRow>();
  for (const r of rows) {
    const clave = r.tema?.nombre ?? `#${r.alumno_id}`;
    const previo = porTema.get(clave);
    if (!previo || r.semana_id > previo.semana_id) porTema.set(clave, r);
  }
  return [...porTema.values()];
}

export async function construirContextoChat(
  audiencia: AudienciaChat,
  authUserId: string,
): Promise<string | undefined> {
  try {
    const admin = createSupabaseAdminClient();
    return audiencia === "alumno"
      ? await contextoAlumno(admin, authUserId)
      : await contextoDocente(admin, authUserId);
  } catch {
    return undefined;
  }
}

type Admin = ReturnType<typeof createSupabaseAdminClient>;

async function contextoAlumno(
  admin: Admin,
  authUserId: string,
): Promise<string | undefined> {
  const { data: alumnoData } = await admin
    .from("alumno")
    .select("id, grupo:grupo_id(nombre, grado)")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  const alumno = alumnoData as unknown as
    | { id: number; grupo: { nombre: string; grado: number } | null }
    | null;
  if (!alumno) return undefined;

  const { data: filas } = await admin
    .from("diagnostico_alumno")
    .select(
      "nivel_dominio, requiere_repaso, semana_id, alumno_id, tema:tema_id(nombre, materia:materia_id(nombre))",
    )
    .eq("alumno_id", alumno.id);

  const diag = ultimoPorTema((filas as unknown as DiagRow[]) ?? []);
  if (diag.length === 0) return undefined;

  const reforzar = diag
    .filter((d) => d.requiere_repaso || d.nivel_dominio <= 1)
    .map(etiquetaTema);
  const domina = diag.filter((d) => d.nivel_dominio >= 2).map(etiquetaTema);

  const lineas = [
    alumno.grupo
      ? `El alumno cursa ${alumno.grupo.grado}° en el grupo ${alumno.grupo.nombre}.`
      : null,
    reforzar.length
      ? `Temas que conviene reforzar con él: ${reforzar.join("; ")}.`
      : null,
    domina.length ? `Temas que ya domina: ${domina.join("; ")}.` : null,
  ].filter(Boolean);

  return lineas.length ? lineas.join("\n") : undefined;
}

async function contextoDocente(
  admin: Admin,
  authUserId: string,
): Promise<string | undefined> {
  const { data: profesorData } = await admin
    .from("profesor")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  const profesor = profesorData as unknown as { id: number } | null;
  if (!profesor) return undefined;

  const { data: grupoData } = await admin
    .from("grupo")
    .select("id, nombre, grado")
    .eq("profesor_id", profesor.id)
    .eq("activo", true)
    .order("id")
    .limit(1)
    .maybeSingle();

  const grupo = grupoData as unknown as
    | { id: number; nombre: string; grado: number }
    | null;
  if (!grupo) return undefined;

  const { data: alumnosData } = await admin
    .from("alumno")
    .select("id")
    .eq("grupo_id", grupo.id)
    .eq("activo", true);

  const ids = ((alumnosData as unknown as { id: number }[]) ?? []).map(
    (a) => a.id,
  );
  if (ids.length === 0) {
    return `Grupo ${grupo.nombre} (${grupo.grado}°): aún sin alumnos registrados.`;
  }

  const { data: filas } = await admin
    .from("diagnostico_alumno")
    .select(
      "nivel_dominio, requiere_repaso, semana_id, alumno_id, tema:tema_id(nombre, materia:materia_id(nombre))",
    )
    .in("alumno_id", ids);

  const rows = (filas as unknown as DiagRow[]) ?? [];
  if (rows.length === 0) {
    return `Grupo ${grupo.nombre} (${grupo.grado}°) con ${ids.length} alumnos. Aún no hay diagnósticos calculados.`;
  }

  const evaluados = new Set(rows.map((r) => r.alumno_id)).size;
  const pctDominio = Math.round(
    (100 * rows.filter((r) => r.nivel_dominio >= 2).length) / rows.length,
  );
  const enRiesgo = new Set(
    rows.filter((r) => r.requiere_repaso).map((r) => r.alumno_id),
  ).size;

  const acumulado = new Map<string, { suma: number; n: number }>();
  for (const r of rows) {
    const clave = etiquetaTema(r);
    const e = acumulado.get(clave) ?? { suma: 0, n: 0 };
    e.suma += r.nivel_dominio;
    e.n += 1;
    acumulado.set(clave, e);
  }
  const debiles = [...acumulado.entries()]
    .map(([tema, v]) => ({ tema, prom: v.suma / v.n }))
    .sort((a, b) => a.prom - b.prom)
    .slice(0, 3)
    .map((d) => d.tema);

  return [
    `Grupo ${grupo.nombre} (${grupo.grado}°), ${ids.length} alumnos (${evaluados} con diagnóstico).`,
    `Dominio aprobatorio (nivel ≥ 2): ${pctDominio}% de los diagnósticos.`,
    `Alumnos que requieren repaso: ${enRiesgo}.`,
    debiles.length ? `Temas más débiles: ${debiles.join("; ")}.` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
