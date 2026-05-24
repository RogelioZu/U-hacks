import NavAlumno from "@/components/alumno/NavAlumno";
import ChatAsistente from "@/components/ChatAsistente";

// Layout compartido para todas las rutas del alumno
export default function LayoutAlumno({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh" style={{ background: "var(--s-bg)" }}>
      <NavAlumno />
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      <ChatAsistente audiencia="alumno" />
    </div>
  );
}
