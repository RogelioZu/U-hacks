import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AlumnoPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-16 sm:px-10">
        <section className="rounded-3xl border border-zinc-800/80 bg-zinc-900/95 p-10 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-400/80">
            Panel alumno
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            Bienvenido, {user?.email ?? "estudiante"}
          </h1>
          <p className="mt-4 max-w-2xl text-zinc-400">
            Aquí puedes retomar tu quiz conversacional, revisar tu progreso y
            recibir retroalimentación cuando necesites un apoyo extra.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <a
            href="/alumno/quiz"
            className="rounded-3xl border border-zinc-800/80 bg-cyan-500/10 p-8 text-left transition hover:border-cyan-400/40 hover:bg-cyan-500/15"
          >
            <h2 className="text-2xl font-semibold text-white">
              Quiz conversacional
            </h2>
            <p className="mt-3 text-zinc-300">
              Responde preguntas con opciones A/B/C/D y recibe orientación
              inmediata en caso de error.
            </p>
          </a>

          <a
            href="/alumno/progreso"
            className="rounded-3xl border border-zinc-800/80 bg-violet-500/10 p-8 text-left transition hover:border-violet-400/40 hover:bg-violet-500/15"
          >
            <h2 className="text-2xl font-semibold text-white">Mi progreso</h2>
            <p className="mt-3 text-zinc-300">
              Consulta tus estadísticas de avance, dominio de temas y áreas
              donde debes reforzar.
            </p>
          </a>
        </section>
      </div>
    </main>
  );
}
