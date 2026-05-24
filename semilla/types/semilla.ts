// Tipos compartidos de Nexo — usados en componentes, páginas y API routes
// Todo en español para consistencia con el resto del proyecto

// ────────────────────────────────────────────────────────
// Catálogo curricular
// ────────────────────────────────────────────────────────

export interface Materia {
  id: number;
  nombre: string;
  clave: string;
}

export interface Tema {
  id: number;
  materia_id: number;
  nombre: string;
  bloque: number;
  materia?: Materia;
}

// ────────────────────────────────────────────────────────
// Estructura institucional
// ────────────────────────────────────────────────────────

export interface Escuela {
  id: number;
  nombre: string;
  cct: string; // Clave de Centro de Trabajo
}

export interface Grupo {
  id: number;
  nombre: string;
  grado: number;
  turno: string;
  escuela_id: number;
  ciclo_escolar: string;
}

export interface Profesor {
  id: number;
  auth_user_id: string;
  nombre: string; // solo en servidor — nunca al cliente
  escuela_id: number;
  grupo_id: number;
}

// ────────────────────────────────────────────────────────
// Operación semanal
// ────────────────────────────────────────────────────────

export interface Semana {
  id: number;
  numero: number;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
}

export interface SemanaMateria {
  id: number;
  semana_id: number;
  grupo_id: number;
  tema_id: number;
  tema?: Tema;
}

// ────────────────────────────────────────────────────────
// Diagnóstico y reportes
// ────────────────────────────────────────────────────────

export interface DiagnosticoAlumno {
  id: number;
  alumno_id: number;
  // Alias público — nunca el nombre real al cliente
  alias: string;
  grupo_id: number;
  semana_id: number;
  materia_id: number;
  materia_nombre: string;
  nivel_dominio: 0 | 1 | 2 | 3;
  requiere_repaso: boolean;
}

export type EstadoReporte = "borrador" | "firmado";

export interface Reporte {
  id: number;
  semana_id: number;
  tipo_reporte: string;
  storage_path: string | null;
  total_alumnos: number;
  total_respuestas: number;
  pct_dominio: number;
  contenido_ia: string;
  estado: EstadoReporte | "enviado";
  generado_at: string;
  enviado_at: string | null;
}

// ────────────────────────────────────────────────────────
// Respuestas de API
// ────────────────────────────────────────────────────────

export interface RespuestaGenerarReporte {
  reporteId: number;
  contenido: string;
}

export interface ErrorApi {
  error: string;
}
