// Marca de Semilla: una semilla que germina (tallo navy + hojas naranja/rosa).
// SVG puro y sin estado → sirve igual en componentes de servidor o cliente.
// Usado como logo en el header (NavAlumno) y como mascota en el quiz.

export default function IlustracionSemilla({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <path d="M32 56 V30" stroke="var(--s-navy)" strokeWidth="4" strokeLinecap="round" />
      <path d="M31 38 C 22 38 14 31 15 20 C 26 20 32 27 31 38 Z" fill="var(--s-orange)" />
      <path d="M33 33 C 42 33 50 26 49 15 C 38 15 32 22 33 33 Z" fill="var(--s-rose-dark)" />
      <circle cx="32" cy="58" r="3" fill="var(--s-navy)" />
    </svg>
  );
}
