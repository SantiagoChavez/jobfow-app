# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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
  - Endpoint `POST /api/ai/analyze-job` con validaciones y manejo de estados HTTP 400, 502, 504 y 500.
  - Suite de 9 pruebas automatizadas en Vitest con mocks deterministas (`server/src/tests/ai.test.js`, 100% pass).
  - Interfaz interactiva en `QuickAddModal.jsx` con botón *"✨ Autocompletar con IA"*, feedback de carga y autocompletado de empresa, puesto, modalidad, prioridad y salario.
  - Generador de pitch personalizado y resumen de empresa con botón de copiado rápido al portapapeles (`navigator.clipboard`).

### Planned (Próximas Tareas)
- **Frontend Paginado y Filtros Avanzados:** Conexión de controles de paginación numérica y selector de límite en `ApplicationTable.jsx`.
- **Autenticación y Multi-Usuario:** Soporte para cuentas individuales de desarrolladores.

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
