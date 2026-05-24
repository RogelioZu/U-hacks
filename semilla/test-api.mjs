import { createClient } from "@supabase/supabase-js";

const url = "https://wpkrnxfxnerdsbkuubir.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwa3JueGZ4bmVyZHNia3V1YmlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTU4MzQxNSwiZXhwIjoyMDk1MTU5NDE1fQ.LEITy7qYjdyyHZeE724U58chFveKtk2CYwtua-lGfF8";

const admin = createClient(url, key);

async function testApi() {
  console.log("Simulando llamada a /api/quiz/preguntas para Ana Garcia...");
  
  // 3. Buscar alumno (Ana Garcia)
  const { data: alumnoData, error: errAl } = await admin
    .from("alumno")
    .select("id, grupo_id")
    .eq("auth_user_id", "79a118b6-18c8-4d6f-821b-4d06351ac4b3")
    .single();

  if (errAl || !alumnoData) {
    console.error("Fallo al encontrar alumno:", errAl);
    return;
  }
  console.log("Alumno encontrado:", alumnoData);

  // 4. Buscar aplicacion
  const { data: aplicacion, error: errApp } = await admin
    .from("aplicacion")
    .select("id")
    .eq("grupo_id", alumnoData.grupo_id)
    .eq("estado", "activa")
    .order("fecha_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (errApp || !aplicacion) {
    console.error("Fallo al encontrar aplicacion activa:", errApp, "aplicacion:", aplicacion);
    return;
  }
  console.log("Aplicacion activa encontrada:", aplicacion);

  // 5. Obtener preguntas
  const { data: preguntasAplicadas, error: errPA } = await admin
    .from("pregunta_aplicada")
    .select(
      `
      id,
      pregunta:pregunta_id (
        id,
        texto_pregunta,
        respuesta_correcta,
        respuesta_incorrecta_1,
        error_distractor_1,
        pista_distractor_1,
        respuesta_incorrecta_2,
        error_distractor_2,
        pista_distractor_2,
        respuesta_incorrecta_3
      )
    `
    )
    .eq("aplicacion_id", aplicacion.id)
    .or(`alumno_id.is.null,alumno_id.eq.${alumnoData.id}`)
    .order("orden");

  if (errPA || !preguntasAplicadas) {
    console.error("Fallo al obtener preguntas aplicadas:", errPA);
    return;
  }
  console.log("Preguntas aplicadas encontradas:", preguntasAplicadas.length);
  if (preguntasAplicadas.length > 0) {
    console.log("Primera pregunta:", JSON.stringify(preguntasAplicadas[0], null, 2));
  } else {
    console.error("La aplicacion no tiene preguntas asignadas!");
  }
  
  console.log("\nSimulando llamada a /api/quiz/respuesta...");
  const testInsert = {
    alumno_id: alumnoData.id,
    pregunta_aplicada_id: preguntasAplicadas[0]?.id || 1,
    respuesta_seleccionada: "Test",
    es_correcta: true,
    tiempo_respuesta_seg: 10,
    modo_entrega: "online",
  };
  const { error: insertErr } = await admin
    .from("respuesta_alumno")
    .insert(testInsert)
    .select("id")
    .single();
    
  if (insertErr) {
    console.error("Error al insertar respuesta:", insertErr);
  } else {
    console.log("Respuesta insertada con exito");
  }
}
testApi();
