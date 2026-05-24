import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/quiz/respuesta
 * Guarda la respuesta del alumno en Supabase usando el cliente del servidor
 * (con las cookies de sesión), evitando problemas de RLS del cliente browser.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // Verificar que el usuario está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      alumno_id,
      pregunta_aplicada_id,
      respuesta_seleccionada,
      es_correcta,
      tiempo_respuesta_seg,
    } = body as {
      alumno_id: number;
      pregunta_aplicada_id: number;
      respuesta_seleccionada: string;
      es_correcta: boolean;
      tiempo_respuesta_seg: number;
    };

    // Insertar con el admin client para evitar RLS
    const { createSupabaseAdminClient } = await import("@/lib/supabase/server");
    const adminSupabase = createSupabaseAdminClient();

    // Validar que el alumno_id pertenece al usuario autenticado
    const { data: alumno } = await adminSupabase
      .from("alumno")
      .select("id")
      .eq("id", alumno_id)
      .eq("auth_user_id", user.id)
      .single();

    if (!alumno) {
      return NextResponse.json(
        { error: "Alumno no corresponde al usuario autenticado" },
        { status: 403 },
      );
    }

    const { data, error } = await adminSupabase
      .from("respuesta_alumno")
      .insert({
        alumno_id,
        pregunta_aplicada_id,
        respuesta_seleccionada,
        es_correcta,
        tiempo_respuesta_seg,
        modo_entrega: "online",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[quiz/respuesta] Error al guardar:", error);
      return NextResponse.json(
        { error: "Error al guardar respuesta", detalle: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error("[quiz/respuesta] Error inesperado:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
