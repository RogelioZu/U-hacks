import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import ReporteCTEEditor from "@/components/docente/ReporteCTEEditor";

export const metadata: Metadata = {
  title: "Reporte CTE — Semilla Docente",
  description:
    "Genera, revisa y firma el reporte del Consejo Técnico Escolar de tu grupo con apoyo de IA.",
};

export default async function PaginaReporte() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const rol = (user.user_metadata?.rol as string | undefined)?.trim().toLowerCase() ?? "";
  if (rol !== "docente" && rol !== "directivo" && rol !== "semilla.docente" && rol !== "semilla.directivo") redirect("/acceso-denegado");

  // Admin client bypasea RLS
  const admin = createSupabaseAdminClient();

  // ── Obtener profesor y su grupo ────────────────────────────────────────
  const { data: profesor } = await admin
    .from("profesor")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  const { data: grupo } = profesor
    ? await admin
        .from("grupo")
        .select("id, nombre")
        .eq("profesor_id", profesor.id)
        .limit(1)
        .maybeSingle()
    : { data: null };

  if (!grupo) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Reporte CTE</h1>
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
    .eq("grupo_id", grupo.id)
    .eq("estado", "activa")
    .limit(1)
    .maybeSingle();

  if (!semanaActiva) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Reporte CTE</h1>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-slate-600">No hay semana activa en este momento.</p>
          <p className="mt-1 text-sm text-slate-400">
            El reporte se puede generar cuando hay una semana activa con diagnósticos.
          </p>
        </div>
      </div>
    );
  }

  // ── Buscar borrador existente para esta semana/grupo ─────────────────
  const { data: reporteExistente, error: errorRep } = await admin
    .from("reporte")
    .select("id, contenido_ia, estado, enviado_at")
    .eq("semana_id", semanaActiva.id)
    .order("generado_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (errorRep) {
    console.error("[reporte/page] Error GET reporte:", errorRep);
  }

  const reporteInicial = reporteExistente
    ? {
        id: reporteExistente.id as number,
        contenido: reporteExistente.contenido_ia as string,
        estado: (reporteExistente.estado === "enviado" ? "firmado" : "borrador") as string,
        firmado_at: reporteExistente.enviado_at as string | null,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reporte CTE</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {grupo.nombre} · Semana {semanaActiva.numero_semana} ·{" "}
          {reporteInicial?.estado === "firmado"
            ? "Reporte firmado"
            : reporteInicial
              ? "Borrador generado — revisa y firma"
              : "Sin reporte — genera uno con IA"}
        </p>
      </div>

      {/* Qué es el CTE */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">¿Qué es el reporte CTE?</p>
            <p className="mt-0.5 text-xs text-slate-500">
              El Consejo Técnico Escolar (CTE) requiere un reporte mensual del avance del grupo.
              Semilla genera un borrador institucional a partir del diagnóstico de la semana.
              <strong className="text-slate-700"> Tú lo revisas, editas y firmas.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Editor principal: generación, edición y firma */}
      <ReporteCTEEditor
        grupoId={grupo.id}
        semanaId={semanaActiva.id}
        reporteInicial={reporteInicial}
      />
    </div>
  );
}
