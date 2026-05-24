"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import IlustracionSemilla from "@/components/IlustracionSemilla";

// Componente de navegación del alumno (client-side para logout)
export default function NavAlumno() {
  const router = useRouter();
  const pathname = usePathname();

  const supabase = createSupabaseBrowserClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const enlaces = [
    {
      href: "/alumno",
      label: "Inicio",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: "/alumno/quiz",
      label: "Quiz",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
        </svg>
      ),
    },
    {
      href: "/alumno/progreso",
      label: "Progreso",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
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
        <Link href="/alumno" className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl border"
            style={{ background: "var(--s-surface)", borderColor: "var(--s-border)" }}
          >
            <IlustracionSemilla className="h-6 w-6" />
          </div>
          <span className="font-bold text-base" style={{ color: "var(--s-navy)" }}>
            Semilla
          </span>
        </Link>

        {/* Navegación */}
        <nav className="flex items-center gap-1">
          {enlaces.map((enlace) => {
            const activo = pathname === enlace.href;
            return (
              <Link
                key={enlace.href}
                href={enlace.href}
                id={`nav-alumno-${enlace.label.toLowerCase()}`}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
                style={
                  activo
                    ? { background: "var(--s-indigo-lt)", color: "var(--s-navy)" }
                    : { color: "var(--s-text-muted)" }
                }
              >
                {enlace.icon}
                <span className="hidden sm:inline">{enlace.label}</span>
              </Link>
            );
          })}

          {/* Cerrar sesión */}
          <button
            id="btn-logout-alumno"
            onClick={handleLogout}
            className="ml-2 flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            style={{ color: "var(--s-text-muted)" }}
            title="Cerrar sesión"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Salir</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
