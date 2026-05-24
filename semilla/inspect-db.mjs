#!/usr/bin/env node
// Inspeccionar las tablas restantes de Supabase
const BASE = "https://wpkrnxfxnerdsbkuubir.supabase.co/rest/v1";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwa3JueGZ4bmVyZHNia3V1YmlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTU4MzQxNSwiZXhwIjoyMDk1MTU5NDE1fQ.LEITy7qYjdyyHZeE724U58chFveKtk2CYwtua-lGfF8";

async function query(table) {
  const res = await fetch(
    `${BASE}/${table}?select=*&limit=2`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
  );
  return res.json();
}

(async () => {
  for (const t of ["semana_materia","diagnostico_alumno","materia","tema","reporte"]) {
    const d = await query(t);
    process.stdout.write(`\n=== ${t} ===\n`);
    process.stdout.write(JSON.stringify(d, null, 2));
    process.stdout.write("\n");
  }
})();
