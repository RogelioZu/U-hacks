// Prueba en vivo los prompts de lib/gemini.ts con ejemplos reales de Telesecundaria.
// Sirve para iterar la redacción hasta que el output sea pedagógicamente correcto.
// Uso: node scripts/probar-prompts.mjs
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

// Import dinámico DESPUÉS de cargar el env (Node 24 procesa el .ts directamente).
const { generarRetroalimentacion, generarReporteCTE } = await import("../lib/gemini.ts");

const sep = (t) => console.log(`\n${"─".repeat(64)}\n${t}\n${"─".repeat(64)}`);

// ── Casos de retroalimentación (respuesta incorrecta) ─────────────────
const casos = [
  {
    textoPregunta: "¿Cuáles son las soluciones de la ecuación x² - 5x + 6 = 0?",
    respuestaSeleccionada: "x = 5 y x = 6",
    respuestaCorrecta: "x = 2 y x = 3",
    errorDistractor:
      "El alumno tomó los coeficientes b y c como si fueran las soluciones, sin factorizar.",
    pistaDistractor:
      "Busca dos números que multiplicados den 6 y sumados den 5.",
  },
  {
    textoPregunta: "¿Cuál es el número atómico del carbono?",
    respuestaSeleccionada: "12",
    respuestaCorrecta: "6",
    errorDistractor:
      "Confunde el número atómico (protones) con la masa atómica.",
    pistaDistractor:
      "El número atómico es la cantidad de protones, no la masa del átomo.",
  },
];

for (const [i, c] of casos.entries()) {
  sep(`RETROALIMENTACIÓN — caso ${i + 1}: ${c.textoPregunta}`);
  console.log(`Eligió (incorrecta): ${c.respuestaSeleccionada}`);
  const fb = await generarRetroalimentacion(c);
  console.log(`\n🌱 Tutor:\n${fb}`);
}

// ── Reporte CTE ───────────────────────────────────────────────────────
sep("REPORTE CTE");
const reporte = await generarReporteCTE({
  nombreGrupo: "3°A",
  numeroSemana: 5,
  temas: ["Ecuaciones de segundo grado", "Tabla periódica y enlaces"],
  totalAlumnos: 28,
  pctDominio: 60,
  alumnosEnRiesgo: 4,
  erroresFrecuentes: [
    "Despeje incorrecto en ecuaciones cuadráticas",
    "Confusión entre número atómico y masa atómica",
  ],
});
console.log(reporte);
console.log();
