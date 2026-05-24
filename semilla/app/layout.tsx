import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexo — Plataforma educativa para Telesecundarias",
  description:
    "Quiz semanal con retroalimentación por IA para alumnos y diagnóstico de grupo con reportes CTE automáticos para docentes de Telesecundaria en México.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
