import { createClient } from "@supabase/supabase-js";
const url = "https://wpkrnxfxnerdsbkuubir.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwa3JueGZ4bmVyZHNia3V1YmlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTU4MzQxNSwiZXhwIjoyMDk1MTU5NDE1fQ.LEITy7qYjdyyHZeE724U58chFveKtk2CYwtua-lGfF8";
const supabase = createClient(url, key);

async function run() {
  const { data: g } = await supabase.from("grupo").select("*");
  console.log("Grupos:", g);
}
run();
