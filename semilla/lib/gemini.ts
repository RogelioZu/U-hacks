// Wrapper central de IA para Semilla.
// Usa la API de Google Gemini (AI Studio) en lugar de OpenAI.
// Modelo único configurable: cámbialo aquí y aplica a toda la app.
const MODELO = "gemini-2.5-flash";

const apiKey = process.env.GEMINI_API_KEY;

// Cliente perezoso: no rompe el build si la key aún no está configurada;
// solo falla cuando realmente se invoca a la IA en el servidor.
let _ai: any | null = null;
async function getClient(): Promise<any> {
  if (!apiKey) {
    throw new Error(
      "Falta GEMINI_API_KEY. Consíguela en https://aistudio.google.com/apikey y agrégala a .env.local",
    );
  }
  if (!_ai) {
    const module = await new Function("return import('@google/genai')")();
    const { GoogleGenAI } = module;
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

// ── 1. Retroalimentación al alumno ───────────────────────────────────

export interface DatosRetroalimentacion {
  /** Texto de la pregunta del quiz. */
  textoPregunta: string;
  /** Opción incorrecta que eligió el alumno. */
  respuestaSeleccionada: string;
  /** Respuesta correcta. Se le da a la IA para guiar, NO para revelarla. */
  respuestaCorrecta: string;
  /** Qué malentendido conceptual refleja la opción elegida (del banco de preguntas). */
  errorDistractor: string;
  /** Pista pedagógica mapeada a ese distractor (del banco de preguntas). */
  pistaDistractor: string;
}

const SYSTEM_RETROALIMENTACION = `Eres un tutor de una Telesecundaria mexicana. Acompañas a estudiantes de 12 a 15 años que acaban de elegir una opción incorrecta en un quiz. Tu meta es que se den cuenta de su malentendido y quieran intentarlo otra vez, sin sentirse mal.

Reglas:
- Háblale de "tú", con calidez y respeto. Lenguaje sencillo, frases cortas.
- NUNCA uses palabras que castiguen: nada de "mal", "incorrecto", "error" o "fallaste". Usa "casi", "vas por buen camino", "fíjate en…".
- Reconoce su intento, nombra con suavidad el malentendido puntual y transmite la pista pedagógica con tus propias palabras.
- NUNCA reveles ni escribas la respuesta correcta: la idea es que la descubra al reintentar.
- Termina SIEMPRE con una pregunta breve que lo invite a volver a intentarlo.
- Máximo 3 oraciones. Texto plano, sin listas ni markdown. Como mucho un emoji.`;

/**
 * Retroalimentación cálida y pedagógica para una respuesta incorrecta.
 * Estilo Telesecundaria: alentador, tutea, guía sin revelar la respuesta.
 */
export async function generarRetroalimentacion(
  datos: DatosRetroalimentacion,
): Promise<string> {
  const response = await (
    await getClient()
  ).models.generateContent({
    model: MODELO,
    contents: `Pregunta: ${datos.textoPregunta}
Opción que eligió el alumno: ${datos.respuestaSeleccionada}
Malentendido que refleja esa opción: ${datos.errorDistractor}
Pista pedagógica que debes transmitir: ${datos.pistaDistractor}
(Solo para tu guía interna, NO la menciones: la respuesta correcta es "${datos.respuestaCorrecta}".)`,
    config: {
      temperature: 0.6,
      maxOutputTokens: 256,
      systemInstruction: SYSTEM_RETROALIMENTACION,
    },
  });

  return response.text?.trim() ?? "";
}

// ── 2. Reporte para el Consejo Técnico Escolar (CTE) ─────────────────

export interface DatosSemana {
  nombreGrupo: string;
  numeroSemana: number;
  temas: string[];
  totalAlumnos: number;
  pctDominio: number;
  alumnosEnRiesgo: number;
  erroresFrecuentes: string[];
}

const SYSTEM_REPORTE_CTE = `Eres asistente de redacción para docentes de Telesecundaria en México. Redactas borradores de reporte para el Consejo Técnico Escolar (CTE).

Reglas:
- Lenguaje institucional formal, en tercera persona, alineado a los lineamientos de la SEP.
- Estructura el texto EXACTAMENTE con estos cuatro apartados, cada uno con su encabezado en MAYÚSCULAS y en este orden: CONTEXTO DEL GRUPO, AVANCES POR COMPETENCIA, ÁREAS DE OPORTUNIDAD, ESTRATEGIAS DE MEJORA PROPUESTAS.
- Básate ÚNICAMENTE en los datos proporcionados. No inventes cifras, porcentajes ni nombres de alumnos.
- Las estrategias deben ser concretas y accionables para la siguiente semana de clases.
- Cierra con una línea indicando que es un borrador asistido por IA, sujeto a la revisión y validación del docente titular.
- Extensión: 4 a 6 párrafos. Texto plano, sin markdown.`;

/**
 * Borrador de reporte CTE a partir de los datos agregados de la semana.
 * El docente lo revisa y firma antes de enviarlo (lenguaje institucional formal).
 */
export async function generarReporteCTE(datos: DatosSemana): Promise<string> {
  const response = await (
    await getClient()
  ).models.generateContent({
    model: MODELO,
    contents: `Genera el borrador del reporte CTE con estos datos:
Grupo: ${datos.nombreGrupo}
Semana: ${datos.numeroSemana}
Temas evaluados: ${datos.temas.join(", ") || "ninguno"}
Total de alumnos evaluados: ${datos.totalAlumnos}
Porcentaje de dominio grupal: ${datos.pctDominio}%
Alumnos con dificultades recurrentes: ${datos.alumnosEnRiesgo}
Errores más frecuentes detectados: ${datos.erroresFrecuentes.join("; ") || "sin datos suficientes"}`,
    config: {
      temperature: 0.5,
      maxOutputTokens: 1200,
      systemInstruction: SYSTEM_REPORTE_CTE,
    },
  });

  return response.text?.trim() ?? "";
}

// ── 3. Chat conversacional (tutor del alumno / asistente del docente) ─────

/** Un turno del chat. Gemini espera los roles "user" y "model". */
export interface MensajeChat {
  rol: "user" | "model";
  texto: string;
}

export type AudienciaChat = "alumno" | "docente";

const SYSTEM_CHAT_ALUMNO = `Eres "Semilla", el tutor virtual de una Telesecundaria mexicana. Conversas con un estudiante de 12 a 15 años que tiene dudas sobre lo que está aprendiendo.

Reglas:
- Háblale de "tú", con calidez y paciencia. Lenguaje sencillo y frases cortas; recuerda que puede tener poca práctica leyendo.
- Guía con preguntas y ejemplos de la vida real. Lleva al alumno a razonar, no le des el resultado masticado.
- NUNCA reveles ni escribas la respuesta de una pregunta del quiz, aunque te lo pida directa o insistentemente. Si insiste, ofrécele una pista nueva y anímalo a intentarlo.
- Nunca uses palabras que castiguen ("mal", "incorrecto", "fallaste"). Usa "casi", "vas bien", "fíjate en…".
- Quédate en temas escolares (matemáticas, español, ciencias, etc.). Si te preguntan algo ajeno o inseguro, redirígelo con amabilidad a su aprendizaje.
- Responde en español, breve (2 a 4 oraciones). Texto plano, sin markdown. Como mucho un emoji.`;

const SYSTEM_CHAT_DOCENTE = `Eres el asistente pedagógico de NEXO para docentes de Telesecundaria en México. Apoyas al profesor a interpretar el diagnóstico de su grupo, proponer estrategias de enseñanza y redactar o ajustar reportes para el Consejo Técnico Escolar (CTE).

Reglas:
- Tono profesional y respetuoso, lenguaje alineado a los lineamientos de la SEP.
- Básate ÚNICAMENTE en los datos del contexto que se te proporcionen. No inventes cifras, porcentajes ni nombres de alumnos; si faltan datos, dilo y pide precisarlos.
- Nunca expongas datos personales de los alumnos (nombres, CURP); trabaja siempre con agregados del grupo.
- Ofrece estrategias concretas y accionables para la siguiente semana de clases.
- Responde en español, claro y conciso. Puedes usar listas cortas cuando ayude a la claridad.`;

/**
 * Responde un turno de chat en streaming. Devuelve los fragmentos de texto
 * conforme el modelo los genera, para mostrarlos en vivo en la UI.
 *
 * El `systemInstruction` y el `contexto` SIEMPRE se arman en el servidor:
 * el cliente solo aporta el historial de mensajes visible para el usuario.
 */
export async function* responderChatStream(opciones: {
  audiencia: AudienciaChat;
  historial: MensajeChat[];
  /** Contexto adicional armado en el servidor (rol, grupo, diagnóstico). */
  contexto?: string;
}): AsyncGenerator<string> {
  const client = await getClient();

  const base =
    opciones.audiencia === "alumno" ? SYSTEM_CHAT_ALUMNO : SYSTEM_CHAT_DOCENTE;
  const systemInstruction = opciones.contexto
    ? `${base}\n\nContexto de la sesión (úsalo para responder; no lo repitas literal):\n${opciones.contexto}`
    : base;

  const contents = opciones.historial.map((m) => ({
    role: m.rol,
    parts: [{ text: m.texto }],
  }));

  const stream = await client.models.generateContentStream({
    model: MODELO,
    contents,
    config: {
      temperature: opciones.audiencia === "alumno" ? 0.6 : 0.5,
      maxOutputTokens: 800,
      systemInstruction,
    },
  });

  for await (const chunk of stream) {
    const texto: string | undefined = chunk.text;
    if (texto) yield texto;
  }
}
