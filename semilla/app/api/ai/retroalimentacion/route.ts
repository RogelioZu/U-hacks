import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generarRetroalimentacion } from "@/lib/gemini";

// POST /api/ai/retroalimentacion
// Body: { preguntaId: number, respuestaSeleccionada: string }
// Devuelve retroalimentación de IA para la opción que eligió el alumno.
//
// El mapeo pedagógico (error + pista de cada distractor) se lee del banco de
// preguntas EN EL SERVIDOR: nunca viaja al cliente, para que no se filtren ni
// las pistas ni la respuesta correcta.

interface Body {
  preguntaId?: number;
  respuestaSeleccionada?: string;
}

export async function POST(request: NextRequest) {
  // 1. Validar body
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const { preguntaId, respuestaSeleccionada } = body;
  if (typeof preguntaId !== "number" || typeof respuestaSeleccionada !== "string") {
    return NextResponse.json(
      { error: "Se requieren preguntaId (número) y respuestaSeleccionada (texto)." },
      { status: 400 },
    );
  }

  // 2. Verificar sesión
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 3. Traer la pregunta y su mapeo pedagógico (con admin client para evitar RLS)
  const { createSupabaseAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createSupabaseAdminClient();
  const { data: pregunta, error } = await adminSupabase
    .from("pregunta")
    .select(
      `texto_pregunta, respuesta_correcta,
       respuesta_incorrecta_1, error_distractor_1, pista_distractor_1,
       respuesta_incorrecta_2, error_distractor_2, pista_distractor_2,
       respuesta_incorrecta_3, error_distractor_3, pista_distractor_3`,
    )
    .eq("id", preguntaId)
    .single();

  if (error || !pregunta) {
    return NextResponse.json({ error: "Pregunta no encontrada" }, { status: 404 });
  }

  // 4. ¿Acertó? Refuerzo positivo sin gastar tokens de IA.
  const elegida = respuestaSeleccionada.trim();
  if (elegida === pregunta.respuesta_correcta.trim()) {
    return NextResponse.json({
      esCorrecta: true,
      retroalimentacion: "¡Muy bien! Lo lograste. 🌱",
    });
  }

  // 5. Identificar qué distractor eligió para recuperar su error y su pista
  const distractores = [
    { opcion: pregunta.respuesta_incorrecta_1, error: pregunta.error_distractor_1, pista: pregunta.pista_distractor_1 },
    { opcion: pregunta.respuesta_incorrecta_2, error: pregunta.error_distractor_2, pista: pregunta.pista_distractor_2 },
    { opcion: pregunta.respuesta_incorrecta_3, error: pregunta.error_distractor_3, pista: pregunta.pista_distractor_3 },
  ];
  const match = distractores.find((d) => d.opcion?.trim() === elegida);

  // 6. Generar la retroalimentación con IA
  try {
    const retroalimentacion = await generarRetroalimentacion({
      textoPregunta: pregunta.texto_pregunta,
      respuestaSeleccionada,
      respuestaCorrecta: pregunta.respuesta_correcta,
      errorDistractor: match?.error ?? "La opción elegida no es la correcta.",
      pistaDistractor: match?.pista ?? "Repasa el concepto con calma y vuelve a intentarlo.",
    });

    return NextResponse.json({ esCorrecta: false, retroalimentacion });
  } catch (e) {
    console.error("Error generando retroalimentación:", e);
    return NextResponse.json(
      { error: "No se pudo generar la retroalimentación en este momento." },
      { status: 502 },
    );
  }
}
