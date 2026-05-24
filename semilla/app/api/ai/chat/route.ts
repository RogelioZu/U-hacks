import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  responderChatStream,
  type AudienciaChat,
  type MensajeChat,
} from "@/lib/gemini";
import { construirContextoChat } from "@/lib/contexto-chat";

// POST /api/ai/chat
// Body: { mensajes: { rol: "user" | "model"; texto: string }[] }
// Devuelve la respuesta del asistente en streaming (text/plain).
//
// La AUDIENCIA (tutor del alumno vs. asistente del docente) y el system prompt
// se deciden EN EL SERVIDOR a partir del rol de la sesión: el cliente no puede
// elegir con qué persona habla. El cliente solo aporta el historial visible.

// Límites defensivos: un chat abierto es muchas más llamadas que un quiz.
const MAX_MENSAJES = 16;
const MAX_CARACTERES = 2000;

function audienciaDeRol(rol: string): AudienciaChat | null {
  const r = rol.trim().toLowerCase();
  if (r === "alumno" || r === "semilla.alumno") return "alumno";
  if (
    r === "docente" ||
    r === "directivo" ||
    r === "semilla.docente" ||
    r === "semilla.directivo"
  ) {
    return "docente";
  }
  return null;
}

export async function POST(request: NextRequest) {
  // 1. Sesión
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 2. Audiencia según el rol (el servidor manda)
  const rol = (user.user_metadata?.rol as string | undefined) ?? "";
  const audiencia = audienciaDeRol(rol);
  if (!audiencia) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  // 3. Validar y sanear el historial
  let mensajes: unknown;
  try {
    ({ mensajes } = await request.json());
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!Array.isArray(mensajes) || mensajes.length === 0) {
    return NextResponse.json(
      { error: "Se requiere un arreglo 'mensajes' no vacío." },
      { status: 400 },
    );
  }

  const historial: MensajeChat[] = [];
  for (const m of mensajes as Array<{ rol?: unknown; texto?: unknown }>) {
    if (
      (m.rol !== "user" && m.rol !== "model") ||
      typeof m.texto !== "string" ||
      m.texto.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Cada mensaje requiere rol ('user'|'model') y texto." },
        { status: 400 },
      );
    }
    historial.push({ rol: m.rol, texto: m.texto.slice(0, MAX_CARACTERES) });
  }

  // Nos quedamos con los últimos turnos y exigimos que el último sea del usuario.
  const recortado = historial.slice(-MAX_MENSAJES);
  if (recortado[recortado.length - 1].rol !== "user") {
    return NextResponse.json(
      { error: "El último mensaje debe ser del usuario." },
      { status: 400 },
    );
  }

  // 4. Contexto armado EN EL SERVIDOR a partir del usuario autenticado:
  //    diagnóstico del alumno o agregados del grupo del docente. Solo entra
  //    info curricular/agregada (temas, niveles), nunca nombres ni CURP.
  const contexto = await construirContextoChat(audiencia, user.id);

  // 5. Responder en streaming de texto plano
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const fragmento of responderChatStream({
          audiencia,
          historial: recortado,
          contexto,
        })) {
          controller.enqueue(encoder.encode(fragmento));
        }
      } catch (e) {
        console.error("Error en chat IA:", e);
        controller.enqueue(
          encoder.encode("\n\n[No se pudo completar la respuesta. Intenta de nuevo.]"),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
