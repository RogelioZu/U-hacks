import { redirect } from "next/navigation";
import Link from "next/link";
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from "@/lib/supabase/server";
import DiagnosticoGrupo from "@/components/docente/DiagnosticoGrupo";
import type { DiagnosticoAlumno } from "@/types/semilla";

export default async function PaginaDetalleSemana(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const semanaId = Number(params.id);

  if (isNaN(semanaId)) redirect("/tablero");

  const supabase = await createSupabaseServerClient();

  // Verificar sesión y rol
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rol =
    (user.user_metadata?.rol as string | undefined)?.trim().toLowerCase() ?? "";
  if (
    rol !== "docente" &&
    rol !== "directivo" &&
    rol !== "semilla.docente" &&
    rol !== "semilla.directivo"
  ) {
    redirect("/acceso-denegado");
  }

  const admin = createSupabaseAdminClient();

  // Obtener la semana en cuestión
  const { data: semana } = await admin
    .from("semana")
    .select("id, numero_semana, fecha_inicio, fecha_fin, estado, grupo_id")
    .eq("id", semanaId)
    .single();

  if (!semana) redirect("/tablero");

  // Obtener el grupo
  const { data: grupo } = await admin
    .from("grupo")
    .select("id, nombre, grado")
    .eq("id", semana.grupo_id)
    .single();
  // DESPUÉS
  const { data: alumnosData } = await admin
    .from("alumno")
    .select("id, nombre, apellidos") // ← añadir campos
    .eq("grupo_id", semana.grupo_id);
  const alumnoIds = (alumnosData ?? []).map((a) => a.id);

  // Mapa id → nombre completo para el paso siguiente
  const nombrePorId = Object.fromEntries(
    (alumnosData ?? []).map((a) => [a.id, `${a.nombre} ${a.apellidos}`]),
  );

  // Obtener diagnósticos
  const { data: datosDiag } = await admin
    .from("diagnostico_alumno")
    .select(
      `id, alumno_id, semana_id, tema_id, nivel_dominio, requiere_repaso, tema:tema_id(materia:materia_id(nombre))
    `,
    )
    .in("alumno_id", alumnoIds.length > 0 ? alumnoIds : [0])
    .eq("semana_id", semanaId);

  const diagnosticos: DiagnosticoAlumno[] = (datosDiag ?? []).map(
    (d, indice) => {
      const temaData = d.tema as any;
      const materiaNombre = temaData?.materia?.nombre ?? "—";

      return {
        id: d.id,
        alumno_id: d.alumno_id,
        alias:
          nombrePorId[d.alumno_id] ??
          `Alumno ${String(indice + 1).padStart(2, "0")}`,
        grupo_id: semana.grupo_id,
        semana_id: d.semana_id,
        materia_id: d.tema_id, // Hack
        materia_nombre: materiaNombre,
        nivel_dominio: d.nivel_dominio as 0 | 1 | 2 | 3,
        requiere_repaso: d.requiere_repaso,
      };
    },
  );

  // Obtener temas de esa semana
  const { data: temasData } = await admin
    .from("semana_materia")
    .select("tema:tema_id(nombre)")
    .eq("semana_id", semanaId);

  const temasVistos = (temasData ?? [])
    .map((t) => (t.tema as unknown as { nombre: string })?.nombre)
    .filter(Boolean);

  const totalAlumnos = diagnosticos.length;
  const pctDominio =
    totalAlumnos > 0
      ? Math.round(
          (diagnosticos.filter((d) => d.nivel_dominio >= 2).length /
            totalAlumnos) *
            100,
        )
      : null;

  return (
    <div className="space-y-6">
      {/* Botón Volver */}
      <div>
        <Link
          href="/tablero"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Volver al tablero
        </Link>
      </div>

      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Detalle Semana {semana.numero_semana}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {grupo?.nombre} ·{" "}
            {new Date(semana.fecha_inicio).toLocaleDateString("es-MX", {
              month: "long",
              day: "numeric",
            })}{" "}
            -{" "}
            {new Date(semana.fecha_fin).toLocaleDateString("es-MX", {
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stats e Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Temas Evaluados
          </h3>
          <div className="flex flex-wrap gap-2">
            {temasVistos.length > 0 ? (
              temasVistos.map((tema, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                >
                  {tema}
                </span>
              ))
            ) : (
              <span className="text-sm italic text-slate-400">
                No se registraron temas para esta semana.
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Dominio Grupal
          </p>
          <p
            className={`mt-2 text-4xl font-bold ${pctDominio && pctDominio >= 70 ? "text-green-600" : pctDominio && pctDominio >= 50 ? "text-amber-600" : "text-red-600"}`}
          >
            {pctDominio !== null ? `${pctDominio}%` : "-"}
          </p>
        </div>
      </div>

      {/* Tabla Diagnóstico */}
      <div className="space-y-2 mt-8">
        <h2 className="text-base font-semibold text-slate-700">
          Desempeño por alumno (Archivo Histórico)
        </h2>
        <DiagnosticoGrupo diagnosticos={diagnosticos} />
      </div>
    </div>
  );
}
