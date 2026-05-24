"use client";

import { useCallback, useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

interface Opcion {
  clave: string;
  texto: string;
}

interface Pregunta {
  id: number;
  pregunta_aplicada_id: number;
  texto: string;
  opciones: Opcion[];
  correcta: string;
  errorDistractor: string;
  pistaDistractor: string;
  /** Mapa texto-opción → pista pedagógica (para el fallback cuando la IA falla). */
  pistasPorTexto: Record<string, string>;
}

type EstadoRespuesta = "pendiente" | "correcta" | "incorrecta";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Mezcla un arreglo usando Fisher-Yates con Math.random() — verdaderamente aleatorio. */
function mezclarFisherYates<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function mapearPregunta(
  pa: {
    id: number;
    pregunta: {
      id: number;
      texto_pregunta: string;
      respuesta_correcta: string;
      respuesta_incorrecta_1: string;
      error_distractor_1: string;
      pista_distractor_1: string;
      respuesta_incorrecta_2: string;
      error_distractor_2: string;
      pista_distractor_2: string;
      respuesta_incorrecta_3: string | null;
      pista_distractor_3: string | null;
    };
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _indice: number
): Pregunta {
  const p = pa.pregunta;

  const opciones: Opcion[] = [
    { clave: "A", texto: p.respuesta_correcta },
    { clave: "B", texto: p.respuesta_incorrecta_1 },
    { clave: "C", texto: p.respuesta_incorrecta_2 },
    ...(p.respuesta_incorrecta_3
      ? [{ clave: "D", texto: p.respuesta_incorrecta_3 }]
      : []),
  ];

  // Bug #5 fix: mezcla verdaderamente aleatoria con Fisher-Yates
  const mezcladas = mezclarFisherYates(opciones).map((op, i) => ({
    ...op,
    clave: ["A", "B", "C", "D"][i],
  }));

  const claveCorrecta =
    mezcladas.find((o) => o.texto === p.respuesta_correcta)?.clave ?? "A";

  // Bug #6 fix: guardar la pista correcta por texto de opción para usarla en el fallback
  const pistasPorTexto: Record<string, string> = {
    [p.respuesta_incorrecta_1]: p.pista_distractor_1 ?? "",
    [p.respuesta_incorrecta_2]: p.pista_distractor_2 ?? "",
    ...(p.respuesta_incorrecta_3 && p.pista_distractor_3
      ? { [p.respuesta_incorrecta_3]: p.pista_distractor_3 }
      : {}),
  };

  return {
    id: p.id,
    pregunta_aplicada_id: pa.id,
    texto: p.texto_pregunta,
    opciones: mezcladas,
    correcta: claveCorrecta,
    errorDistractor: p.error_distractor_1,
    pistaDistractor: p.pista_distractor_1,
    pistasPorTexto,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Preguntas de demo
// ─────────────────────────────────────────────────────────────────────────────

const PREGUNTAS_DEMO: Pregunta[] = [
  {
    id: -1,
    pregunta_aplicada_id: -1,
    texto: "¿Cuál es el valor de 3/4 + 1/8?",
    opciones: [
      { clave: "A", texto: "5/8" },
      { clave: "B", texto: "7/8" },
      { clave: "C", texto: "1" },
      { clave: "D", texto: "1 1/8" },
    ],
    correcta: "B",
    errorDistractor: "Sumar los numeradores sin convertir al mismo denominador",
    pistaDistractor: "Recuerda que antes de sumar fracciones necesitas un denominador común.",
    pistasPorTexto: {},
  },
  {
    id: -2,
    pregunta_aplicada_id: -2,
    texto: "Si un examen tiene 40 preguntas y respondiste 32 correctamente, ¿qué porcentaje obtuviste?",
    opciones: [
      { clave: "A", texto: "72%" },
      { clave: "B", texto: "75%" },
      { clave: "C", texto: "80%" },
      { clave: "D", texto: "85%" },
    ],
    correcta: "C",
    errorDistractor: "Dividir por 40 y no multiplicar por 100 correctamente",
    pistaDistractor: "Convierte la fracción en porcentaje multiplicando por 100.",
    pistasPorTexto: {},
  },
  {
    id: -3,
    pregunta_aplicada_id: -3,
    texto: "¿Cuál es la forma correcta de escribir 0.25 como fracción?",
    opciones: [
      { clave: "A", texto: "1/4" },
      { clave: "B", texto: "2/5" },
      { clave: "C", texto: "1/5" },
      { clave: "D", texto: "3/4" },
    ],
    correcta: "A",
    errorDistractor: "Pensar que 0.25 equivale a 2/5 en lugar de 1/4",
    pistaDistractor: "Haz la división 25 ÷ 100 y busca la fracción equivalente.",
    pistasPorTexto: {},
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function AlumnoQuizPage() {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modoDemo, setModoDemo] = useState(false);
  const [aplicacionId, setAplicacionId] = useState<number | null>(null);
  const [alumnoId, setAlumnoId] = useState<number | null>(null);

  const [indice, setIndice] = useState(0);
  const [score, setScore] = useState(0);
  const [estadoRespuesta, setEstadoRespuesta] = useState<EstadoRespuesta>("pendiente");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [terminado, setTerminado] = useState(false);
  
  // Track questions failed on the first try
  const [falladas, setFalladas] = useState<Set<number>>(new Set());

  const preguntaActual = preguntas[indice];

  // ── Cargar preguntas desde la API del servidor (evita RLS) ───────────────
  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch("/api/quiz/preguntas");
        const datos = await res.json();
        console.log("[Quiz] Respuesta API:", datos.modo, "preguntas:", datos.preguntas?.length ?? 0);

        if (cancelado) return;

        if (datos.modo === "real" && datos.preguntas?.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped = (datos.preguntas as any[]).map((pa, i) => mapearPregunta(pa, i));
          setPreguntas(mapped);
          setModoDemo(false);
          setAlumnoId(datos.alumnoId);
          setAplicacionId(datos.aplicacionId);
          console.log("[Quiz] ✅ Modo REAL — alumnoId:", datos.alumnoId, "preguntas:", mapped.length);
        } else {
          setPreguntas(PREGUNTAS_DEMO);
          setModoDemo(true);
          if (datos.alumnoId) setAlumnoId(datos.alumnoId);
          console.log("[Quiz] → Modo demo (alumnoId:", datos.alumnoId, ")");
        }
      } catch (err) {
        console.error("[Quiz] ❌ Error al cargar:", err);
        if (!cancelado) {
          setPreguntas(PREGUNTAS_DEMO);
          setModoDemo(true);
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => { cancelado = true; };
  }, []);

  // ── Guardar respuesta (vía API del servidor para evitar problemas de RLS) ──
  const guardarRespuesta = useCallback(
    async (pregunta: Pregunta, clave: string, esCorrecta: boolean, tiempoSeg: number) => {
      if (modoDemo || !alumnoId || pregunta.pregunta_aplicada_id < 0) return;
      try {
        const res = await fetch("/api/quiz/respuesta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            alumno_id: alumnoId,
            pregunta_aplicada_id: pregunta.pregunta_aplicada_id,
            respuesta_seleccionada:
              pregunta.opciones.find((o) => o.clave === clave)?.texto ?? clave,
            es_correcta: esCorrecta,
            tiempo_respuesta_seg: tiempoSeg,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("[Quiz] Error al guardar respuesta:", err);
        }
      } catch (err) {
        console.error("[Quiz] Falló la petición de guardado:", err);
      }
    },
    [modoDemo, alumnoId]
  );

  const [tiempoInicio, setTiempoInicio] = useState(Date.now());
  useEffect(() => { setTiempoInicio(Date.now()); }, [indice]);

  async function seleccionarOpcion(clave: string) {
    if (terminado || procesando || estadoRespuesta !== "pendiente") return;
    const tiempoSeg = Math.round((Date.now() - tiempoInicio) / 1000);

    if (clave === preguntaActual.correcta) {
      setEstadoRespuesta("correcta");
      if (!falladas.has(preguntaActual.id)) {
        setScore((v) => v + 1);
      }
      setMensaje("¡Muy bien! Respuesta correcta.");
      await guardarRespuesta(preguntaActual, clave, true, tiempoSeg);

      const siguiente = indice + 1;
      if (siguiente >= preguntas.length) {
        // Cierre del quiz y cálculo del diagnóstico real
        if (!modoDemo && alumnoId && aplicacionId) {
          try {
            await fetch("/api/quiz/finalizar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ alumno_id: alumnoId, aplicacion_id: aplicacionId }),
            });
          } catch (err) {
            console.error("[Quiz] Error al finalizar el quiz", err);
          }
        }
        setTimeout(() => setTerminado(true), 900);
      } else {
        setTimeout(() => {
          setIndice(siguiente);
          setEstadoRespuesta("pendiente");
          setMensaje(null);
          setFeedback(null);
        }, 1100);
      }
      return;
    }

    setEstadoRespuesta("incorrecta");
    setFalladas((prev) => new Set(prev).add(preguntaActual.id));
    setProcesando(true);
    await guardarRespuesta(preguntaActual, clave, false, tiempoSeg);

    const respuestaTexto = preguntaActual.opciones.find((op) => op.clave === clave)?.texto ?? clave;

    // Modo demo: las preguntas no están en la BD (id negativo), así que no hay
    // mapeo pedagógico que leer en el servidor. Mostramos la pista local sin
    // llamar a la IA (no gasta tokens y funciona offline).
    if (modoDemo || preguntaActual.id < 0) {
      setFeedback(`Casi. Pista: ${preguntaActual.pistaDistractor}`);
      setMensaje("Casi. Lee la orientación y vuelve a intentar.");
      setProcesando(false);
      return;
    }

    // Preguntas reales: el endpoint seguro lee el error y la pista del distractor
    // EN EL SERVIDOR a partir del id; ni la respuesta correcta ni las pistas
    // viajan al cliente.
    try {
      const respuesta = await fetch("/api/ai/retroalimentacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preguntaId: preguntaActual.id,
          respuestaSeleccionada: respuestaTexto,
        }),
      });
      const datos = await respuesta.json();
      setFeedback(datos.retroalimentacion ?? "Usa la pista y vuelve a intentarlo.");
      setMensaje("Casi. Lee la orientación y vuelve a intentar.");
    } catch {
      // Bug #6 fix: usar la pista del distractor elegido, no siempre el primero
      const pistaFallback =
        preguntaActual.pistasPorTexto[respuestaTexto] ?? preguntaActual.pistaDistractor;
      setFeedback(`Pista: ${pistaFallback}`);
      setMensaje("Tu respuesta no fue correcta. Vuelve a intentar.");
    } finally {
      setProcesando(false);
    }
  }

  function intentarDeNuevo() {
    setEstadoRespuesta("pendiente");
    setMensaje(null);
    setFeedback(null);
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-10 w-10 semilla-spin rounded-full border-4"
            style={{ borderColor: "var(--s-border)", borderTopColor: "var(--s-orange)" }}
          />
          <p style={{ color: "var(--s-text-muted)" }}>Cargando quiz…</p>
        </div>
      </div>
    );
  }

  // ── Resultados ────────────────────────────────────────────────────────────
  if (terminado) {
    const pct = Math.round((score / preguntas.length) * 100);
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="s-card p-10 text-center max-w-md w-full">
          <div className="text-5xl mb-4">
            {pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📚"}
          </div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--s-navy)" }}>
            ¡Quiz terminado!
          </h2>
          <p className="mt-2" style={{ color: "var(--s-text-muted)" }}>
            Respondiste{" "}
            <strong style={{ color: "var(--s-orange)" }}>{score}</strong> de{" "}
            <strong>{preguntas.length}</strong> preguntas correctamente ({pct}%).
          </p>
          {modoDemo && (
            <p className="mt-2 text-sm" style={{ color: "var(--s-text-muted)" }}>
              Modo demo — tus respuestas no se guardaron.
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href="/alumno/progreso" className="s-btn-primary">
              Ver mi progreso
            </a>
            <a href="/alumno" className="s-btn-secondary">
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz ──────────────────────────────────────────────────────────────────
  const pctProgreso = (indice / preguntas.length) * 100;

  return (
    <div className="space-y-6">
      {/* Encabezado / Progreso */}
      <section className="s-card p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--s-orange)" }}
            >
              Quiz semanal
            </p>
            <h1 className="mt-1 text-xl font-bold" style={{ color: "var(--s-navy)" }}>
              Matemáticas — Semana actual
            </h1>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className="s-badge"
              style={{ background: "var(--s-indigo-lt)", color: "var(--s-navy)" }}
            >
              {indice + 1} / {preguntas.length}
            </span>
            {modoDemo && (
              <span
                className="s-badge"
                style={{ background: "var(--s-orange-lt)", color: "var(--s-orange)" }}
              >
                Demo
              </span>
            )}
          </div>
        </div>

        {/* Barra de progreso */}
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ background: "var(--s-indigo-lt)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pctProgreso}%`, background: "var(--s-orange)" }}
          />
        </div>
      </section>

      {/* Pregunta */}
      {preguntaActual && (
        <section className="s-card p-6 space-y-5">
          {/* Enunciado */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--s-indigo-lt)" }}
          >
            <h2 className="text-lg font-semibold leading-7" style={{ color: "var(--s-navy)" }}>
              {preguntaActual.texto}
            </h2>
          </div>

          {/* Opciones */}
          <div className="grid gap-3 sm:grid-cols-2">
            {preguntaActual.opciones.map((opcion) => {
              let estilo: React.CSSProperties = {
                background: "var(--s-surface)",
                borderColor: "var(--s-border)",
                color: "var(--s-text)",
              };

              if (estadoRespuesta === "correcta") {
                if (opcion.clave === preguntaActual.correcta) {
                  estilo = {
                    background: "#F0FDF4",
                    borderColor: "#86EFAC",
                    color: "#15803D",
                  };
                } else {
                  estilo = {
                    background: "#F9FAFB",
                    borderColor: "var(--s-border)",
                    color: "#9CA3AF",
                  };
                }
              }

              return (
                <button
                  key={opcion.clave}
                  id={`opcion-${opcion.clave}`}
                  type="button"
                  onClick={() => seleccionarOpcion(opcion.clave)}
                  disabled={procesando || estadoRespuesta === "correcta" || terminado}
                  className="group rounded-2xl border-2 px-5 py-4 text-left transition-all hover:shadow-md disabled:cursor-not-allowed"
                  style={{
                    ...estilo,
                    ...(procesando ? { opacity: 0.65 } : {}),
                  }}
                >
                  <span
                    className="text-xs font-bold"
                    style={{ color: "var(--s-orange)" }}
                  >
                    {opcion.clave}
                  </span>
                  <p className="mt-1 text-sm font-medium leading-5">{opcion.texto}</p>
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {mensaje && (
            <div
              className="rounded-2xl border-2 p-5"
              style={
                estadoRespuesta === "correcta"
                  ? { background: "#F0FDF4", borderColor: "#86EFAC" }
                  : { background: "var(--s-orange-lt)", borderColor: "#FED7AA" }
              }
            >
              <p
                className="font-semibold"
                style={{
                  color:
                    estadoRespuesta === "correcta"
                      ? "var(--s-success)"
                      : "var(--s-orange)",
                }}
              >
                {mensaje}
              </p>
              {feedback && (
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--s-text-muted)" }}>
                  {feedback}
                </p>
              )}
              {estadoRespuesta === "incorrecta" && !procesando && (
                <button
                  id="btn-intentar-nuevo"
                  type="button"
                  onClick={intentarDeNuevo}
                  className="s-btn-secondary mt-4 text-sm"
                >
                  ↩ Volver a intentar
                </button>
              )}
            </div>
          )}

          {procesando && (
            <p
              className="text-center text-sm animate-pulse"
              style={{ color: "var(--s-text-muted)" }}
            >
              Generando orientación personalizada con IA…
            </p>
          )}
        </section>
      )}
    </div>
  );
}
