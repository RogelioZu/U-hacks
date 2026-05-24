import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

export default async function HistoricoReportes() {
  const supabase = await createSupabaseServerClient();

  // Verificar sesión y rol
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rol = (user.user_metadata?.rol as string | undefined)?.trim().toLowerCase() ?? "";
  if (rol !== "docente" && rol !== "directivo" && rol !== "semilla.docente" && rol !== "semilla.directivo") {
    redirect("/acceso-denegado");
  }

  const admin = createSupabaseAdminClient();

  // Obtener el ID del profesor asociado al usuario
  const { data: profesor } = await admin
    .from("profesor")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profesor) redirect("/login");

  // Obtener los grupos del profesor para poder encontrar los reportes por semana
  const { data: grupos } = await admin
    .from("grupo")
    .select("id, nombre")
    .eq("profesor_id", profesor.id);

  const grupoIds = (grupos ?? []).map(g => g.id);

  // Obtener todas las semanas de esos grupos
  const { data: semanas } = await admin
    .from("semana")
    .select("id, numero_semana, grupo_id, fecha_inicio, fecha_fin")
    .in("grupo_id", grupoIds.length > 0 ? grupoIds : [0]);

  const semanaIds = (semanas ?? []).map(s => s.id);

  // Obtener los reportes (sugerencias guardadas) de esas semanas
  const { data: reportes } = await admin
    .from("reporte")
    .select("id, contenido_ia, estado, generado_at, enviado_at, semana_id")
    .in("semana_id", semanaIds.length > 0 ? semanaIds : [0])
    .order("generado_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Botón Volver */}
      <div>
        <Link
          href="/tablero"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al tablero
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Histórico de Sugerencias CTE</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Consulta la información y sugerencias que has guardado previamente para redactar tus reportes.
        </p>
      </div>

      <div className="grid gap-4">
        {(!reportes || reportes.length === 0) ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="font-medium text-slate-700">Aún no tienes información guardada</p>
            <p className="mt-1 text-sm text-slate-500">
              Cuando guardes las sugerencias del asistente CTE, aparecerán aquí.
            </p>
          </div>
        ) : (
          reportes.map((reporte) => {
            const semana = semanas?.find(s => s.id === reporte.semana_id);
            const grupo = grupos?.find(g => g.id === semana?.grupo_id);
            const fechaGuardado = reporte.enviado_at || reporte.generado_at;

            return (
              <div key={reporte.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 mb-3 gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {grupo?.nombre || "Grupo Desconocido"} — Semana {semana?.numero_semana || "?"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Guardado el {new Date(fechaGuardado).toLocaleDateString("es-MX", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric"
                      })}
                    </p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      reporte.estado === "enviado" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {reporte.estado === "enviado" ? "Guardado" : "Borrador sin guardar"}
                    </span>
                  </div>
                </div>
                
                <div className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100 max-h-60 overflow-y-auto">
                  {reporte.contenido_ia}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
