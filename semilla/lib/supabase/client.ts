import { createBrowserClient } from "@supabase/ssr";

// Cliente para componentes de cliente ("use client").
// Solo expone la anon key pública; nunca la service role.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
