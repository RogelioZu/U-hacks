import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/quiz/preguntas
 * Carga las preguntas del quiz para el alumno autenticado.
 * Usa el admin client para evitar bloqueos de RLS en tablas como alumno,
 * aplicacion, pregunta_aplicada, etc.
 */
export async function GET() {
  try {
    // 1. Verificar sesión del usuario
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ modo: "demo", preguntas: [], alumnoId: null });
    }

    // 2. Usar admin client para leer datos sin restricciones de RLS
    const admin = createSupabaseAdminClient();

    // 3. Buscar alumno vinculado a este auth user
    const { data: alumnoData } = await admin
      .from("alumno")
      .select("id, grupo_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!alumnoData) {
      return NextResponse.json({ modo: "demo", preguntas: [], alumnoId: null });
    }

    // 4. Buscar aplicación activa del grupo
    const { data: aplicacion } = await admin
      .from("aplicacion")
      .select("id")
      .eq("grupo_id", alumnoData.grupo_id)
      .eq("estado", "activa")
      .order("fecha_inicio", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!aplicacion) {
      return NextResponse.json({
        modo: "demo",
        preguntas: [],
        alumnoId: alumnoData.id,
      });
    }

    // 5. Obtener preguntas de la aplicación
    const { data: preguntasAplicadas } = await admin
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
          respuesta_incorrecta_3,
          pista_distractor_3
        )
      `,
      )
      .eq("aplicacion_id", aplicacion.id)
      .or(`alumno_id.is.null,alumno_id.eq.${alumnoData.id}`)
      .order("orden");

    if (!preguntasAplicadas || preguntasAplicadas.length === 0) {
      return NextResponse.json({
        modo: "demo",
        preguntas: [],
        alumnoId: alumnoData.id,
      });
    }

    return NextResponse.json({
      modo: "real",
      preguntas: preguntasAplicadas,
      alumnoId: alumnoData.id,
      aplicacionId: aplicacion.id,
    });
  } catch (err) {
    console.error("[api/quiz/preguntas] Error:", err);
    return NextResponse.json({ modo: "demo", preguntas: [], alumnoId: null });
  }
}
