import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import LibrosTexto from "@/components/alumno/LibrosTexto";
import IlustracionSemilla from "@/components/IlustracionSemilla";

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
    <div className="space-y-6">
      {/* ── Saludo cálido con la mascota Semilla ──────────────────────── */}
      <section
        className="s-card semilla-fade-up relative overflow-hidden p-7 sm:p-9"
        style={{ ["--index" as string]: 0 } as CSSProperties}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full opacity-[0.13] blur-2xl"
          style={{ background: "var(--s-orange)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 right-24 h-44 w-44 rounded-full opacity-[0.10] blur-2xl"
          style={{ background: "var(--s-navy)" }}
        />

        <div className="relative flex items-center gap-2.5">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{ background: "var(--s-orange-lt)" }}
          >
            <IlustracionSemilla className="semilla-float h-6 w-6" />
          </span>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: "var(--s-orange-lt)", color: "var(--s-orange)" }}
          >
            Tu espacio
          </span>
        </div>

        <h1
          className="relative mt-4 text-3xl font-bold capitalize tracking-tight md:text-4xl"
          style={{ color: "var(--s-navy)" }}
        >
          ¡Hola, {nombre}!
        </h1>
        <p className="relative mt-2 max-w-lg text-[0.95rem] leading-relaxed" style={{ color: "var(--s-text-muted)" }}>
          Qué bueno verte. Aquí respondes el quiz de la semana, revisas cómo vas
          y recibes pistas hechas para ti cuando algo se complica.
        </p>
      </section>

      {/* Libros de texto de Telesecundaria */}
      <div className="semilla-fade-up" style={{ ["--index" as string]: 1 } as CSSProperties}>
        <LibrosTexto />
      </div>

      {/* ── Acciones rápidas ──────────────────────────────────────────── */}
      <section className="grid gap-5 sm:grid-cols-2">
        {/* Quiz */}
        <Link
          href="/alumno/quiz"
          id="card-quiz"
          className="s-card semilla-fade-up group block p-7 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl"
          style={{ ["--index" as string]: 2 } as CSSProperties}
        >
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105"
            style={{ background: "var(--s-orange-lt)" }}
          >
            <svg
              className="h-6 w-6"
              style={{ color: "var(--s-orange)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
            </svg>
          </div>
          <h2 className="text-lg font-bold" style={{ color: "var(--s-navy)" }}>
            Quiz semanal
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--s-text-muted)" }}>
            Responde las preguntas de esta semana. Si algo no sale, la IA te da
            una pista pensada para ti y lo intentas de nuevo.
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
          className="s-card semilla-fade-up group block p-7 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl"
          style={{ ["--index" as string]: 3 } as CSSProperties}
        >
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105"
            style={{ background: "var(--s-indigo-lt)" }}
          >
            <svg
              className="h-6 w-6"
              style={{ color: "var(--s-navy)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold" style={{ color: "var(--s-navy)" }}>
            Mi progreso
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--s-text-muted)" }}>
            Mira tu nivel de dominio por tema y descubre dónde conviene regar un
            poco más para seguir creciendo.
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

      {/* ── Consejo de la semana ──────────────────────────────────────── */}
      <section
        className="semilla-fade-up flex items-start gap-4 rounded-3xl p-6"
        style={
          {
            ["--index" as string]: 4,
            background: "var(--s-rose)",
            border: "1.5px solid #FECDD3",
          } as CSSProperties
        }
      >
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "rgba(255,255,255,0.6)" }}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="var(--s-navy)" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--s-navy)" }}>
            Consejo de la semana
          </p>
          <p className="mt-0.5 text-sm leading-relaxed" style={{ color: "#6B4F60" }}>
            ¿Te equivocaste en el quiz? Tranqui, así se aprende. La IA te dará una
            pista personalizada para que lo intentes otra vez y te quede claro.
          </p>
        </div>
      </section>
    </div>
  );
}
