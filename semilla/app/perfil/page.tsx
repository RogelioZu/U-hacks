"use client";

import { useState, useEffect } from "react";

export default function PerfilPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Could fetch /api/me to show current metadata; keep simple here.
  }, []);

  async function requestRole() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/set-role", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setStatus("Rol asignado: nexo.alumno. Refresca para continuar.");
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16 text-center sm:px-10">
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/95 p-10 shadow-2xl shadow-black/20">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-400/80">
            Perfil
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            Completa tu perfil
          </h1>
          <p className="mt-4 text-zinc-300">
            Parece que no tienes un rol asignado. Pulsa el botón para solicitar
            ser marcado como alumno.
          </p>

          <div className="mt-8">
            <button
              onClick={requestRole}
              disabled={loading}
              className="rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400 disabled:opacity-60"
            >
              {loading ? "Solicitando…" : "Solicitar rol alumno"}
            </button>
          </div>

          {status ? <p className="mt-4 text-zinc-300">{status}</p> : null}
        </div>
      </div>
    </main>
  );
}
