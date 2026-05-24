@AGENTS.md

# NEXO (repo: `semilla`)

Plataforma educativa para **Telesecundarias mexicanas**. Quiz semanal con
retroalimentación por IA para el alumno, diagnóstico de grupo y borradores de
reporte CTE (Consejo Técnico Escolar) para el docente. Diseñada para bajo costo,
baja fricción operativa y uso offline-first.

- **Idioma:** todo el código, comentarios, UI y datos en **español**.
- **Contexto/dominio:** SEP, ciclo escolar, bloques, CCT, CTE, repetición espaciada.
- Propuesta técnica completa (fuera del repo): `../nexo_propuesta_tecnica_v2.md`.

## Stack real (lo que hay en el repo — manda sobre la propuesta)

La propuesta v2 menciona Next 14, pero el repo usa Next 16. **Sigue el repo:**

| Capa | Realidad en el repo | Nota |
|---|---|---|
| Framework | **Next.js 16.2.6** (App Router) + **React 19** | NO es Next 14 — ver `AGENTS.md` |
| Estilos | **Tailwind CSS v4** (`@tailwindcss/postcss`) | sin `tailwind.config` clásico |
| BD / Auth / Storage | **Supabase** (`@supabase/ssr`) | PostgreSQL 15, Auth JWT, RLS |
| IA | **Google Gemini** (`@google/genai`, `gemini-2.5-flash`) | wrapper en `lib/gemini.ts` |
| Lenguaje | TypeScript | |

Planeado en la propuesta pero **aún no instalado**: Upstash (Redis/QStash), Resend
(email), Sentry. No asumas que existen; instálalos si la tarea lo pide.

## Convenciones críticas de Next.js 16

- **`proxy.ts` (raíz) reemplaza a `middleware.ts`.** El middleware se llama ahora
  `proxy()` y se exporta desde `proxy.ts`. Ya existe y refresca la sesión de
  Supabase + hace chequeo optimista de rol por prefijo de ruta.
- Antes de escribir features de Next, lee `node_modules/next/dist/docs/` — esta
  versión tiene breaking changes respecto a tu conocimiento previo.

## Estructura

```
app/                  # App Router (hoy: layout, page, globals.css — apenas scaffold)
lib/
  gemini.ts           # Wrapper IA: generarRetroalimentacion(), generarReporteCTE()
  supabase/
    client.ts         # createSupabaseBrowserClient() — solo anon key, para "use client"
    server.ts         # cliente servidor (SSR)
proxy.ts              # middleware de Next 16: sesión Supabase + guard de rol
```

Rutas previstas por rol (a construir): `(alumno)/quiz`, `(alumno)/progreso`,
`(docente)/tablero`, `(docente)/configurar`, `(docente)/reporte`, `(admin)/panel`.
API/Server Actions en `app/api/...` (quiz, ai, reportes, sync).

## Roles y seguridad

Roles: `alumno`, `docente`, `directivo`, `admin_zonal`. El rol vive en
`user_metadata.rol` de Supabase Auth.

- **`proxy.ts`** hace el guard optimista por prefijo (`/alumno`, `/docente`,
  `/admin`). Es UX, no seguridad real.
- **La autorización real son las políticas RLS de Postgres.** Toda tabla sensible
  (alumno, respuesta_alumno, grupo, reporte) lleva RLS. Nunca confíes solo en el proxy.
- **Datos personales** (CURP, RFC, nombres): solo en servidor con la service role
  key; nunca al cliente. El dashboard docente muestra agregados sin nombres.
- `NEXT_PUBLIC_*` se expone al navegador; la `SUPABASE_SERVICE_ROLE_KEY` y
  `GEMINI_API_KEY` **solo en el servidor**.

## Variables de entorno (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # solo servidor
GEMINI_API_KEY=                # https://aistudio.google.com/apikey
```

## Modelo de datos (Supabase / PostgreSQL)

Catálogo curricular → `materia` → `tema` → `pregunta` (con distractores que mapean
error conceptual + pista pedagógica). Institucional: `escuela` → `profesor` →
`grupo` → `alumno`. Operación semanal: `semana` → `semana_materia` → `aplicacion`
→ `pregunta_aplicada` → `respuesta_alumno`. Diagnóstico/reportes:
`diagnostico_alumno`, `reporte`. Auditoría: `audit_log`.

- IDs `SERIAL`; fechas `TIMESTAMPTZ`. `auth_user_id UUID` enlaza con `auth.users`.
- El diagnóstico (nivel de dominio 0–3, `requiere_repaso`) se calcula al cerrar una
  aplicación; alimenta el motor de repetición espaciada y los reportes CTE.
- DDL completo y políticas RLS de referencia: sección 4–5 de `../nexo_propuesta_tecnica_v2.md`.
  Las migraciones vivirían en `supabase/migrations/`.

## Estilo de la IA (Gemini)

- **Retroalimentación al alumno:** cálida, tutea, nunca penaliza el error, termina
  con una pregunta que invite a reintentar, máx. 3 oraciones.
- **Reporte CTE:** lenguaje institucional formal SEP; incluye contexto del grupo,
  avances por competencia, áreas de oportunidad y estrategias de mejora.
- Modelo configurable en una constante al inicio de `lib/gemini.ts`.

## Comandos

```
npm run dev     # desarrollo
npm run build   # build de producción
npm run lint    # eslint (eslint-config-next)
```
