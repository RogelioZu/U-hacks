// Sección de libros de texto gratuitos de Telesecundaria (SEP) — Tercer grado.
// Las portadas y los enlaces apuntan a librosconaliteg.com.mx, donde el
// alumno puede visualizar/leer cada libro. Componente de servidor: presenta
// datos estáticos; las portadas se delegan a PortadaLibro (cliente) para
// gestionar carga y error.

import PortadaLibro from "./PortadaLibro";

type Libro = {
  /** Materia mostrada en la tarjeta (texto corto). */
  materia: string;
  /** URL de la portada. */
  imagen: string;
  /** URL de la página de visualización del libro. */
  enlace: string;
};

const BASE_IMG = "https://librosconaliteg.com.mx/libros/telesecundaria";
const BASE_LINK = "https://librosconaliteg.com.mx/telesecundaria/tercer-grado";

const LIBROS: Libro[] = [
  {
    materia: "Ciencias y Tecnología · Química",
    imagen: `${BASE_IMG}/Ciencias-y-Tecnologia-Quimica-Tercer-Grado-Telesecundaria.jpg`,
    enlace: `${BASE_LINK}/ciencias-y-tecnologia-quimica-tercer-grado-telesecundaria/`,
  },
  {
    materia: "Formación Cívica y Ética",
    imagen: `${BASE_IMG}/Formacion-Civica-y-Etica-Tercer-Grado-Telesecundaria.jpg`,
    enlace: `${BASE_LINK}/formacion-civica-y-etica-tercer-grado-telesecundaria/`,
  },
  {
    materia: "Historia",
    imagen: `${BASE_IMG}/Historia-Tercer-Grado-Telesecundaria.jpg`,
    enlace: `${BASE_LINK}/historia-tercer-grado-telesecundaria/`,
  },
  {
    materia: "Lengua Materna · Español",
    imagen: `${BASE_IMG}/Lengua-Materna-Espanol-Tercer-Grado-Telesecundaria.jpg`,
    enlace: `${BASE_LINK}/lengua-materna-espanol-tercer-grado-telesecundaria/`,
  },
  {
    materia: "Matemáticas",
    imagen: `${BASE_IMG}/Matematicas-Tercer-Grado-Telesecundaria.jpg`,
    enlace: `${BASE_LINK}/matematicas-tercer-grado-telesecundaria/`,
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
            Biblioteca · Tercer grado
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
              title={`Abrir: ${libro.materia} — Tercer grado`}
              className="group block transition-transform duration-150 active:scale-[0.98]"
            >
              <div
                className="overflow-hidden rounded-xl border bg-white transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_30px_-12px_rgba(30,45,125,0.35)]"
                style={{ borderColor: "var(--s-border)" }}
              >
                <PortadaLibro
                  src={libro.imagen}
                  alt={`Portada de ${libro.materia} — Tercer grado`}
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
