import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Semilla — Plataforma educativa",
};

/**
 * Página raíz — redirige según el rol del usuario autenticado.
 * Si el usuario no tiene rol en user_metadata pero existe en la tabla
 * `profesor` o `alumno`, se lo asigna automáticamente y redirige.
 */
export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let rol = (user.user_metadata?.rol as string | undefined)
    ?.trim()
    .toLowerCase();

  // ── Auto-detección de rol desde la BD ──────────────────────────────
  // Si el usuario no tiene rol en metadata pero sí existe en las tablas
  // `profesor` o `alumno`, le asignamos el rol automáticamente.
  if (!rol) {
    const admin = createSupabaseAdminClient();

    // ¿Es profesor?
    const { data: profesor } = await admin
      .from("profesor")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profesor) {
      const nuevoRol = "docente";
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...(user.user_metadata ?? {}), rol: nuevoRol },
      });
      rol = nuevoRol;
    } else {
      // ¿Es alumno?
      const { data: alumno } = await admin
        .from("alumno")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (alumno) {
        const nuevoRol = "alumno";
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: { ...(user.user_metadata ?? {}), rol: nuevoRol },
        });
        rol = nuevoRol;
      }
    }
  }

  // ── Redirección por rol ────────────────────────────────────────────
  if (!rol) {
    redirect("/perfil");
  }

  if (rol === "alumno" || rol === "semilla.alumno") {
    redirect("/alumno");
  }

  if (
    rol === "docente" ||
    rol === "semilla.docente" ||
    rol === "directivo" ||
    rol === "semilla.directivo"
  ) {
    redirect("/tablero");
  }

  if (rol === "admin_zonal" || rol === "semilla.admin_zonal") {
    redirect("/admin");
  }

  // Rol desconocido
  redirect("/acceso-denegado");
}
