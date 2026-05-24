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

  const rol = (user.user_metadata?.rol as string | undefined)?.trim().toLowerCase() ?? "";
  if (rol !== "docente" && rol !== "directivo" && rol !== "semilla.docente" && rol !== "semilla.directivo") {
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
    .select("id, numero_semana")
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

  const { data: alumnosData } = await supabaseAdmin
    .from("alumno")
    .select("id")
    .eq("grupo_id", grupoId);
  const alumnoIds = (alumnosData ?? []).map(a => a.id);

  // Diagnósticos del grupo para esa semana
  const { data: diagnosticos, error: errorDiag } = await supabaseAdmin
    .from("diagnostico_alumno")
    .select("id, nivel_dominio, requiere_repaso")
    .in("alumno_id", alumnoIds.length > 0 ? alumnoIds : [0])
    .eq("semana_id", semanaId);

  if (errorDiag) {
    console.error("[reportes/generar] Error diagnosticos:", errorDiag);
    return NextResponse.json(
      { error: `Error al consultar diagnósticos: ${errorDiag.message}` },
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

  // ── Buscar aplicaciones de la semana ───────────────────────────────────
  const { data: aplicaciones } = await supabaseAdmin
    .from("aplicacion")
    .select("id")
    .eq("semana_id", semanaId)
    .eq("grupo_id", grupoId);

  const appIds = (aplicaciones ?? []).map((a) => a.id);

  let erroresFrecuentes: string[] = ["Sin datos de errores frecuentes"];

  if (appIds.length > 0) {
    // Buscar preguntas aplicadas
    const { data: preguntasApli } = await supabaseAdmin
      .from("pregunta_aplicada")
      .select("id, pregunta:pregunta_id(texto_pregunta)")
      .in("aplicacion_id", appIds);

    const paMap = new Map();
    (preguntasApli ?? []).forEach((pa) => {
      paMap.set(pa.id, ((pa.pregunta as unknown) as { texto_pregunta: string })?.texto_pregunta ?? "Pregunta desconocida");
    });

    const paIds = Array.from(paMap.keys());

    if (paIds.length > 0) {
      // Buscar respuestas incorrectas
      const { data: respuestasInc } = await supabaseAdmin
        .from("respuesta_alumno")
        .select("pregunta_aplicada_id, respuesta_seleccionada")
        .eq("es_correcta", false)
        .in("pregunta_aplicada_id", paIds);

      if (respuestasInc && respuestasInc.length > 0) {
        // Agrupar por pregunta y respuesta
        const conteoErrores: Record<string, number> = {};
        respuestasInc.forEach((r) => {
          const textoPregunta = paMap.get(r.pregunta_aplicada_id);
          const key = `Pregunta: "${textoPregunta}" | Respondieron erróneamente: "${r.respuesta_seleccionada}"`;
          conteoErrores[key] = (conteoErrores[key] || 0) + 1;
        });

        // Tomar los 5 errores más comunes
        erroresFrecuentes = Object.entries(conteoErrores)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([desc, count]) => `${desc} (${count} alumnos)`);
      }
    }
  }

  // ── 4. Generar reporte con IA ──────────────────────────────────────────
  const datosSemana: DatosSemana = {
    nombreGrupo: grupo.nombre,
    numeroSemana: semana.numero_semana,
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
      semana_id: semanaId,
      tipo_reporte: "diagnostico_semanal",
      total_alumnos: totalAlumnos,
      pct_dominio: pctDominio,
      contenido_ia: contenidoReporte,
      estado: "borrador",
      generado_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (errorGuardar || !reporteGuardado) {
    console.error("[reportes/generar] Error guardar:", errorGuardar);
    return NextResponse.json(
      { error: `Error al guardar el reporte en la base de datos: ${errorGuardar?.message}` },
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

export async function GET() {
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
  const { data, error } = await supabaseAdmin.from("reporte").select("*").limit(1);
  return NextResponse.json({ info: "DB SCHEMA REPORT", data, error });
}

