# 📌 Backlog de Tareas - JobHunter

Este documento centraliza el roadmap y el desglose de tareas técnicas necesarias para llevar el MVP de JobHunter a producción, ordenadas por fases incrementales y prioridades.

---

## 🚦 Leyenda de Estados
- 🟢 **Completado (`[x]`)**
- 🟡 **En Progreso (`[-]`)**
- ⚪ **Pendiente (`[ ]`)**

---

## 🚀 Fase 0: Inicialización del Proyecto (Completada)
- [x] **0.1** Crear archivo `.gitignore` robusto en la raíz del repositorio.
- [x] **0.2** Inicializar módulo `/server` con `pnpm init` y configurar `"type": "module"`.
- [x] **0.3** Instalar dependencias de producción (`express`, `cors`, `dotenv`) y de desarrollo (`nodemon`).
- [x] **0.4** Configurar scripts `dev` y `start` en `server/package.json`.
- [x] **0.5** Crear estructura de directorios en `server/src/` (`config/`, `controllers/`, `models/`, `routes/`, `utils/`).
- [x] **0.6** Configurar `.env` y `.env.example` con la variable `PORT=5000`.
- [x] **0.7** Implementar servidor Express en `server/src/server.js` con endpoint `GET /health` y verificar respuesta 200 OK.
- [x] **0.8** Crear documentación base (`README.md`, `CHANGELOG.md` y `TASKS.md`).
- [x] **0.9** Configurar flujo de ramas Git (`main`, `pre-staging`, `dev`) y sincronizar con repositorio remoto (`origin`).
- [x] **0.10** Incorporar especificaciones de diseño y modelos de referencia visual (`modelo para job hunter.pdf`).

---

## 🗄️ Fase 1: Persistencia y Modelos de Datos (Backend - Tarjeta 2 Completada)
- [x] **1.1 Configuración de Base de Datos**
  - [x] Instalar `mongoose` en `/server` vía `pnpm add mongoose`.
  - [x] Crear módulo de conexión `server/src/config/db.js` con manejo de errores y desconexión segura.
  - [x] Agregar variable `MONGODB_URI` en `.env.example` y `.env`.
  - [x] Conectar la base de datos en el ciclo de vida de `server.js` previo a la escucha de Express.
- [x] **1.2 Modelo de Postulaciones Enriquecido (`Application`)**
  - [x] Crear `server/src/models/Application.js`.
  - [x] Definir subdocumento `interactionSchema`:
    - `type`: Enum (`POSTULACION_ENVIADA`, `MENSAJE_ENVIADO`, `RESPUESTA_RECIBIDA`, `ENTREVISTA`, `RECHAZO`, `OFERTA`), required.
    - `date`: Date (default `Date.now`).
    - `notes`: String con trim.
  - [x] Definir campos de `applicationSchema`:
    - `company`: `name` (requerido), `website`, `industry`.
    - `role`: String (requerido).
    - `status`: Enum (`ENVIADA`, `CONTACTO`, `ENTREVISTA`, `RECHAZADA`, `OFERTA`), default `'ENVIADA'`.
    - `priority`: Enum (`LOW`, `MEDIUM`, `HIGH`), default `'MEDIUM'`.
    - `workMode`: Enum (`REMOTE`, `HYBRID`, `ON_SITE`), default `'REMOTE'`.
    - `salary`, `experienceLevel`.
    - `recruiter`: `name`, `email`.
    - `jobUrl`, `requirementsRaw`, `extractedSkills`.
    - `interactions`: Array de `interactionSchema`.
    - `appliedAt` (Date), `responseTimeDays` (Number, default null).
  - [x] Configurar `{ timestamps: true }`.
  - [x] Configurar índices para reportes (`status/appliedAt`, `priority`, `company.name`).

---

## ⚙️ Fase 2: Lógica de Negocio y Endpoints Core (Backend)
- [x] **2.1 Crear Postulación (`POST /api/applications`)**
  - [x] Validar campos obligatorios (`company.name`, `role`).
  - [x] Insertar primera interacción automática (`POSTULACION_ENVIADA`).
  - [x] Responder 201 Created con el documento creado.
- [x] **2.2 Listar y Filtrar Postulaciones (`GET /api/applications`)**
  - [x] Implementar listado ordenado descendente por fecha de aplicación.
  - [x] Filtros por query params: `status`, `priority`, `workMode`, y búsqueda por texto `search` (empresa / rol).
- [x] **2.3 Detalle de Postulación (`GET /api/applications/:id`)**
  - [x] Validación de ObjectId con Mongoose.
  - [x] Retorno del documento completo o 404 Not Found.
- [x] **2.4 Actualizar Estado y Calcular Tiempos (`PATCH /api/applications/:id/status`)**
  - [x] Validación de enums de estado (`ENVIADA`, `CONTACTO`, `ENTREVISTA`, `RECHAZADA`, `OFERTA`).
  - [x] Cálculo automático de `responseTimeDays` si pasa a CONTACTO o ENTREVISTA y era null.
  - [x] Registro automático del cambio de estado en el historial de `interactions`.
- [x] **2.5 Eliminar Postulación (`DELETE /api/applications/:id`)**
  - [x] Validación de ObjectId y eliminación física en MongoDB Atlas.
- [x] **2.6 Configuración de Enrutador (`server/src/routes/applicationRoutes.js`)**
  - [x] Enrutador montado en `server.js` bajo `/api/applications`.
- [ ] **2.7 Registrar Interacción Manual (`POST /api/applications/:id/interactions`)**
- [ ] **2.8 Utilidad Avanzada de Extracción de Skills (`skillExtractor.js`)**

---

## 📊 Fase 3: Analítica y Reportes para el Coach (Backend)
- [ ] **3.1 Resumen Estadístico (`GET /api/analytics/summary`)**
  - [ ] Crear controlador y ruta para analíticas.
  - [ ] Calcular indicadores globales y del período:
    - `totalEnviadas`: Total de postulaciones registradas.
    - `conRespuesta`: Cantidad de postulaciones con `tiempoRespuestaDias != null`.
    - `tasaRespuesta`: `(conRespuesta / totalEnviadas) * 100` (%).
    - `promedioDiasRespuesta`: Promedio de `tiempoRespuestaDias` de las que obtuvieron respuesta.
    - Desglose por estados (`ENVIADA`, `CONTACTO`, `ENTREVISTA`, `OFERTA`, `RECHAZADA`).
- [ ] **3.2 Generación de Reporte PDF Semanal (`GET /api/reports/pdf`)**
  - [ ] Evaluar librería de generación de PDF en streaming (`pdfkit` o `puppeteer-core` / HTML to PDF).
  - [ ] Diseñar plantilla del reporte con formato profesional:
    - Encabezado con datos del desarrollador y rango de fechas (`from` - `to`).
    - Bloque de métricas clave (total postulaciones, tasa de respuesta, tiempo medio de respuesta).
    - Tabla detallada de evidencia con fecha, empresa, rol, estado y última interacción.
  - [ ] Configurar endpoint para responder con streaming de buffer binario y cabecera `Content-Type: application/pdf`.

---

## 💻 Fase 4: Frontend y Vistas Basadas en Modelo UI (`/client`)
- [-] **4.1 Inicialización de la Aplicación Cliente**
  - [x] Inicializar `/client` con Vite 8 + React 19 usando `pnpm`.
  - [x] Configurar Tailwind CSS v3, PostCSS y paleta "Deep Cobalt & Crisp Gold".
  - [x] Limpiar boilerplate y verificar renderizado en navegador (`http://localhost:5173`).
  - [ ] Configurar cliente HTTP (Axios / Fetch) con URL base configurable (`VITE_API_URL`).
- [ ] **4.2 Shell y Navegación Principal (Layout)**
  - [ ] Sidebar lateral estilizado: Logo JobHunter, enlaces (Dashboard, Applications, Tracker, Calendar, Analytics, Profile).
  - [ ] Header con perfil de usuario y botón de acción rápida `+ Add Application`.
- [ ] **4.3 Formulario Rápido de Carga (Modal / Quick Add)**
  - [ ] Modal con campos: Empresa, Puesto/Rol, URL de la oferta, Prioridad, Requisitos (textarea).
  - [ ] Enlace con API `POST /api/applications` y actualización optimista.
- [ ] **4.4 Tablero Tracker (Kanban Board)**
  - [ ] Columnas según modelo: *Saved*, *Applied*, *Interview*, *Offer*, *Rejected*.
  - [ ] Tarjetas con nombre de empresa, rol, fecha y botón de acción rápida ("Me respondieron").
- [ ] **4.5 Vista de Tabla de Postulaciones (Applications View)**
  - [ ] Tabla interactiva con filtros por estado, orden por fecha y buscador por texto.
- [ ] **4.6 Dashboard y Analítica**
  - [ ] Tarjetas resumen con métricas (Applications, Interviews, Offers, Response Rate).
  - [ ] Componente de actividad semanal y distribución de postulaciones.
  - [ ] Botón de descarga de "Reporte Semanal en PDF" con selector de fechas para entregar al coach.
