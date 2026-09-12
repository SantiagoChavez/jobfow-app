<p align="center">
  <img src="./client/src/assets/Jobflow-banner.png" alt="Jobflow - Radar & Career Tracker" width="540" />
</p>

# 🎯 Jobflow

> **Plataforma ágil de gestión y analítica de postulaciones laborales para desarrolladores.**

Jobflow nace para resolver un problema crítico en la búsqueda activa de empleo: el registro manual desordenado y la falta de métricas accionables para seguimiento personal y coaching profesional (evidencia de postulaciones, tiempos de respuesta y tasa de conversión).

---

## 🌐 Enlaces de Ejecución (Demo en Vivo)

| Componente | Plataforma | URL de Acceso | Estado |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | Vercel | [https://jobfow-app.vercel.app](https://jobfow-app.vercel.app) | 🟢 Operativo (HTTPS) |
| **Backend REST API** | Render | [https://jobfow-api.onrender.com](https://jobfow-api.onrender.com) | 🟢 Operativo (HTTPS) |
| **Endpoint de Salud** | Render | [https://jobfow-api.onrender.com/health](https://jobfow-api.onrender.com/health) | 🟢 200 OK |
| **Base de Datos** | MongoDB Atlas | Cluster M0 (AWS `sa-east-1` / `us-east-1`) | 🟢 Conectado |
| **Copiloto IA** | Google Gemini | Modelo `gemini-3.5-flash-lite` | 🟢 Activo |
| **Manual de Usuario** | Documento PDF | [Manual-de-Usuario-Jobflow.pdf](docs/Manual-de-Usuario-Jobflow.pdf) | 📘 Guía Oficial (4 Págs) |
| **Guía Rápida (No Dev)** | PDF & Markdown | [Guia-Rapida-Jobflow.pdf](docs/Guia-Rapida-Jobflow.pdf) / [GUIA_USUARIO.md](docs/GUIA_USUARIO.md) | 💡 Guía Visual e Intuitiva |
| **Centro de Documentación** | Directorio Docs | [Carpeta docs/](docs/) | 📚 Docs, Guías & Specs |

---

## 📋 Tabla de Contenidos

- [Enlaces de Ejecución (Demo en Vivo)](#-enlaces-de-ejecución-demo-en-vivo)
- [Manual de Usuario & Guía de IA (PDF)](#-manual-de-usuario--especificación-del-copiloto-de-ia)
- [Problema & Visión del Producto](#-problema--visión-del-producto)
- [Características del MVP](#-características-del-mvp)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Estrategia de Ramas (Git Workflow)](#-estrategia-de-ramas-git-workflow)
- [Diseño y Modelo de Referencia](#-diseño-y-modelo-de-referencia)
- [Modelo de Datos](#-modelo-de-datos)
- [Contrato de API (Endpoints)](#-contrato-de-api-endpoints)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
- [Scripts Disponibles](#-scripts-disponibles)
- [Roadmap de Tareas](#-roadmap-de-tareas)

---

## 📖 Manual de Usuario & Especificación del Copiloto de IA

El proyecto cuenta con un **Manual de Usuario oficial en formato PDF vectorial** ([`Manual-de-Usuario-Jobflow.pdf`](docs/Manual-de-Usuario-Jobflow.pdf)) diseñado para postulantes, coaches y evaluadores técnicos.

### 🧠 ¿Qué acciones realiza la Inteligencia Artificial (Google Gemini)?
Dentro del modal **`+ Nueva Postulación`**, al pegar la descripción sin procesar de cualquier oferta de empleo y hacer clic en **`✨ Autocompletar con IA`**, el modelo `gemini-3.5-flash-lite` ejecuta 5 acciones cognitivas en paralelo:

1. **Extracción y Normalización de Campos**: Identifica y extrae automáticamente la *Empresa*, *Puesto / Rol*, *Modalidad laboral* (`REMOTE`, `HYBRID`, `ONSITE`), *Nivel de Prioridad* y el *Salario estimado en USD*, completando el formulario al instante.
2. **Cálculo de Afinidad Técnica (`matchScore`)**: Evalúa del 0 al 100% la compatibilidad entre los requisitos de la vacante y el stack del postulante.
3. **Detección de Brechas de Conocimiento (Gap Analysis)**: Identifica las habilidades que dominás (`extractedSkills`) y lista las tecnologías secundarias o deseables a repasar antes de la entrevista técnica (`missingSkills`).
4. **Resumen Ejecutivo de la Compañía**: Redacta una síntesis de 2 oraciones sobre el modelo de negocio, industria y cultura de la empresa para que el candidato llegue informado a la primera llamada.
5. **Generador de Pitch de Presentación Personalizado**: Adapta la plantilla oficial del candidato (reconversión IT, versatilidad multidisciplinaria, formación académica en UTN y Soy Henry, y enlaces directos a sus perfiles de GitHub y LinkedIn) al contexto específico de la vacante, listo para enviar al reclutador con 1 clic.

---

## 💡 Problema & Visión del Producto

* **Dolor a resolver:** En procesos de acompañamiento y coaching laboral, suele exigirse un objetivo mínimo (por ejemplo, 2 postulaciones diarias registradas con evidencia de fechas, enlaces y respuestas). Registrarlo en hojas de cálculo o notas sueltas consume tiempo y no entrega métricas de valor.
* **Usuario objetivo:** Desarrolladores en búsqueda activa que necesitan cargar aplicaciones de forma inmediata (mobile-first / web rápida).
* **Propuesta de valor:** Carga veloz de ofertas, seguimiento en tablero Kanban, cálculo automático de tiempos de respuesta del mercado y generación de reportes semanales en PDF listos para enviar al coach o mentor.

---

## 🚀 Características del MVP

- [x] **Arquitectura base desacoplada (`/server` y `/client`)** con ES Modules y pnpm.
- [x] **Backend Express inicializado** con middlewares de CORS, JSON parser y endpoint de salud `GET /health` verificado.
- [x] **Frontend inicializado con React + Vite y Tailwind CSS v3** con paleta de diseño "Deep Cobalt & Crisp Gold".
- [x] **Estrategia de ramas Git configurada** (`main`, `pre-staging`, `dev`).
- [x] **Persistencia con MongoDB Atlas & Mongoose (Tarjeta 2):** Conexión asíncrona configurada y esquema enriquecido `Application` con subdocumento `interactions` e índices optimizados.
- [x] **Formulario rápido de carga:** Registro modal ágil de Empresa, Rol, Modalidad, Prioridad, Salario, URL de la oferta y texto de Requisitos.
- [x] **Extracción y matching semántico de skills:** Comparación algorítmica de tecnologías y porcentaje de afinidad con debounce en vivo (`match-preview`).
- [x] **Historial de interacciones:** Registro cronológico de eventos por postulación (*"Postulación enviada"*, *"Mensaje a recruiter"*, *"Respuesta recibida"*, etc.).
- [x] **Lógica analítica de tiempos de respuesta:** Cálculo automático en días entre la postulación y la primera respuesta del reclutador (`responseTimeDays`).
- [x] **Dashboard analítico y tablero Tracker:** Bloque de KPIs principales, alertas de seguimiento y tablero Kanban interactivo por columnas de estado.
- [x] **Generación de Reporte PDF semanal:** Exportación vectorial descargable con métricas resumidas y listado tabular para presentar al coach.
- [x] **Paginación en servidor y ordenamiento dinámico (Tarjeta 9):** Endpoint `GET /api/applications` con `page`, `limit`, `sortBy`, `order` y DTO de metadatos de paginación para alto volumen.
- [x] **Drag and Drop interactivo en Kanban (Tarjeta 10):** Movimiento fluido de tarjetas entre columnas con persistencia en tiempo real, UI optimista y rollback ante errores.
- [x] **Copiloto de IA con Google Gemini (Tarjeta 11):** Extracción estructurada de vacantes con `POST /api/ai/analyze-job`, sueldo estimado, cálculo de afinidad técnica (`matchScore`), skills faltantes y generación de pitch de contacto.
- [x] **Drawer de Seguimientos y Alertas Clave (Tarjeta 12):** Slide-over accesible (`RemindersDrawer`) con filtro de criticidad, trigger seguro `mailto:` y badge reactivo en Navbar.
- [x] **Toast Global y Paginación Interactiva en Tabla (Tarjeta 12):** Contexto global `ToastContext` reutilizable y botonera numérica interactiva en pie de tabla.
- [x] **Autenticación Multiusuario y Google OAuth (Tarjeta 13):** Registro tradicional con bcrypt y JWT, inicio de sesión 1-click mediante Google Identity Services (`@google-auth-library`), persistencia de sesión segura y aislamiento de postulaciones por cuenta de usuario.
- [x] **Modo Claro Armónico & Switch Dual (Tarjeta 14):** Selector de tema interactivo Sol/Luna en Navbar, paleta híbrida descansada (ice/slate con acentos dorados y cobalto), persistencia en `localStorage` y sincronización con perfil de usuario (`PATCH /api/auth/theme`).
- [x] **Despliegue Full-Stack en la Nube (DevOps):** Frontend en Vercel con SPA routing (`vercel.json`), Backend en Render (`render.yaml`) y Base de Datos en MongoDB Atlas M0.

---

## 🌿 Estrategia de Ramas (Git Workflow)

El proyecto sigue un flujo de ramificación ordenado para garantizar estabilidad:

* **`main`**: Rama de producción final y versiones estables publicadas.
* **`pre-staging`**: Rama de integración y despliegue previo a producción para pruebas finales de QA.
* **`dev`**: Rama activa de desarrollo diario donde se integran los avances, características y fixes.

---

## 🎨 Diseño y Modelo de Referencia

El diseño de la interfaz se basa en el documento de especificación visual [`modelo para jobflow.pdf`](docs/modelo%20para%20jobflow.pdf), adoptando el sistema estético **"Deep Cobalt & Crisp Gold"** con soporte completo para Tema Dual (Oscuro / Claro Armónico):

* **Paleta Modo Oscuro (Deep Cobalt):**
  * Fondo principal: `#0B1329` (`bg-navy-base`)
  * Superficies y tarjetas: `#172554` (`bg-navy-surface`)
  * Resaltados: `#1E3A8A` (`bg-navy-highlight`)
  * Acentos dorados primarios: `#FACC15` (`text-gold-primary`)
  * Variantes doradas: `#FEF08A` (light) y `#CA8A04` (dark)
  * Acentos técnicos: `#38BDF8` (`sky-tech`) y `#93C5FD` (`ice-blue`)
* **Paleta Modo Claro Armónico:**
  * Fondo base: Tono hielo / slate descansado (`#f1f5f9` / `#e2e8f0`)
  * Superficies y tarjetas: Blanco perlado cálido (`#ffffff` / `#f8fafc`) con sombras suaves y bordes cobalto tenues (`#cbd5e1`)
  * Tipografía y títulos: Azul cobalto profundo y slate de alto contraste (`#0f172a`, `#1e293b`)
  * Acentos de marca: Dorado ámbar cálido (`#b45309` / `#d97706`) y azul técnico (`#0284c7`)
* **Vistas proyectadas en el modelo:**
  * **Dashboard:** Tarjetas resumen (Postulaciones, Entrevistas, Ofertas, Tasa de respuesta), gráfico de actividad y postulaciones por estado.
  * **Tablero Tracker (Kanban):** Columnas de estado (*Guardadas*, *Aplicadas*, *Entrevista*, *Oferta*, *Rechazada*).
  * **Listado de Postulaciones:** Tabla detallada con filtros, fechas, estados y acciones rápidas.
  * **Detalle de Postulación:** Línea de tiempo de eventos, notas, datos del recruiter y documentos.

---

## 🏗️ Arquitectura del Proyecto

```text
Jobflow-app/
├── client/                     # Frontend SPA (React 19, Vite, Tailwind CSS v3)
│   ├── src/
│   │   ├── assets/             # Banners e identidades visuales
│   │   ├── components/         # Modales, vistas, Kanban, Drawer y AuthModal
│   │   ├── context/            # AuthContext, ThemeContext, ToastContext
│   │   ├── hooks/              # useModalA11y y custom hooks
│   │   ├── services/           # Cliente API centralizado (api.js con JWT)
│   │   ├── utils/              # Generador seguro mailto y helpers
│   │   ├── App.jsx             # Componente raíz
│   │   ├── index.css           # Directivas Tailwind y diseño dual
│   │   └── main.jsx            # Punto de entrada de React
│   ├── tailwind.config.js      # Configuración de modo oscuro por clase
│   └── package.json
├── docs/                       # Centro de documentación y guías oficiales
│   ├── README.md               # Índice general de documentación
│   ├── GUIA_USUARIO.md         # Guía de uso rápido para usuarios finales
│   ├── TASKS.md                # Backlog exhaustivo y roadmap de fases
│   ├── Guia-Rapida-Jobflow.pdf # Guía visual en PDF vectorial
│   ├── Manual-de-Usuario-Jobflow.pdf # Manual oficial de 4 páginas
│   ├── Planificacion de jobflow.pdf  # Especificación de proyecto
│   ├── modelo para jobflow.pdf # Wireframes y diseño de referencia
│   └── jobflow-reporte-demo.pdf# Demo de reporte semanal exportado
├── server/                     # Backend REST API (Node.js, Express 5, ES Modules)
│   ├── scripts/                # Generadores de PDFs con PDFKit-Table
│   ├── src/
│   │   ├── config/             # Conexión MongoDB y catálogo de skills
│   │   ├── controllers/        # Controladores (applications, auth, ai, reports, etc.)
│   │   ├── middlewares/        # authMiddleware (protección Bearer JWT)
│   │   ├── models/             # Esquemas Mongoose (Application, User)
│   │   ├── routes/             # Enrutadores Express (auth, apps, ai, reports, analytics)
│   │   ├── services/           # Servicios (aiService Gemini, pdfService, matchService)
│   │   ├── utils/              # Generador de tokens JWT
│   │   └── server.js           # Servidor Express
│   └── package.json
├── CHANGELOG.md                # Registro histórico de versiones
└── README.md                   # Documentación principal
```

### Stack Tecnológico
* **Frontend:** React 19, Vite 8, Tailwind CSS v3 (soporte Dual Dark/Light), PostCSS, Autoprefixer, Heroicons.
* **Backend:** Node.js (>= v20), Express 5, ES Modules (`"type": "module"`).
* **Autenticación & Seguridad:** JWT (`jsonwebtoken`), cifrado `bcryptjs`, Google Identity Services (`google-auth-library`).
* **Testing:** Vitest 5, Supertest 7 (75 pruebas unitarias y de integración de endpoints automatizadas).
* **Inteligencia Artificial:** Google Gemini SDK (`@google/genai`), modelo `gemini-3.5-flash-lite`.
* **Reportes:** PDFKit, PDFKit-Table (Generación vectorial en servidor).
* **Gestor de paquetes:** `pnpm` (v11+).
* **Base de datos:** MongoDB Atlas / Mongoose 9 (Esquemas enriquecidos `User` y `Application` con índices y agregaciones).
* **Utilidades:** `cors`, `dotenv`, `nodemon` (desarrollo backend).

---

## 🗄️ Modelo de Datos

```text
[ USER ]
 ├── name (String, requerido)
 ├── email (String, requerido, único, indexado)
 ├── password (String, hasheado con bcryptjs)
 ├── avatar (String)
 ├── googleId (String, sparse index)
 ├── theme ('dark' | 'light', default: 'dark')
 └── timestamps: (createdAt, updatedAt)

[ APPLICATION ]
 ├── user: ObjectId (ref: 'User', requerido)
 ├── company:
 │    ├── name (String, requerido)
 │    ├── website (String)
 │    └── industry (String)
 ├── role (String, requerido)
 ├── status (ENVIADA | CONTACTO | ENTREVISTA | RECHAZADA | OFERTA)
 ├── priority (LOW | MEDIUM | HIGH)
 ├── workMode (REMOTE | HYBRID | ON_SITE)
 ├── salary (String)
 ├── experienceLevel (String)
 ├── recruiter: { name, email }
 ├── jobUrl (String)
 ├── requirementsRaw (String)
 ├── extractedSkills: [String]
 ├── matchScore (Number, 0-100)
 ├── suggestedPitch (String)
 ├── companySummary (String)
 ├── appliedAt (Date, default: Date.now)
 ├── responseTimeDays (Number, default: null)
 ├── timestamps: (createdAt, updatedAt)
 └── interactions: [
      ├── type (POSTULACION_ENVIADA | MENSAJE_ENVIADO | RESPUESTA_RECIBIDA | ENTREVISTA | RECHAZO | OFERTA)
      ├── date (Date, default: Date.now)
      └── notes (String)
     ]
```

---

## 📡 Contrato de API (Endpoints)

| Método | Ruta | Descripción | Estado |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Chequeo de salud del servicio | ✅ Verificado (200 OK) |
| `POST` | `/api/auth/register` | Registro tradicional de usuario y emisión de JWT | ✅ Implementado y testeado |
| `POST` | `/api/auth/login` | Inicio de sesión tradicional y emisión de JWT | ✅ Implementado y testeado |
| `POST` | `/api/auth/google` | Autenticación 1-click con Google OAuth y emisión de JWT | ✅ Implementado y testeado |
| `GET` | `/api/auth/me` | Obtener perfil del usuario autenticado (requiere JWT) | ✅ Implementado y testeado |
| `PATCH` | `/api/auth/theme` | Sincronizar preferencia de tema ('dark' \| 'light') | ✅ Implementado y testeado |
| `POST` | `/api/applications` | Registrar una nueva postulación asociada al usuario | ✅ Implementado y testeado |
| `GET` | `/api/applications` | Listar postulaciones con paginación (`page`, `limit`), ordenamiento (`sortBy`, `order`) y filtros combinados | ✅ Implementado y testeado |
| `POST` | `/api/applications/match-preview` | Previsualizar afinidad semántica y match de habilidades técnicas | ✅ Implementado y testeado |
| `POST` | `/api/ai/analyze-job` | Extraer datos de vacantes con Google Gemini y generar pitch sugerido | ✅ Implementado y testeado |
| `GET` | `/api/applications/:id` | Obtener detalle completo de una postulación por ID | ✅ Implementado |
| `PATCH` | `/api/applications/:id/status` | Actualizar estado de postulación, recalcular métricas y proteger degradación involuntaria de `OFERTA` (HTTP 409) | ✅ Implementado y testeado |
| `DELETE` | `/api/applications/:id` | Eliminar una postulación por ID | ✅ Implementado |
| `POST` | `/api/applications/:id/interactions` | Añadir evento/interacción manual y recalcular tiempos | ✅ Implementado y testeado |
| `GET` | `/api/analytics/summary` | Resumen de métricas consolidadas (KPIs, distribución y tiempos) | ✅ Implementado y testeado |
| `GET` | `/api/reports/pdf?from=...&to=...` | Generar y descargar reporte PDF estructurado con KPIs y tabla | ✅ Implementado y testeado |

---

## ⚙️ Requisitos Previos

* **Node.js:** Versión 20 o superior instalada.
* **pnpm:** Versión 10 u 11 (`npm install -g pnpm`).

---

## 🛠️ Instalación y Puesta en Marcha

### 1. Clonar el repositorio y situarse en la rama `dev`
```bash
git clone https://github.com/SantiagoChavez/jobfow-app.git
cd Jobflow-app
git checkout dev
```

### 2. Configurar y Levantar el Backend (`/server`)
```bash
cd server
pnpm install
cp .env.example .env
pnpm run dev
```
* Servidor activo en: `http://localhost:5000`
* Chequeo de salud: `http://localhost:5000/health`

### 3. Configurar y Levantar el Frontend (`/client`)
En una nueva terminal:
```bash
cd client
pnpm install
pnpm run dev
```
* Cliente activo en: `http://localhost:5173`

---

## 📜 Scripts Disponibles

### En `/server`:
* `pnpm run dev`: Inicia el servidor backend con recarga automática (`nodemon`).
* `pnpm start`: Inicia el servidor en modo producción con Node nativo.
* `pnpm test`: Ejecuta la suite de pruebas unitarias y de integración con Vitest (75 tests).
* `pnpm run test:watch`: Ejecuta las pruebas en modo interactivo/watch.

### En `/client`:
* `pnpm run dev`: Inicia el servidor de desarrollo de Vite con HMR.
* `pnpm run build`: Compila la aplicación frontend optimizada para producción.
* `pnpm run preview`: Previsualiza la compilación de producción localmente.

---

## 🗺️ Roadmap de Tareas

Para consultar el backlog detallado, criterios de aceptación y orden de ejecución paso a paso, consulta el archivo [TASKS.md](docs/TASKS.md).

