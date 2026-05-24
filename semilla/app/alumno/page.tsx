import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel del Alumno — Semilla",
  description: "Tu espacio de aprendizaje semanal en Semilla, plataforma para Telesecundarias.",
};

export default async function AlumnoPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nombre = user?.email?.split("@")[0] ?? "estudiante";

  return (
    <div className="space-y-8">
      {/* Saludo */}
      <section className="s-card p-8 relative overflow-hidden">
        {/* Decoración */}
        <div
          aria-hidden
          className="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-15"
          style={{ background: "var(--s-orange)" }}
        />
        <div
          aria-hidden
          className="absolute -bottom-10 right-16 h-28 w-28 rounded-full opacity-10"
          style={{ background: "var(--s-navy)" }}
        />

        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--s-orange)" }}
        >
          Panel alumno
        </p>
        <h1
          className="mt-2 text-3xl font-bold capitalize"
          style={{ color: "var(--s-navy)" }}
        >
          ¡Hola, {nombre}! 👋
        </h1>
        <p className="mt-2 max-w-lg text-base" style={{ color: "var(--s-text-muted)" }}>
          Aquí puedes responder el quiz de esta semana, revisar tu avance y recibir
          retroalimentación personalizada.
        </p>
      </section>

      {/* Acciones rápidas */}
      <section className="grid gap-5 sm:grid-cols-2">
        {/* Quiz */}
        <Link
          href="/alumno/quiz"
          id="card-quiz"
          className="s-card group p-7 transition-transform hover:-translate-y-1 hover:shadow-xl block"
          style={{ borderColor: "var(--s-border)" }}
        >
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "var(--s-orange-lt)" }}
          >
            <svg
              className="h-6 w-6"
              style={{ color: "var(--s-orange)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
            </svg>
          </div>
          <h2 className="text-lg font-bold" style={{ color: "var(--s-navy)" }}>
            Quiz semanal
          </h2>
          <p className="mt-1.5 text-sm" style={{ color: "var(--s-text-muted)" }}>
            Responde las preguntas de esta semana y recibe orientación
            personalizada con IA si cometes un error.
          </p>
          <div
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: "var(--s-orange)" }}
          >
            Comenzar quiz
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </Link>

        {/* Progreso */}
        <Link
          href="/alumno/progreso"
          id="card-progreso"
          className="s-card group p-7 transition-transform hover:-translate-y-1 hover:shadow-xl block"
        >
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "var(--s-indigo-lt)" }}
          >
            <svg
              className="h-6 w-6"
              style={{ color: "var(--s-navy)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold" style={{ color: "var(--s-navy)" }}>
            Mi progreso
          </h2>
          <p className="mt-1.5 text-sm" style={{ color: "var(--s-text-muted)" }}>
            Consulta tus estadísticas de avance, nivel de dominio por materia y
            áreas donde necesitas reforzar.
          </p>
          <div
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: "var(--s-navy)" }}
          >
            Ver progreso
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </Link>
      </section>

      {/* Tip del día */}
      <section
        className="rounded-2xl border p-5"
        style={{ background: "var(--s-rose)", borderColor: "#FECDD3" }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--s-navy)" }}>
              Consejo de la semana
            </p>
            <p className="mt-0.5 text-sm" style={{ color: "#6B4F60" }}>
              Si cometes un error en el quiz, ¡no te preocupes! La IA te dará
              una pista personalizada para que lo intentes de nuevo y aprendas
              del proceso.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
