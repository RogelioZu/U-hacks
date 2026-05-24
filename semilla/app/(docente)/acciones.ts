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
): Promise<{ exito: boolean; error?: string }> {
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

  return { exito: true };
}
