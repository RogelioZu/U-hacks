export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-12 px-6 py-16 sm:px-10">
        <section className="rounded-3xl border border-zinc-800/80 bg-zinc-900/95 p-10 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-400/80">
            Nexo Alumno
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            Autenticación y flujo del alumno
          </h1>
          <p className="mt-4 max-w-2xl text-zinc-400">
            Accede como estudiante, resuelve un quiz conversacional con opciones
            A/B/C/D y consulta tu progreso.
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          <a
            href="/login"
            className="rounded-3xl border border-zinc-800/80 bg-cyan-500/10 p-8 text-left transition hover:border-cyan-400/40 hover:bg-cyan-500/15"
          >
            <h2 className="text-2xl font-semibold text-white">Login</h2>
            <p className="mt-3 text-zinc-300">
              Configura Supabase Auth y accede al flujo de alumno.
            </p>
          </a>
          <a
            href="/alumno"
            className="rounded-3xl border border-zinc-800/80 bg-violet-500/10 p-8 text-left transition hover:border-violet-400/40 hover:bg-violet-500/15"
          >
            <h2 className="text-2xl font-semibold text-white">
              Dashboard alumno
            </h2>
            <p className="mt-3 text-zinc-300">
              Ir al panel del estudiante para iniciar el quiz y revisar el
              progreso.
            </p>
          </a>
        </section>
      </main>
    </div>
  );
}
