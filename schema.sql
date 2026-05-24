-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.alumno (
  id integer NOT NULL DEFAULT nextval('alumno_id_seq'::regclass),
  auth_user_id uuid UNIQUE,
  curp character UNIQUE,
  nombre character varying NOT NULL,
  apellidos character varying NOT NULL,
  grupo_id integer NOT NULL,
  fecha_nac date,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT alumno_pkey PRIMARY KEY (id),
  CONSTRAINT alumno_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES public.grupo(id)
);
CREATE TABLE public.aplicacion (
  id integer NOT NULL DEFAULT nextval('aplicacion_id_seq'::regclass),
  semana_id integer NOT NULL,
  grupo_id integer NOT NULL,
  fecha_inicio timestamp with time zone NOT NULL,
  fecha_cierre timestamp with time zone NOT NULL,
  duracion_min smallint NOT NULL DEFAULT 30,
  estado character varying NOT NULL DEFAULT 'pendiente'::character varying CHECK (estado::text = ANY (ARRAY['pendiente'::character varying, 'activa'::character varying, 'cerrada'::character varying]::text[])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT aplicacion_pkey PRIMARY KEY (id),
  CONSTRAINT aplicacion_semana_id_fkey FOREIGN KEY (semana_id) REFERENCES public.semana(id),
  CONSTRAINT aplicacion_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES public.grupo(id)
);
CREATE TABLE public.audit_log (
  id bigint NOT NULL DEFAULT nextval('audit_log_id_seq'::regclass),
  user_id uuid NOT NULL,
  rol character varying NOT NULL,
  entidad character varying NOT NULL,
  entidad_id integer,
  accion character varying NOT NULL,
  detalle jsonb,
  ip_origen inet,
  ocurrido_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_log_pkey PRIMARY KEY (id)
);
CREATE TABLE public.diagnostico_alumno (
  id integer NOT NULL DEFAULT nextval('diagnostico_alumno_id_seq'::regclass),
  alumno_id integer NOT NULL,
  tema_id integer NOT NULL,
  semana_id integer NOT NULL,
  intentos_totales smallint NOT NULL DEFAULT 0,
  aciertos smallint NOT NULL DEFAULT 0,
  nivel_dominio smallint NOT NULL DEFAULT 0 CHECK (nivel_dominio >= 0 AND nivel_dominio <= 3),
  requiere_repaso boolean NOT NULL DEFAULT false,
  repaso_semanas smallint NOT NULL DEFAULT 0,
  calculado_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT diagnostico_alumno_pkey PRIMARY KEY (id),
  CONSTRAINT diagnostico_alumno_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumno(id),
  CONSTRAINT diagnostico_alumno_tema_id_fkey FOREIGN KEY (tema_id) REFERENCES public.tema(id),
  CONSTRAINT diagnostico_alumno_semana_id_fkey FOREIGN KEY (semana_id) REFERENCES public.semana(id)
);
CREATE TABLE public.escuela (
  id integer NOT NULL DEFAULT nextval('escuela_id_seq'::regclass),
  nombre character varying NOT NULL,
  cct character NOT NULL UNIQUE,
  municipio character varying NOT NULL,
  estado character varying NOT NULL DEFAULT 'Estado de México'::character varying,
  zona_escolar character varying,
  telefono character varying,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT escuela_pkey PRIMARY KEY (id)
);
CREATE TABLE public.grupo (
  id integer NOT NULL DEFAULT nextval('grupo_id_seq'::regclass),
  nombre character varying NOT NULL,
  grado smallint NOT NULL CHECK (grado >= 1 AND grado <= 3),
  ciclo_escolar character NOT NULL,
  escuela_id integer NOT NULL,
  profesor_id integer NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT grupo_pkey PRIMARY KEY (id),
  CONSTRAINT grupo_escuela_id_fkey FOREIGN KEY (escuela_id) REFERENCES public.escuela(id),
  CONSTRAINT grupo_profesor_id_fkey FOREIGN KEY (profesor_id) REFERENCES public.profesor(id)
);
CREATE TABLE public.materia (
  id integer NOT NULL DEFAULT nextval('materia_id_seq'::regclass),
  nombre character varying NOT NULL,
  grado smallint NOT NULL CHECK (grado >= 1 AND grado <= 3),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT materia_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pregunta (
  id integer NOT NULL DEFAULT nextval('pregunta_id_seq'::regclass),
  tema_id integer NOT NULL,
  texto_pregunta text NOT NULL,
  respuesta_correcta character varying NOT NULL,
  respuesta_incorrecta_1 character varying NOT NULL,
  error_distractor_1 character varying NOT NULL,
  pista_distractor_1 character varying NOT NULL,
  respuesta_incorrecta_2 character varying NOT NULL,
  error_distractor_2 character varying NOT NULL,
  pista_distractor_2 character varying NOT NULL,
  respuesta_incorrecta_3 character varying,
  error_distractor_3 character varying,
  pista_distractor_3 character varying,
  nivel_dificultad smallint NOT NULL DEFAULT 2 CHECK (nivel_dificultad >= 1 AND nivel_dificultad <= 3),
  activo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pregunta_pkey PRIMARY KEY (id),
  CONSTRAINT pregunta_tema_id_fkey FOREIGN KEY (tema_id) REFERENCES public.tema(id)
);
CREATE TABLE public.pregunta_aplicada (
  id integer NOT NULL DEFAULT nextval('pregunta_aplicada_id_seq'::regclass),
  aplicacion_id integer NOT NULL,
  pregunta_id integer NOT NULL,
  orden smallint NOT NULL,
  alumno_id integer,
  es_repaso boolean NOT NULL DEFAULT false,
  CONSTRAINT pregunta_aplicada_pkey PRIMARY KEY (id),
  CONSTRAINT pregunta_aplicada_aplicacion_id_fkey FOREIGN KEY (aplicacion_id) REFERENCES public.aplicacion(id),
  CONSTRAINT pregunta_aplicada_pregunta_id_fkey FOREIGN KEY (pregunta_id) REFERENCES public.pregunta(id),
  CONSTRAINT pregunta_aplicada_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumno(id)
);
CREATE TABLE public.profesor (
  id integer NOT NULL DEFAULT nextval('profesor_id_seq'::regclass),
  auth_user_id uuid NOT NULL UNIQUE,
  nombre character varying NOT NULL,
  apellidos character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  escuela_id integer NOT NULL,
  rfc character,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profesor_pkey PRIMARY KEY (id),
  CONSTRAINT profesor_escuela_id_fkey FOREIGN KEY (escuela_id) REFERENCES public.escuela(id)
);
CREATE TABLE public.reporte (
  id integer NOT NULL DEFAULT nextval('reporte_id_seq'::regclass),
  semana_id integer NOT NULL,
  tipo_reporte character varying NOT NULL DEFAULT 'diagnostico_semanal'::character varying CHECK (tipo_reporte::text = ANY (ARRAY['diagnostico_semanal'::character varying, 'reporte_cte'::character varying, 'alerta_desercion'::character varying]::text[])),
  storage_path text,
  total_alumnos smallint NOT NULL DEFAULT 0,
  total_respuestas smallint NOT NULL DEFAULT 0,
  pct_dominio numeric,
  contenido_ia text,
  estado character varying NOT NULL DEFAULT 'borrador'::character varying CHECK (estado::text = ANY (ARRAY['borrador'::character varying, 'revisado'::character varying, 'enviado'::character varying]::text[])),
  generado_at timestamp with time zone NOT NULL DEFAULT now(),
  enviado_at timestamp with time zone,
  CONSTRAINT reporte_pkey PRIMARY KEY (id),
  CONSTRAINT reporte_semana_id_fkey FOREIGN KEY (semana_id) REFERENCES public.semana(id)
);
CREATE TABLE public.respuesta_alumno (
  id integer NOT NULL DEFAULT nextval('respuesta_alumno_id_seq'::regclass),
  alumno_id integer NOT NULL,
  pregunta_aplicada_id integer NOT NULL,
  respuesta_seleccionada character varying NOT NULL,
  es_correcta boolean NOT NULL,
  intento_numero smallint NOT NULL DEFAULT 1,
  tiempo_respuesta_seg smallint,
  modo_entrega character varying NOT NULL DEFAULT 'online'::character varying CHECK (modo_entrega::text = ANY (ARRAY['online'::character varying, 'offline_sync'::character varying]::text[])),
  respondida_at timestamp with time zone NOT NULL DEFAULT now(),
  sincronizada_at timestamp with time zone,
  CONSTRAINT respuesta_alumno_pkey PRIMARY KEY (id),
  CONSTRAINT respuesta_alumno_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumno(id),
  CONSTRAINT respuesta_alumno_pregunta_aplicada_id_fkey FOREIGN KEY (pregunta_aplicada_id) REFERENCES public.pregunta_aplicada(id)
);
CREATE TABLE public.semana (
  id integer NOT NULL DEFAULT nextval('semana_id_seq'::regclass),
  grupo_id integer NOT NULL,
  numero_semana smallint NOT NULL CHECK (numero_semana >= 1 AND numero_semana <= 40),
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  estado character varying NOT NULL DEFAULT 'configurada'::character varying CHECK (estado::text = ANY (ARRAY['configurada'::character varying, 'activa'::character varying, 'cerrada'::character varying]::text[])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT semana_pkey PRIMARY KEY (id),
  CONSTRAINT semana_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES public.grupo(id)
);
CREATE TABLE public.semana_materia (
  id integer NOT NULL DEFAULT nextval('semana_materia_id_seq'::regclass),
  semana_id integer NOT NULL,
  tema_id integer NOT NULL,
  CONSTRAINT semana_materia_pkey PRIMARY KEY (id),
  CONSTRAINT semana_materia_semana_id_fkey FOREIGN KEY (semana_id) REFERENCES public.semana(id),
  CONSTRAINT semana_materia_tema_id_fkey FOREIGN KEY (tema_id) REFERENCES public.tema(id)
);
CREATE TABLE public.tema (
  id integer NOT NULL DEFAULT nextval('tema_id_seq'::regclass),
  materia_id integer NOT NULL,
  nombre character varying NOT NULL,
  descripcion text,
  bloque_sep smallint CHECK (bloque_sep >= 1 AND bloque_sep <= 5),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tema_pkey PRIMARY KEY (id),
  CONSTRAINT tema_materia_id_fkey FOREIGN KEY (materia_id) REFERENCES public.materia(id)
);