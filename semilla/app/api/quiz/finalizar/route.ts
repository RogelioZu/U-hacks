import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { alumno_id, aplicacion_id } = await request.json() as {
      alumno_id: number;
      aplicacion_id: number;
    };

    if (!alumno_id || !aplicacion_id) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const adminSupabase = createSupabaseAdminClient();

    // Validar que el alumno pertenece al usuario autenticado
    const { data: alumno } = await adminSupabase
      .from("alumno")
      .select("id")
      .eq("id", alumno_id)
      .eq("auth_user_id", user.id)
      .single();

    if (!alumno) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener la semana_id desde la aplicación
    const { data: appData } = await adminSupabase
      .from("aplicacion")
      .select("semana_id")
      .eq("id", aplicacion_id)
      .single();

    if (!appData) {
      return NextResponse.json({ error: "Aplicación no encontrada" }, { status: 404 });
    }

    // Obtener todas las respuestas de este alumno en esta aplicación para el primer intento
    // Join a pregunta_aplicada y pregunta para agrupar por tema_id
    const { data: respuestas } = await adminSupabase
      .from("respuesta_alumno")
      .select(`
        es_correcta,
        intento_numero,
        pregunta_aplicada!inner(
          aplicacion_id,
          pregunta!inner(
            tema_id
          )
        )
      `)
      .eq("alumno_id", alumno_id)
      .eq("pregunta_aplicada.aplicacion_id", aplicacion_id)
      .eq("intento_numero", 1);

    if (!respuestas || respuestas.length === 0) {
      return NextResponse.json({ error: "No hay respuestas para evaluar" }, { status: 400 });
    }

    // Agrupar resultados por tema_id
    const resultadosPorTema: Record<number, { correctas: number; totales: number }> = {};

    for (const r of respuestas) {
      // Tipar la respuesta para extraer el tema_id
      const pa = r.pregunta_aplicada as any;
      const tema_id = pa.pregunta.tema_id;

      if (!resultadosPorTema[tema_id]) {
        resultadosPorTema[tema_id] = { correctas: 0, totales: 0 };
      }
      resultadosPorTema[tema_id].totales += 1;
      if (r.es_correcta) {
        resultadosPorTema[tema_id].correctas += 1;
      }
    }

    // Calcular nivel de dominio e insertar en diagnostico_alumno
    const recordsToInsert = Object.entries(resultadosPorTema).map(([temaIdStr, stats]) => {
      const tema_id = parseInt(temaIdStr, 10);
      const pct = stats.correctas / stats.totales;

      let nivel_dominio = 0;
      if (pct === 1) nivel_dominio = 3; // Todo bien al primer intento
      else if (pct >= 0.5) nivel_dominio = 2; // Avanzado
      else if (pct > 0) nivel_dominio = 1; // Básico
      else nivel_dominio = 0; // Inicio (0%)

      const requiere_repaso = nivel_dominio < 3;

      return {
        alumno_id,
        tema_id,
        semana_id: appData.semana_id,
        intentos_totales: stats.totales,
        aciertos: stats.correctas,
        nivel_dominio,
        requiere_repaso,
        calculado_at: new Date().toISOString()
      };
    });

    // Eliminar diagnósticos previos si por alguna razón ya existían (idempotencia)
    await adminSupabase
      .from("diagnostico_alumno")
      .delete()
      .eq("alumno_id", alumno_id)
      .eq("semana_id", appData.semana_id);

    const { error: insertError } = await adminSupabase
      .from("diagnostico_alumno")
      .insert(recordsToInsert);

    if (insertError) {
      console.error("[quiz/finalizar] Error guardando diagnóstico:", insertError);
      return NextResponse.json({ error: "Error al guardar el diagnóstico final" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[quiz/finalizar] Error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
