"use server";

// Acciones del servidor para el módulo docente.
// Separadas del componente cliente para cumplir con las reglas de Next.js 16.

import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Guarda la selección de temas para una semana y grupo determinados.
 * Borra la selección anterior y la reemplaza con la nueva.
 */
export async function guardarTemas(
  grupoId: number,
  semanaId: number,
  temaIds: number[],
): Promise<{ exito: boolean; error?: string; redirectUrl?: string }> {
  const supabase = createSupabaseAdminClient();

  // Eliminar selección anterior de esta semana/grupo
  const { error: errorBorrar } = await supabase
    .from("semana_materia")
    .delete()
    .eq("grupo_id", grupoId)
    .eq("semana_id", semanaId);

  if (errorBorrar) {
    return { exito: false, error: "Error al limpiar temas anteriores" };
  }

  if (temaIds.length === 0) {
    return { exito: true };
  }

  // Insertar la nueva selección
  const registros = temaIds.map((temaId) => ({
    semana_id: semanaId,
    grupo_id: grupoId,
    tema_id: temaId,
  }));

  const { error: errorInsertar } = await supabase
    .from("semana_materia")
    .insert(registros);

  if (errorInsertar) {
    return { exito: false, error: "Error al guardar la selección de temas" };
  }

  // ── INTEGRACIÓN: Generar Aplicación y Preguntas ──
  // 1. Buscar o crear la aplicación para esta semana
  let aplicacionId: number;
  const { data: appExistente } = await supabase
    .from("aplicacion")
    .select("id")
    .eq("semana_id", semanaId)
    .eq("grupo_id", grupoId)
    .maybeSingle();

  if (appExistente) {
    aplicacionId = appExistente.id;
    // Limpiar diagnósticos previos de esta semana/grupo
    const { data: alumnosGrupo } = await supabase.from("alumno").select("id").eq("grupo_id", grupoId);
    if (alumnosGrupo && alumnosGrupo.length > 0) {
      const alumnoIds = alumnosGrupo.map((a) => a.id);
      await supabase
        .from("diagnostico_alumno")
        .delete()
        .eq("semana_id", semanaId)
        .in("alumno_id", alumnoIds);
    }

    // Obtener los IDs de las preguntas aplicadas actuales para borrar sus respuestas
    const { data: preguntasViejas } = await supabase
      .from("pregunta_aplicada")
      .select("id")
      .eq("aplicacion_id", aplicacionId);

    if (preguntasViejas && preguntasViejas.length > 0) {
      const idsViejos = preguntasViejas.map(p => p.id);
      await supabase
        .from("respuesta_alumno")
        .delete()
        .in("pregunta_aplicada_id", idsViejos);
    }

    // Ahora sí podemos limpiar las preguntas previas sin errores de Foreign Key
    await supabase.from("pregunta_aplicada").delete().eq("aplicacion_id", aplicacionId);
  } else {
    const { data: newApp, error: errNewApp } = await supabase
      .from("aplicacion")
      .insert({
        semana_id: semanaId,
        grupo_id: grupoId,
        fecha_inicio: new Date().toISOString(),
        estado: "activa",
        duracion_min: 30,
      })
      .select("id")
      .single();

    if (errNewApp) {
      console.error("Error creando aplicación:", errNewApp);
      return { exito: false, error: "Error al generar la aplicación del quiz" };
    }
    aplicacionId = newApp.id;
  }

  // 2. Seleccionar preguntas de los temas elegidos (2 por tema)
  const preguntasParaInsertar: { aplicacion_id: number; pregunta_id: number; orden: number }[] = [];
  let ordenActual = 1;

  for (const tId of temaIds) {
    const { data: preguntasTema } = await supabase
      .from("pregunta")
      .select("id")
      .eq("tema_id", tId)
      .limit(2); // Idealmente usar aleatoriedad, por ahora limitamos a 2

    if (preguntasTema) {
      for (const p of preguntasTema) {
        preguntasParaInsertar.push({
          aplicacion_id: aplicacionId,
          pregunta_id: p.id,
          orden: ordenActual++,
        });
      }
    }
  }

  // 3. Insertar las preguntas aplicadas
  if (preguntasParaInsertar.length > 0) {
    const { error: errPreguntas } = await supabase
      .from("pregunta_aplicada")
      .insert(preguntasParaInsertar);

    if (errPreguntas) {
      console.error("Error insertando preguntas:", errPreguntas);
      return { exito: false, error: "Error al asignar las preguntas al quiz" };
    }
  }

  // Refrescar caché de la ruta de configuración para que se vean los cambios
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/configurar");

  // Enviar instrucción de redirección al cliente
  return { exito: true, redirectUrl: "/tablero" };
}
