"use client";

// Widget de chat flotante. Se monta una vez en el layout de cada rol.
// La `audiencia` aquí es solo cosmética (título, saludo, color): el servidor
// decide la persona real del asistente a partir del rol de la sesión.

import { useEffect, useRef, useState } from "react";

interface Mensaje {
  rol: "user" | "model";
  texto: string;
}

const COPY = {
  alumno: {
    titulo: "Tutor Semilla",
    saludo: "¡Hola! Soy tu tutor 🌱 ¿Qué tema quieres repasar hoy?",
    placeholder: "Escribe tu duda…",
    acento: "var(--s-orange)",
  },
  docente: {
    titulo: "Asistente NEXO",
    saludo:
      "Hola. Puedo ayudarte a interpretar el diagnóstico del grupo o a redactar tu reporte CTE. ¿Qué necesitas?",
    placeholder: "Pregunta sobre tu grupo o reporte…",
    acento: "var(--s-indigo)",
  },
} as const;

export default function ChatAsistente({
  audiencia,
}: {
  audiencia: "alumno" | "docente";
}) {
  const copy = COPY[audiencia];
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [entrada, setEntrada] = useState("");
  const [enviando, setEnviando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  // Autoscroll al último mensaje
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, abierto]);

  async function enviar() {
    const texto = entrada.trim();
    if (!texto || enviando) return;

    const historial: Mensaje[] = [...mensajes, { rol: "user", texto }];
    // Añadimos un turno vacío del modelo que iremos rellenando con el stream.
    setMensajes([...historial, { rol: "model", texto: "" }]);
    setEntrada("");
    setEnviando(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensajes: historial }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const fragmento = decoder.decode(value, { stream: true });
        setMensajes((prev) => {
          const copia = [...prev];
          copia[copia.length - 1] = {
            rol: "model",
            texto: copia[copia.length - 1].texto + fragmento,
          };
          return copia;
        });
      }
    } catch {
      setMensajes((prev) => {
        const copia = [...prev];
        copia[copia.length - 1] = {
          rol: "model",
          texto: "No pude responder en este momento. Intenta de nuevo. 🙏",
        };
        return copia;
      });
    } finally {
      setEnviando(false);
    }
  }

  function alPresionar(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        type="button"
        aria-label={abierto ? "Cerrar asistente" : "Abrir asistente"}
        onClick={() => setAbierto((v) => !v)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105"
        style={{ background: copy.acento }}
      >
        {abierto ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.05-3.5C3.4 15.3 3 13.7 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {abierto && (
        <div
          className="fixed bottom-24 right-5 z-40 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border shadow-2xl"
          style={{ background: "var(--s-surface)", borderColor: "var(--s-border)" }}
        >
          {/* Encabezado */}
          <div
            className="flex items-center gap-2 px-4 py-3 text-white"
            style={{ background: "var(--s-navy)" }}
          >
            <span className="text-lg">🌱</span>
            <span className="font-semibold">{copy.titulo}</span>
          </div>

          {/* Mensajes */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            <Burbuja rol="model" texto={copy.saludo} />
            {mensajes.map((m, i) => (
              <Burbuja key={i} rol={m.rol} texto={m.texto} acento={copy.acento} />
            ))}
            {enviando &&
              mensajes[mensajes.length - 1]?.rol === "model" &&
              mensajes[mensajes.length - 1]?.texto === "" && (
                <p className="text-sm" style={{ color: "var(--s-text-muted)" }}>
                  Escribiendo…
                </p>
              )}
            <div ref={finRef} />
          </div>

          {/* Entrada */}
          <div className="border-t p-3" style={{ borderColor: "var(--s-border)" }}>
            <div className="flex items-end gap-2">
              <textarea
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                onKeyDown={alPresionar}
                rows={1}
                placeholder={copy.placeholder}
                className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--s-border)", color: "var(--s-text)" }}
              />
              <button
                type="button"
                onClick={enviar}
                disabled={enviando || entrada.trim() === ""}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: copy.acento }}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Burbuja({
  rol,
  texto,
  acento,
}: {
  rol: "user" | "model";
  texto: string;
  acento?: string;
}) {
  const esUsuario = rol === "user";
  return (
    <div className={esUsuario ? "flex justify-end" : "flex justify-start"}>
      <div
        className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed"
        style={
          esUsuario
            ? { background: acento ?? "var(--s-navy)", color: "#fff" }
            : { background: "var(--s-bg)", color: "var(--s-text)" }
        }
      >
        {texto}
      </div>
    </div>
  );
}
