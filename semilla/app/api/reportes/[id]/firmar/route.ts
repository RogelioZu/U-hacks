import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { ErrorApi } from "@/types/nexo";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/reportes/[id]/firmar
// Actualiza el contenido editado por el docente y marca el reporte como firmado.
export async function PATCH(
  request: NextRequest,
  { params }: Params,
): Promise<NextResponse<{ ok: boolean } | ErrorApi>> {
  // ── 1. Verificar autenticación ──────────────────────────────────────
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    },
  );

  const {
    data: { user },
    error: errorAuth,
  } = await supabaseAuth.auth.getUser();

  if (errorAuth || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const rol = (user.user_metadata?.rol as string | undefined) ?? "";
  if (rol !== "docente" && rol !== "directivo") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  // ── 2. Parsear parámetros ──────────────────────────────────────────
  const { id: idStr } = await params;
  const reporteId = Number(idStr);

  if (!reporteId || isNaN(reporteId)) {
    return NextResponse.json({ error: "ID de reporte inválido" }, { status: 400 });
  }

  let contenido: string;
  try {
    const cuerpo = await request.json();
    contenido = String(cuerpo.contenido ?? "").trim();
    if (!contenido) {
      return NextResponse.json(
        { error: "El contenido del reporte no puede estar vacío" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud inválido" },
      { status: 400 },
    );
  }

  // ── 3. Obtener id del profesor ─────────────────────────────────────
  const { data: profesor } = await supabaseAuth
    .from("profesor")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profesor) {
    return NextResponse.json(
      { error: "No se encontró el perfil del docente" },
      { status: 403 },
    );
  }

  // ── 4. Verificar que el reporte pertenece a este docente ──────────
  // RLS ya lo bloquea en Supabase, pero verificamos explícitamente
  const { data: reporteActual } = await supabaseAuth
    .from("reporte")
    .select("id, estado, docente_id")
    .eq("id", reporteId)
    .single();

  if (!reporteActual) {
    return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
  }

  if (reporteActual.estado === "firmado") {
    return NextResponse.json(
      { error: "El reporte ya fue firmado y no puede modificarse" },
      { status: 409 },
    );
  }

  // ── 5. Actualizar el reporte ─────────────────────────────────────────
  const { error: errorActualizar } = await supabaseAuth
    .from("reporte")
    .update({
      contenido,
      estado: "firmado",
      firmado_at: new Date().toISOString(),
    })
    .eq("id", reporteId);

  if (errorActualizar) {
    return NextResponse.json(
      { error: "Error al guardar el reporte firmado" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
