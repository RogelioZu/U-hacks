import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso Denegado — Semilla",
};

export default function AccesoDenegadoPage() {
  return (
    <div
      className="min-h-dvh flex items-center justify-center px-4 py-16"
      style={{ background: "var(--s-bg)" }}
    >
      <div className="s-card max-w-md w-full p-10 text-center">
        {/* Ilustración */}
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: "#FEF2F2" }}
        >
          <svg
            className="h-10 w-10"
            style={{ color: "var(--s-error)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--s-error)" }}
        >
          Acceso denegado
        </p>
        <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--s-navy)" }}>
          Sin permisos para esta sección
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--s-text-muted)" }}>
          Tu cuenta no tiene el rol requerido para acceder aquí. Si crees que es
          un error, contacta a tu administrador.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a href="/login" className="s-btn-primary">
            Ir a login
          </a>
          <a href="/" className="s-btn-secondary">
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
