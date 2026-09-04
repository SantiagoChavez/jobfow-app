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

## 🗄️ Fase 1: Persistencia y Modelos de Datos (Backend)
- [ ] **1.1 Configuración de Base de Datos**
  - [ ] Instalar `mongoose` en `/server` vía `pnpm add mongoose`.
  - [ ] Crear módulo de conexión `server/src/config/db.js`.
  - [ ] Agregar variable `MONGODB_URI` en `.env.example` y `.env`.
  - [ ] Conectar la base de datos en el ciclo de vida de `server.js`.
- [ ] **1.2 Modelo de Postulaciones (`Application`)**
  - [ ] Crear `server/src/models/Application.js`.
  - [ ] Definir subdocumento/esquema para `interactions`:
    - `tipo`: Enum (`POSTULACION_ENVIADA`, `MENSAJE_RECRUITER`, `RESPUESTA_RECIBIDA`, `ENTREVISTA`, `RECHAZO`, `OTRO`).
    - `fecha`: Date (default `Date.now`).
    - `notas`: String opcional.
  - [ ] Definir campos principales de `Application`:
    - `empresa`: Object/String (nombre requerido, web, rubro).
    - `rol`: String (requerido).
    - `url`: String opcional.
    - `prioridad`: Enum (`High`, `Medium`, `Low`, default: `Medium`).
    - `fechaAplicacion`: Date (default `Date.now`).
    - `estado`: Enum (`ENVIADA`, `CONTACTO`, `ENTREVISTA`, `OFERTA`, `RECHAZADA`).
    - `requisitosTexto`: String opcional.
    - `skillsDetectadas`: Array de strings.
    - `tiempoRespuestaDias`: Number (null por defecto hasta el primer contacto).
    - `interacciones`: Array de subdocumentos de interacción.

---

## ⚙️ Fase 2: Lógica de Negocio y Endpoints Core (Backend)
- [ ] **2.1 Utilidad de Extracción de Skills (`skillExtractor`)**
  - [ ] Crear `server/src/utils/skillExtractor.js`.
  - [ ] Implementar función para extraer palabras clave/tecnologías (React, Node, TypeScript, Docker, SQL, Python, etc.) a partir del texto de requisitos.
- [ ] **2.2 Crear Postulación (`POST /api/applications`)**
  - [ ] Crear controlador `server/src/controllers/applicationController.js`.
  - [ ] Validar campos obligatorios (`empresa`, `rol`); responder 400 Bad Request si faltan datos.
  - [ ] Procesar `requisitosTexto` con `skillExtractor`.
  - [ ] Insertar automáticamente la primera interacción: `{ tipo: "POSTULACION_ENVIADA", fecha: fechaAplicacion }`.
  - [ ] Guardar en base de datos con estado `"ENVIADA"` y responder 201 Created con el documento creado.
- [ ] **2.3 Listar y Filtrar Postulaciones (`GET /api/applications`)**
  - [ ] Implementar listado con orden descendente por `fechaAplicacion`.
  - [ ] Permitir filtros por query params: `estado`, rango de fechas (`from`, `to`), y búsqueda por empresa o rol.
- [ ] **2.4 Registrar Interacción y Calcular Métricas (`POST /api/applications/:id/interactions`)**
  - [ ] Validar existencia de la postulación (retornar 404 si no existe).
  - [ ] Agregar nuevo evento al array de `interacciones`.
  - [ ] **Regla analítica de negocio:**
    - Si `tipo === "RESPUESTA_RECIBIDA"` y `tiempoRespuestaDias === null`:
      - Calcular diferencia en milisegundos: `fechaEvento - fechaAplicacion`.
      - Convertir a días: `Math.round(diffMs / (1000 * 60 * 60 * 24))`.
      - Asignar `tiempoRespuestaDias`.
      - Actualizar estado a `"CONTACTO"` o `"ENTREVISTA"`.
  - [ ] Guardar y retornar el documento actualizado (status 200).
- [ ] **2.5 Configurar Enrutador de Postulaciones**
  - [ ] Crear `server/src/routes/applicationRoutes.js`.
  - [ ] Conectar rutas en `server.js` bajo el prefijo `/api/applications`.

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
