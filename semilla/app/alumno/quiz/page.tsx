"use client";

import { useCallback, useEffect, useState } from "react";
import IlustracionSemilla from "@/components/IlustracionSemilla";

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
  const [quizNoActivo, setQuizNoActivo] = useState(false);
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

  // Estados para la IA opcional
  const [respuestaSeleccionadaTexto, setRespuestaSeleccionadaTexto] = useState<string | null>(null);
  const [pidiendoAyudaIA, setPidiendoAyudaIA] = useState(false);
  const [ayudaIARecibida, setAyudaIARecibida] = useState(false);
  
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

        if (datos.modo === "no-activo") {
          setQuizNoActivo(true);
          if (datos.alumnoId) setAlumnoId(datos.alumnoId);
          console.log("[Quiz] → Modo no-activo (alumnoId:", datos.alumnoId, ")");
        } else if (datos.modo === "real" && datos.preguntas?.length > 0) {
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
          setRespuestaSeleccionadaTexto(null);
          setAyudaIARecibida(false);
          setPidiendoAyudaIA(false);
        }, 1100);
      }
      return;
    }

    setEstadoRespuesta("incorrecta");
    setFalladas((prev) => new Set(prev).add(preguntaActual.id));
    setProcesando(true);
    await guardarRespuesta(preguntaActual, clave, false, tiempoSeg);

    const respuestaTexto = preguntaActual.opciones.find((op) => op.clave === clave)?.texto ?? clave;

    // Modo demo o inicial: mostrar pista local
    const pistaFallback =
      preguntaActual.pistasPorTexto[respuestaTexto] ?? preguntaActual.pistaDistractor;
    setFeedback(`Pista: ${pistaFallback}`);
    setMensaje("Tu respuesta no fue correcta. Lee la pista y vuelve a intentar.");
    setProcesando(false);
    setRespuestaSeleccionadaTexto(respuestaTexto);
    setAyudaIARecibida(false);
  }

  async function pedirAyudaIA() {
    if (!respuestaSeleccionadaTexto) return;
    setPidiendoAyudaIA(true);
    try {
      const respuesta = await fetch("/api/ai/retroalimentacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preguntaId: preguntaActual.id,
          respuestaSeleccionada: respuestaSeleccionadaTexto,
        }),
      });
      const datos = await respuesta.json();
      setFeedback(datos.retroalimentacion ?? "Usa la pista y vuelve a intentarlo.");
      setMensaje("Orientación de tu tutora IA:");
      setAyudaIARecibida(true);
    } catch {
      setFeedback("Ocurrió un error al contactar a la IA. Sigue intentando con la pista.");
    } finally {
      setPidiendoAyudaIA(false);
    }
  }

  function intentarDeNuevo() {
    setEstadoRespuesta("pendiente");
    setMensaje(null);
    setFeedback(null);
    setRespuestaSeleccionadaTexto(null);
    setAyudaIARecibida(false);
    setPidiendoAyudaIA(false);
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden">
        <BlobsDecorativos />
        <div className="relative z-10 flex flex-col items-center">
          <div className="semilla-float">
            <IlustracionSemilla className="h-24 w-24" />
          </div>
          <div className="mt-6 flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="semilla-bounce h-2.5 w-2.5 rounded-full"
                style={{
                  background: "var(--s-orange)",
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </div>
          <p className="mt-4 font-medium" style={{ color: "var(--s-navy)" }}>
            Preparando tu quiz…
          </p>
        </div>
      </div>
    );
  }

  // ── Quiz No Activo ──────────────────────────────────────────────────────────
  if (quizNoActivo) {
    return (
      <div className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden">
        <BlobsDecorativos />
        <div className="relative z-10 flex flex-col items-center s-card p-10 text-center max-w-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "var(--s-orange-lt)", color: "var(--s-orange)" }}>
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold" style={{ color: "var(--s-navy)" }}>
            ¡Aún no es hora del quiz!
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--s-text-muted)" }}>
            Tu profesor todavía no ha configurado el quiz de esta semana. Vuelve más tarde cuando te lo indique.
          </p>
          <a href="/alumno" className="s-btn-primary mt-6">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  // ── Resultados ────────────────────────────────────────────────────────────
  if (terminado) {
    const pct = Math.round((score / preguntas.length) * 100);
    const nivel =
      pct >= 80
        ? {
            titulo: "¡Excelente trabajo!",
            sub: "Dominaste el quiz de esta semana.",
            color: "var(--s-success)",
          }
        : pct >= 50
        ? {
            titulo: "¡Vas por buen camino!",
            sub: "Un poco más de práctica y lo logras.",
            color: "var(--s-orange)",
          }
        : {
            titulo: "¡Sigamos sembrando!",
            sub: "Cada intento te acerca a entenderlo mejor.",
            color: "var(--s-navy)",
          };

    // Anillo de puntaje (r=52 → circunferencia ≈ 326.73)
    const circ = 2 * Math.PI * 52;
    const offset = circ * (1 - pct / 100);

    return (
      <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
        <BlobsDecorativos />
        <div className="s-card semilla-pop relative z-10 w-full max-w-md p-8 text-center sm:p-10">
          {pct >= 80 && <ConfetiDecorativo />}

          {/* Anillo de puntaje con ilustración al centro */}
          <div className="relative mx-auto h-40 w-40">
            <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke="var(--s-indigo-lt)" strokeWidth="10"
              />
              <circle
                className="semilla-ring"
                cx="60" cy="60" r="52" fill="none"
                stroke={nivel.color} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ ["--circ" as string]: circ }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold leading-none" style={{ color: "var(--s-navy)" }}>
                {pct}%
              </span>
              <span className="mt-1 text-xs font-semibold" style={{ color: "var(--s-text-muted)" }}>
                {score}/{preguntas.length}
              </span>
            </div>
          </div>

          <h2 className="mt-6 text-2xl font-bold" style={{ color: "var(--s-navy)" }}>
            {nivel.titulo}
          </h2>
          <p className="mt-1.5" style={{ color: "var(--s-text-muted)" }}>
            {nivel.sub}
          </p>

          {modoDemo && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
               style={{ background: "var(--s-orange-lt)", color: "var(--s-orange)" }}>
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
  const pctProgreso = ((indice + (estadoRespuesta === "correcta" ? 1 : 0)) / preguntas.length) * 100;

  return (
    <div className="relative">
      <BlobsDecorativos />

      <div className="relative z-10 space-y-6">
        {/* Encabezado / Progreso */}
        <section className="s-card p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: "var(--s-orange-lt)" }}
              >
                <IlustracionSemilla className="h-7 w-7" />
              </div>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--s-orange)" }}
                >
                  Quiz semanal
                </p>
                <h1 className="mt-0.5 text-xl font-bold" style={{ color: "var(--s-navy)" }}>
                  Matemáticas — Semana actual
                </h1>
              </div>
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
            className="relative h-2.5 w-full overflow-hidden rounded-full"
            style={{ background: "var(--s-indigo-lt)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${pctProgreso}%`,
                background: "linear-gradient(90deg, var(--s-orange), var(--s-rose-dark))",
              }}
            />
          </div>
        </section>

        {/* Pregunta */}
        {preguntaActual && (
          <section className="s-card space-y-5 p-6">
            {/* Enunciado */}
            <div
              className="relative overflow-hidden rounded-2xl p-5 pr-12"
              style={{ background: "var(--s-indigo-lt)" }}
            >
              <p
                className="mb-1 text-[11px] font-bold uppercase tracking-widest"
                style={{ color: "var(--s-indigo)" }}
              >
                Pregunta {indice + 1}
              </p>
              <h2 className="text-lg font-semibold leading-7" style={{ color: "var(--s-navy)" }}>
                {preguntaActual.texto}
              </h2>
              <ChispaDoodle className="absolute -right-2 -top-2 h-16 w-16 opacity-70" />
            </div>

            {/* Opciones */}
            <div className="grid gap-3 sm:grid-cols-2">
              {preguntaActual.opciones.map((opcion, i) => {
                const esCorrectaResuelta =
                  estadoRespuesta === "correcta" && opcion.clave === preguntaActual.correcta;
                const atenuada =
                  estadoRespuesta === "correcta" && opcion.clave !== preguntaActual.correcta;

                let estilo: React.CSSProperties = {
                  background: "var(--s-surface)",
                  borderColor: "var(--s-border)",
                  color: "var(--s-text)",
                };
                if (esCorrectaResuelta) {
                  estilo = { background: "#F0FDF4", borderColor: "#86EFAC", color: "#15803D" };
                } else if (atenuada) {
                  estilo = { background: "#F9FAFB", borderColor: "var(--s-border)", color: "#9CA3AF" };
                }

                const activable = !procesando && estadoRespuesta !== "correcta" && !terminado;

                return (
                  <button
                    key={`${indice}-${opcion.clave}`}
                    id={`opcion-${opcion.clave}`}
                    type="button"
                    onClick={() => seleccionarOpcion(opcion.clave)}
                    disabled={procesando || estadoRespuesta === "correcta" || terminado}
                    style={{ ...estilo, ...(procesando ? { opacity: 0.65 } : {}), ["--index" as string]: i }}
                    className={`semilla-fade-up flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all duration-150 disabled:cursor-not-allowed ${
                      activable ? "hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]" : ""
                    }`}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors"
                      style={
                        esCorrectaResuelta
                          ? { background: "#86EFAC", color: "#15803D" }
                          : atenuada
                          ? { background: "#F3F4F6", color: "#9CA3AF" }
                          : { background: "var(--s-orange-lt)", color: "var(--s-orange)" }
                      }
                    >
                      {esCorrectaResuelta ? <IconCheck className="h-5 w-5" /> : opcion.clave}
                    </span>
                    <span className="text-sm font-medium leading-5">{opcion.texto}</span>
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {mensaje && (
              <div
                className="semilla-pop flex gap-3 rounded-2xl border-2 p-5"
                style={
                  estadoRespuesta === "correcta"
                    ? { background: "#F0FDF4", borderColor: "#86EFAC" }
                    : { background: "var(--s-orange-lt)", borderColor: "#FED7AA" }
                }
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={
                    estadoRespuesta === "correcta"
                      ? { background: "#86EFAC", color: "#15803D" }
                      : { background: "#FFE3D6", color: "var(--s-orange)" }
                  }
                >
                  {estadoRespuesta === "correcta" ? (
                    <IconCheck className="h-5 w-5" />
                  ) : (
                    <IconBombilla className="h-5 w-5" />
                  )}
                </span>
                <div className="flex-1">
                  <p
                    className="font-semibold"
                    style={{
                      color:
                        estadoRespuesta === "correcta" ? "var(--s-success)" : "var(--s-orange)",
                    }}
                  >
                    {mensaje}
                  </p>
                  {feedback && (
                    <p className="mt-1.5 text-sm leading-6" style={{ color: "var(--s-text-muted)" }}>
                      {feedback}
                    </p>
                  )}
                  {estadoRespuesta === "incorrecta" && !procesando && (
                    <div className="flex flex-wrap gap-3 mt-4">
                      <button
                        id="btn-intentar-nuevo"
                        type="button"
                        onClick={intentarDeNuevo}
                        className="s-btn-secondary text-sm"
                      >
                        <IconReintentar className="h-4 w-4" />
                        Volver a intentar
                      </button>
                      {!modoDemo && preguntaActual.id > 0 && !ayudaIARecibida && (
                        <button
                          type="button"
                          onClick={pedirAyudaIA}
                          disabled={pidiendoAyudaIA}
                          className="s-btn-primary flex gap-2 items-center text-sm disabled:opacity-60"
                        >
                          <IconBombilla className="h-4 w-4" />
                          {pidiendoAyudaIA ? "Pensando..." : "Necesito más ayuda"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {procesando && (
              <div className="flex items-center justify-center gap-2 py-1">
                <span className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="semilla-bounce h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--s-orange)", animationDelay: `${i * 0.16}s` }}
                    />
                  ))}
                </span>
                <p className="text-sm" style={{ color: "var(--s-text-muted)" }}>
                  Generando orientación personalizada con IA…
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ilustraciones y doodles (estilo Ellsy) — SVG inline, paleta del proyecto
// ─────────────────────────────────────────────────────────────────────────────

/** Chispa/destello decorativo de cuatro puntas. */
function ChispaDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <path
        d="M32 14 C 33 26 38 31 50 32 C 38 33 33 38 32 50 C 31 38 26 33 14 32 C 26 31 31 26 32 14 Z"
        fill="var(--s-rose-dark)"
        opacity="0.55"
      />
    </svg>
  );
}

/** Confeti decorativo para resultados altos. */
function ConfetiDecorativo() {
  const piezas = [
    { left: "8%", top: "10%", color: "var(--s-orange)", r: 4 },
    { left: "22%", top: "4%", color: "var(--s-rose-dark)", r: 3 },
    { left: "78%", top: "8%", color: "var(--s-indigo)", r: 4 },
    { left: "90%", top: "20%", color: "var(--s-orange)", r: 3 },
    { left: "14%", top: "26%", color: "var(--s-indigo)", r: 3 },
    { left: "86%", top: "40%", color: "var(--s-rose-dark)", r: 4 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {piezas.map((p, i) => (
        <span
          key={i}
          className="semilla-float absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.r * 2,
            height: p.r * 2,
            background: p.color,
            animationDelay: `${i * 0.25}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Blobs decorativos de fondo (se mantienen detrás vía z-0). */
function BlobsDecorativos() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        className="absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-15"
        style={{ background: "var(--s-orange)" }}
      />
      <div
        className="absolute -left-16 top-1/3 h-44 w-44 rounded-full opacity-10"
        style={{ background: "var(--s-navy)" }}
      />
      <div
        className="absolute bottom-6 right-1/4 h-28 w-28 rounded-full opacity-10"
        style={{ background: "var(--s-rose-dark)" }}
      />
    </div>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 12.5 3.5 3.5 8-9" />
    </svg>
  );
}

function IconBombilla({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18h6M10 21h4" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.2 1 1.9l.1.7h4.8l.1-.7c.1-.7.4-1.4 1-1.9A6 6 0 0 0 12 3Z"
      />
    </svg>
  );
}

function IconReintentar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4" />
    </svg>
  );
}
