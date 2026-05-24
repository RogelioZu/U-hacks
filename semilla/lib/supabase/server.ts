import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente para Server Components, Server Actions y Route Handlers.
// En Next.js 16 `cookies()` es asíncrono, por eso esta función es async.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // `setAll` desde un Server Component lanza error porque no se
            // pueden escribir cookies durante el render. Es seguro ignorarlo:
            // el refresco de sesión ocurre en proxy.ts antes del render.
          }
        },
      },
    },
  );
}

// Cliente con privilegios de servicio (service_role). SOLO en el servidor.
// Omite RLS: úsalo únicamente para tareas administrativas/cron, nunca con
// datos provenientes directamente del cliente sin validar.
export function createSupabaseAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    },
  );
}
