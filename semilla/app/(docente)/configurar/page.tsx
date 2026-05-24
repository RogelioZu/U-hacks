import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SelectorTemas from "@/components/docente/SelectorTemas";
import type { Materia, Tema } from "@/types/nexo";

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

  const rol = (user.user_metadata?.rol as string | undefined) ?? "";
  if (rol !== "docente" && rol !== "directivo") redirect("/acceso-denegado");

  // ── Obtener grupo del docente ────────────────────────────────────────
  const { data: profesor } = await supabase
    .from("profesor")
    .select("id, grupo_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profesor?.grupo_id) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Configurar semana</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="font-medium text-amber-800">No tienes un grupo asignado.</p>
        </div>
      </div>
    );
  }

  // ── Semana activa ────────────────────────────────────────────────────
  const { data: semanaActiva } = await supabase
    .from("semana")
    .select("id, numero")
    .eq("activa", true)
    .single();

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
  const { data: materiasData } = await supabase
    .from("materia")
    .select("id, nombre, clave")
    .order("nombre");

  const { data: temasData } = await supabase
    .from("tema")
    .select("id, materia_id, nombre, bloque")
    .order("bloque")
    .order("nombre");

  const materias: Materia[] = (materiasData ?? []).map((m) => ({
    id: m.id,
    nombre: m.nombre,
    clave: m.clave,
  }));

  const temas: Tema[] = (temasData ?? []).map((t) => ({
    id: t.id,
    materia_id: t.materia_id,
    nombre: t.nombre,
    bloque: t.bloque,
  }));

  // ── Temas ya seleccionados para esta semana / grupo ──────────────────
  const { data: seleccionData } = await supabase
    .from("semana_materia")
    .select("tema_id")
    .eq("semana_id", semanaActiva.id)
    .eq("grupo_id", profesor.grupo_id);

  const seleccionActual = (seleccionData ?? []).map((s) => s.tema_id as number);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configurar semana</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Semana {semanaActiva.numero} · Elige los temas que evaluarás esta semana
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
          grupoId={profesor.grupo_id}
          seleccionActual={seleccionActual}
        />
      )}
    </div>
  );
}
