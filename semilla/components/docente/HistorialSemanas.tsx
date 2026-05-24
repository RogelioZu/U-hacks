"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo } from "react";

export interface HistorialSemana {
  id: number;
  numero_semana: number;
  fecha_inicio: string;
  fecha_fin: string;
  pctDominio: number | null;
  alumnosEnRiesgo: number;
  totalAlumnos: number;
  temasVistos: string[];
}

// Paleta por nivel de desempeño, alineada a los tokens de Semilla.
function paletaDe(pct: number) {
  if (pct >= 70)
    return { from: "#34D399", to: "var(--s-success)", text: "#15803D" }; // sólido
  if (pct >= 50)
    return { from: "#FBBF24", to: "var(--s-warning)", text: "#B45309" }; // en progreso
  return { from: "#FB7185", to: "var(--s-error)", text: "#BE123C" }; // requiere apoyo
}

const fmtFecha = (f: string) =>
  new Date(f).toLocaleDateString("es-MX", { month: "short", day: "numeric" });

export default function HistorialSemanas({
  semanas,
}: {
  semanas: HistorialSemana[];
}) {
  // De la más antigua a la más reciente (eje X de izquierda a derecha).
  const semanasGrafico = useMemo(
    () => [...semanas].sort((a, b) => a.numero_semana - b.numero_semana),
    [semanas],
  );

  const conDato = useMemo(
    () => semanasGrafico.filter((s) => s.pctDominio !== null),
    [semanasGrafico],
  );

  const promedio = useMemo(() => {
    if (conDato.length === 0) return null;
    const suma = conDato.reduce((acc, s) => acc + (s.pctDominio ?? 0), 0);
    return Math.round(suma / conDato.length);
  }, [conDato]);

  // Tendencia: última semana con dato vs. la primera.
  const tendencia = useMemo(() => {
    if (conDato.length < 2) return null;
    return (
      (conDato[conDato.length - 1].pctDominio ?? 0) -
      (conDato[0].pctDominio ?? 0)
    );
  }, [conDato]);

  if (!semanas || semanas.length === 0) {
    return (
      <div className="s-card p-8 text-center">
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
        </div>
        <p className="font-semibold" style={{ color: "var(--s-navy)" }}>
          Aún no hay historial de evaluaciones
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--s-text-muted)" }}>
          Las semanas anteriores aparecerán aquí una vez que sean cerradas por
          el administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Gráfico de evolución ─────────────────────────────────── */}
      <div className="s-card p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3
              className="text-sm font-bold uppercase tracking-wide"
              style={{ color: "var(--s-navy)" }}
            >
              Evolución del dominio grupal
            </h3>
            <p
              className="mt-0.5 text-xs"
              style={{ color: "var(--s-text-muted)" }}
            >
              % de alumnos en nivel Avanzado o Dominio por semana
            </p>
          </div>

          <div className="flex items-center gap-2">
            {promedio !== null && (
              <span
                className="s-badge"
                style={{
                  background: "var(--s-indigo-lt)",
                  color: "var(--s-navy)",
                }}
              >
                Promedio {promedio}%
              </span>
            )}
            {tendencia !== null && (
              <span
                className="s-badge"
                style={
                  tendencia >= 0
                    ? { background: "#DCFCE7", color: "#15803D" }
                    : { background: "#FEE2E2", color: "#BE123C" }
                }
              >
                <span aria-hidden>{tendencia >= 0 ? "▲" : "▼"}</span>
                {Math.abs(tendencia)} pts
              </span>
            )}
          </div>
        </div>

        {/* Plot: eje Y + área de barras */}
        <div className="flex gap-3">
          {/* Eje Y */}
          <div
            className="flex h-48 flex-col justify-between py-0.5 text-[10px] font-semibold sm:h-56"
            style={{ color: "var(--s-text-muted)" }}
          >
            <span>100</span>
            <span>50</span>
            <span>0</span>
          </div>

          <div className="min-w-0 flex-1">
            {/* Área del plot */}
            <div className="relative">
              {/* Líneas de cuadrícula */}
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="border-t border-dashed"
                    style={{ borderColor: "var(--s-border)" }}
                  />
                ))}
              </div>

              {/* Línea de promedio */}
              {promedio !== null && (
                <div
                  className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                  style={{ bottom: `${promedio}%` }}
                >
                  <div
                    className="w-full border-t-2 border-dashed"
                    style={{ borderColor: "var(--s-orange)" }}
                  />
                  <span
                    className="ml-1 shrink-0 rounded px-1 text-[9px] font-bold leading-tight"
                    style={{
                      background: "var(--s-orange-lt)",
                      color: "var(--s-orange)",
                    }}
                  >
                    prom
                  </span>
                </div>
              )}

              {/* Barras */}
              <div className="relative z-10 flex h-48 items-end justify-between gap-2 sm:h-56">
                {semanasGrafico.map((semana, i) => {
                  const pct = semana.pctDominio ?? 0;
                  const pal = paletaDe(pct);
                  const sinDato = semana.pctDominio === null;

                  return (
                    <div
                      key={semana.id}
                      className="group semilla-fade-up flex h-full flex-1 flex-col items-center justify-end"
                      style={{ "--index": i } as CSSProperties}
                    >
                      {/* Valor */}
                      <span
                        className="mb-1.5 text-xs font-bold transition-transform group-hover:scale-110"
                        style={{ color: sinDato ? "var(--s-text-muted)" : pal.text }}
                      >
                        {sinDato ? "—" : `${pct}%`}
                      </span>

                      {/* Barra */}
                      <div
                        className="mx-auto w-full max-w-[34px] rounded-t-lg transition-all duration-500 ease-out group-hover:brightness-105"
                        style={{
                          height: `${Math.max(pct, 2)}%`,
                          background: sinDato
                            ? "var(--s-border)"
                            : `linear-gradient(180deg, ${pal.from}, ${pal.to})`,
                          boxShadow: sinDato
                            ? "none"
                            : "0 4px 10px -3px rgba(30,45,125,0.25)",
                        }}
                        title={sinDato ? "Sin datos" : `Semana ${semana.numero_semana}: ${pct}%`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Etiquetas eje X (alineadas con las barras) */}
            <div className="mt-2 flex justify-between gap-2">
              {semanasGrafico.map((semana) => (
                <span
                  key={semana.id}
                  className="flex-1 truncate text-center text-xs font-medium"
                  style={{ color: "var(--s-text-muted)" }}
                >
                  S{semana.numero_semana}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div
          className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-4 text-xs"
          style={{ borderColor: "var(--s-border)", color: "var(--s-text-muted)" }}
        >
          <LeyendaPunto color="var(--s-success)" texto="≥ 70% sólido" />
          <LeyendaPunto color="var(--s-warning)" texto="50–69% en progreso" />
          <LeyendaPunto color="var(--s-error)" texto="< 50% requiere apoyo" />
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-0 w-4 border-t-2 border-dashed"
              style={{ borderColor: "var(--s-orange)" }}
            />
            promedio del periodo
          </span>
        </div>
      </div>

      {/* ── Timeline de semanas ──────────────────────────────────── */}
      <div className="space-y-3">
        {semanas.map((semana, i) => {
          const pal = paletaDe(semana.pctDominio ?? 0);
          const sinDato = semana.pctDominio === null;

          return (
            <div
              key={semana.id}
              className="s-card semilla-fade-up flex flex-col gap-4 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between"
              style={{ "--index": i } as CSSProperties}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4
                    className="text-lg font-bold"
                    style={{ color: "var(--s-navy)" }}
                  >
                    Semana {semana.numero_semana}
                  </h4>
                  <span
                    className="s-badge"
                    style={
                      semana.alumnosEnRiesgo > 0
                        ? { background: "#FEF3C7", color: "#B45309" }
                        : { background: "#DCFCE7", color: "#15803D" }
                    }
                  >
                    {semana.alumnosEnRiesgo > 0
                      ? `${semana.alumnosEnRiesgo} requieren atención`
                      : "Sin alumnos en riesgo"}
                  </span>
                </div>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--s-text-muted)" }}
                >
                  {fmtFecha(semana.fecha_inicio)} – {fmtFecha(semana.fecha_fin)}
                </p>

                {/* Temas vistos */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {semana.temasVistos.length > 0 ? (
                    semana.temasVistos.map((tema, j) => (
                      <span
                        key={j}
                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
                        style={{
                          background: "var(--s-indigo-lt)",
                          color: "var(--s-navy)",
                        }}
                      >
                        {tema}
                      </span>
                    ))
                  ) : (
                    <span
                      className="text-xs italic"
                      style={{ color: "var(--s-text-muted)" }}
                    >
                      Sin temas registrados
                    </span>
                  )}
                </div>
              </div>

              <div
                className="flex items-center gap-5 border-t pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0"
                style={{ borderColor: "var(--s-border)" }}
              >
                {/* Indicador de dominio */}
                <div className="min-w-[88px]">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--s-text-muted)" }}
                  >
                    Dominio
                  </p>
                  <p
                    className="text-2xl font-bold leading-tight"
                    style={{ color: sinDato ? "var(--s-text-muted)" : pal.text }}
                  >
                    {sinDato ? "—" : `${semana.pctDominio}%`}
                  </p>
                  <div
                    className="mt-1 h-1.5 w-full overflow-hidden rounded-full"
                    style={{ background: "var(--s-indigo-lt)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${semana.pctDominio ?? 0}%`,
                        background: sinDato
                          ? "var(--s-border)"
                          : `linear-gradient(90deg, ${pal.from}, ${pal.to})`,
                      }}
                    />
                  </div>
                </div>

                <Link
                  href={`/semana/${semana.id}`}
                  className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition-colors"
                  style={{
                    background: "var(--s-indigo-lt)",
                    color: "var(--s-navy)",
                    border: "1.5px solid var(--s-border)",
                  }}
                >
                  Ver detalle
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeyendaPunto({ color, texto }: { color: string; texto: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
      {texto}
    </span>
  );
}
