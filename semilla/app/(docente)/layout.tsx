import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/docente/LogoutButton";
import ChatAsistente from "@/components/ChatAsistente";
import IlustracionSemilla from "@/components/IlustracionSemilla";

// Layout compartido para todas las rutas del docente.
// Verifica sesión y rol — segunda capa tras proxy.ts.
export default async function LayoutDocente({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const rol = (user.user_metadata?.rol as string | undefined)?.trim().toLowerCase() ?? "";
  if (rol !== "docente" && rol !== "directivo" && rol !== "semilla.docente" && rol !== "semilla.directivo") {
    redirect("/acceso-denegado");
  }

  const navLinks = [
    {
      href: "/tablero",
      id: "nav-tablero",
      label: "Tablero",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: "/configurar",
      id: "nav-configurar",
      label: "Configurar",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      href: "/reporte",
      id: "nav-reporte",
      label: "Reporte CTE",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-dvh" style={{ background: "var(--s-bg)" }}>
      {/* Barra de navegación */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          background: "var(--s-surface)",
          borderColor: "var(--s-border)",
          boxShadow: "0 1px 12px rgba(30,45,125,0.07)",
        }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl border"
              style={{ background: "var(--s-surface)", borderColor: "var(--s-border)" }}
            >
              <IlustracionSemilla className="h-6 w-6" />
            </div>
            <span className="font-bold text-base" style={{ color: "var(--s-navy)" }}>Semilla</span>
            <span
              className="hidden rounded-full px-2 py-0.5 text-xs font-semibold sm:inline"
              style={{ background: "var(--s-indigo-lt)", color: "var(--s-navy)" }}
            >
              Docente
            </span>
          </div>

          {/* Navegación */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                id={link.id}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--s-indigo-lt)]"
                style={{ color: "var(--s-text-muted)" }}
              >
                {link.icon}
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            ))}
            <LogoutButton />
          </nav>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>

      <ChatAsistente audiencia="docente" />
    </div>
  );
}
