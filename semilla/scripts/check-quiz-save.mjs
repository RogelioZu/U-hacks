// Script para diagnosticar por qué no se guardan respuestas del quiz.
// Ejecutar: node scripts/check-quiz-save.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wpkrnxfxnerdsbkuubir.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!key) {
  console.error("❌ No se encontró key de Supabase");
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  console.log("═══════════════════════════════════════════");
  console.log("🔍 Diagnóstico de guardado de quiz");
  console.log("═══════════════════════════════════════════\n");

  // 1. Verificar tabla respuesta_alumno
  console.log("1️⃣  Tabla respuesta_alumno:");
  const { data: respuestas, error: errResp } = await supabase
    .from("respuesta_alumno")
    .select("*")
    .limit(5);

  if (errResp) {
    console.log("   ❌ ERROR:", errResp.message);
    console.log("   Código:", errResp.code);
    console.log("   Detalle:", errResp.details);
  } else {
    console.log("   ✅ Tabla existe, registros encontrados:", respuestas?.length ?? 0);
    if (respuestas?.length > 0) {
      console.log("   Columnas:", Object.keys(respuestas[0]).join(", "));
    }
  }

  // 2. Verificar tabla alumno
  console.log("\n2️⃣  Tabla alumno:");
  const { data: alumnos, error: errAl } = await supabase
    .from("alumno")
    .select("id, auth_user_id, grupo_id")
    .limit(5);

  if (errAl) {
    console.log("   ❌ ERROR:", errAl.message);
  } else {
    console.log("   ✅ Alumnos encontrados:", alumnos?.length ?? 0);
    for (const a of alumnos ?? []) {
      console.log(`   - id=${a.id} auth_user=${a.auth_user_id} grupo=${a.grupo_id}`);
    }
  }

  // 3. Verificar aplicacion activa
  console.log("\n3️⃣  Aplicaciones activas:");
  const { data: apps, error: errApp } = await supabase
    .from("aplicacion")
    .select("id, grupo_id, estado, fecha_inicio")
    .eq("estado", "activa");

  if (errApp) {
    console.log("   ❌ ERROR:", errApp.message);
  } else {
    console.log("   Aplicaciones activas:", apps?.length ?? 0);
    for (const a of apps ?? []) {
      console.log(`   - id=${a.id} grupo=${a.grupo_id} estado=${a.estado}`);
    }
  }

  // 4. Verificar pregunta_aplicada
  console.log("\n4️⃣  Preguntas aplicadas:");
  const { data: pa, error: errPA } = await supabase
    .from("pregunta_aplicada")
    .select("id, aplicacion_id, pregunta_id, alumno_id, orden")
    .limit(5);

  if (errPA) {
    console.log("   ❌ ERROR:", errPA.message);
  } else {
    console.log("   Preguntas encontradas:", pa?.length ?? 0);
    for (const p of pa ?? []) {
      console.log(`   - id=${p.id} app=${p.aplicacion_id} preg=${p.pregunta_id} alumno=${p.alumno_id}`);
    }
  }

  // 5. Intentar insertar una respuesta de prueba
  console.log("\n5️⃣  Test de INSERT en respuesta_alumno:");
  if (alumnos?.length > 0 && pa?.length > 0) {
    const testInsert = {
      alumno_id: alumnos[0].id,
      pregunta_aplicada_id: pa[0].id,
      respuesta_seleccionada: "TEST - borrar",
      es_correcta: false,
      tiempo_respuesta_seg: 0,
      modo_entrega: "online",
    };
    console.log("   Payload:", JSON.stringify(testInsert, null, 2));

    const { data: insertData, error: insertErr } = await supabase
      .from("respuesta_alumno")
      .insert(testInsert)
      .select();

    if (insertErr) {
      console.log("   ❌ INSERT FALLÓ:", insertErr.message);
      console.log("   Código:", insertErr.code);
      console.log("   Detalle:", insertErr.details);
      console.log("   Hint:", insertErr.hint);
    } else {
      console.log("   ✅ INSERT exitoso:", insertData);
      // Limpiar registro de prueba
      if (insertData?.[0]?.id) {
        await supabase.from("respuesta_alumno").delete().eq("id", insertData[0].id);
        console.log("   🧹 Registro de prueba eliminado");
      }
    }
  } else {
    console.log("   ⚠️  No hay datos de alumno/pregunta para probar insert");
  }

  // 6. Verificar RLS
  console.log("\n6️⃣  Test de INSERT con anon key (simulando cliente):");
  const anonClient = createClient(url, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwa3JueGZ4bmVyZHNia3V1YmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1ODM0MTUsImV4cCI6MjA5NTE1OTQxNX0.YLuR65DA9jCyrzApnx5Hrf0t0usxO2Go4dFBFZqzc7g");

  if (alumnos?.length > 0 && pa?.length > 0) {
    const { error: anonErr } = await anonClient
      .from("respuesta_alumno")
      .insert({
        alumno_id: alumnos[0].id,
        pregunta_aplicada_id: pa[0].id,
        respuesta_seleccionada: "ANON TEST",
        es_correcta: false,
        tiempo_respuesta_seg: 0,
        modo_entrega: "online",
      });

    if (anonErr) {
      console.log("   ❌ RLS BLOQUEÓ INSERT:", anonErr.message);
      console.log("   → El alumno NO autenticado no puede insertar (esperado)");
      console.log("   → Pero si está autenticado y también falla, RLS está mal configurado");
    } else {
      console.log("   ✅ INSERT con anon key pasó (RLS permite inserts sin auth)");
    }
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("✅ Diagnóstico completado");
  console.log("═══════════════════════════════════════════");
}

check().catch(console.error);
