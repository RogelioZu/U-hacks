import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Completa tu perfil — Semilla",
};

/**
 * Página de perfil incompleto.
 * El middleware redirige aquí cuando un usuario está autenticado pero
 * no tiene un rol asignado en user_metadata.rol.
 */
export default function PerfilPage() {
  return (
    <div
      className="min-h-dvh flex items-center justify-center px-4 py-16"
      style={{ background: "var(--s-bg)" }}
    >
      <div className="s-card max-w-md w-full p-10 text-center">
        {/* Ilustración */}
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: "var(--s-indigo-lt)" }}
        >
          <svg
            className="h-10 w-10"
            style={{ color: "var(--s-navy)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </div>

        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--s-indigo)" }}
        >
          Cuenta sin configurar
        </p>
        <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--s-navy)" }}>
          Tu perfil está incompleto
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--s-text-muted)" }}>
          Tu cuenta fue creada pero aún no se le ha asignado un rol (alumno,
          docente o directivo). Contacta al administrador de tu escuela para
          completar el registro.
        </p>

        <div
          className="mt-6 rounded-xl border p-4 text-left text-sm"
          style={{ background: "var(--s-rose)", borderColor: "#FECDD3" }}
        >
          <p className="font-semibold" style={{ color: "var(--s-navy)" }}>
            ¿Qué debo hacer?
          </p>
          <ul className="mt-2 space-y-1" style={{ color: "#6B4F60" }}>
            <li>• Pide a tu docente o directivo que te asigne un rol</li>
            <li>• Una vez asignado, cierra sesión y vuelve a entrar</li>
          </ul>
        </div>

        <div className="mt-8">
          <a href="/login" className="s-btn-outline">
            Volver a login
          </a>
        </div>
      </div>
    </div>
  );
}
