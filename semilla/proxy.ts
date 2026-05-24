import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// En Next.js 16 el antiguo `middleware.ts` se llama `proxy.ts`.
// Aquí: (1) refrescamos la sesión de Supabase en cada request y
// (2) hacemos un chequeo optimista de rol por prefijo de ruta.
// La autorización real (de fondo) vive en las políticas RLS de Postgres.

// Prefijo de ruta -> roles permitidos.
const ROL_DOCENTE = ["docente", "semilla.docente", "directivo", "semilla.directivo"];

const RUTAS_PROTEGIDAS: { prefijo: string; roles: string[] }[] = [
  { prefijo: "/alumno", roles: ["alumno", "semilla.alumno"] },
  // (docente) route group expone las rutas directamente sin prefijo /docente
  { prefijo: "/tablero", roles: ROL_DOCENTE },
  { prefijo: "/configurar", roles: ROL_DOCENTE },
  { prefijo: "/reporte", roles: ROL_DOCENTE },
  // Prefijo alternativo si la estructura de carpetas cambia a /docente/*
  { prefijo: "/docente", roles: ROL_DOCENTE },
  { prefijo: "/admin", roles: ["admin_zonal", "semilla.admin_zonal"] },
];

function normalizeRole(role?: string) {
  return role?.trim().toLowerCase() ?? "";
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANTE: llamar getUser() temprano para que el refresco de token
  // se escriba en la respuesta antes de generarla.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const reglaProtegida = RUTAS_PROTEGIDAS.find((r) =>
    path.startsWith(r.prefijo),
  );

  if (reglaProtegida) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }

    const rolRaw = (user.user_metadata?.rol as string | undefined) ?? "";
    const rol = normalizeRole(rolRaw);

    if (!rol) {
      // Usuario autenticado pero sin rol asignado: pedir completar perfil.
      const url = request.nextUrl.clone();
      url.pathname = "/perfil";
      return NextResponse.redirect(url);
    }

    if (!reglaProtegida.roles.includes(rol)) {
      const url = request.nextUrl.clone();
      url.pathname = "/acceso-denegado";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  // Corre en todas las rutas excepto estáticos y assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
