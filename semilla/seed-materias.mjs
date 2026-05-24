// Usando `fetch` nativo de Node.js para no depender de librerías externas
const url = "https://wpkrnxfxnerdsbkuubir.supabase.co/rest/v1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwa3JueGZ4bmVyZHNia3V1YmlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTU4MzQxNSwiZXhwIjoyMDk1MTU5NDE1fQ.LEITy7qYjdyyHZeE724U58chFveKtk2CYwtua-lGfF8";

const headers = {
  "Content-Type": "application/json",
  apikey: key,
  Authorization: `Bearer ${key}`,
  Prefer: "return=representation"
};

const materias = [
  { nombre: "Matemáticas - Tercer Grado", grado: 3 },
  { nombre: "Historia - Tercer Grado", grado: 3 },
  { nombre: "Lengua Materna – Español – Tercer Grado", grado: 3 },
  { nombre: "Formación Cívica y Ética - Tercer Grado", grado: 3 },
  { nombre: "Ciencias y Tecnología – Química – Tercer Grado", grado: 3 }
];

async function seed() {
  console.log("Seeding materias...");
  for (const m of materias) {
    // Verificar si existe la materia
    let res = await fetch(`${url}/materia?nombre=eq.${encodeURIComponent(m.nombre)}&select=id`, { headers });
    let data = await res.json();
    let materiaId;

    if (Array.isArray(data) && data.length > 0) {
      materiaId = data[0].id;
      console.log(`Materia already exists: ${m.nombre} (ID: ${materiaId})`);
    } else {
      // Insertar materia
      res = await fetch(`${url}/materia`, {
        method: "POST",
        headers,
        body: JSON.stringify(m)
      });
      
      if (!res.ok) {
        console.error("Error al insertar materia:", await res.text());
        continue;
      }
      
      data = await res.json();
      materiaId = data[0].id;
      console.log(`Inserted materia: ${m.nombre} (ID: ${materiaId})`);
    }

    // Insertar temas
    const temasEjemplo = [
      { materia_id: materiaId, nombre: `Bloque 1 - Tema 1 de ${m.nombre.split(' ')[0]}` },
      { materia_id: materiaId, nombre: `Bloque 1 - Tema 2 de ${m.nombre.split(' ')[0]}` },
      { materia_id: materiaId, nombre: `Bloque 2 - Tema 1 de ${m.nombre.split(' ')[0]}` }
    ];

    for (const t of temasEjemplo) {
      res = await fetch(`${url}/tema?nombre=eq.${encodeURIComponent(t.nombre)}&materia_id=eq.${materiaId}&select=id`, { headers });
      data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        console.log(`  Tema already exists: ${t.nombre}`);
      } else {
        res = await fetch(`${url}/tema`, {
          method: "POST",
          headers,
          body: JSON.stringify(t)
        });
        if (res.ok) {
          console.log(`  Inserted tema: ${t.nombre}`);
        } else {
          console.error(`  Error inserting tema: ${t.nombre}`, await res.text());
        }
      }
    }
  }
  console.log("\n¡Listo! Seed completado.");
}

seed().catch(console.error);
