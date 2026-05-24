import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter auto-hospedada por next/font (sin @import frágil de Google Fonts).
// Se expone como variable CSS y la usa --font-sans en globals.css.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Semilla — Plataforma educativa para Telesecundarias",
  description:
    "Quiz semanal con retroalimentación por IA para alumnos y diagnóstico de grupo con reportes CTE automáticos para docentes de Telesecundaria en México.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
