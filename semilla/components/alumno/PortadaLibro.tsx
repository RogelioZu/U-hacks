"use client";

import { useState } from "react";

// Portada de un libro servida desde un host externo (librosconaliteg.com.mx).
// Componente cliente aislado: gestiona los estados de carga (shimmer) y error
// (fallback elegante), sin afectar el render del layout de servidor.

export default function PortadaLibro({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [estado, setEstado] = useState<"cargando" | "ok" | "error">("cargando");

  return (
    <div
      className="relative aspect-[3/4] w-full overflow-hidden"
      style={{ background: "var(--s-indigo-lt)" }}
    >
      {/* Estado: cargando → shimmer */}
      {estado === "cargando" && (
        <div className="absolute inset-0 semilla-shimmer" aria-hidden />
      )}

      {/* Estado: error → portada no disponible */}
      {estado === "error" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center"
          style={{ color: "var(--s-text-muted)" }}
        >
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <span className="text-[11px] font-medium leading-tight">
            Portada no disponible
          </span>
        </div>
      )}

      {/* La imagen siempre se monta para poder detectar carga/error. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setEstado("ok")}
        onError={() => setEstado("error")}
        className={`h-full w-full object-cover transition-opacity duration-500 ${
          estado === "ok" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
