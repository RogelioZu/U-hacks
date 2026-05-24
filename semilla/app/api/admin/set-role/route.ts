import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const admin = createSupabaseAdminClient();

    // Merge existing metadata with role
    const existing = user.user_metadata ?? {};
    const newMeta = { ...existing, rol: "semilla.alumno" };

    const res = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: newMeta,
    });

    if (res.error)
      return NextResponse.json({ error: res.error.message }, { status: 500 });

    return NextResponse.json({ ok: true, user: res.data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
