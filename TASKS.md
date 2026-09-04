# 📌 Backlog de Tareas - JobHunter

Este documento centraliza el roadmap y el desglose de tareas técnicas necesarias para llevar el MVP de JobHunter a producción, ordenadas por fases incrementales y prioridades.

---

## 🚦 Leyenda de Estados
- 🟢 **Completado (`[x]`)**
- 🟡 **En Progreso (`[-]`)**
- ⚪ **Pendiente (`[ ]`)**

---

##  Fase 0: Inicialización del Proyecto (Completada)
- [x] **0.1** Crear archivo `.gitignore` robusto en la raíz del repositorio.
- [x] **0.2** Inicializar módulo `/server` con `pnpm init` y configurar `"type": "module"`.
- [x] **0.3** Instalar dependencias de producción (`express`, `cors`, `dotenv`) y de desarrollo (`nodemon`).
- [x] **0.4** Configurar scripts `dev` y `start` en `server/package.json`.
- [x] **0.5** Crear estructura de directorios en `server/src/` (`config/`, `controllers/`, `models/`, `routes/`, `utils/`).
- [x] **0.6** Configurar `.env` y `.env.example` con la variable `PORT=5000`.
- [x] **0.7** Implementar servidor Express en `server/src/server.js` con endpoint `GET /health`.
- [x] **0.8** Crear documentación base (`README.md`, `CHANGELOG.md` y `TASKS.md`).

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
    - `fechaAplicacion`: Date (default `Date.now`).
    - `estado`: Enum (`ENVIADA`, `CONTACTO`, `ENTREVISTA`, `RECHAZADA`).
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
    - Desglose por estados (`ENVIADA`, `CONTACTO`, `ENTREVISTA`, `RECHAZADA`).
- [ ] **3.2 Generación de Reporte PDF Semanal (`GET /api/reports/pdf`)**
  - [ ] Evaluar librería de generación de PDF en streaming (`pdfkit` o `puppeteer-core` / HTML to PDF).
  - [ ] Diseñar plantilla del reporte con formato profesional:
    - Encabezado con datos del desarrollador y rango de fechas (`from` - `to`).
    - Bloque de métricas clave (total postulaciones, tasa de respuesta, tiempo medio de respuesta).
    - Tabla detallada de evidencia con fecha, empresa, rol, estado y última interacción.
  - [ ] Configurar endpoint para responder con streaming de buffer binario y cabecera `Content-Type: application/pdf`.

---

## 💻 Fase 4: Frontend Mobile-First (`/client`)
- [ ] **4.1 Inicialización de la Aplicación Cliente**
  - [ ] Inicializar `/client` con Vite + React usando pnpm.
  - [ ] Configurar cliente HTTP (Axios / Fetch) con URL base configurable.
  - [ ] Establecer estilos y diseño visual limpio, moderno y responsivo (optimizado para carga rápida en móvil).
- [ ] **4.2 Formulario Rápido de Carga (Quick Add)**
  - [ ] Campos: Empresa, Puesto/Rol, URL de la oferta, Requisitos (textarea para pegar).
  - [ ] Envío rápido y confirmación visual inmediata.
- [ ] **4.3 Gestión de Postulaciones e Interacciones**
  - [ ] Listado de tarjetas de postulación agrupadas por estado o fecha.
  - [ ] Acción rápida "Me Respondieron" para registrar respuesta con 1 clic.
  - [ ] Modal/Drawer para agregar notas o mensajes enviados al recruiter.
- [ ] **4.4 Dashboard de Métricas & Exportación**
  - [ ] Tarjetas con métricas principales (Postulaciones esta semana, Tasa de respuesta, Tiempo promedio).
  - [ ] Botón de descarga de "Reporte Semanal en PDF" con selector de fechas para entregar al coach.
