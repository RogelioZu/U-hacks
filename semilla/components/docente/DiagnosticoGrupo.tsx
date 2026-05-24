import type { DiagnosticoAlumno } from "@/types/semilla";

// Mapa de niveles de dominio → etiqueta y color visual
const NIVEL_CONFIG: Record<
  number,
  { etiqueta: string; claseInsignia: string; claseTexto: string }
> = {
  0: {
    etiqueta: "Inicio",
    claseInsignia: "bg-red-100 border border-red-300",
    claseTexto: "text-red-700",
  },
  1: {
    etiqueta: "Básico",
    claseInsignia: "bg-orange-100 border border-orange-300",
    claseTexto: "text-orange-700",
  },
  2: {
    etiqueta: "Avanzado",
    claseInsignia: "bg-blue-100 border border-blue-300",
    claseTexto: "text-blue-700",
  },
  3: {
    etiqueta: "Dominio",
    claseInsignia: "bg-green-100 border border-green-300",
    claseTexto: "text-green-700",
  },
};

interface Props {
  diagnosticos: DiagnosticoAlumno[];
}

export default function DiagnosticoGrupo({ diagnosticos }: Props) {
  if (diagnosticos.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <svg
            className="h-6 w-6 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600">
          Sin diagnósticos disponibles para esta semana.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Los resultados aparecerán cuando los alumnos completen el quiz.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Encabezado de la tabla */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">
            Resultados del grupo
          </h3>
          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {diagnosticos.length} alumnos
          </span>
        </div>
      </div>

      {/* Tabla — responsive: scroll horizontal en móvil */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Alumno
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Materia
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nivel
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                Repaso
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {diagnosticos.map((d) => {
              const nivel = NIVEL_CONFIG[d.nivel_dominio] ?? NIVEL_CONFIG[0];
              const enRiesgo = d.requiere_repaso;

              return (
                <tr
                  key={d.id}
                  className={
                    enRiesgo
                      ? "bg-amber-50 hover:bg-amber-100 transition-colors"
                      : "hover:bg-slate-50 transition-colors"
                  }
                >
                  {/* Alias del alumno — nunca nombre completo */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                        {d.alias.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-800">
                        {d.alias}
                      </span>
                    </div>
                  </td>

                  {/* Materia */}
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {d.materia_nombre}
                  </td>

                  {/* Nivel de dominio con insignia */}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${nivel.claseInsignia} ${nivel.claseTexto}`}
                    >
                      {nivel.etiqueta}
                    </span>
                  </td>

                  {/* Indicador de repaso requerido */}
                  <td className="px-4 py-3 text-center">
                    {enRiesgo ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <svg
                          className="h-3 w-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Sí
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        <svg
                          className="h-3 w-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        No
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
