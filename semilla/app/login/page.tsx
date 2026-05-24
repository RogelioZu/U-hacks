"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import IlustracionSemilla from "@/components/IlustracionSemilla";

export default function LoginPage() {
  const router = useRouter();
  // Instanciar dentro del componente para evitar problemas de hidratación en Next.js
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      // Log real para depuración — no se muestra al usuario
      console.error("[Supabase Auth error]", error.message, error.status);
      setError(
        error.message.includes("Email not confirmed")
          ? "Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada."
          : error.message.includes("Invalid login credentials")
          ? "Correo o contraseña incorrectos."
          : `Error al iniciar sesión: ${error.message}`
      );
      return;
    }

    // Respetar ?redirect si existe
    const params = new URLSearchParams(window.location.search);
    const redirigir = params.get("redirect");
    if (redirigir) {
      router.push(redirigir);
      return;
    }

    // Redirigir según rol — si no tiene rol, ir a "/" para auto-detección
    const rol = (data.user?.user_metadata?.rol as string | undefined)
      ?.trim()
      .toLowerCase();

    if (
      rol === "docente" ||
      rol === "semilla.docente" ||
      rol === "directivo" ||
      rol === "semilla.directivo"
    ) {
      router.push("/tablero");
    } else if (rol === "alumno" || rol === "semilla.alumno") {
      router.push("/alumno");
    } else {
      // Sin rol en metadata → ir a la raíz que auto-detecta desde la BD
      router.push("/");
    }
  }

  return (
    <div
      className="min-h-dvh flex items-center justify-center px-4 py-12"
      style={{ background: "var(--s-bg)" }}
    >
      {/* Formas decorativas de fondo */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-20"
          style={{ background: "var(--s-orange)" }}
        />
        <div
          className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full opacity-15"
          style={{ background: "var(--s-navy)" }}
        />
        <div
          className="absolute top-1/2 right-1/4 h-48 w-48 rounded-full opacity-10"
          style={{ background: "var(--s-rose)" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / cabecera */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg"
            style={{ background: "var(--s-surface)", borderColor: "var(--s-border)" }}
          >
            <IlustracionSemilla className="h-10 w-10" />
          </div>
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--s-navy)" }}
          >
            Semilla
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--s-text-muted)" }}>
            Plataforma educativa para Telesecundarias
          </p>
        </div>

        {/* Card del formulario */}
        <div className="s-card p-8">
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--s-text)" }}
          >
            Ingresar al aula
          </h2>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--s-text-muted)" }}
          >
            Accede con tu cuenta institucional para continuar.
          </p>

          <div className="mt-4 p-3 rounded-lg border text-sm" style={{ background: "var(--s-indigo-lt)", borderColor: "var(--s-indigo)", color: "var(--s-navy)" }}>
            <p className="font-semibold mb-1">Cuentas de demostración:</p>
            <ul className="space-y-1">
              <li>
                <span className="font-medium">Alumno:</span> luis_mtz@alumno.semilla.edu <span className="opacity-70">(Clave: 1234)</span>
              </li>
              <li>
                <span className="font-medium">Docente:</span> rogelio_zga@docente.semilla.edu <span className="opacity-70">(Clave: 1234)</span>
              </li>
            </ul>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--s-text)" }}
              >
                Correo institucional
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="s-input"
                placeholder="alumno@semilla.edu.mx"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--s-text)" }}
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="s-input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div
                className="rounded-xl border p-4 text-sm"
                style={{
                  background: "#FFF1F2",
                  borderColor: "#FECDD3",
                  color: "var(--s-error)",
                }}
              >
                {error}
              </div>
            )}

            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="s-btn-primary w-full"
            >
              {loading ? (
                <>
                  <svg
                    className="semilla-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Ingresando…
                </>
              ) : (
                "Ingresar al aula"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p
          className="mt-6 text-center text-xs"
          style={{ color: "var(--s-text-muted)" }}
        >
          Semilla · SEP Telesecundarias · México
        </p>
      </div>
    </div>
  );
}
