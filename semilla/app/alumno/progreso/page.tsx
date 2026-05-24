import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Progreso — Semilla",
  description: "Consulta tu avance, nivel de dominio y áreas a reforzar.",
};

export default async function ProgresoPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createSupabaseAdminClient();

  // Obtener diagnósticos reales del alumno
  let diagnosticos: {
    materia_nombre: string;
    nivel_dominio: number;
    requiere_repaso: boolean;
  }[] = [];

  let totalCorrectasGlobal = 0;
  let totalRespuestasGlobal = 0;

  if (user) {
    const { data: alumnoData } = await admin
      .from("alumno")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (alumnoData) {
      // Diagnósticos más recientes del alumno
      const { data: diagData } = await admin
        .from("diagnostico_alumno")
        .select("nivel_dominio, requiere_repaso, materia:materia_id(nombre)")
        .eq("alumno_id", alumnoData.id)
        .order("semana_id", { ascending: false })
        .limit(10);

      if (diagData) {
        diagnosticos = diagData.map((d) => ({
          materia_nombre:
            ((d.materia as unknown) as { nombre: string } | null)?.nombre ?? "—",
          nivel_dominio: d.nivel_dominio as number,
          requiere_repaso: d.requiere_repaso as boolean,
        }));
      }

      // Estadísticas globales de respuestas
      const { data: respuestasData } = await admin
        .from("respuesta_alumno")
        .select("es_correcta")
        .eq("alumno_id", alumnoData.id);

      if (respuestasData) {
        totalRespuestasGlobal = respuestasData.length;
        totalCorrectasGlobal = respuestasData.filter((r) => r.es_correcta).length;
      }
    }
  }

  const pctDominio =
    totalRespuestasGlobal > 0
      ? Math.round((totalCorrectasGlobal / totalRespuestasGlobal) * 100)
      : null;

  const alumnosEnRiesgo = diagnosticos.filter((d) => d.requiere_repaso);

  const NIVEL_LABEL: Record<number, { label: string; color: string; bg: string }> = {
    0: { label: "Inicio", color: "#DC2626", bg: "#FEF2F2" },
    1: { label: "Básico", color: "#D97706", bg: "#FFFBEB" },
    2: { label: "Avanzado", color: "#2563EB", bg: "#EFF6FF" },
    3: { label: "Dominio", color: "#16A34A", bg: "#F0FDF4" },
  };

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <section className="s-card p-8 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10"
          style={{ background: "var(--s-navy)" }}
        />
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--s-indigo)" }}
        >
          Mi progreso
        </p>
        <h1 className="mt-2 text-3xl font-bold" style={{ color: "var(--s-navy)" }}>
          {user?.email?.split("@")[0] ?? "Estudiante"}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--s-text-muted)" }}>
          Aquí ves tu avance acumulado y los temas que conviene reforzar.
        </p>
      </section>

      {/* Estadísticas globales */}
      <section className="grid gap-5 sm:grid-cols-3">
        <div className="s-card p-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--s-text-muted)" }}>
            Respuestas totales
          </p>
          <p className="mt-3 text-4xl font-bold" style={{ color: "var(--s-navy)" }}>
            {totalRespuestasGlobal}
          </p>
        </div>

        <div className="s-card p-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--s-text-muted)" }}>
            Aciertos globales
          </p>
          <p
            className="mt-3 text-4xl font-bold"
            style={{
              color:
                pctDominio === null
                  ? "var(--s-navy)"
                  : pctDominio >= 70
                  ? "var(--s-success)"
                  : pctDominio >= 50
                  ? "var(--s-warning)"
                  : "var(--s-error)",
            }}
          >
            {pctDominio !== null ? `${pctDominio}%` : "—"}
          </p>
        </div>

        <div className="s-card p-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--s-text-muted)" }}>
            Temas a reforzar
          </p>
          <p
            className="mt-3 text-4xl font-bold"
            style={{
              color:
                alumnosEnRiesgo.length === 0
                  ? "var(--s-success)"
                  : "var(--s-warning)",
            }}
          >
            {alumnosEnRiesgo.length}
          </p>
        </div>
      </section>

      {/* Diagnóstico por materia */}
      <section className="s-card p-6">
        <h2 className="text-lg font-bold mb-5" style={{ color: "var(--s-navy)" }}>
          Diagnóstico por materia
        </h2>

        {diagnosticos.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "var(--s-indigo-lt)" }}
          >
            <p className="text-sm" style={{ color: "var(--s-text-muted)" }}>
              Aún no tienes diagnósticos registrados. Completa el quiz de esta
              semana para ver tu progreso aquí.
            </p>
            <a href="/alumno/quiz" className="s-btn-primary mt-4 inline-flex">
              Ir al quiz
            </a>
          </div>
        ) : (
          <ul className="space-y-3">
            {diagnosticos.map((d, i) => {
              const nivel = NIVEL_LABEL[d.nivel_dominio] ?? NIVEL_LABEL[0];
              return (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-xl px-4 py-3 border"
                  style={{
                    background: d.requiere_repaso ? "#FFFBEB" : "var(--s-surface)",
                    borderColor: d.requiere_repaso ? "#FDE68A" : "var(--s-border)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {d.requiere_repaso && (
                      <span title="Requiere repaso">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: "var(--s-warning)" }}>
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                    <span className="text-sm font-medium" style={{ color: "var(--s-text)" }}>
                      {d.materia_nombre}
                    </span>
                  </div>
                  <span
                    className="s-badge text-xs"
                    style={{ background: nivel.bg, color: nivel.color }}
                  >
                    {nivel.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Aliento */}
      <section
        className="rounded-2xl border p-5"
        style={{ background: "var(--s-rose)", borderColor: "#FECDD3" }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">🌱</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--s-navy)" }}>
              ¡Cada práctica cuenta!
            </p>
            <p className="mt-0.5 text-sm" style={{ color: "#6B4F60" }}>
              El aprendizaje es un proceso. Sigue practicando cada semana y
              verás cómo tu dominio crece poco a poco. ¡Tú puedes!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
