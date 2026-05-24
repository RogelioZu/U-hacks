<div align="center">
  <img src="semilla/public/logo-semilla.png" alt="Semilla" width="120" />

  # Semilla

  **Plataforma educativa con IA para Telesecundarias mexicanas.**

  Quiz semanal con retroalimentación por IA para el alumno, diagnóstico de grupo
  y borradores de reporte CTE para el docente. Diseñada para bajo costo, baja
  fricción operativa y uso _offline-first_.

  <p>
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
    <img alt="Azure Static Web Apps" src="https://img.shields.io/badge/Azure_Static_Web_Apps-0078D4?logo=microsoftazure&logoColor=white" />
    <img alt="Azure SQL" src="https://img.shields.io/badge/Azure_SQL_Database-0078D4?logo=microsoftazure&logoColor=white" />
    <img alt="Microsoft Entra ID" src="https://img.shields.io/badge/Microsoft_Entra_ID-0078D4?logo=microsoft&logoColor=white" />
    <img alt="Azure Blob Storage" src="https://img.shields.io/badge/Azure_Blob_Storage-0078D4?logo=microsoftazure&logoColor=white" />
    <img alt="Azure OpenAI" src="https://img.shields.io/badge/Azure_OpenAI_Service-0078D4?logo=microsoftazure&logoColor=white" />
  </p>
</div>

---

## 📖 Acerca del proyecto

**Semilla** (nombre interno del repo: _NEXO_) es una plataforma pensada para el
contexto de las **Telesecundarias** del sistema educativo mexicano (SEP). Atiende
dos necesidades reales que hoy consumen tiempo y no tienen herramienta digital:

- **Para el alumno** — un quiz semanal que, ante una respuesta incorrecta,
  responde con **retroalimentación cálida generada por IA** que nombra el
  malentendido y lo invita a reintentar, sin penalizar el error.
- **Para el docente** — un **diagnóstico automático del grupo** (nivel de dominio
  por tema, alertas de riesgo) y **borradores de reporte CTE** (Consejo Técnico
  Escolar) redactados en lenguaje institucional SEP, listos para revisar y firmar.

Todo el código, la interfaz y los datos están en **español**, alineados al dominio
educativo mexicano: ciclo escolar, bloques, CCT, CTE y repetición espaciada.

---

## ✨ Características

### 👩‍🎓 Alumno
- Quiz semanal con preguntas del banco curricular (materia → tema → pregunta).
- Retroalimentación pedagógica por IA en cada respuesta incorrecta.
- Vista de progreso y libros de texto de referencia.
- Asistente de chat con _streaming_ contextualizado.

### 👨‍🏫 Docente
- Tablero con diagnóstico del grupo y alertas de riesgo (sin exponer nombres).
- Selector de temas y configuración de la semana.
- Editor de reporte CTE con borrador generado por IA.
- Histórico de semanas aplicadas y firma del reporte.

### 🔐 Plataforma
- Roles: `alumno`, `docente`, `directivo`, `admin_zonal`.
- Seguridad real con **políticas RLS de PostgreSQL**; guard optimista de rol por ruta.
- Datos personales (CURP, RFC, nombres) tratados **solo en servidor**.

---

## 🧱 Stack tecnológico

| Capa | Tecnología | Detalle |
|---|---|---|
| **Hosting / Framework** | Azure Static Web Apps | Despliegue nativo con SSR, CI/CD desde GitHub |
| **Lenguaje** | TypeScript 5 | Desarrollado por Microsoft |
| **BD** | Azure SQL Database | SQL Server gestionado en la nube |
| **Auth** | Microsoft Entra ID | Autenticación JWT + gestión de identidades |
| **Storage** | Azure Blob Storage | Almacenamiento de archivos y recursos estáticos |
| **IA** | Azure OpenAI Service (GPT-4o) | Modelo de lenguaje gestionado por Microsoft |

---

## 🟦 Stack Microsoft

Este proyecto se desarrolló íntegramente sobre servicios y tecnologías de **Microsoft**:

| Tecnología | Servicio Microsoft | Rol en el proyecto |
|---|---|---|
| **TypeScript 5** | TypeScript (Microsoft) | Lenguaje principal del frontend y backend |
| **Azure Static Web Apps** | Microsoft Azure | Hosting con SSR y despliegue desde GitHub |
| **Azure SQL Database** | Microsoft Azure | Base de datos relacional principal |
| **Microsoft Entra ID** | Microsoft Azure | Autenticación JWT y gestión de identidades |
| **Azure Blob Storage** | Microsoft Azure | Almacenamiento de archivos y recursos |
| **Azure OpenAI Service** | Microsoft Azure | IA generativa (GPT-4o): retroalimentación y reportes CTE |

### Stack Microsoft

<div align="center">

| | | |
|:---:|:---:|:---:|
| **TypeScript** | **Azure Static Web Apps** | **Azure SQL Database** |
| **Microsoft Entra ID** | **Azure Blob Storage** | **Azure OpenAI Service** |

</div>

---

## 🗂️ Estructura del proyecto

```
.
├── schema.sql                 # DDL de PostgreSQL (catálogo, institucional, operación)
└── semilla/                   # Aplicación Next.js
    ├── app/                   # App Router
    │   ├── alumno/            # quiz, progreso
    │   ├── (docente)/         # tablero, configurar, reporte, semana, histórico
    │   ├── api/               # quiz, ai, reportes, admin, me
    │   ├── login/  perfil/  acceso-denegado/
    │   ├── layout.tsx  page.tsx  globals.css
    ├── components/
    │   ├── alumno/            # NavAlumno, RetroalimentacionCard, LibrosTexto…
    │   ├── docente/           # DiagnosticoGrupo, ReporteCTEEditor, AlertaRiesgo…
    │   └── ChatAsistente.tsx
    ├── lib/
    │   ├── ai.ts              # Wrapper IA: retroalimentación + reporte CTE
    │   ├── contexto-chat.ts
    │   └── db/                # client.ts (browser) · server.ts (SSR)
    ├── types/                 # nexo.ts · semilla.ts
    └── proxy.ts               # Middleware Next 16: sesión Supabase + guard de rol
```

---

## 🗄️ Modelo de datos

Definido en [`schema.sql`](schema.sql) (PostgreSQL):

- **Catálogo curricular** — `materia` → `tema` → `pregunta` (con distractores que
  mapean cada error conceptual a una pista pedagógica).
- **Institucional** — `escuela` → `profesor` → `grupo` → `alumno`.
- **Operación semanal** — `semana` → `semana_materia` → `aplicacion` →
  `pregunta_aplicada` → `respuesta_alumno`.
- **Diagnóstico / reportes** — `diagnostico_alumno`, `reporte`.
- **Auditoría** — `audit_log`.

El diagnóstico (nivel de dominio 0–3, `requiere_repaso`) se calcula al cerrar una
aplicación y alimenta tanto el motor de repetición espaciada como los reportes CTE.

---

## 🚀 Puesta en marcha

### Requisitos
- Node.js 20+
- Una instancia de **Azure SQL Database** con el esquema aplicado
- Credenciales de **Microsoft Entra ID** (Client ID, Tenant ID, Client Secret)
- Un recurso de **Azure OpenAI Service** con GPT-4o desplegado
- Una cuenta de **Azure Blob Storage** para archivos

### Instalación

```bash
git clone https://github.com/RogelioZu/U-hacks.git
cd U-hacks/semilla
npm install
```

### Variables de entorno

Crea `semilla/.env.local`:

```bash
# Azure SQL Database
AZURE_SQL_CONNECTION_STRING=

# Microsoft Entra ID (autenticación)
ENTRAID_CLIENT_ID=
ENTRAID_TENANT_ID=
ENTRAID_CLIENT_SECRET=         # solo servidor — nunca al cliente

# Azure Blob Storage
AZURE_STORAGE_ACCOUNT_NAME=
AZURE_STORAGE_ACCOUNT_KEY=     # solo servidor — nunca al cliente

# Azure OpenAI Service
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=          # solo servidor — nunca al cliente
AZURE_OPENAI_DEPLOYMENT=       # nombre del despliegue GPT-4o
```

> ⚠️ Las variables de cuentas y claves viven **solo en el servidor** y nunca deben exponerse al navegador.

### Base de datos

Aplica el esquema a tu instancia de **Azure SQL Database**:

```bash
sqlcmd -S <servidor>.database.windows.net -d <base_de_datos> -U <usuario> -P <contraseña> -i ../schema.sql
```

### Desarrollo

```bash
npm run dev      # servidor de desarrollo en http://localhost:3000
npm run build    # build de producción
npm run start    # servir el build
npm run lint     # eslint (eslint-config-next)
```

---

## 🤖 Estilo de la IA

El wrapper de IA vive en [`semilla/lib/ai.ts`](semilla/lib/ai.ts) y consume
**Azure OpenAI Service** con el modelo **GPT-4o**. El deployment es configurable
desde una constante al inicio del archivo.

- **Retroalimentación al alumno** — cálida, tutea, nunca penaliza el error; evita
  palabras como «mal» o «incorrecto», y cierra con una invitación a reintentar
  (máx. 3 oraciones).
- **Reporte CTE** — lenguaje institucional formal SEP: contexto del grupo, avances
  por competencia, áreas de oportunidad y estrategias de mejora.

---

## 🔒 Seguridad

- La autorización real son las **políticas de seguridad de Azure SQL** y los permisos de **Microsoft Entra ID**; el guard de `proxy.ts` es solo UX, no seguridad.
- Toda tabla sensible (`alumno`, `respuesta_alumno`, `grupo`, `reporte`) tiene restricciones de acceso por rol.
- El dashboard docente muestra **agregados sin nombres**.
- Los datos personales se procesan únicamente en servidor con credenciales de Entra ID de solo-servidor.

---

<div align="center">
  <sub>Hecho con 🌱 para el Hackathon de Microsoft · Educación · Telesecundarias de México</sub>
</div>
