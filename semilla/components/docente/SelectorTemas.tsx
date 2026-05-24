"use client";

import { useState, useTransition } from "react";
import { guardarTemas } from "@/app/(docente)/acciones";
import type { Materia, Tema } from "@/types/semilla";

interface Props {
  materias: Materia[];
  temas: Tema[];
  semanaId: number;
  grupoId: number;
  // Temas que ya están seleccionados para esta semana
  seleccionActual: number[]; // ids de tema
}

export default function SelectorTemas({
  materias,
  temas,
  semanaId,
  grupoId,
  seleccionActual,
}: Props) {
  const [seleccionados, setSeleccionados] =
    useState<number[]>(seleccionActual);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Agrupar temas por materia para mostrarlos en secciones
  const temasPorMateria = materias.map((materia) => ({
    materia,
    temas: temas.filter((t) => t.materia_id === materia.id),
  }));

  function toggleTema(temaId: number) {
    setGuardado(false);
    setError(null);
    setSeleccionados((prev) =>
      prev.includes(temaId)
        ? prev.filter((id) => id !== temaId)
        : [...prev, temaId],
    );
  }

  function handleGuardar() {
    setError(null);
    setGuardado(false);

    startTransition(async () => {
      const resultado = await guardarTemas(grupoId, semanaId, seleccionados);
      if (resultado.exito) {
        setGuardado(true);
      } else {
        setError(resultado.error ?? "Error al guardar");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Instrucción */}
      <p className="text-sm text-slate-600">
        Selecciona los temas que evaluarás esta semana. Solo se activan los
        reactivos correspondientes a los temas seleccionados.
      </p>

      {/* Temas agrupados por materia */}
      <div className="space-y-4">
        {temasPorMateria.map(({ materia, temas: temasMateria }) => (
          <div
            key={materia.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            {/* Encabezado de materia */}
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <h4 className="text-sm font-semibold text-slate-700">
                {materia.nombre}
              </h4>
            </div>

            {/* Lista de temas */}
            <ul className="divide-y divide-slate-100">
              {temasMateria.length === 0 ? (
                <li className="px-4 py-3 text-xs text-slate-400">
                  Sin temas disponibles en esta materia.
                </li>
              ) : (
                temasMateria.map((tema) => {
                  const activo = seleccionados.includes(tema.id);
                  return (
                    <li key={tema.id}>
                      <label
                        htmlFor={`tema-${tema.id}`}
                        className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                          activo
                            ? "bg-blue-50 hover:bg-blue-100"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <input
                          id={`tema-${tema.id}`}
                          type="checkbox"
                          checked={activo}
                          onChange={() => toggleTema(tema.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">
                          {tema.nombre}
                        </span>
                        {tema.bloque && (
                          <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                            Bloque {tema.bloque}
                          </span>
                        )}
                      </label>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ))}
      </div>

      {/* Resumen de selección */}
      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
        <span>
          <strong className="text-slate-800">{seleccionados.length}</strong>{" "}
          {seleccionados.length === 1 ? "tema seleccionado" : "temas seleccionados"}
        </span>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {guardado && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Temas guardados correctamente.
        </div>
      )}

      {/* Botón de guardar */}
      <button
        id="btn-guardar-temas"
        onClick={handleGuardar}
        disabled={isPending}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Guardando...
          </span>
        ) : (
          "Confirmar selección de temas"
        )}
      </button>
    </div>
  );
}
