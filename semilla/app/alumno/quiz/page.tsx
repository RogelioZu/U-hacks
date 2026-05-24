"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
}

type EstadoRespuesta = "pendiente" | "correcta" | "incorrecta";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Transforma la fila de Supabase al tipo Pregunta del quiz. */
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
    };
  },
  indice: number
): Pregunta {
  const p = pa.pregunta;

  // Construir array de opciones mezclado
  const opciones: Opcion[] = [
    { clave: "A", texto: p.respuesta_correcta },
    { clave: "B", texto: p.respuesta_incorrecta_1 },
    { clave: "C", texto: p.respuesta_incorrecta_2 },
    ...(p.respuesta_incorrecta_3
      ? [{ clave: "D", texto: p.respuesta_incorrecta_3 }]
      : []),
  ];

  // Mezclar opciones de forma determinista por índice (sin random para SSR)
  const mezcladas = opciones
    .map((op, i) => ({ op, sort: (i + indice * 3) % opciones.length }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ op }, i) => ({ ...op, clave: ["A", "B", "C", "D"][i] }));

  // La opción correcta es la que tiene el texto de respuesta_correcta
  const claveCorrecta =
    mezcladas.find((o) => o.texto === p.respuesta_correcta)?.clave ?? "A";

  return {
    id: p.id,
    pregunta_aplicada_id: pa.id,
    texto: p.texto_pregunta,
    opciones: mezcladas,
    correcta: claveCorrecta,
    errorDistractor: p.error_distractor_1,
    pistaDistractor: p.pista_distractor_1,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Preguntas de demo (usadas cuando no hay aplicación activa en Supabase)
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
    pistaDistractor:
      "Recuerda que antes de sumar fracciones necesitas un denominador común.",
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
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function AlumnoQuizPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  // ── Estado ────────────────────────────────────────────────────────────────
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

  const preguntaActual = preguntas[indice];

  // ── Cargar preguntas desde Supabase al montar ─────────────────────────────
  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        // 1. Obtener usuario autenticado
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelado) {
            setPreguntas(PREGUNTAS_DEMO);
            setModoDemo(true);
            setCargando(false);
          }
          return;
        }

        // 2. Obtener ID de alumno
        const { data: alumnoData } = await supabase
          .from("alumno")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();

        if (!alumnoData) {
          if (!cancelado) {
            setPreguntas(PREGUNTAS_DEMO);
            setModoDemo(true);
            setCargando(false);
          }
          return;
        }

        if (!cancelado) setAlumnoId(alumnoData.id);

        // 3. Buscar aplicación activa del grupo del alumno
        const { data: alumnoGrupo } = await supabase
          .from("alumno")
          .select("grupo_id")
          .eq("id", alumnoData.id)
          .single();

        const { data: aplicacion } = await supabase
          .from("aplicacion")
          .select("id")
          .eq("grupo_id", alumnoGrupo?.grupo_id ?? 0)
          .eq("estado", "activa")
          .order("fecha_inicio", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!aplicacion) {
          if (!cancelado) {
            setPreguntas(PREGUNTAS_DEMO);
            setModoDemo(true);
            setCargando(false);
          }
          return;
        }

        if (!cancelado) setAplicacionId(aplicacion.id);

        // 4. Obtener preguntas de la aplicación (comunes + personalizadas del alumno)
        const { data: preguntasAplicadas } = await supabase
          .from("pregunta_aplicada")
          .select(
            `
            id,
            pregunta:pregunta_id (
              id,
              texto_pregunta,
              respuesta_correcta,
              respuesta_incorrecta_1,
              error_distractor_1,
              pista_distractor_1,
              respuesta_incorrecta_2,
              error_distractor_2,
              pista_distractor_2,
              respuesta_incorrecta_3
            )
          `
          )
          .eq("aplicacion_id", aplicacion.id)
          .or(`alumno_id.is.null,alumno_id.eq.${alumnoData.id}`)
          .order("orden");

        if (!preguntasAplicadas || preguntasAplicadas.length === 0) {
          if (!cancelado) {
            setPreguntas(PREGUNTAS_DEMO);
            setModoDemo(true);
            setCargando(false);
          }
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = (preguntasAplicadas as any[]).map((pa, i) =>
          mapearPregunta(pa, i)
        );

        if (!cancelado) {
          setPreguntas(mapped);
          setModoDemo(false);
          setCargando(false);
        }
      } catch {
        if (!cancelado) {
          setPreguntas(PREGUNTAS_DEMO);
          setModoDemo(true);
          setCargando(false);
        }
      }
    })();

    return () => { cancelado = true; };
  }, [supabase]);

  // ── Guardar respuesta en Supabase ─────────────────────────────────────────
  const guardarRespuesta = useCallback(
    async (
      pregunta: Pregunta,
      clave: string,
      esCorrecta: boolean,
      tiempoSeg: number
    ) => {
      if (modoDemo || !alumnoId || pregunta.pregunta_aplicada_id < 0) return;

      await supabase.from("respuesta_alumno").insert({
        alumno_id: alumnoId,
        pregunta_aplicada_id: pregunta.pregunta_aplicada_id,
        respuesta_seleccionada:
          pregunta.opciones.find((o) => o.clave === clave)?.texto ?? clave,
        es_correcta: esCorrecta,
        tiempo_respuesta_seg: tiempoSeg,
        modo_entrega: "online",
      });
    },
    [modoDemo, alumnoId, supabase]
  );

  // ── Manejar selección de opción ───────────────────────────────────────────
  const [tiempoInicio, setTiempoInicio] = useState(Date.now());

  useEffect(() => {
    setTiempoInicio(Date.now());
  }, [indice]);

  async function seleccionarOpcion(clave: string) {
    if (terminado || procesando || estadoRespuesta !== "pendiente") return;
    const tiempoSeg = Math.round((Date.now() - tiempoInicio) / 1000);

    if (clave === preguntaActual.correcta) {
      setEstadoRespuesta("correcta");
      setScore((v) => v + 1);
      setMensaje("¡Muy bien! Respuesta correcta.");
      await guardarRespuesta(preguntaActual, clave, true, tiempoSeg);

      const siguiente = indice + 1;
      if (siguiente >= preguntas.length) {
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

    // Respuesta incorrecta
    setEstadoRespuesta("incorrecta");
    setProcesando(true);
    await guardarRespuesta(preguntaActual, clave, false, tiempoSeg);

    const respuestaTexto =
      preguntaActual.opciones.find((op) => op.clave === clave)?.texto ?? clave;

    try {
      const respuesta = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pregunta: preguntaActual.texto,
          respuestaSeleccionada: respuestaTexto,
          respuestaCorrecta: preguntaActual.opciones.find(
            (o) => o.clave === preguntaActual.correcta
          )?.texto ?? "",
          errorDistractor: preguntaActual.errorDistractor,
          pistaDistractor: preguntaActual.pistaDistractor,
        }),
      });

      const datos = await respuesta.json();
      setFeedback(
        datos.feedback ?? "Usa la pista y vuelve a intentarlo."
      );
      setMensaje("Casi. Lee la orientación y vuelve a intentar.");
    } catch {
      setFeedback(
        `Pista: ${preguntaActual.pistaDistractor}`
      );
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

  // ── Render ────────────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center text-zinc-400">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-cyan-400" />
          <p>Cargando quiz…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-16 sm:px-10">

        {/* Encabezado */}
        <section className="rounded-3xl border border-zinc-800/80 bg-zinc-900/95 p-8 shadow-2xl shadow-black/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-400/80">
                Quiz semanal
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                Matemáticas — Semana actual
              </h1>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
                {indice + 1} / {preguntas.length}
              </span>
              {modoDemo && (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                  Demo
                </span>
              )}
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-500"
              style={{ width: `${((indice) / preguntas.length) * 100}%` }}
            />
          </div>
        </section>

        {/* Pregunta */}
        {!terminado && preguntaActual && (
          <section className="rounded-3xl border border-zinc-800/80 bg-zinc-900/95 p-8 shadow-black/10">
            <div className="space-y-6">
              {/* Enunciado */}
              <div className="rounded-2xl bg-zinc-950/80 p-6">
                <h2 className="text-xl font-semibold leading-8 text-white sm:text-2xl">
                  {preguntaActual.texto}
                </h2>
              </div>

              {/* Opciones */}
              <div className="grid gap-3 sm:grid-cols-2">
                {preguntaActual.opciones.map((opcion) => {
                  let clases =
                    "rounded-2xl border px-5 py-5 text-left transition focus:outline-none ";
                  if (estadoRespuesta === "pendiente" || estadoRespuesta === "incorrecta") {
                    clases +=
                      "border-zinc-800/80 bg-zinc-950/90 text-white hover:border-cyan-400/50 hover:bg-zinc-900/95 ";
                    if (procesando) clases += "cursor-wait opacity-70 ";
                  } else if (estadoRespuesta === "correcta") {
                    clases +=
                      opcion.clave === preguntaActual.correcta
                        ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200 "
                        : "border-zinc-800/40 bg-zinc-950/40 text-zinc-600 cursor-not-allowed ";
                  }

                  return (
                    <button
                      key={opcion.clave}
                      id={`opcion-${opcion.clave}`}
                      type="button"
                      onClick={() => seleccionarOpcion(opcion.clave)}
                      className={clases}
                      disabled={
                        procesando ||
                        estadoRespuesta === "correcta" ||
                        terminado
                      }
                    >
                      <span className="text-sm font-semibold text-cyan-300">
                        {opcion.clave}
                      </span>
                      <p className="mt-2 text-base leading-6">{opcion.texto}</p>
                    </button>
                  );
                })}
              </div>

              {/* Mensaje y feedback */}
              {mensaje && (
                <div
                  className={`rounded-2xl border p-5 ${
                    estadoRespuesta === "correcta"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-100"
                  }`}
                >
                  <p className="font-semibold">{mensaje}</p>
                  {feedback && (
                    <p className="mt-3 text-sm leading-6 text-zinc-300">
                      {feedback}
                    </p>
                  )}
                  {estadoRespuesta === "incorrecta" && !procesando && (
                    <button
                      id="btn-intentar-nuevo"
                      type="button"
                      onClick={intentarDeNuevo}
                      className="mt-4 rounded-xl bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/30"
                    >
                      Volver a intentar ↩
                    </button>
                  )}
                </div>
              )}

              {procesando && (
                <p className="text-center text-sm text-zinc-500 animate-pulse">
                  Generando orientación personalizada…
                </p>
              )}
            </div>
          </section>
        )}

        {/* Pantalla de resultados */}
        {terminado && (
          <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-10 text-center shadow-black/10">
            <p className="text-5xl">🎉</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">
              ¡Quiz terminado!
            </h2>
            <p className="mt-3 text-zinc-300">
              Respondiste <strong className="text-emerald-300">{score}</strong> de{" "}
              <strong>{preguntas.length}</strong> preguntas correctamente.
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {modoDemo
                ? "Modo demo — regístrate para guardar tu progreso."
                : "Tus respuestas fueron registradas. Tu docente las revisará pronto."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="/alumno/progreso"
                className="rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                Ver mi progreso
              </a>
              <a
                href="/alumno"
                className="rounded-2xl border border-zinc-700 px-6 py-3 font-semibold text-zinc-300 transition hover:border-zinc-500"
              >
                Volver al inicio
              </a>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
