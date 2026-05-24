import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();
  const {
    pregunta,
    respuestaSeleccionada,
    errorDistractor,
    pistaDistractor,
    respuestaCorrecta,
  } = payload as {
    pregunta: string;
    respuestaSeleccionada: string;
    errorDistractor: string;
    pistaDistractor: string;
    respuestaCorrecta?: string;
  };

  if (!pregunta || !respuestaSeleccionada) {
    return NextResponse.json(
      { error: "Se requiere pregunta y respuesta seleccionada." },
      { status: 400 },
    );
  }

  let feedback = `Parece que no fue correcto. Revisa la pregunta y usa la pista para intentarlo de nuevo.`;

  if (process.env.GEMINI_API_KEY) {
    try {
      const { generarRetroalimentacion } = await import("../../../lib/gemini");
      feedback = await generarRetroalimentacion({
        textoPregunta: pregunta,
        respuestaSeleccionada,
        respuestaCorrecta: respuestaCorrecta ?? "",
        errorDistractor,
        pistaDistractor,
      });
    } catch {
      feedback = `No se pudo generar retroalimentación automática. Usa la pista: ${pistaDistractor}`;
    }
  } else {
    feedback = `Revisa tu respuesta y aplica esta pista: ${pistaDistractor}`;
  }

  return NextResponse.json({ feedback });
}
