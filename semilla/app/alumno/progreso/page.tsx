import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProgresoPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const progreso = {
    completado: 68,
    dominio: 74,
    lecciones: 12,
    erroresFrecuentes: [
      "Concepto de fracciones",
      "Interpretación de texto",
      "Uso de porcentajes",
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-16 sm:px-10">
        <section className="rounded-3xl border border-zinc-800/80 bg-zinc-900/95 p-10 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-violet-300/80">
            Mi progreso
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            {user?.email ?? "Estudiante"}
          </h1>
          <p className="mt-4 max-w-2xl text-zinc-400">
            Esta sección muestra una vista general de tu avance y los temas
            donde conviene reforzar.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/95 p-8">
            <p className="text-sm text-zinc-400">Actividades completadas</p>
            <p className="mt-6 text-5xl font-semibold text-white">
              {progreso.completado}%
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/95 p-8">
            <p className="text-sm text-zinc-400">Dominio actual</p>
            <p className="mt-6 text-5xl font-semibold text-white">
              {progreso.dominio}%
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/95 p-8">
            <p className="text-sm text-zinc-400">Lecciones completadas</p>
            <p className="mt-6 text-5xl font-semibold text-white">
              {progreso.lecciones}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800/80 bg-zinc-900/95 p-8">
          <h2 className="text-2xl font-semibold text-white">
            Temas con más errores
          </h2>
          <ul className="mt-4 space-y-3 text-zinc-300">
            {progreso.erroresFrecuentes.map((tema) => (
              <li
                key={tema}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 px-4 py-3"
              >
                {tema}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
