import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Página raíz — redirige según el rol del usuario autenticado.
 * Sin sesión → /login
 * alumno     → /alumno
 * docente / directivo → /docente/tablero  (ruta real del grupo de rutas)
 * admin_zonal → /admin (futuro)
 * sin rol    → /perfil (para completar registro)
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

  if (rol === "alumno" || rol === "nexo.alumno") {
    redirect("/alumno");
  }

  if (
    rol === "docente" ||
    rol === "nexo.docente" ||
    rol === "directivo" ||
    rol === "nexo.directivo"
  ) {
    redirect("/docente/tablero");
  }

  if (rol === "admin_zonal" || rol === "nexo.admin_zonal") {
    redirect("/admin");
  }

  // Rol desconocido
  redirect("/acceso-denegado");
}
