import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import SelectorTemas from "@/components/docente/SelectorTemas";
import type { Materia, Tema } from "@/types/semilla";

export const metadata: Metadata = {
  title: "Configurar semana — Nexo Docente",
  description:
    "Selecciona los temas del catálogo SEP que evaluarás esta semana con tu grupo.",
};

export default async function PaginaConfigurar() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const rolNorm = (user.user_metadata?.rol as string | undefined)?.trim().toLowerCase() ?? "";
  if (rolNorm !== "docente" && rolNorm !== "directivo" && rolNorm !== "semilla.docente" && rolNorm !== "semilla.directivo") redirect("/acceso-denegado");

  // Admin client bypasea RLS — necesario porque las políticas RLS
  // de la tabla profesor pueden bloquear la lectura con anon key.
  const admin = createSupabaseAdminClient();

  // ── Obtener profesor y su grupo ───────────────────────────────────────
  const { data: profesor } = await admin
    .from("profesor")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  const { data: grupoData } = profesor
    ? await admin
        .from("grupo")
        .select("id")
        .eq("profesor_id", profesor.id)
        .limit(1)
        .maybeSingle()
    : { data: null };

  const grupoId = grupoData?.id as number | undefined;

  if (!grupoId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Configurar semana</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="font-medium text-amber-800">No tienes un grupo asignado.</p>
        </div>
      </div>
    );
  }

  // ── Semana activa del grupo ──────────────────────────────────────────
  const { data: semanaActiva } = await admin
    .from("semana")
    .select("id, numero_semana")
    .eq("grupo_id", grupoId)
    .eq("estado", "activa")
    .limit(1)
    .maybeSingle();

  if (!semanaActiva) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Configurar semana</h1>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-slate-600">No hay semana activa en este momento.</p>
          <p className="mt-1 text-sm text-slate-400">
            El administrador debe activar una semana antes de configurar los temas.
          </p>
        </div>
      </div>
    );
  }

  // ── Cargar catálogo de materias y temas desde Supabase ───────────────
  const { data: materiasData } = await admin
    .from("materia")
    .select("id, nombre")
    .order("nombre");

  const { data: temasData } = await admin
    .from("tema")
    .select("id, materia_id, nombre")
    .order("nombre");

  const materias: Omit<Materia, "clave">[] = (materiasData ?? []).map((m) => ({
    id: m.id,
    nombre: m.nombre,
  }));

  const temas: Omit<Tema, "bloque">[] = (temasData ?? []).map((t) => ({
    id: t.id,
    materia_id: t.materia_id,
    nombre: t.nombre,
  }));

  // ── Temas ya seleccionados para esta semana / grupo ──────────────────
  const { data: seleccionData } = await admin
    .from("semana_materia")
    .select("tema_id")
    .eq("semana_id", semanaActiva.id)
    .eq("grupo_id", grupoId);

  const seleccionActual = (seleccionData ?? []).map((s) => s.tema_id as number);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configurar semana</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Semana {semanaActiva.numero_semana} · Elige los temas que evaluarás esta semana
        </p>
      </div>

      {/* Aviso informativo */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <p className="text-sm text-blue-700">
          Solo se activarán los reactivos de los temas seleccionados para los alumnos de tu grupo esta semana.
        </p>
      </div>

      {/* Selector de temas */}
      {materias.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-slate-500">
            No hay materias en el catálogo aún. Coordina con el administrador.
          </p>
        </div>
      ) : (
        <SelectorTemas
          materias={materias}
          temas={temas}
          semanaId={semanaActiva.id}
          grupoId={grupoId}
          seleccionActual={seleccionActual}
        />
      )}
    </div>
  );
}
