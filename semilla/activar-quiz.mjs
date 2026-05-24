const url = "https://wpkrnxfxnerdsbkuubir.supabase.co/rest/v1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwa3JueGZ4bmVyZHNia3V1YmlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTU4MzQxNSwiZXhwIjoyMDk1MTU5NDE1fQ.LEITy7qYjdyyHZeE724U58chFveKtk2CYwtua-lGfF8";

const headers = {
  "Content-Type": "application/json",
  apikey: key,
  Authorization: `Bearer ${key}`,
  Prefer: "return=representation"
};

async function fix() {
  console.log("Activando aplicación de examen...");
  const res = await fetch(`${url}/aplicacion?id=eq.1`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ estado: "activa" })
  });
  
  if (res.ok) {
    console.log("¡Aplicación activada con éxito!", await res.json());
  } else {
    console.error("Error al activar:", await res.text());
  }
}

fix();
