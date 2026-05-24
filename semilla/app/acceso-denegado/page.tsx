export default function AccesoDenegadoPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16 text-center sm:px-10">
        <div className="rounded-3xl border border-red-700/60 bg-red-950/90 p-10 shadow-2xl shadow-black/25">
          <p className="text-sm uppercase tracking-[0.25em] text-red-300">
            Acceso denegado
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            No tienes permisos para esta sección
          </h1>
          <p className="mt-4 text-zinc-300">
            Tu cuenta no cuenta con el rol requerido para acceder a esta ruta.
            Si crees que es un error, habla con tu administrador o revisa tus
            credenciales.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="/login"
              className="rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400"
            >
              Ir a login
            </a>
            <a
              href="/"
              className="rounded-2xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-white"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
