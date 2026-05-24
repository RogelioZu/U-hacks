import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import DiagnosticoGrupo from "@/components/docente/DiagnosticoGrupo";
import AlertaRiesgo from "@/components/docente/AlertaRiesgo";
import HistorialSemanas from "@/components/docente/HistorialSemanas";
import type { DiagnosticoAlumno } from "@/types/semilla";

export const metadata: Metadata = {
  title: "Tablero Docente — Semilla",
  description:
    "Diagnóstico semanal del grupo y alertas de alumnos en riesgo para docentes de Telesecundaria.",
};

export default async function PaginaTablero() {
  const supabase = await createSupabaseServerClient();

  // Verificar sesión y rol (segunda capa tras proxy.ts)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const rol = (user.user_metadata?.rol as string | undefined)?.trim().toLowerCase() ?? "";
  if (rol !== "docente" && rol !== "directivo" && rol !== "semilla.docente" && rol !== "semilla.directivo") redirect("/acceso-denegado");

  // Admin client bypasea RLS — necesario porque las políticas RLS
  // de la tabla profesor pueden bloquear la lectura con anon key.
  const admin = createSupabaseAdminClient();

  // ── Obtener el profesor autenticado ────────────────────────────────────
  const { data: profesor } = await admin
    .from("profesor")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profesor) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold" style={{ color: "var(--s-navy)" }}>Tablero docente</h1>
        <div
          className="rounded-2xl border p-6 text-center"
          style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}
        >
          <p className="font-medium" style={{ color: "#92400E" }}>
            No se encontró tu registro de profesor.
          </p>
        </div>
      </div>
    );
  }

  // ── Obtener el grupo del docente (grupo.profesor_id = profesor.id) ────
  const { data: grupo } = await admin
    .from("grupo")
    .select("id, nombre, grado")
    .eq("profesor_id", profesor.id)
    .limit(1)
    .maybeSingle();

  if (!grupo) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold" style={{ color: "var(--s-navy)" }}>Tablero docente</h1>
        <div
          className="rounded-2xl border p-6 text-center"
          style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}
        >
          <p className="font-medium" style={{ color: "#92400E" }}>
            No tienes un grupo asignado aún.
          </p>
          <p className="mt-1 text-sm" style={{ color: "#B45309" }}>
            Contacta al administrador para que te asigne un grupo.
          </p>
        </div>
      </div>
    );
  }

  // ── Obtener todas las semanas del grupo ────────────────────────────────
  const { data: todasSemanas } = await admin
    .from("semana")
    .select("id, numero_semana, fecha_inicio, fecha_fin, estado")
    .eq("grupo_id", grupo.id)
    .order("numero_semana", { ascending: false });

  const semanaActiva = todasSemanas?.find((s) => s.estado === "activa");
  const semanasCerradas = todasSemanas?.filter((s) => s.estado === "cerrada") ?? [];

  // ── Obtener alumnos del grupo ──────────────────────────────────────────
  const { data: alumnosData } = await admin
    .from("alumno")
    .select("id")
    .eq("grupo_id", grupo.id);
  const alumnoIds = alumnosData?.map((a) => a.id) ?? [];

  // ── Obtener todos los diagnósticos de los alumnos del grupo ────────────
  const { data: todosDiagnosticos } = await admin
    .from("diagnostico_alumno")
    .select(
      `
      id,
      alumno_id,
      semana_id,
      tema_id,
      nivel_dominio,
      requiere_repaso,
      tema:tema_id(materia:materia_id(nombre))
    `
    )
    .in("alumno_id", alumnoIds.length > 0 ? alumnoIds : [0]);

  // ── Obtener temas vistos históricamente ────────────────────────────────
  const { data: todosTemasVistos } = await admin
    .from("semana_materia")
    .select("semana_id, tema:tema_id(nombre)")
    .eq("grupo_id", grupo.id);

  // ── Procesar diagnóstico de la semana activa ───────────────────────────
  let diagnosticos: DiagnosticoAlumno[] = [];
  if (semanaActiva) {
    const datosDiag = (todosDiagnosticos ?? []).filter(
      (d) => d.semana_id === semanaActiva.id
    );

    diagnosticos = datosDiag.map((d, indice) => {
      // Extraer nombre de la materia desde tema -> materia -> nombre
      const temaData = d.tema as any;
      const materiaNombre = temaData?.materia?.nombre ?? "—";

      return {
        id: d.id,
        alumno_id: d.alumno_id,
        alias: `Alumno ${String(indice + 1).padStart(2, "0")}`,
        grupo_id: grupo.id,
        semana_id: d.semana_id,
        materia_id: d.tema_id, // Hack para usar tema_id donde espera materia_id
        materia_nombre: materiaNombre,
        nivel_dominio: d.nivel_dominio as 0 | 1 | 2 | 3,
        requiere_repaso: d.requiere_repaso,
      };
    });
  }

  const alumnosEnRiesgo = diagnosticos.filter((d) => d.requiere_repaso).length;
  const totalAlumnos = diagnosticos.length;

  const pctDominio =
    totalAlumnos > 0
      ? Math.round(
          (diagnosticos.filter((d) => d.nivel_dominio >= 2).length /
            totalAlumnos) *
            100
        )
      : null;

  // ── Procesar Historial de Semanas Cerradas ─────────────────────────────
  const historialSemanas = semanasCerradas.map((semana) => {
    const diags = (todosDiagnosticos ?? []).filter((d) => d.semana_id === semana.id);
    const temas = (todosTemasVistos ?? [])
      .filter((t) => t.semana_id === semana.id)
      .map((t) => ((t.tema as unknown) as { nombre: string })?.nombre)
      .filter(Boolean);

    const totalAlum = diags.length;
    const pctDom =
      totalAlum > 0
        ? Math.round((diags.filter((d) => d.nivel_dominio >= 2).length / totalAlum) * 100)
        : null;
    const enRiesgo = diags.filter((d) => d.requiere_repaso).length;

    return {
      id: semana.id,
      numero_semana: semana.numero_semana,
      fecha_inicio: semana.fecha_inicio,
      fecha_fin: semana.fecha_fin,
      pctDominio: pctDom,
      alumnosEnRiesgo: enRiesgo,
      totalAlumnos: totalAlum,
      temasVistos: temas,
    };
  });

  return (
    <div className="space-y-10">
      {/* SECCIÓN: SEMANA ACTUAL */}
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Tablero docente</h1>
            {grupo && (
              <p className="mt-0.5 text-sm text-slate-500">
                {grupo.nombre} · {semanaActiva ? `Semana ${semanaActiva.numero_semana}` : "Sin semana activa"}
              </p>
            )}
          </div>

          {/* Acciones rápidas */}
          <div className="flex gap-2">
            <Link
              href="/configurar"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configurar semana
            </Link>

            <Link
              href="/reporte"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
              Reporte CTE
            </Link>
          </div>
        </div>

        {totalAlumnos > 0 && semanaActiva && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Alumnos evaluados
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-800">
                {totalAlumnos}
              </p>
            </div>
            {pctDominio !== null && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Dominio grupal
                </p>
                <p className={`mt-1 text-3xl font-bold ${pctDominio >= 70 ? "text-green-600" : pctDominio >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {pctDominio}%
                </p>
              </div>
            )}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                En riesgo
              </p>
              <p className={`mt-1 text-3xl font-bold ${alumnosEnRiesgo === 0 ? "text-green-600" : "text-amber-600"}`}>
                {alumnosEnRiesgo}
              </p>
            </div>
          </div>
        )}

        <AlertaRiesgo alumnosEnRiesgo={alumnosEnRiesgo} totalAlumnos={totalAlumnos} />

        {!semanaActiva && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <p className="font-medium text-slate-600">No hay semana activa en este momento.</p>
            <p className="mt-1 text-sm text-slate-400">Cuando el administrador active una semana, aquí verás el diagnóstico del grupo.</p>
          </div>
        )}

        {semanaActiva && (
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-slate-700">Diagnóstico por alumno</h2>
            <DiagnosticoGrupo diagnosticos={diagnosticos} />
            <div className="flex flex-wrap gap-2 text-xs pt-2">
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-700">Inicio (0)</span>
              <span className="rounded-full bg-orange-100 px-2.5 py-1 text-orange-700">Básico (1)</span>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">Avanzado (2)</span>
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-green-700">Dominio (3)</span>
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN: HISTORIAL Y TRAZABILIDAD */}
      <hr className="border-slate-200" />
      
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Historial de Evaluaciones</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Semanas anteriores, temas evaluados y evolución del desempeño de tu grupo.
          </p>
        </div>
        
        <HistorialSemanas semanas={historialSemanas} />
      </div>
    </div>
  );
}
