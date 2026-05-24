import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Semilla — Plataforma educativa",
};

/**
 * Página raíz — redirige según el rol del usuario autenticado.
 * Sin sesión       → /login
 * alumno           → /alumno
 * docente/directivo → /tablero
 * admin_zonal      → /admin (futuro)
 * sin rol          → /perfil (completar registro)
 */
export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rol = (user.user_metadata?.rol as string | undefined)
    ?.trim()
    .toLowerCase();

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
