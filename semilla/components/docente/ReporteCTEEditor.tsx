"use client";

import { useState, useTransition } from "react";
import type { RespuestaGenerarReporte } from "@/types/semilla";

interface Props {
  grupoId: number;
  semanaId: number;
  reporteInicial: {
    id: number;
    contenido: string;
    estado: string;
    firmado_at: string | null;
  } | null;
}

// Componente cliente que maneja la generación, edición y firma del reporte CTE.
// El Server Component padre (PaginaReporte) le pasa el borrador existente si hay uno.
export default function ReporteCTEEditor({
  grupoId,
  semanaId,
  reporteInicial,
}: Props) {
  const [reporte, setReporte] = useState(reporteInicial);
  const [contenido, setContenido] = useState(reporteInicial?.contenido ?? "");
  const [isPendingGenerar, startTransitionGenerar] = useTransition();
  const [isPendingFirmar, startTransitionFirmar] = useTransition();
  const [errorGenerar, setErrorGenerar] = useState<string | null>(null);
  const [errorFirmar, setErrorFirmar] = useState<string | null>(null);

  const yaFirmado = reporte?.estado === "firmado";

  // ── Generar reporte con IA ──────────────────────────────────────────
  function handleGenerar() {
    setErrorGenerar(null);

    startTransitionGenerar(async () => {
      const respuesta = await fetch("/api/reportes/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grupoId, semanaId }),
      });

      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => ({}));
        setErrorGenerar(
          (data as { error?: string }).error ??
            "Error al generar el reporte. Intenta de nuevo.",
        );
        return;
      }

      const datos: RespuestaGenerarReporte = await respuesta.json();
      setReporte({
        id: datos.reporteId,
        contenido: datos.contenido,
        estado: "borrador",
        firmado_at: null,
      });
      setContenido(datos.contenido);
    });
  }

  // ── Firmar y guardar el reporte ──────────────────────────────────────
  function handleFirmar() {
    if (!reporte) return;
    setErrorFirmar(null);

    startTransitionFirmar(async () => {
      const respuesta = await fetch(`/api/reportes/${reporte.id}/firmar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido }),
      });

      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => ({}));
        setErrorFirmar(
          (data as { error?: string }).error ??
            "Error al firmar el reporte. Intenta de nuevo.",
        );
        return;
      }

      const ahora = new Date().toISOString();
      setReporte((prev) =>
        prev ? { ...prev, contenido, estado: "firmado", firmado_at: ahora } : prev,
      );
    });
  }

  return (
    <div className="space-y-5">
      {/* Estado: sin reporte aún */}
      {!reporte && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                />
              </svg>
            </div>
            <p className="font-medium text-slate-700">
              No hay reporte generado para esta semana.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Gemini analizará el diagnóstico de tu grupo y generará un borrador
              institucional listo para revisar.
            </p>
          </div>

          {errorGenerar && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorGenerar}
            </div>
          )}

          <button
            id="btn-generar-reporte"
            onClick={handleGenerar}
            disabled={isPendingGenerar}
            className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPendingGenerar ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generando con IA... (puede tardar unos segundos)
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Generar reporte CTE con IA
              </span>
            )}
          </button>
        </div>
      )}

      {/* Estado: reporte generado / editable */}
      {reporte && (
        <div className="space-y-4">
          {/* Aviso de autoría */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-amber-800">
              <strong>Revisa el contenido antes de firmar.</strong> La IA genera un
              borrador de apoyo; tú eres el responsable del contenido final del reporte.
            </p>
          </div>

          {/* Estado firmado */}
          {yaFirmado && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-green-800">Reporte firmado</p>
                {reporte.firmado_at && (
                  <p className="text-xs text-green-600">
                    {new Date(reporte.firmado_at).toLocaleString("es-MX", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Editor de contenido */}
          <div className="space-y-1.5">
            <label
              htmlFor="contenido-reporte"
              className="block text-sm font-medium text-slate-700"
            >
              Contenido del reporte
              {!yaFirmado && (
                <span className="ml-2 text-xs font-normal text-slate-400">
                  (editable)
                </span>
              )}
            </label>
            <textarea
              id="contenido-reporte"
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              disabled={yaFirmado}
              rows={18}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="El contenido del reporte aparecerá aquí..."
            />
          </div>

          {/* Errores */}
          {errorFirmar && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorFirmar}
            </div>
          )}

          {/* Botones de acción */}
          {!yaFirmado && (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {/* Regenerar */}
              <button
                id="btn-regenerar-reporte"
                onClick={handleGenerar}
                disabled={isPendingGenerar || isPendingFirmar}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPendingGenerar ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Regenerando...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Regenerar con IA
                  </>
                )}
              </button>

              {/* Firmar */}
              <button
                id="btn-firmar-reporte"
                onClick={handleFirmar}
                disabled={isPendingFirmar || isPendingGenerar || !contenido.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPendingFirmar ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Firmando...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Firmar y guardar
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
