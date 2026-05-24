import { createBrowserClient } from "@supabase/ssr";

// Cliente para componentes de cliente ("use client").
// Solo expone la anon key pública; nunca la service role.
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (key.startsWith("sb_secret_")) {
    throw new Error(
      "Forbidden use of secret API key in browser. Set NEXT_PUBLIC_SUPABASE_ANON_KEY to the public anon key and move the secret key to SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  if (url.includes("/rest/v1")) {
    throw new Error(
      "La URL de Supabase debe ser la raíz del proyecto, no el endpoint REST. Usa el formato https://<tu-proyecto>.supabase.co.",
    );
  }

  return createBrowserClient(url, key);
}
