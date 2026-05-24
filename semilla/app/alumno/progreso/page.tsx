import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import IlustracionSemilla from "@/components/IlustracionSemilla";
import type { Metadata } from "next";
import type { CSSProperties } from "react";

export const metadata: Metadata = {
  title: "Mi Progreso — Semilla",
  description: "Consulta tu avance, nivel de dominio y áreas a reforzar.",
};

// Escala de dominio (0–3). Una sola fuente de verdad para colores y etiquetas.
const NIVEL_LABEL: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: "Inicio", color: "#DC2626", bg: "#FEF2F2" },
  1: { label: "Básico", color: "#D97706", bg: "#FFFBEB" },
  2: { label: "Avanzado", color: "#2563EB", bg: "#EFF6FF" },
  3: { label: "Dominio", color: "#16A34A", bg: "#F0FDF4" },
};

// Color del puntaje global según rango de aciertos.
function colorPorPorcentaje(pct: number | null): string {
  if (pct === null) return "var(--s-navy)";
  if (pct >= 70) return "var(--s-success)";
  if (pct >= 50) return "var(--s-warning)";
  return "var(--s-error)";
}

// Anillo radial animado (puro SVG + CSS). Se rellena desde vacío al montar
// vía la utilidad .semilla-ring, que parte de stroke-dashoffset: var(--circ).
function AnilloDominio({ pct }: { pct: number | null }) {
  const size = 148;
  const stroke = 13;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const valor = pct ?? 0;
  const offset = circ * (1 - valor / 100);
  const color = colorPorPorcentaje(pct);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--s-indigo-lt)"
          strokeWidth={stroke}
        />
        {pct !== null && (
          <circle
            className="semilla-ring"
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ ["--circ" as string]: `${circ}px` } as CSSProperties}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums" style={{ color }}>
          {pct !== null ? `${pct}%` : "—"}
        </span>
        <span
          className="text-[0.65rem] font-semibold uppercase tracking-widest"
          style={{ color: "var(--s-text-muted)" }}
        >
          Aciertos
        </span>
      </div>
    </div>
  );
}

// Barra segmentada que comunica el nivel de dominio de un tema (0–3).
function BarraNivel({ nivel }: { nivel: number }) {
  const color = (NIVEL_LABEL[nivel] ?? NIVEL_LABEL[0]).color;
  return (
    <div className="grid grid-cols-4 gap-1" aria-hidden>
      {[0, 1, 2, 3].map((seg) => (
        <span
          key={seg}
          className="h-1.5 rounded-full transition-colors"
          style={{ background: seg <= nivel ? color : "var(--s-border)" }}
        />
      ))}
    </div>
  );
}

export default async function ProgresoPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createSupabaseAdminClient();

  // Diagnósticos reales del alumno (uno por tema evaluado).
  let diagnosticos: {
    tema_nombre: string;
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
      // El diagnóstico se guarda por tema; la materia se obtiene anidada vía tema.
      const { data: diagData } = await admin
        .from("diagnostico_alumno")
        .select(
          "nivel_dominio, requiere_repaso, tema:tema_id(nombre, materia:materia_id(nombre))"
        )
        .eq("alumno_id", alumnoData.id)
        .order("semana_id", { ascending: false })
        .limit(10);

      if (diagData) {
        diagnosticos = diagData.map((d) => {
          const tema = (d.tema as unknown) as
            | { nombre: string; materia: { nombre: string } | null }
            | null;
          return {
            tema_nombre: tema?.nombre ?? "—",
            materia_nombre: tema?.materia?.nombre ?? "—",
            nivel_dominio: d.nivel_dominio as number,
            requiere_repaso: d.requiere_repaso as boolean,
          };
        });
      }

      // Estadísticas globales de respuestas.
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

  // Temas a reforzar primero: el listado prioriza lo que requiere repaso.
  const temasReforzar = diagnosticos.filter((d) => d.requiere_repaso);
  const diagnosticosOrdenados = [...diagnosticos].sort(
    (a, b) =>
      Number(b.requiere_repaso) - Number(a.requiere_repaso) ||
      a.nivel_dominio - b.nivel_dominio
  );
  const nombre = user?.email?.split("@")[0] ?? "Estudiante";

  return (
    <div className="space-y-6">
      {/* ── Hero asimétrico: saludo + anillo de dominio ───────────────── */}
      <section
        className="s-card semilla-fade-up relative overflow-hidden p-7 sm:p-9"
        style={{ ["--index" as string]: 0 } as CSSProperties}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-[0.12] blur-2xl"
          style={{ background: "var(--s-navy)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full opacity-[0.10] blur-2xl"
          style={{ background: "var(--s-orange)" }}
        />

        <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-[44ch]">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{ background: "var(--s-indigo-lt)" }}
              >
                <IlustracionSemilla className="semilla-float h-6 w-6" />
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "var(--s-indigo-lt)", color: "var(--s-indigo)" }}
              >
                Mi progreso
              </span>
            </div>
            <h1
              className="mt-4 text-3xl font-bold tracking-tight md:text-4xl"
              style={{ color: "var(--s-navy)" }}
            >
              ¡Hola, {nombre}!
            </h1>
            <p className="mt-2 text-[0.95rem] leading-relaxed" style={{ color: "var(--s-text-muted)" }}>
              Mira cuánto has crecido. Cada respuesta te acerca un poco más, y
              aquí están los temas que vale la pena regar otra vez.
            </p>

            {totalRespuestasGlobal > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                <span
                  className="s-badge"
                  style={{ background: "var(--s-indigo-lt)", color: "var(--s-navy)" }}
                >
                  {totalRespuestasGlobal} respuestas
                </span>
                <span
                  className="s-badge"
                  style={{ background: "var(--s-indigo-lt)", color: "var(--s-navy)" }}
                >
                  {diagnosticos.length} temas evaluados
                </span>
              </div>
            )}
          </div>

          <div className="self-center semilla-pop md:self-auto">
            <AnilloDominio pct={pctDominio} />
          </div>
        </div>
      </section>

      {/* ── Métricas de apoyo (2 tiles, sin la tríada genérica) ───────── */}
      <section
        className="semilla-fade-up grid gap-5 sm:grid-cols-2"
        style={{ ["--index" as string]: 1 } as CSSProperties}
      >
        <div className="s-card flex items-center gap-4 p-6">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "var(--s-indigo-lt)" }}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="var(--s-navy)" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--s-navy)" }}>
              {totalRespuestasGlobal}
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--s-text-muted)" }}>
              Respuestas en total
            </p>
          </div>
        </div>

        <div className="s-card flex items-center gap-4 p-6">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: temasReforzar.length === 0 ? "#F0FDF4" : "var(--s-orange-lt)",
            }}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke={temasReforzar.length === 0 ? "var(--s-success)" : "var(--s-orange)"}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <p
              className="text-3xl font-bold tabular-nums"
              style={{ color: temasReforzar.length === 0 ? "var(--s-success)" : "var(--s-orange)" }}
            >
              {temasReforzar.length}
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--s-text-muted)" }}>
              {temasReforzar.length === 1 ? "Tema por reforzar" : "Temas por reforzar"}
            </p>
          </div>
        </div>
      </section>

      {/* ── Panel destacado: temas a reforzar ─────────────────────────── */}
      {temasReforzar.length > 0 && (
        <section
          className="semilla-fade-up relative overflow-hidden rounded-3xl p-6 sm:p-7"
          style={{
            ["--index" as string]: 2,
            background: "var(--s-orange-lt)",
            border: "1.5px solid #FFD4C7",
          } as CSSProperties}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: "#FFFFFF" }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="var(--s-orange)" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold" style={{ color: "var(--s-navy)" }}>
                Temas a reforzar
              </h2>
              <p className="mt-0.5 text-sm" style={{ color: "#9A4A33" }}>
                Estos temas necesitan otra práctica. ¡Un repaso y los dominas!
              </p>

              <ul className="mt-4 flex flex-wrap gap-2">
                {temasReforzar.map((d, i) => (
                  <li
                    key={i}
                    className="rounded-xl bg-white px-3 py-1.5 text-sm font-medium"
                    style={{ color: "var(--s-navy)", border: "1px solid #FFD4C7" }}
                  >
                    {d.tema_nombre}
                  </li>
                ))}
              </ul>

              <a href="/alumno/quiz" className="s-btn-primary mt-5 inline-flex">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Practicar ahora
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── Diagnóstico por tema ──────────────────────────────────────── */}
      <section
        className="s-card semilla-fade-up p-6 sm:p-7"
        style={{ ["--index" as string]: 3 } as CSSProperties}
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--s-navy)" }}>
            Diagnóstico por tema
          </h2>
          {/* Leyenda de niveles */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {Object.values(NIVEL_LABEL).map((n) => (
              <span key={n.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: n.color }} />
                <span className="text-xs font-medium" style={{ color: "var(--s-text-muted)" }}>
                  {n.label}
                </span>
              </span>
            ))}
          </div>
        </div>

        {diagnosticos.length === 0 ? (
          <div
            className="flex flex-col items-center rounded-2xl px-6 py-12 text-center"
            style={{ background: "var(--s-indigo-lt)" }}
          >
            <IlustracionSemilla className="semilla-float h-14 w-14" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed" style={{ color: "var(--s-text-muted)" }}>
              Aún no tienes diagnósticos registrados. Completa el quiz de esta
              semana para ver tu progreso aquí.
            </p>
            <a href="/alumno/quiz" className="s-btn-primary mt-5 inline-flex">
              Ir al quiz
            </a>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {diagnosticosOrdenados.map((d, i) => {
              const nivel = NIVEL_LABEL[d.nivel_dominio] ?? NIVEL_LABEL[0];
              return (
                <li
                  key={i}
                  className="semilla-fade-up flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-colors"
                  style={
                    {
                      ["--index" as string]: 4 + i,
                      background: "var(--s-surface)",
                      border: "1.5px solid var(--s-border)",
                      borderLeft: d.requiere_repaso
                        ? "4px solid var(--s-orange)"
                        : "1.5px solid var(--s-border)",
                    } as CSSProperties
                  }
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--s-text)" }}>
                      {d.tema_nombre}
                    </p>
                    <p className="truncate text-xs" style={{ color: "var(--s-text-muted)" }}>
                      {d.materia_nombre}
                    </p>
                    <div className="mt-2 max-w-[180px]">
                      <BarraNivel nivel={d.nivel_dominio} />
                    </div>
                  </div>
                  <span
                    className="s-badge shrink-0 text-xs"
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

      {/* ── Cierre motivacional con la mascota Semilla ────────────────── */}
      <section
        className="semilla-fade-up flex items-center gap-4 rounded-3xl p-6"
        style={
          {
            ["--index" as string]: 4 + diagnosticosOrdenados.length,
            background: "var(--s-rose)",
            border: "1.5px solid #FECDD3",
          } as CSSProperties
        }
      >
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "rgba(255,255,255,0.6)" }}
        >
          <IlustracionSemilla className="semilla-float h-9 w-9" />
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--s-navy)" }}>
            ¡Cada práctica cuenta!
          </p>
          <p className="mt-0.5 text-sm leading-relaxed" style={{ color: "#6B4F60" }}>
            El aprendizaje es un proceso. Sigue practicando cada semana y verás
            cómo tu dominio crece poco a poco. ¡Tú puedes!
          </p>
        </div>
      </section>
    </div>
  );
}
