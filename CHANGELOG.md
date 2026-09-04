# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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
  - Incorporación del documento `modelo para job hunter.pdf` que define las vistas de referencia: Dashboard, Tablero Kanban (Tracker), tabla de postulaciones, calendario y perfil de usuario.
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

### Planned (Próximas Tareas)
- **Lógica Avanzada & Reportes:**
  - Endpoint `POST /api/applications/:id/interactions` para registro de eventos manuales con notas.
  - Extractor avanzado de skills (`skillExtractor.js`).
  - Endpoint `GET /api/analytics/summary` para resumen estadístico del dashboard.
  - Endpoint `GET /api/reports/pdf` para reporte semanal descargable en PDF.
- **Frontend (`/client`):** Implementación de vistas Kanban Tracker, formulario de carga rápida y dashboard.

---

## [0.1.0] - 2026-09-04

### Added
- **Estructura base del repositorio:** Arquitectura desacoplada en raíz (`/server` y futura `/client`).
- **Gestión de dependencias:** Inicialización del proyecto backend usando `pnpm` (`jobhunter-server`).
- **Configuración de Git:** Archivo `.gitignore` configurado para excluir dependencias (`node_modules/`), variables de entorno locales (`.env*`), artefactos de build y logs del sistema.
- **Servidor Express con ES Modules:**
  - Servidor Express en `server/src/server.js` utilizando módulos nativos ECMAScript (`"type": "module"`).
  - Middlewares globales de seguridad e integración: `cors` y `express.json()`.
  - Endpoint de comprobación de salud del servicio: `GET /health`.
  - Soporte de recarga en caliente con `nodemon` (`pnpm run dev`).
  - Plantilla de variables de entorno con `server/.env.example` y `server/.env`.
- **Estructura modular del servidor:** Creación de carpetas `config/`, `controllers/`, `models/`, `routes/` y `utils/` en `server/src/`.
- **Documentación:** Creación del `README.md` con especificaciones de producto, arquitectura, modelo de datos y contrato de API.
