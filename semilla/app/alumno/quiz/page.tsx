"use client";

import { useMemo, useState } from "react";

const preguntas = [
  {
    id: 1,
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
    id: 2,
    texto:
      "Si un examen tiene 40 preguntas y respondiste 32 correctamente, ¿qué porcentaje obtuviste?",
    opciones: [
      { clave: "A", texto: "72%" },
      { clave: "B", texto: "75%" },
      { clave: "C", texto: "80%" },
      { clave: "D", texto: "85%" },
    ],
    correcta: "C",
    errorDistractor: "Dividir por 40 y no multiplicar por 100 correctamente",
    pistaDistractor:
      "Convierte la fracción en porcentaje multiplicando por 100.",
  },
  {
    id: 3,
    texto: "¿Cuál es la forma correcta de escribir 0.25 como fracción?",
    opciones: [
      { clave: "A", texto: "1/4" },
      { clave: "B", texto: "2/5" },
      { clave: "C", texto: "1/5" },
      { clave: "D", texto: "3/4" },
    ],
    correcta: "A",
    errorDistractor: "Pensar que 0.25 equivale a 2/5 en lugar de 1/4",
    pistaDistractor:
      "Haz la división 25 ÷ 100 y busca la fracción equivalente.",
  },
];

type Pregunta = (typeof preguntas)[number];

export default function AlumnoQuizPage() {
  const [indice, setIndice] = useState(0);
  const [score, setScore] = useState(0);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [terminado, setTerminado] = useState(false);

  const preguntaActual = useMemo(() => preguntas[indice], [indice]);

  async function seleccionarOpcion(clave: string) {
    if (terminado || procesando) return;
    setMensaje(null);
    setFeedback(null);

    if (clave === preguntaActual.correcta) {
      setScore((valor) => valor + 1);
      setMensaje("¡Excelente! Respuesta correcta.");
      const siguiente = indice + 1;
      if (siguiente >= preguntas.length) {
        setTerminado(true);
        return;
      }
      setTimeout(() => setIndice(siguiente), 900);
      return;
    }

    setProcesando(true);
    const respuestaTexto =
      preguntaActual.opciones.find((op) => op.clave === clave)?.texto ?? clave;
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pregunta: preguntaActual.texto,
          respuestaSeleccionada: respuestaTexto,
          errorDistractor: preguntaActual.errorDistractor,
          pistaDistractor: preguntaActual.pistaDistractor,
        }),
      });

      const data = await response.json();
      setFeedback(
        data.feedback ??
          "Intenta de nuevo con la pista y observa el paso a paso.",
      );
      setMensaje(
        "Respuesta incorrecta. Lee la retroalimentación y vuelve a intentarlo.",
      );
    } catch (err) {
      setFeedback(
        "No se pudo obtener la retroalimentación. Revisa tu respuesta y vuelve a intentar.",
      );
      setMensaje("Tu respuesta no fue correcta.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-16 sm:px-10">
        <section className="rounded-3xl border border-zinc-800/80 bg-zinc-900/95 p-10 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-400/80">
            Quiz alumno
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            Interfaz conversacional
          </h1>
          <p className="mt-4 max-w-2xl text-zinc-400">
            Responde con una opción y recibe retroalimentación inmediata cuando
            cometas un error.
          </p>
        </section>

        <section className="rounded-3xl border border-zinc-800/80 bg-zinc-900/95 p-8 shadow-black/10">
          <div className="space-y-6">
            <div className="rounded-3xl bg-zinc-950/80 p-6">
              <p className="text-sm text-zinc-400">
                Pregunta {indice + 1} de {preguntas.length}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                {preguntaActual.texto}
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {preguntaActual.opciones.map((opcion) => (
                <button
                  key={opcion.clave}
                  type="button"
                  onClick={() => seleccionarOpcion(opcion.clave)}
                  className="rounded-3xl border border-zinc-800/80 bg-zinc-950/90 px-5 py-5 text-left text-white transition hover:border-cyan-400/50 hover:bg-zinc-900/95"
                  disabled={procesando}
                >
                  <span className="text-sm font-semibold text-cyan-300">
                    {opcion.clave}
                  </span>
                  <p className="mt-2 text-lg leading-7">{opcion.texto}</p>
                </button>
              ))}
            </div>

            {mensaje ? (
              <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/90 p-5 text-white">
                <p className="font-semibold">{mensaje}</p>
                {feedback ? (
                  <p className="mt-3 text-zinc-300">{feedback}</p>
                ) : null}
              </div>
            ) : null}

            {terminado ? (
              <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-white">
                <h3 className="text-2xl font-semibold">
                  ¡Has terminado el quiz!
                </h3>
                <p className="mt-3 text-zinc-300">
                  Tu puntuación final es {score} de {preguntas.length}.
                </p>
                <a
                  href="/alumno/progreso"
                  className="mt-6 inline-flex rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-cyan-400"
                >
                  Ver progreso
                </a>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
