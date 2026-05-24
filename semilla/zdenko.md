# NEXO — Contexto de agente: Persona 4 (Dashboard Docente)

## Qué es el proyecto
Nexo es una plataforma educativa para Telesecundarias mexicanas. Permite al alumno
resolver un quiz semanal con retroalimentación por IA, y al docente ver el diagnóstico
de su grupo y generar borradores de reporte CTE automáticamente con IA.

## Stack real del repositorio (manda sobre cualquier documento externo)

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.6 (App Router) + React 19 |
| Estilos | Tailwind CSS v4 — sin `tailwind.config` clásico, usa `@theme` en globals.css |
| Base de datos / Auth | Supabase (`@supabase/ssr`) — PostgreSQL 15, Auth JWT, RLS |
| IA | Google Gemini (`@google/genai`, modelo `gemini-2.5-flash`) |
| Lenguaje | TypeScript |

**Todo el código, comentarios, UI y datos va en español.**

## Convenciones críticas

- El middleware se llama `proxy.ts` en la raíz (NO `middleware.ts`). Ya existe.
  Refresca la sesión de Supabase y hace guard optimista de rol por prefijo de ruta.
- Clientes Supabase:
  - `lib/supabase/client.ts` → `createSupabaseBrowserClient()` — solo en componentes
    con `"use client"`
  - `lib/supabase/server.ts` → cliente SSR — en Server Components y API routes
- `lib/gemini.ts` ya existe con `generarRetroalimentacion()` y `generarReporteCTE()`
- Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (solo servidor), `GEMINI_API_KEY` (solo servidor)
- `NEXT_PUBLIC_*` se expone al navegador. Nunca expongas `SUPABASE_SERVICE_ROLE_KEY`
  ni `GEMINI_API_KEY` al cliente.

## Modelo de datos relevante para el dashboard docente

- `escuela` → `profesor` → `grupo` → `alumno`
- `semana` → `semana_materia` → `aplicacion` → `pregunta_aplicada` → `respuesta_alumno`
- `diagnostico_alumno`: nivel de dominio 0–3, `requiere_repaso` boolean
- `reporte`: borrador generado por IA, firmado por el docente
- `materia` → `tema` → `pregunta`
- El rol del usuario vive en `user_metadata.rol` de Supabase Auth
- Roles: `alumno`, `docente`, `directivo`, `admin_zonal`
- RLS activo en todas las tablas sensibles — nunca confíes solo en el proxy

## Estructura de carpetas relevante para Persona 4

app/
(docente)/
tablero/page.tsx       # Dashboard principal del docente — TU ENTREGA 1
configurar/page.tsx    # Selector de temas de la semana — TU ENTREGA 2
reporte/page.tsx       # Vista y firma del reporte CTE — TU ENTREGA 3
api/
reportes/
generar/route.ts     # API route que llama a lib/gemini.ts — TU ENTREGA 4
components/
docente/
DiagnosticoGrupo.tsx   # Tabla de resultados del grupo — TU ENTREGA 5
AlertaRiesgo.tsx       # Alumnos con requiere_repaso = true — TU ENTREGA 6
SelectorTemas.tsx      # Selector de temas para la semana — TU ENTREGA 7
lib/
gemini.ts                # Ya existe — NO modificar sin coordinarlo
supabase/
client.ts              # Ya existe
server.ts              # Ya existe
proxy.ts                   # Ya existe — NO modificar

## Tus responsabilidades como Persona 4 — pasos en orden

### Paso 1 — Verifica que el entorno funcione (10 min)
Antes de construir cualquier página, confirma:
- `npm run dev` corre sin errores
- `.env.local` tiene las 4 variables con valores reales
- Puedes hacer una query básica a Supabase desde un Server Component

### Paso 2 — API route de generación de reporte CTE (20 min)
Crea `app/api/reportes/generar/route.ts`.
- Recibe POST con `{ grupoId, semanaId }`
- Consulta `diagnostico_alumno` + `semana_materia` + `tema` en Supabase (server client)
- Llama a `generarReporteCTE()` de `lib/gemini.ts` con los datos del grupo
- Guarda el borrador en la tabla `reporte` con estado `borrador`
- Devuelve `{ reporteId, contenido }`
- Usa `SUPABASE_SERVICE_ROLE_KEY` — este endpoint es solo para docentes autenticados

### Paso 3 — Componente DiagnosticoGrupo (20 min)
Crea `components/docente/DiagnosticoGrupo.tsx`.
- Recibe como props el array de `diagnostico_alumno` del grupo
- Muestra tabla: columnas → alumno (solo número o alias, nunca nombre completo al cliente),
  materia, nivel de dominio (0–3), requiere repaso
- Los alumnos con `requiere_repaso = true` van resaltados visualmente

### Paso 4 — Componente AlertaRiesgo (10 min)
Crea `components/docente/AlertaRiesgo.tsx`.
- Recibe el conteo de alumnos en riesgo
- Muestra un banner o card de alerta si el número es mayor a 0
- Mensaje claro: cuántos alumnos necesitan atención esta semana

### Paso 5 — Componente SelectorTemas (20 min)
Crea `components/docente/SelectorTemas.tsx`.
- Muestra las materias y temas disponibles del catálogo SEP en Supabase
- El docente selecciona qué temas evalúa esta semana
- Al confirmar, crea o actualiza registros en `semana_materia`

### Paso 6 — Página tablero (30 min)
Crea `app/(docente)/tablero/page.tsx`.
- Server Component — usa cliente Supabase de servidor
- Verifica que `user_metadata.rol === 'docente'`
- Consulta el grupo del docente autenticado
- Consulta los `diagnostico_alumno` de la semana activa
- Renderiza `DiagnosticoGrupo` y `AlertaRiesgo` con los datos reales
- Botón que lleva a `/docente/configurar` y otro a `/docente/reporte`

### Paso 7 — Página configurar (20 min)
Crea `app/(docente)/configurar/page.tsx`.
- Server Component para cargar temas del catálogo
- Renderiza `SelectorTemas`
- Al guardar, redirige de vuelta al tablero

### Paso 8 — Página reporte (30 min)
Crea `app/(docente)/reporte/page.tsx`.
- Muestra el borrador de reporte CTE generado por IA
- Si no existe borrador, muestra botón "Generar reporte" que llama a
  `POST /api/reportes/generar`
- Si existe borrador, muestra el contenido editable (textarea)
- Botón "Firmar y guardar" actualiza el registro en `reporte` con
  estado `firmado` y `firmado_at = now()`
- El docente es el último responsable del contenido — la IA solo propone

### Paso 9 — Revisión visual (20 min)
- Verifica que las tres páginas se vean bien en móvil (los docentes acceden desde
  teléfono en muchos casos)
- Verifica que el flujo completo funcione: tablero → configurar → reporte → firmar
- Limpia cualquier `console.log` de desarrollo

### Paso 10 — Apoyo al equipo y demo (tiempo restante)
- Coordina con Persona 1 que los datos seed sean suficientes para el demo
- Prepara el script del demo: historia de un docente real que abre el tablero,
  ve alumnos en riesgo, genera el reporte CTE con IA y lo firma en 2 minutos
- Graba video de respaldo del demo completo por si falla la conexión en la presentación

## Estilo de código esperado

- Componentes de servidor por default — solo `"use client"` cuando sea estrictamente
  necesario (interactividad, hooks)
- Tailwind v4 para todos los estilos — sin CSS modules ni styled-components
- TypeScript estricto — sin `any`
- Nombres de variables, funciones y comentarios en español
- Manejo de errores explícito en todas las API routes — nunca dejes un catch vacío

## Qué NO es tu responsabilidad

- El quiz del alumno (Persona 2)
- La lógica interna de `lib/gemini.ts` (Persona 3)
- El esquema SQL y seed data (Persona 1)
- La autenticación base y middleware (Persona 2)

## Coordinación crítica con el equipo

- **Depende de Persona 1:** necesitas que las tablas `diagnostico_alumno`, `reporte`,
  `semana_materia`, `materia` y `tema` existan con datos seed antes de construir
  el tablero. Coordina esto primero.
- **Depende de Persona 3:** `lib/gemini.ts` debe tener `generarReporteCTE()` exportada
  y funcionando antes de construir `app/api/reportes/generar/route.ts`.
- **Persona 2** configura Auth — asegúrate de que el usuario docente de prueba tenga
  `user_metadata.rol = 'docente'` en Supabase antes de probar tus rutas.