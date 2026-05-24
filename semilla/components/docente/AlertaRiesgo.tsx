interface Props {
  alumnosEnRiesgo: number;
  totalAlumnos?: number;
}

// Banner de alerta que indica cuántos alumnos requieren atención esta semana.
// Muestra estado positivo cuando todos están bien.
export default function AlertaRiesgo({ alumnosEnRiesgo, totalAlumnos }: Props) {
  if (alumnosEnRiesgo === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        {/* Ícono de check */}
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-5 w-5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-green-800">
            ¡Grupo al día!
          </p>
          <p className="text-xs text-green-600">
            Todos los alumnos avanzan sin dificultades esta semana.
          </p>
        </div>
      </div>
    );
  }

  const porcentaje =
    totalAlumnos && totalAlumnos > 0
      ? Math.round((alumnosEnRiesgo / totalAlumnos) * 100)
      : null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-sm">
      {/* Ícono de advertencia con pulso */}
      <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-40" />
        <svg
          className="relative h-5 w-5 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">
          {alumnosEnRiesgo}{" "}
          {alumnosEnRiesgo === 1
            ? "alumno necesita atención"
            : "alumnos necesitan atención"}{" "}
          esta semana
        </p>
        <p className="mt-0.5 text-xs text-amber-700">
          {porcentaje !== null
            ? `${porcentaje}% del grupo requiere repaso adicional. `
            : ""}
          Revisa la tabla para identificarlos y planifica actividades de refuerzo.
        </p>
      </div>

      {/* Contador destacado */}
      <div className="flex-shrink-0 rounded-lg bg-amber-200 px-3 py-1 text-center">
        <span className="block text-xl font-bold leading-tight text-amber-800">
          {alumnosEnRiesgo}
        </span>
        <span className="text-xs font-medium text-amber-600">en riesgo</span>
      </div>
    </div>
  );
}
