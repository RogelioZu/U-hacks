const url = "https://wpkrnxfxnerdsbkuubir.supabase.co/rest/v1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwa3JueGZ4bmVyZHNia3V1YmlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTU4MzQxNSwiZXhwIjoyMDk1MTU5NDE1fQ.LEITy7qYjdyyHZeE724U58chFveKtk2CYwtua-lGfF8";
const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function getStats() {
  const [apps, pregAp, preg, resps] = await Promise.all([
    fetch(`${url}/aplicacion?select=id,estado,grupo_id`, { headers }).then(r=>r.json()),
    fetch(`${url}/pregunta_aplicada?select=id,aplicacion_id,alumno_id,pregunta_id`, { headers }).then(r=>r.json()),
    fetch(`${url}/pregunta?select=id,texto_pregunta`, { headers }).then(r=>r.json()),
    fetch(`${url}/respuesta_alumno?select=id,respondida_at,respuesta_seleccionada`, { headers }).then(r=>r.json()),
  ]);

  console.log("=== DIAGNOSTICO DE BD ===");
  console.log("Aplicaciones:", apps);
  console.log("Preguntas Aplicadas:", pregAp);
  console.log("Preguntas:", preg);
  console.log("Respuestas guardadas:", resps);
}
getStats();
