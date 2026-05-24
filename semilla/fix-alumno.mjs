import { createClient } from "@supabase/supabase-js";

const url = "https://wpkrnxfxnerdsbkuubir.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwa3JueGZ4bmVyZHNia3V1YmlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTU4MzQxNSwiZXhwIjoyMDk1MTU5NDE1fQ.LEITy7qYjdyyHZeE724U58chFveKtk2CYwtua-lGfF8";

const admin = createClient(url, key);

async function fix() {
  console.log("Revisando usuarios autenticados...");
  
  // 1. Obtener todos los usuarios de Supabase Auth
  const { data: { users }, error: errUsers } = await admin.auth.admin.listUsers();
  
  if (errUsers) {
    console.error("Error al obtener usuarios:", errUsers);
    return;
  }

  // Buscar a la usuaria Ana
  const anaUser = users.find(u => u.email === "ana@nexo.demo" || u.email?.includes("ana"));
  
  if (!anaUser) {
    console.log("No se encontro un usuario con el correo ana@nexo.demo en Supabase Auth.");
    console.log("Estos son los usuarios existentes:");
    users.forEach(u => console.log(` - ${u.email} (ID: ${u.id}, Rol: ${u.user_metadata?.rol})`));
    
    // Si hay algún usuario con rol alumno, lo usamos como fallback
    const alumnoUser = users.find(u => u.user_metadata?.rol === "alumno" || u.user_metadata?.rol === "semilla.alumno");
    if (alumnoUser) {
      console.log(`\nUsando a ${alumnoUser.email} como el alumno de prueba...`);
      await vincularAlumno(alumnoUser.id);
    }
    return;
  }

  console.log(`Usuario Ana encontrado en Auth: ID = ${anaUser.id}`);
  await vincularAlumno(anaUser.id);
}

async function vincularAlumno(authUserId) {
  // 2. Vincular este ID al alumno "Ana García" en la BD
  console.log(`Vinculando auth_user_id '${authUserId}' al alumno en la base de datos...`);
  
  const { data, error } = await admin
    .from("alumno")
    .update({ auth_user_id: authUserId })
    .eq("nombre", "Ana")
    .select();
    
  if (error) {
    console.error("Error al actualizar la tabla alumno:", error);
  } else {
    console.log("¡Alumno vinculado con éxito!", data);
    console.log("\n--> AHORA VE A TU NAVEGADOR Y RECARGA LA PÁGINA DEL QUIZ <--");
  }
}

fix();
