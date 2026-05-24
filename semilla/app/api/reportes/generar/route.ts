import { NextResponse, type NextRequest } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from "@/lib/supabase/server";
import { generarReporteCTE, type DatosSemana } from "@/lib/gemini";

// POST /api/reportes/generar
// Body: { semanaId: number }
// Agrega los datos de la semana, genera un borrador de reporte CTE con IA y lo
// guarda como borrador. Solo para docentes/directivos autenticados.
//
// Lee datos del grupo con la service role (cruzan a varios alumnos); por eso la
// autorización se valida explícitamente aquí antes de usar el cliente admin.

interface Body {
  semanaId?: number;
}

const ROLES_PERMITIDOS = ["docente", "directivo"];

export async function POST(request: NextRequest) {
  // 1. Validar body
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const { semanaId } = body;
  if (typeof semanaId !== "number") {
    return NextResponse.json({ error: "Se requiere semanaId (número)." }, { status: 400 });
  }

  // 2. Autenticación + rol
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const rol = (user.user_metadata?.rol as string | undefined) ?? "";
  if (!ROLES_PERMITIDOS.includes(rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // 3. Reunir los datos de la semana (cliente admin: lectura agregada del grupo)
  const admin = createSupabaseAdminClient();

  const { data: semana, error: errSemana } = await admin
    .from("semana")
    .select("numero_semana, grupo:grupo_id(nombre)")
    .eq("id", semanaId)
    .single();

  if (errSemana || !semana) {
    return NextResponse.json({ error: "Semana no encontrada" }, { status: 404 });
  }

  // Diagnóstico por tema desde la vista agregada (sin nombres de alumnos).
  const { data: filas, error: errVista } = await admin
    .from("vista_diagnostico_grupo")
    .select("tema, pct_dominio, total_alumnos_evaluados, alumnos_requieren_repaso")
    .eq("semana_id", semanaId);

  if (errVista) {
    return NextResponse.json(
      { error: "No se pudo leer el diagnóstico del grupo" },
      { status: 500 },
    );
  }

  const temasFilas = filas ?? [];
  const temas = temasFilas.map((f) => f.tema);
  const totalAlumnos = temasFilas.reduce(
    (max, f) => Math.max(max, f.total_alumnos_evaluados ?? 0),
    0,
  );
  const pctDominio = temasFilas.length
    ? Math.round(temasFilas.reduce((s, f) => s + Number(f.pct_dominio ?? 0), 0) / temasFilas.length)
    : 0;

  // Alumnos distintos en riesgo (requiere_repaso) en la semana.
  const { data: enRiesgo } = await admin
    .from("diagnostico_alumno")
    .select("alumno_id")
    .eq("semana_id", semanaId)
    .eq("requiere_repaso", true);
  const alumnosEnRiesgo = new Set((enRiesgo ?? []).map((r) => r.alumno_id)).size;

  // Nota: el cálculo de "errores más frecuentes" (distractores más elegidos)
  // requiere una agregación dedicada sobre respuesta_alumno + pregunta; se deja
  // como mejora. El prompt maneja el caso vacío de forma elegante.
  const erroresFrecuentes: string[] = [];

  const datos: DatosSemana = {
    nombreGrupo:
      (semana.grupo as { nombre?: string } | null)?.nombre ?? "Grupo",
    numeroSemana: semana.numero_semana,
    temas,
    totalAlumnos,
    pctDominio,
    alumnosEnRiesgo,
    erroresFrecuentes,
  };

  // 4. Generar el borrador con IA
  let contenido: string;
  try {
    contenido = await generarReporteCTE(datos);
  } catch (e) {
    console.error("Error generando reporte CTE:", e);
    return NextResponse.json(
      { error: "No se pudo generar el reporte en este momento." },
      { status: 502 },
    );
  }

  // 5. Guardar como borrador
  const { data: reporte, error: errInsert } = await admin
    .from("reporte")
    .insert({
      semana_id: semanaId,
      tipo_reporte: "reporte_cte",
      total_alumnos: totalAlumnos,
      pct_dominio: pctDominio,
      contenido_ia: contenido,
      estado: "borrador",
    })
    .select("id")
    .single();

  if (errInsert) {
    // El borrador se generó aunque no se haya podido persistir: devuélvelo igual.
    console.error("No se pudo guardar el reporte:", errInsert);
    return NextResponse.json({ reporteId: null, contenido, datos });
  }

  return NextResponse.json({ reporteId: reporte.id, contenido, datos });
}
