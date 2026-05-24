// Wrapper central de IA para Nexo.
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

/**
 * Retroalimentación cálida para un alumno que respondió incorrectamente.
 * Estilo Telesecundaria: alentador, tutea, nunca penaliza el error.
 */
export async function generarRetroalimentacion(
  textoPregunta: string,
  respuestaSeleccionada: string,
  errorDistractor: string,
  pistaDistractor: string,
): Promise<string> {
  const response = await (
    await getClient()
  ).models.generateContent({
    model: MODELO,
    contents: `El alumno respondió incorrectamente.
Pregunta: ${textoPregunta}
Respuesta elegida: ${respuestaSeleccionada}
Error cometido: ${errorDistractor}
Pista pedagógica a usar: ${pistaDistractor}`,
    config: {
      temperature: 0.4,
      maxOutputTokens: 150,
      systemInstruction: `Eres un tutor de Telesecundaria mexicana. Tu estilo es cálido,
alentador y nunca penalizas el error. Hablas de tú al estudiante.
Siempre terminas con una pregunta que lo invite a intentar de nuevo.
Máximo 3 oraciones.`,
    },
  });

  return response.text ?? "";
}

export interface DatosSemana {
  nombreGrupo: string;
  numeroSemana: number;
  temas: string[];
  totalAlumnos: number;
  pctDominio: number;
  alumnosEnRiesgo: number;
  erroresFrecuentes: string[];
}

/**
 * Borrador de reporte para el Consejo Técnico Escolar (CTE).
 * Lenguaje institucional formal; el docente lo revisa antes de enviar.
 */
export async function generarReporteCTE(datos: DatosSemana): Promise<string> {
  const response = await (
    await getClient()
  ).models.generateContent({
    model: MODELO,
    contents: `Genera el reporte CTE con estos datos:
Grupo: ${datos.nombreGrupo} | Semana: ${datos.numeroSemana}
Temas evaluados: ${datos.temas.join(", ")}
Alumnos evaluados: ${datos.totalAlumnos}
Porcentaje de dominio grupal: ${datos.pctDominio}%
Alumnos con dificultades recurrentes: ${datos.alumnosEnRiesgo}
Errores más frecuentes: ${datos.erroresFrecuentes.join(", ")}`,
    config: {
      maxOutputTokens: 800,
      systemInstruction: `Eres asistente de redacción para docentes de Telesecundaria en México.
Redactas reportes para el Consejo Técnico Escolar (CTE) con lenguaje
institucional formal, siguiendo los lineamientos de la SEP.
Siempre incluyes: contexto del grupo, avances por competencia,
áreas de oportunidad y estrategias de mejora propuestas.`,
    },
  });

  return response.text ?? "";
}
