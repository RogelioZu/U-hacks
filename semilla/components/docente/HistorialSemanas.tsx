"use client";

import Link from "next/link";
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

export default function HistorialSemanas({ semanas }: { semanas: HistorialSemana[] }) {
  // Ordenar de la más antigua a la más reciente para el gráfico de evolución (de izquierda a derecha)
  const semanasGrafico = useMemo(() => {
    return [...semanas].sort((a, b) => a.numero_semana - b.numero_semana);
  }, [semanas]);

  if (!semanas || semanas.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="font-medium text-slate-600">No hay historial de evaluaciones.</p>
        <p className="mt-1 text-sm text-slate-400">
          Las semanas anteriores aparecerán aquí una vez que sean cerradas por el administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Gráfico Visual de Evolución */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-6">
          Evolución del Dominio Grupal
        </h3>
        
        <div className="flex items-end justify-between gap-2 h-48 sm:h-56">
          {semanasGrafico.map((semana) => {
            const pct = semana.pctDominio ?? 0;
            // Determinamos el color basado en el porcentaje
            let colorClase = "bg-red-500";
            if (pct >= 70) colorClase = "bg-green-500";
            else if (pct >= 50) colorClase = "bg-amber-500";

            return (
              <div key={semana.id} className="flex flex-col items-center flex-1 group">
                {/* Porcentaje flotante */}
                <span className="text-xs font-bold text-slate-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {pct}%
                </span>
                
                {/* Barra */}
                <div className="relative w-full max-w-[40px] bg-slate-100 rounded-t-md h-full flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ease-out ${colorClase}`}
                    style={{ height: `${pct}%` }}
                  ></div>
                </div>
                
                {/* Etiqueta Eje X */}
                <span className="text-xs text-slate-500 mt-2 font-medium truncate">
                  Sem {semana.numero_semana}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista / Timeline de Semanas */}
      <div className="space-y-4">
        {semanas.map((semana) => (
          <div
            key={semana.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-800 text-lg">Semana {semana.numero_semana}</h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    semana.alumnosEnRiesgo > 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {semana.alumnosEnRiesgo} en riesgo
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {new Date(semana.fecha_inicio).toLocaleDateString("es-MX", { month: "short", day: "numeric" })} - {" "}
                {new Date(semana.fecha_fin).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
              </p>

              {/* Temas Vistos */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {semana.temasVistos.length > 0 ? (
                  semana.temasVistos.map((tema, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                    >
                      {tema}
                    </span>
                  ))
                ) : (
                  <span className="text-xs italic text-slate-400">Sin temas registrados</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 sm:pl-4 sm:border-l border-slate-100">
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Dominio
                </p>
                <p className="text-xl font-bold text-slate-700">
                  {semana.pctDominio !== null ? `${semana.pctDominio}%` : "-"}
                </p>
              </div>

              <Link
                href={`/semana/${semana.id}`}
                className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                Ver Detalle
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
