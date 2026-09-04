# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Inicialización del cliente frontend (`/client`):**
  - Configuración con Vite + React usando `pnpm`.
  - Integración de Tailwind CSS v3, PostCSS y Autoprefixer.
  - Configuración del tema con la paleta de identidad "Deep Cobalt & Crisp Gold" (`navy-base`, `navy-surface`, `navy-highlight`, `gold-primary`, `gold-light`, `gold-dark`, `sky-tech`, `ice-blue`).
  - Limpieza de boilerplate inicial y componente base de prueba en `client/src/App.jsx`.

### Planned (Próximas Tareas)
- **Conexión a Base de Datos:** Configurar conexión a MongoDB mediante Mongoose (`server/src/config/db.js`).
- **Modelos de Datos:** Implementar schemas de Mongoose para `Application` e `Interaction`.
- **Lógica de Negocio y Controladores:**
  - Endpoint `POST /api/applications` con validación y extracción inicial de skills.
  - Endpoint `GET /api/applications` con filtros por estado y fechas.
  - Endpoint `POST /api/applications/:id/interactions` con algoritmo de cálculo automático de `tiempoRespuestaDias` y transición de estados (`CONTACTO` / `ENTREVISTA`).
  - Endpoint `GET /api/analytics/summary` para resumen estadístico (total postulaciones, con respuesta, tasa de respuesta y días promedio).
  - Endpoint `GET /api/reports/pdf` para generación y streaming de reporte semanal en PDF.

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
