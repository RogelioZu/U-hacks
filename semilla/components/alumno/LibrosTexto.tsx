// Sección de libros de texto gratuitos de Telesecundaria (SEP) — Tercer grado.
// Ciclo escolar 2025-2026. Colección Nanahuatzin.
// Las portadas y los enlaces apuntan al visor oficial de CONALITEG.
// Componente de servidor: presenta datos estáticos; las portadas se delegan
// a PortadaLibro (cliente) para gestionar carga y error.

import PortadaLibro from "./PortadaLibro";

type Libro = {
  /** Materia mostrada en la tarjeta (texto corto). */
  materia: string;
  /** URL de la portada (visor CONALITEG). */
  imagen: string;
  /** URL de la página de visualización del libro. */
  enlace: string;
};

// Visor oficial CONALITEG 2025-2026 — Tercer grado Telesecundaria
const BASE_CONALITEG = "https://libros.conaliteg.gob.mx/2025";

const LIBROS: Libro[] = [
  {
    materia: "Libro para la maestra y el maestro",
    imagen: `${BASE_CONALITEG}/T0LPM.htm`,
    enlace: `${BASE_CONALITEG}/T0LPM.htm`,
  },
  {
    materia: "Ética, naturaleza y sociedades",
    imagen: `${BASE_CONALITEG}/T3ETA.htm`,
    enlace: `${BASE_CONALITEG}/T3ETA.htm`,
  },
  {
    materia: "De lo humano y lo comunitario",
    imagen: `${BASE_CONALITEG}/T3HUA.htm`,
    enlace: `${BASE_CONALITEG}/T3HUA.htm`,
  },
  {
    materia: "Projects and Readings",
    imagen: `${BASE_CONALITEG}/T3INA.htm`,
    enlace: `${BASE_CONALITEG}/T3INA.htm`,
  },
  {
    materia: "Lenguajes",
    imagen: `${BASE_CONALITEG}/T3LEA.htm`,
    enlace: `${BASE_CONALITEG}/T3LEA.htm`,
  },
  {
    materia: "Proyectos · Tomo I",
    imagen: `${BASE_CONALITEG}/T3LP1.htm`,
    enlace: `${BASE_CONALITEG}/T3LP1.htm`,
  },
  {
    materia: "Proyectos · Tomo II",
    imagen: `${BASE_CONALITEG}/T3LP2.htm`,
    enlace: `${BASE_CONALITEG}/T3LP2.htm`,
  },
  {
    materia: "Proyectos · Tomo III",
    imagen: `${BASE_CONALITEG}/T3LP3.htm`,
    enlace: `${BASE_CONALITEG}/T3LP3.htm`,
  },
  {
    materia: "Múltiples lenguajes",
    imagen: `${BASE_CONALITEG}/T3MLA.htm`,
    enlace: `${BASE_CONALITEG}/T3MLA.htm`,
  },
  {
    materia: "Saberes y pensamiento científico",
    imagen: `${BASE_CONALITEG}/T3SAA.htm`,
    enlace: `${BASE_CONALITEG}/T3SAA.htm`,
  },
];

export default function LibrosTexto() {
  return (
    <section className="s-card p-6 sm:p-8">
      {/* Encabezado con icono en el lenguaje visual del proyecto */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "var(--s-orange-lt)" }}
        >
          <svg
            className="h-6 w-6"
            style={{ color: "var(--s-orange)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--s-orange)" }}
          >
            Col. Nanahuatzin · 3° · 2025-2026
          </p>
          <h2 className="text-2xl font-bold" style={{ color: "var(--s-navy)" }}>
            Libros de texto
          </h2>
        </div>
      </div>
      <p className="mt-2 text-sm" style={{ color: "var(--s-text-muted)" }}>
        Toca un libro para abrirlo y consultarlo en línea.
      </p>

      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {LIBROS.map((libro, i) => (
          <li
            key={libro.enlace}
            className="semilla-fade-up"
            style={{ ["--index" as string]: i }}
          >
            <a
              href={libro.enlace}
              target="_blank"
              rel="noopener noreferrer"
              title={`Abrir: ${libro.materia} — Col. Nanahuatzin 3° 2025-2026`}
              className="group block transition-transform duration-150 active:scale-[0.98]"
            >
              <div
                className="overflow-hidden rounded-xl border bg-white transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_30px_-12px_rgba(30,45,125,0.35)]"
                style={{ borderColor: "var(--s-border)" }}
              >
                <PortadaLibro
                  src={libro.imagen}
                  alt={`Portada de ${libro.materia} — Telesecundaria 3°`}
                />
              </div>
              <p
                className="mt-2 text-xs font-medium leading-tight"
                style={{ color: "var(--s-navy)" }}
              >
                {libro.materia}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
