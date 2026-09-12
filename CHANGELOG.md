# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Centralización y Reestructuración de Documentación en Carpeta `/docs`:**
  - Traslado de toda la documentación del proyecto (`GUIA_USUARIO.md`, `TASKS.md`, `Guia-Rapida-Jobflow.pdf`, `Manual-de-Usuario-Jobflow.pdf`, `Planificacion de jobflow.pdf`, `modelo para jobflow.pdf`, `jobflow-reporte-demo.pdf`) al nuevo directorio centralizado `docs/`, preservando exclusivamente `README.md` y `CHANGELOG.md` en la raíz.
  - Creación del índice maestro `docs/README.md` con tabla descriptiva de manuales, especificaciones y comandos para generar documentos PDF.
  - Actualización de los scripts de generación server-side `server/scripts/generateFriendlyGuidePdf.js` y `server/scripts/generateManualPdf.js` para compilar directamente sobre `docs/`.
  - Ajuste de `.gitignore` para permitir el rastreo de PDFs en `!docs/*.pdf`.
  - Actualización de la guía de usuario (`docs/GUIA_USUARIO.md`) con las nuevas secciones de autenticación multiusuario/Google OAuth y switch de tema dual armónico.
- **Correcciones de Code Review e Integración Resiliente:**
  - Intercepción y manejo reactivo de error HTTP 401 en descarga de reportes PDF (`downloadPdfReport` en `client/src/services/api.js`), eliminando el token expirado de `localStorage` y disparando el evento global `jobflow:unauthorized`.
  - Sincronización inteligente de tema en `ThemeContext.jsx`: respeto prioritario de la preferencia activa local del usuario en `localStorage` ante un login/registro reciente, sincronizándola contra la base de datos (`PATCH /api/auth/theme`).

### Changed
- **Renombrado integral del proyecto a Jobflow:**
  - Actualización de nombres de paquetes (`jobflow-server`, `jobflow-client`) y endpoint `/health` (`Jobflow API`).
  - Actualización de documentación, backlog de tareas y archivos de referencia (`Planificacion de jobflow.pdf`, `modelo para jobflow.pdf`).
  - Incorporación del banner oficial `Jobflow-banner` como portada del `README.md`.

### Added
- **Inicialización del cliente frontend (`/client`):**
  - Configuración con Vite 8 + React 19 usando `pnpm`.
  - Integración de Tailwind CSS v3, PostCSS y Autoprefixer.
  - Configuración del tema con la paleta de identidad "Deep Cobalt & Crisp Gold" (`navy-base`, `navy-surface`, `navy-highlight`, `gold-primary`, `gold-light`, `gold-dark`, `sky-tech`, `ice-blue`).
  - Limpieza de boilerplate inicial y componente base de prueba en `client/src/App.jsx`.
- **Estrategia de Ramas Git:**
  - Configuración de ramas `main` (producción), `pre-staging` (pruebas de integración y pre-deploy) y `dev` (desarrollo activo).
  - Sincronización remota de las ramas hacia GitHub (`origin`).
- **Diseño & Modelos de Referencia UI/UX:**
  - Incorporación del documento `modelo para jobflow.pdf` que define las vistas de referencia: Dashboard, Tablero Kanban (Tracker), tabla de postulaciones, calendario y perfil de usuario.
- **Persistencia y Modelos de Datos (Tarjeta 2):**
  - Instalación de dependencia `mongoose` en `/server`.
  - Módulo de conexión asíncrono a MongoDB Atlas (`server/src/config/db.js`) con manejo de errores y salida de proceso controlada.
  - Creación del modelo enriquecido `Application` (`server/src/models/Application.js`) con subdocumento `interactions`, campos extendidos (`company`, `role`, `status`, `priority`, `workMode`, `salary`, `recruiter`, etc.), timestamps e índices de consulta.
  - Integración de `connectDB()` en el ciclo de inicio de `server/src/server.js`.

- **Controladores y Rutas de Postulaciones (Tarjeta 3):**
  - `POST /api/applications`: Creación de postulación con validación de campos obligatorios e inserción automática de primera interacción.
  - `GET /api/applications`: Listado de postulaciones con orden cronológico y filtros por `status`, `priority`, `workMode` y búsqueda `search`.
  - `GET /api/applications/:id`: Consulta de detalle completo de postulación por ObjectId.
  - `PATCH /api/applications/:id/status`: Actualización de estado (`ENVIADA`, `CONTACTO`, `ENTREVISTA`, `RECHAZADA`, `OFERTA`), cálculo de `responseTimeDays` y registro de interacción.
  - `DELETE /api/applications/:id`: Eliminación física de postulación con validación de ObjectId.

- **Registro de Interacciones y Métricas de Tiempos (Tarjeta 4):**
  - `POST /api/applications/:id/interactions`: Registro cronológico de interacciones (`POSTULACION_ENVIADA`, `MENSAJE_ENVIADO`, `RESPUESTA_RECIBIDA`, `ENTREVISTA`, `RECHAZO`, `OFERTA`).
  - Lógica de cálculo automático de `responseTimeDays` (días transcurridos sin valores negativos) y cambio de estado a `CONTACTO` en primera respuesta recibida.
  - Transición a estado `ENTREVISTA` protegiendo el estado `OFERTA`.
  - Desacoplamiento de Express `app.js` y `server.js` para pruebas automatizadas.
  - Configuración del entorno de testing con **Vitest** y **Supertest** en `/server`.
  - Suite de pruebas unitarias y de integración (`server/src/tests/interactions.test.js`) cubriendo casos felices y 5 edge cases (100% pass).

- **Analítica y Métricas - MongoDB Aggregation Pipeline (Tarjeta 5):**
  - `GET /api/analytics/summary`: Endpoint consolidado que resuelve métricas en una única agregación facetada (`$facet`).
  - Pipeline de KPIs principales (`totalApplications`, `totalInterviews`, `totalOffers`, `responseRate`).
  - Pipeline de distribución de postulaciones por estado (`statusDistribution`) con cálculo relativo de porcentaje.
  - Pipeline de tiempos de respuesta (`responseMetrics`) con cálculo de promedio aritmético global (`avgResponseDays`) y ranking de top 5 empresas más ágiles (`fastestCompanies`).
  - Suite de pruebas con Vitest y Supertest (`server/src/tests/analytics.test.js`) cubriendo casos con base vacía (sin división por cero), dataset real y manejo de errores (100% pass).

- **Generación de Reportes PDF Descargables (Tarjeta 6):**
  - Instalación de dependencias `pdfkit` y `pdfkit-table` para generación vectorial server-side en Node.js.
  - Servicio `pdfService.js`: Diseño de plantilla A4 profesional con identidad Deep Cobalt & Gold, bloque de KPIs, tabla estructurada de postulaciones y pie de página con paginación dinámica.
  - Controlador `reportController.js`: Endpoint `GET /api/reports/pdf` con filtrado por rango de fechas (`from`, `to`), fallback inteligente a últimos 30 días y descarga binaria con cabeceras `Content-Type` y `Content-Disposition`.
  - Suite de pruebas con Vitest y Supertest (`server/src/tests/reports.test.js`) validando status 200, cabeceras de descarga, firma mágica `%PDF` y manejo de errores (100% pass).

- **Matching y Afinidad de Habilidades Técnicas (Tarjeta 7):**
  - Catálogo normalizado de tecnologías, frameworks y herramientas con alias del mercado (`server/src/config/skillsCatalog.js`).
  - Servicio algorítmico de matching semántico (`server/src/services/matchService.js`) con cálculo porcentual de afinidad y desglose de skills coincidentes y faltantes.
  - Endpoints HTTP `POST /api/applications/match-preview` y `POST /api/match/preview`.
  - Suite de pruebas con Vitest y Supertest (`server/src/tests/match.test.js`) validando cálculo de porcentajes, normalización de alias y manejo de texto libre (100% pass).

- **Frontend SPA Completo Mobile-First y Vistas UI (Tarjeta 8):**
  - Capa de comunicación HTTP centralizada (`client/src/services/api.js`) y configuración de proxy inverso en `client/vite.config.js`.
  - Layout responsive mobile-first con Header Navbar y BottomNav fija con acceso rápido a creación.
  - Modal de carga rápida (`QuickAddModal.jsx`) con validación y análisis en vivo de afinidad de skills con debounce.
  - Tablero Kanban Tracker interactivo (`KanbanBoard.jsx`) con columnas por estado y botón rápido de respuesta (*"⚡ Me respondieron"*).
  - Tabla de postulaciones (`ApplicationTable.jsx`) con buscador dinámico, filtros por estado y acciones directas.
  - Bloque de KPIs (`KPICards.jsx`) consumiendo analíticas consolidadas, alertas prioritarias (`UpcomingReminders.jsx`) y descarga modal de reporte PDF (`ReportModal.jsx`).
  - Modal de detalle de postulación (`ApplicationDetailModal.jsx`) con gestión de estado, timeline cronológico y registro de interacciones.

- **Paginación en Servidor y Filtros Combinados (Tarjeta 9):**
  - Endpoint `GET /api/applications` con paginación (`page`, `limit`), ordenamiento dinámico seguro (`sortBy`, `order`) y whitelist de campos permitidos.
  - Sanitización de parámetros con valores por defecto seguros (`page=1`, `limit=10`, tope de seguridad de 100) para evitar saturación de memoria.
  - DTO de respuesta con metadatos limpios (`totalDocs`, `totalPages`, `currentPage`, `limit`, `hasNextPage`, `hasPrevPage`).
  - Consulta y conteo en paralelo optimizados con `Promise.all` (`countDocuments` y `find`).
  - Preservación íntegra de filtros combinados (`status` múltiple, `priority` múltiple, `workMode`, `search` regex).
  - Suite de 17 pruebas automatizadas con Vitest y Supertest (`server/src/tests/pagination.test.js`) cubriendo límites inválidos, skips, páginas intermedias, base de datos vacía, escape de ReDoS y blindaje contra Type Injection (100% pass).

- **Drag and Drop Interactivo en Tablero Kanban (Tarjeta 10):**
  - Integración de biblioteca `@hello-pangea/dnd` (v18) compatible nativamente con React 19 y eventos táctiles móviles.
  - Soporte de arrastre visual fluido de tarjetas entre las columnas (`ENVIADA`, `CONTACTO`, `ENTREVISTA`, `OFERTA`, `RECHAZADA`).
  - Conexión con `PATCH /api/applications/:id/status` para persistencia en base de datos en tiempo real.
  - Manejo de UI Optimista inmediata con rollback automático al snapshot previo en caso de error de red o backend.
  - Recálculo automático de tiempos de respuesta (`responseTimeDays`) y refresco de analíticas (`GET /api/analytics/summary`).
  - Feedback visual enriquecido durante el arrastre (sombras profundas, rotación sutil, borde dorado y highlight reactivo en la columna receptora).
  - Toast de notificación visualmente diferenciado para estados de éxito y alertas de error.

- **Copiloto de Postulación con IA - Google Gemini (Tarjeta 11):**
  - Integración del SDK oficial `@google/genai` con modelo `gemini-3.5-flash-lite` (y fallback resiliente a `gemini-1.5-flash`).
  - Servicio `aiService.js` con sanitización de prompt injection, truncado seguro a 6.000 caracteres, timeout de 12 segundos y parsing JSON tipado.
  - Soporte de alias contractual `keySkills` sincronizado con `extractedSkills`.
  - Endpoint `POST /api/ai/analyze-job` con validaciones y manejo de estados HTTP 400, 502, 504 y 500.
  - Suite de 9 pruebas automatizadas en Vitest con mocks deterministas (`server/src/tests/ai.test.js`, 100% pass).
  - Interfaz interactiva en `QuickAddModal.jsx` con botón *"✨ Autocompletar con IA"*, feedback de carga y autocompletado de empresa, puesto, modalidad, prioridad y salario.
  - Generador de pitch personalizado y resumen de empresa con botón de copiado rápido al portapapeles (`navigator.clipboard`).
  - **Persistencia y Visualización del Pitch IA:**
    - Almacenamiento persistente de `suggestedPitch`, `companySummary` y `matchScore` en el modelo de base de datos `Application` (`server/src/models/Application.js`) y controlador `createApplication`.
    - Soporte para edición interactiva del pitch en `QuickAddModal.jsx` previo al guardado.
    - Visualización destacada en `ApplicationDetailModal.jsx` con bloque estético Deep Cobalt & Gold, copiado al portapapeles con 1-click y notificación toast.
    - Visualización de la tarjeta de resumen de empresa y badge de afinidad técnica (Match Score) en el detalle.
    - Ampliación de la suite de pruebas unitarias a 55 tests (100% pass).
  - **Guía Rápida e Intuitiva para Usuarios No Técnicos:**
    - Creación del documento accesible `GUIA_USUARIO.md` con explicación amigable en 5 pasos sencillos, consejos para entrevistas y beneficios del Copiloto IA sin tecnicismos.
    - Generación de la guía vectorial en PDF `Guia-Rapida-Jobflow.pdf` con paleta Deep Cobalt & Gold mediante `server/scripts/generateFriendlyGuidePdf.js`.

- **Resiliencia de Dominio, Seguridad NoSQL y Accesibilidad (Code Review):**
  - Blindaje contra `NaN` en `responseTimeDays` mediante helpers puros `parseSafeDate` y `calculateResponseDays`.
  - Protección estricta de estado: rechazo con HTTP 409 Conflict ante intentos de degradación involuntaria del estado `OFERTA` en `PATCH /api/applications/:id/status`, con soporte para bypass intencional mediante `force: true`.
  - Whitelist de filtrado en consultas MongoDB para `status`, `priority` y `workMode`, previniendo inyección de cadenas espurias en `$in`.
  - Límite de seguridad defensivo (`MAX_ALL_QUERY_LIMIT = 1000`) en consultas con `all=true` para prevenir sobrecarga de memoria en el servidor.
  - Creación del hook de accesibilidad `useModalA11y` en frontend con escucha de tecla `Escape` y bloqueo de scroll de fondo (`document.body.style.overflow = 'hidden'`), integrado en todos los modales de la aplicación.
  - Ampliación de la suite de pruebas en Vitest a 54 tests automatizados (100% pass).

- **Reminders Drawer, Toast Global y Paginación en Tabla (Tarjeta 12):**
  - Creación de `RemindersDrawer.jsx`: panel lateral deslizable (slide-over) accesible con filtros de criticidad (`ALTA`, `MEDIA`), cálculo reactivo de días de inactividad y disparador seguro de contacto directo `mailto:` con asunto y cuerpo preformateados.
  - Implementación de `ToastContext.jsx`: proveedor global de notificaciones con paleta Deep Cobalt, variantes semánticas (`success`, `error`, `info`), descarte manual interactivo y timer defensivo para prevenir fugas de memoria.
  - Paginación interactiva en `ApplicationTable.jsx`: barra numérica al pie con navegación `< Anterior`, botones de página, elipsis (`...`) y `Siguiente >`, desacoplada del estado global de Kanban.
  - Badge reactivo y disparador de campana en `Navbar.jsx` con contador en vivo de alertas pendientes.
  - Stack counter en `useModalA11y.js` para mantener el bloqueo de scroll (`overflow: hidden`) al abrir modales anidados sobre el drawer.

- **Sistema de Autenticación, Registro y Google OAuth (Tarjeta 13):**
  - Modelo `User` en Mongoose (`server/src/models/User.js`) con campos `name`, `email` único, `password` hasheado con `bcryptjs`, `avatar`, `googleId` con índice sparse, `theme` y timestamps.
  - Métodos criptográficos: `matchPassword` con `bcrypt.compare`, hook `pre('save')` para hasheo con salt de 10 rondas y transformación `toJSON` para excluir hash de contraseñas.
  - Vinculación y aislamiento de datos: asociación de postulaciones en `Application.js` con `user: { type: ObjectId, ref: 'User' }`, índices compuestos `{ user: 1, appliedAt: -1 }` y `{ user: 1, status: 1 }`.
  - Scoping de consultas por usuario en `applicationController.js`, pipeline de analíticas en `analyticsController.js` y reportes en `reportController.js`.
  - Rutas y controladores de auth (`POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/google`, `GET /api/auth/me`).
  - Middleware de protección Express `protect` (`server/src/middlewares/authMiddleware.js`) para validar tokens Bearer JWT y salvaguardar endpoints privados.
  - Integración de Google OAuth con `google-auth-library` para verificar ID tokens federados.
  - Suite automatizada en Vitest (`server/src/tests/auth.test.js`) con 17 pruebas unitarias y de integración (72 tests pasando al 100%).
  - Frontend: `AuthContext.jsx` para gestión global de sesión, persistencia de token en `localStorage` e inyección automática en `client/src/services/api.js`.
  - Componente modal `AuthModal.jsx`: accesible vía `useModalA11y`, con selector de pestañas (Iniciar Sesión / Registro), botón "Continuar con Google", validación en tiempo real y feedback visual de errores.
  - Menú de perfil y logout en `Navbar.jsx`: avatar con foto/iniciales, menú desplegable con datos de cuenta, botón de cerrar sesión y notificación toast.
  - Vista landing / bienvenida en `App.jsx` para usuarios no autenticados, protegiendo los datos privados del usuario.

- **Modo Claro Armónico & Switch de Tema Dual (Tarjeta 14):**
  - **Paleta de Diseño Armónica (Tailwind & CSS Tokens):** Configuración de `darkMode: 'class'` en `client/tailwind.config.js` y variables semánticas en `client/src/index.css`. Sustitución de blanco estridente plano por base suave hielo/slate (`#f1f5f9` / `#e2e8f0`), tarjetas perladas (`#ffffff` / `#f8fafc`) con bordes sutiles (`#cbd5e1`), tipografía Deep Cobalt & Slate (`#0f172a`, `#1e293b`) de alto contraste (WCAG AAA) y acentos ámbar cálido (`#b45309` / `#d97706`).
  - **Sincronización en Backend:** Endpoint `PATCH /api/auth/theme` con validación de valores (`'dark' | 'light'`) y persistencia en MongoDB (`User.theme`). Suite automatizada en Vitest con 3 pruebas para actualización de tema (75/75 tests en total pasando).
  - **Contexto Global (`ThemeContext.jsx`):** Jerarquía de resolución inteligente (perfil de usuario > `localStorage` > `prefers-color-scheme` > `'dark'`), conmutación inmediata de clases `.dark` / `.light` en `document.documentElement` y hook `useTheme()`.
  - **Switch Interactivo (`ThemeToggle.jsx`):** Botón accesible en `Navbar.jsx` con micro-animación SVG de rotación suave entre iconos `SunIcon` y `MoonIcon`.
  - **Adaptación Visual Exhaustiva:** Aplicación de variantes `dark:` en toda la aplicación: `Navbar`, `App`, `KPICards`, `KanbanBoard` (columnas y tarjetas), `ApplicationTable` (filas alternadas y controles numéricos de paginación), `ViewToggle`, `UpcomingReminders`, `QuickAddModal`, `ApplicationDetailModal`, `ReportModal`, `RemindersDrawer`, `AuthModal` y `BottomNav`.

- **Despliegue Full-Stack en la Nube y DevOps:**
  - Configuración de SPA rewrites en Vercel (`client/vercel.json`) para prevenir errores 404 en recargas.
  - Creación del blueprint declarativo de Render (`render.yaml`) con comandos de build, start y health check.
  - Normalización dinámica de `VITE_API_URL` en la capa de servicios (`client/src/services/api.js`).
  - Base de datos en MongoDB Atlas M0 Free Tier (AWS) con IP whitelist global (`0.0.0.0/0`).
  - Despliegue en producción operativo: Frontend en Vercel (`https://jobfow-app.vercel.app`) y Backend en Render (`https://jobfow-api.onrender.com`).

---

## [0.1.0] - 2026-09-04

### Added
- **Estructura base del repositorio:** Arquitectura desacoplada en raíz (`/server` y futura `/client`).
- **Gestión de dependencias:** Inicialización del proyecto backend usando `pnpm` (`jobflow-server`).
- **Configuración de Git:** Archivo `.gitignore` configurado para excluir dependencias (`node_modules/`), variables de entorno locales (`.env*`), artefactos de build y logs del sistema.
- **Servidor Express con ES Modules:**
  - Servidor Express en `server/src/server.js` utilizando módulos nativos ECMAScript (`"type": "module"`).
  - Middlewares globales de seguridad e integración: `cors` y `express.json()`.
  - Endpoint de comprobación de salud del servicio: `GET /health`.
  - Soporte de recarga en caliente con `nodemon` (`pnpm run dev`).
  - Plantilla de variables de entorno con `server/.env.example` y `server/.env`.
- **Estructura modular del servidor:** Creación de carpetas `config/`, `controllers/`, `models/`, `routes/` y `utils/` en `server/src/`.
- **Documentación:** Creación del `README.md` con especificaciones de producto, arquitectura, modelo de datos y contrato de API.
