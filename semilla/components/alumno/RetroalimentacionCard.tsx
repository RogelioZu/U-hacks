"use client";

// Muestra al alumno la retroalimentación de la IA tras responder un quiz.
// Es presentacional: el padre llama a /api/ai/retroalimentacion y le pasa el
// resultado. Pedagogía sin castigo: el caso "incorrecto" usa tonos cálidos
// (no rojo) y siempre ofrece reintentar.
//
// Ejemplo:
//   <RetroalimentacionCard
//     estado={cargando ? "pensando" : esCorrecta ? "correcto" : "incorrecto"}
//     mensaje={mensaje}
//     onReintentar={() => setRespuesta(null)}
//     onContinuar={siguientePregunta}
//   />

export type EstadoRetro = "pensando" | "correcto" | "incorrecto";

export function RetroalimentacionCard({
  estado,
  mensaje,
  onReintentar,
  onContinuar,
}: {
  estado: EstadoRetro;
  mensaje?: string;
  onReintentar?: () => void;
  onContinuar?: () => void;
}) {
  if (estado === "pensando") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <span className="text-2xl">🌱</span>
        <p className="flex items-center gap-1 text-sm text-zinc-500">
          El tutor está pensando
          <span className="inline-flex gap-0.5">
            <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
          </span>
        </p>
      </div>
    );
  }

  if (estado === "correcto") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="flex items-center gap-2 font-semibold text-emerald-800">
          <span className="text-xl">✅</span> ¡Muy bien!
        </p>
        {mensaje && <p className="mt-1 text-sm text-emerald-700">{mensaje}</p>}
        {onContinuar && (
          <button
            onClick={onContinuar}
            className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Siguiente pregunta →
          </button>
        )}
      </div>
    );
  }

  // incorrecto — tono cálido (ámbar), nunca rojo
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🌱</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900">Tu tutor te dice:</p>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">{mensaje}</p>
        </div>
      </div>
      {onReintentar && (
        <button
          onClick={onReintentar}
          className="mt-3 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
        >
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
      style={{ animationDelay: delay }}
    />
  );
}
