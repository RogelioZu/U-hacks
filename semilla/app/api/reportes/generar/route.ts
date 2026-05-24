import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { generarReporteCTE, type DatosSemana } from "@/lib/gemini";
import type { RespuestaGenerarReporte, ErrorApi } from "@/types/semilla";

// API route que genera un borrador de reporte CTE con IA.
// Solo accesible para docentes autenticados.
// Usa la service role key para leer datos sensibles sin restricción de RLS.
export async function POST(
  request: NextRequest,
): Promise<NextResponse<RespuestaGenerarReporte | ErrorApi>> {
  // ── 1. Verificar autenticación ─────────────────────────────────────────
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    },
  );

  const {
    data: { user },
    error: errorAuth,
  } = await supabaseAuth.auth.getUser();

  if (errorAuth || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const rol = (user.user_metadata?.rol as string | undefined) ?? "";
  if (rol !== "docente" && rol !== "directivo") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  // ── 2. Parsear cuerpo ──────────────────────────────────────────────────
  let grupoId: number;
  let semanaId: number;

  try {
    const cuerpo = await request.json();
    grupoId = Number(cuerpo.grupoId);
    semanaId = Number(cuerpo.semanaId);

    if (!grupoId || !semanaId || isNaN(grupoId) || isNaN(semanaId)) {
      return NextResponse.json(
        { error: "grupoId y semanaId son requeridos y deben ser números" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud inválido" },
      { status: 400 },
    );
  }

  // ── 3. Consultar datos con privilegios de servicio ─────────────────────
  // Service role omite RLS — solo para lectura de datos agregados en el servidor
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    },
  );

  // Datos del grupo
  const { data: grupo, error: errorGrupo } = await supabaseAdmin
    .from("grupo")
    .select("id, nombre, grado")
    .eq("id", grupoId)
    .single();

  if (errorGrupo || !grupo) {
    return NextResponse.json(
      { error: "Grupo no encontrado" },
      { status: 404 },
    );
  }

  // Datos de la semana
  const { data: semana, error: errorSemana } = await supabaseAdmin
    .from("semana")
    .select("id, numero")
    .eq("id", semanaId)
    .single();

  if (errorSemana || !semana) {
    return NextResponse.json(
      { error: "Semana no encontrada" },
      { status: 404 },
    );
  }

  // Temas evaluados en la semana
  const { data: semanasMaterias, error: errorSM } = await supabaseAdmin
    .from("semana_materia")
    .select("id, tema:tema_id(id, nombre)")
    .eq("grupo_id", grupoId)
    .eq("semana_id", semanaId);

  if (errorSM) {
    return NextResponse.json(
      { error: "Error al consultar temas de la semana" },
      { status: 500 },
    );
  }

  const temas = (semanasMaterias ?? []).map(
    (sm) => ((sm.tema as unknown) as { id: number; nombre: string } | null)?.nombre ?? "",
  );

  // Diagnósticos del grupo para esa semana
  const { data: diagnosticos, error: errorDiag } = await supabaseAdmin
    .from("diagnostico_alumno")
    .select("id, nivel_dominio, requiere_repaso")
    .eq("grupo_id", grupoId)
    .eq("semana_id", semanaId);

  if (errorDiag) {
    return NextResponse.json(
      { error: "Error al consultar diagnósticos" },
      { status: 500 },
    );
  }

  const totalAlumnos = (diagnosticos ?? []).length;
  const alumnosEnRiesgo = (diagnosticos ?? []).filter(
    (d) => d.requiere_repaso,
  ).length;
  const pctDominio =
    totalAlumnos === 0
      ? 0
      : Math.round(
          ((diagnosticos ?? []).filter((d) => d.nivel_dominio >= 2).length /
            totalAlumnos) *
            100,
        );

  // Errores frecuentes: alumnos con nivel_dominio 0 o 1
  const erroresFrecuentes =
    totalAlumnos > 0
      ? [
          `${(diagnosticos ?? []).filter((d) => d.nivel_dominio <= 1).length} alumnos con dominio insuficiente`,
        ]
      : ["Sin datos de errores frecuentes"];

  // ── 4. Generar reporte con IA ──────────────────────────────────────────
  const datosSemana: DatosSemana = {
    nombreGrupo: grupo.nombre,
    numeroSemana: semana.numero,
    temas: temas.length > 0 ? temas : ["Sin temas configurados"],
    totalAlumnos,
    pctDominio,
    alumnosEnRiesgo,
    erroresFrecuentes,
  };

  let contenidoReporte: string;
  try {
    contenidoReporte = await generarReporteCTE(datosSemana);
  } catch (errorIA) {
    const mensaje =
      errorIA instanceof Error ? errorIA.message : "Error desconocido de IA";
    return NextResponse.json(
      { error: `Error al generar reporte con IA: ${mensaje}` },
      { status: 502 },
    );
  }

  // ── 5. Guardar borrador en la tabla reporte ────────────────────────────
  // Buscar el id del profesor a partir del auth_user_id
  const { data: profesor } = await supabaseAdmin
    .from("profesor")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  const { data: reporteGuardado, error: errorGuardar } = await supabaseAdmin
    .from("reporte")
    .insert({
      grupo_id: grupoId,
      semana_id: semanaId,
      contenido: contenidoReporte,
      estado: "borrador",
      generado_at: new Date().toISOString(),
      docente_id: profesor?.id ?? null,
    })
    .select("id")
    .single();

  if (errorGuardar || !reporteGuardado) {
    return NextResponse.json(
      { error: "Error al guardar el reporte en la base de datos" },
      { status: 500 },
    );
  }

  // ── 6. Responder ───────────────────────────────────────────────────────
  return NextResponse.json(
    {
      reporteId: reporteGuardado.id,
      contenido: contenidoReporte,
    },
    { status: 201 },
  );
}
