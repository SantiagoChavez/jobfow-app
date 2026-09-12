# 📌 Backlog de Tareas - Jobflow

Este documento centraliza el roadmap y el desglose de tareas técnicas necesarias para llevar el MVP de Jobflow a producción, ordenadas por fases incrementales y prioridades.

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
- [x] **0.10** Incorporar especificaciones de diseño y modelos de referencia visual (`modelo para jobflow.pdf`).

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
- [x] **2.7 Registrar Interacción Manual (`POST /api/applications/:id/interactions` - Tarjeta 4)**
  - [x] Validación de ObjectId y enum de tipos de interacción permitidos (`POSTULACION_ENVIADA`, `MENSAJE_ENVIADO`, `RESPUESTA_RECIBIDA`, `ENTREVISTA`, `RECHAZO`, `OFERTA`).
  - [x] Registro cronológico de interacciones con fecha y notas.
  - [x] Cálculo automático de `responseTimeDays` (diferencia en días sin negativos) y transición a `CONTACTO`.
  - [x] Transición a `ENTREVISTA` protegiendo el estado `OFERTA`.
  - [x] Suite de pruebas automatizadas con Vitest y Supertest (`server/src/tests/interactions.test.js`).
- [x] **2.8 Matching y Comparación de Habilidades Técnicas (`POST /api/applications/match-preview` - Tarjeta 7)**
  - [x] Catálogo de skills técnicas normalizado con alias y diccionario del mercado (`server/src/config/skillsCatalog.js`).
  - [x] Servicio algorítmico de matching semántico y cálculo de afinidad (`server/src/services/matchService.js`).
  - [x] Controlador y endpoints `POST /api/applications/match-preview` y `POST /api/match/preview`.
  - [x] Suite de pruebas automatizadas con Vitest y Supertest (`server/src/tests/match.test.js`).

---

## 📊 Fase 3: Analítica y Reportes para el Coach (Backend)
- [x] **3.1 Resumen Estadístico (`GET /api/analytics/summary` - Tarjeta 5)**
  - [x] Crear controlador `analyticsController.js` y ruta `analyticsRoutes.js`.
  - [x] Pipeline de KPIs principales (`totalApplications`, `totalInterviews`, `totalOffers`, `responseRate`).
  - [x] Pipeline de distribución de postulaciones por estado con cálculo de porcentajes.
  - [x] Pipeline de tiempos de respuesta (`avgResponseDays` y ranking `fastestCompanies` top 5).
  - [x] Suite de pruebas automatizadas con Vitest y Supertest (`server/src/tests/analytics.test.js`).
- [x] **3.2 Generación de Reporte PDF Semanal (`GET /api/reports/pdf` - Tarjeta 6)**
  - [x] Integrar librerías `pdfkit` y `pdfkit-table` para generación vectorial en Node.js.
  - [x] Servicio modular `pdfService.js` con plantilla A4, identidad Deep Cobalt & Gold.
  - [x] Bloque de KPIs (Total, En Proceso, Ofertas, Tasa de Respuesta) y tabla estructurada de postulaciones.
  - [x] Numeración dinámica de páginas en pie de página.
  - [x] Controlador `reportController.js` con filtrado por fechas (`from`, `to`), fallback a últimos 30 días y descarga binaria.
  - [x] Suite de pruebas automatizadas con Vitest y Supertest (`server/src/tests/reports.test.js`).

---

## 💻 Fase 4: Frontend y Vistas Basadas en Modelo UI (`/client` - Tarjeta 8)
- [x] **4.1 Inicialización y Capa de Servicios HTTP**
  - [x] Inicializar `/client` con Vite 8 + React 19 usando `pnpm`.
  - [x] Configurar Tailwind CSS v3, PostCSS y paleta "Deep Cobalt & Crisp Gold".
  - [x] Proxy de desarrollo configurado en `client/vite.config.js` (`/api` -> `http://localhost:5000`).
  - [x] Capa de servicios HTTP en `client/src/services/api.js` (CRUD, status, interactions, matching y PDF blob download).
- [x] **4.2 Shell y Navegación Principal (Layout & Mobile-First)**
  - [x] Header Navbar con Logo Jobflow Radar, selector de vista y botón `+ Nueva Postulación`.
  - [x] BottomNav fija para dispositivos móviles con botón flotante central de acción rápida.
- [x] **4.3 Formulario Rápido de Carga (Modal / Quick Add)**
  - [x] Modal `QuickAddModal.jsx` con campos completos (empresa, puesto, modalidad, prioridad, salario, url, reclutador).
  - [x] Análisis en vivo de afinidad de skills con debounce consultando `POST /api/applications/match-preview`.
  - [x] Badges visuales de porcentaje de afinidad y desglose de skills coincidentes y faltantes.
- [x] **4.4 Tablero Tracker (Kanban Board)**
  - [x] Columnas por estado: `ENVIADA`, `CONTACTO`, `ENTREVISTA`, `OFERTA`, `RECHAZADA`.
  - [x] Tarjetas compactas con empresa, rol, badges de prioridad/modalidad, días transcurridos y botón rápido *"⚡ Me respondieron"*.
- [x] **4.5 Vista de Tabla de Postulaciones (Applications View)**
  - [x] Tabla interactiva `ApplicationTable.jsx` con buscador de texto en vivo y filtros por estado.
  - [x] Acciones por fila para ver detalle, abrir enlace de la vacante y eliminar.
- [x] **4.6 Dashboard y Analítica**
  - [x] `KPICards.jsx`: Bloque de 4 métricas (Postulaciones, Entrevistas, Ofertas, Tasa de Respuesta) consumiendo `/api/analytics/summary`.
  - [x] `UpcomingReminders.jsx`: Alertas de seguimientos prioritarios según días transcurridos y estado.
  - [x] `ReportModal.jsx`: Descarga directa del reporte oficial en PDF con selector de rango de fechas y presets.
- [x] **4.7 Modal Detalle de Postulación (`ApplicationDetailModal.jsx`)**
  - [x] Pestañas *Overview*, *Timeline* y *Reclutador*.
  - [x] Formulario para registrar eventos e interacciones cronológicas (`POST /api/applications/:id/interactions`).
  - [x] Cambio ágil de estado en tiempo real.

---

## ⚡ Fase 5: Optimización de Rendimiento y Escalabilidad (Backend - Tarjeta 9)
- [x] **5.1 Paginación en Servidor y Filtros Combinados (`GET /api/applications` - Tarjeta 9)**
  - [x] Implementar paginación (`page`, `limit`) y ordenamiento dinámico (`sortBy`, `order`) en `GET /api/applications`.
  - [x] Saneamiento seguro de query params (fallback a `page=1`, `limit=10`, límite superior de seguridad `100`, whitelist de ordenamiento).
  - [x] Retornar DTO de metadatos de paginación (`totalDocs`, `totalPages`, `currentPage`, `limit`, `hasNextPage`, `hasPrevPage`).
  - [x] Preservar filtros existentes (`status`, `priority`, `workMode`, `search`) sin romper compatibilidad.
  - [x] Crear suite de tests en Vitest (`server/src/tests/pagination.test.js`) validando páginas intermedias, límites inválidos y base vacía.

---

## 🖐️ Fase 6: Interactividad Avanzada y Productividad (Frontend - Tarjeta 10)
- [x] **6.1 Drag and Drop Interactivo en Kanban (`KanbanBoard.jsx` - Tarjeta 10)**
  - [x] Instalar e integrar soporte de arrastre visual con `@hello-pangea/dnd` v18 en React 19.
  - [x] Conectar evento `onDragEnd` con `PATCH /api/applications/:id/status`.
  - [x] Implementar actualización optimista de UI inmediata para transiciones instantáneas.
  - [x] Implementar rollback visual automático al snapshot previo en caso de fallo de red/servidor.
  - [x] Sincronizar datos recalculados del backend (`responseTimeDays`) y refrescar métricas (`getAnalyticsSummary()`).
  - [x] Estilos y feedback visual durante arrastre (sombras profundas, rotación sutil, borde dorado y highlight de columna destino).
  - [x] Preservar clic simple para abrir el modal `ApplicationDetailModal` sin conflictos de arrastre.

---

## 🤖 Fase 7: Copiloto de Postulación con IA (Backend & Frontend - Tarjeta 11)
- [x] **7.1 Integración del SDK Oficial de Google Gemini (`server/src/services/aiService.js`)**
  - [x] Instalar paquete `@google/genai` y configurar variables de entorno `GEMINI_API_KEY` y `GEMINI_MODEL=gemini-3.5-flash-lite`.
  - [x] Implementar servicio de extracción estructurada con fallback resiliente a `gemini-1.5-flash` en caso de error 404 del modelo.
  - [x] Blindaje de seguridad contra desbordamiento y prompt injection mediante truncado de entrada a 6.000 caracteres.
  - [x] Protección de tiempo de respuesta mediante timeout controlado de 12 segundos con `Promise.race`.
  - [x] Sanitización y extracción de JSON desde bloques de código markdown (` ```json `) con valores predeterminados garantizados.
- [x] **7.2 Endpoint de Análisis de Vacantes (`POST /api/ai/analyze-job`)**
  - [x] Crear controlador `aiController.js` con validación de entrada mínima (15 caracteres) y compatibilidad con alias (`jobDescription`, `requirementsRaw`).
  - [x] Crear enrutador `aiRoutes.js` y montarlo bajo `/api/ai` en `app.js`.
  - [x] Manejo de códigos de estado HTTP semánticos: 400 (Bad Request), 502 (Bad Gateway / upstream AI error), 504 (Gateway Timeout), 500 (Internal Server Error).
- [x] **7.3 Suite de Pruebas Automatizadas con Vitest (`server/src/tests/ai.test.js`)**
  - [x] Configuración de mocks deterministas de clase para `GoogleGenAI` (cero llamadas de red externas en tests).
  - [x] Cobertura de casos exitosos, payloads vacíos o cortos, timeout controlado (504), error del SDK externo (502) y fallback de modelo (9 tests pasando al 100%).
- [x] **7.4 Capa de Cliente y UI Interactiva (`QuickAddModal.jsx` & `api.js`)**
  - [x] Implementar función de consumo HTTP `analyzeJobWithAI` en `client/src/services/api.js`.
  - [x] Botón interactivo *"✨ Autocompletar con IA"* en `QuickAddModal.jsx` con spinner y estado de carga (`analyzingAI`).
  - [x] Autocompletado automático de campos del formulario (empresa, puesto, modalidad, prioridad, salario y afinidad).
  - [x] Tarjeta visual destacada con resumen de la empresa y pitch personalizado para recruiters.
  - [x] Botón *"📋 Copiar Pitch"* integrado con la API del portapapeles (`navigator.clipboard`) y feedback mediante toasts.

---

## 🛡️ Fase 8: Resiliencia de Dominio, Accesibilidad y Refactorizaciones del Code Review
- [x] **8.1 Blindaje contra `NaN` y Cálculos Temporales Seguros (`applicationController.js`)**
  - [x] Implementar helpers puros `parseSafeDate` y `calculateResponseDays`.
  - [x] Prevenir asignación de `NaN` en `responseTimeDays` cuando se reciben fechas inválidas o malformadas.
  - [x] Añadir suite de tests automatizados validando fechas inválidas en Vitest (`interactions.test.js`).
- [x] **8.2 Protección contra Degradación de Estados de Negocio (`updateApplicationStatus`)**
  - [x] Prevenir degradación accidental de postulaciones en estado `OFERTA` a estados previos (`CONTACTO`, `ENTREVISTA`, `ENVIADA`).
  - [x] Responder con código HTTP `409 Conflict` si se intenta degradar sin confirmación explícita.
  - [x] Soportar el parámetro `force: true` para transiciones manuales forzadas por el usuario.
  - [x] Agregar pruebas unitarias cubriendo el código de estado 409 y la confirmación forzada en Vitest.
- [x] **8.3 Sanitización con Listas Blancas y Protección de Memoria en Consultas (`getApplications`)**
  - [x] Restringir valores de filtros `$in` para `status`, `priority` y `workMode` mediante listas blancas (`VALID_STATUSES`, `VALID_PRIORITIES`, `VALID_WORK_MODES`).
  - [x] Implementar tope defensivo de seguridad `MAX_ALL_QUERY_LIMIT = 1000` en peticiones con `all=true` para prevenir sobrecarga de memoria (OOM).
- [x] **8.4 Consistencia de Contrato en Copiloto IA (`aiService.js`)**
  - [x] Incorporar alias contractual `keySkills` mapeado a `extractedSkills` en el esquema de respuesta y normalización.
  - [x] Añadir aserción de `keySkills` en la suite de pruebas unitarias (`ai.test.js`).
- [x] **8.5 Hook de Accesibilidad y Control de Scroll en Modales / Drawers (`useModalA11y.js`)**
  - [x] Crear hook reutilizable `useModalA11y` en `client/src/hooks/useModalA11y.js`.
  - [x] Implementar cierre con tecla `Escape` y bloqueo de scroll en el fondo (`document.body.style.overflow = 'hidden'`).
  - [x] Integrar `useModalA11y` en `QuickAddModal.jsx`, `ApplicationDetailModal.jsx` y `ReportModal.jsx`.

---

## 🔔 Fase 9: Drawer de Alertas, Toast Global y Paginación en Servidor (Tarjeta 12 - Completada)
- [x] **9.1 Refactorización y Refinamiento del Contexto Global Toast (`ToastContext.jsx`)**
  - [x] Proveedor global accesible y hook `useToast()` con soporte para `success`, `error` e `info`.
  - [x] Integración de `useToast` en `App.jsx`, `QuickAddModal.jsx` y `ReportModal.jsx`.
- [x] **9.2 Drawer Lateral de Recordatorios y Alertas (Slide-over UX - `RemindersDrawer.jsx`)**
  - [x] Implementar componente `RemindersDrawer.jsx` accesible (cierre con `Escape`, bloqueo de scroll con `useModalA11y`, `role="dialog"`, overlay animado).
  - [x] Filtros dinámicos por nivel de criticidad (Todos, Urgentes &gt; 5 días, Entrevistas, Contacto).
  - [x] Botón de acción rápida con trigger `mailto:` sanitizado vía `createSafeMailto` para contactar reclutadores.
  - [x] Botón de acción secundaria para abrir el detalle de la postulación.
- [x] **9.3 Integración en Header y Navegación**
  - [x] Botón de campana con badge de contador reactivo en `Navbar.jsx` que abre el Drawer de Alertas.
  - [x] Enlace directo de apertura rápida en el widget `UpcomingReminders.jsx`.
- [x] **9.4 Controles Interactivos de Paginación en Servidor (`ApplicationTable.jsx`)**
  - [x] Barra interactiva al pie con `< Anterior`, botones numéricos de página y `Siguiente >`.
  - [x] Texto informativo dinámico: "Mostrando página X de Y (Z postulaciones en total)".
  - [x] Gestión de estado `currentPage` y consumo de `GET /api/applications?page=X` en `App.jsx` sin recargar la aplicación.

---

## 🤖 Fase 10: Persistencia de Pitch IA y Experiencia de Contacto
- [x] **10.1 Persistencia de Pitch y Resumen de Empresa en Base de Datos**
  - [x] Agregar campos `suggestedPitch`, `companySummary` y `matchScore` al esquema Mongoose de `Application.js`.
  - [x] Adaptar controlador `createApplication` para guardar `suggestedPitch`, `companySummary` y `matchScore` en MongoDB.
  - [x] Prueba de integración automatizada en Vitest (`ai.test.js`) para verificar la persistencia de datos de IA.
- [x] **10.2 Experiencia de Usuario: Edición y Copiado en Frontend**
  - [x] Soporte para personalización y edición del pitch sugerido en `QuickAddModal.jsx` antes del guardado.
  - [x] Visualización del pitch guardado en `ApplicationDetailModal.jsx` (pestaña General / Overview).
  - [x] Botón de copiado con 1-click al portapapeles (`navigator.clipboard`) y notificación toast de éxito.
  - [x] Visualización de resumen de empresa (`companySummary`) y badge de afinidad técnica (`matchScore`).

---

## 🔐 Fase 11: Autenticación de Usuarios y Google OAuth (Tarjeta Trello 13 - Completada)
- [x] **11.1 Modelo de Datos y Seguridad en Servidor (`server/src/models/User.js`)**
  - [x] Crear esquema de usuario `User` con campos `name`, `email` (único e indexado), `password` (hasheado con bcryptjs para registro tradicional), `avatar`, `googleId` (índice sparse), `theme` ('dark' | 'light') y timestamps.
  - [x] Métodos de seguridad: comparación de contraseñas (`matchPassword`) y exclusión de hash en respuestas JSON.
  - [x] Actualizar modelo `Application` para asociar postulaciones a un usuario específico (`user: { type: ObjectId, ref: 'User' }`).
- [x] **11.2 Controladores y Rutas de Autenticación (`server/src/controllers/authController.js`)**
  - [x] Implementar `POST /api/auth/register`: validación de campos, hash de contraseña y emisión de token JWT.
  - [x] Implementar `POST /api/auth/login`: validación de credenciales y retorno de sesión JWT.
  - [x] Implementar `POST /api/auth/google`: verificación de token con Google Identity Services (`google-auth-library`), registro/inicio de sesión federado y emisión de JWT.
  - [x] Implementar `GET /api/auth/me`: obtención del perfil del usuario autenticado.
  - [x] Middleware `protect` (`server/src/middlewares/authMiddleware.js`): validación de token `Bearer` y protección de rutas privadas.
- [x] **11.3 Suite de Pruebas Automatizadas en Vitest (`server/src/tests/auth.test.js`)**
  - [x] Pruebas unitarias de registro tradicional, login con credenciales válidas/inválidas y verificación de Google OAuth.
  - [x] Pruebas de protección de rutas privadas (401 Unauthorized sin token).
- [x] **11.4 Contexto Global y Vistas de Autenticación en Frontend (`client/src/context/AuthContext.jsx`)**
  - [x] Proveedor `AuthContext` con persistencia de token en `localStorage`, manejo de estado `user`, `login`, `logout` y `loginWithGoogle`.
  - [x] Modal/Vista de Autenticación (`AuthModal.jsx`): pestañas de Iniciar Sesión y Registro con validaciones visuales en tiempo real.
  - [x] Botón de *"Continuar con Google"* integrado con la librería oficial `@react-oauth/google` o Google Identity Services.
  - [x] Menú de Perfil de Usuario en `Navbar.jsx`: visualización de avatar/nombre y botón de "Cerrar Sesión" (Logout) con confirmación toast.

---

## 🌓 Fase 12: Modo Claro Armónico y Switch de Tema Dual (Tarjeta Trello 14 - Completada)
- [x] **12.1 Definición de la Paleta Light Armónica (Tailwind & CSS Tokens)**
  - [x] Definir tokens de color para evitar el blanco puro estridente (`#ffffff`) y mantener la identidad Deep Cobalt & Gold:
    - Fondo base suave: Tono hielo / slate refinado (`#f1f5f9` / `#e2e8f0` sutil).
    - Superficies de tarjetas y modales: Blanco perlado cálido (`#ffffff` / `#f8fafc`) con sombras suaves y bordes cobalto tenues (`#cbd5e1`).
    - Tipografía y títulos: Azul cobalto profundo y slate de alto contraste (`#0f172a`, `#1e293b`).
    - Acentos de marca: Dorado ámbar de alto contraste sobre fondo claro (`#b45309` / `#d97706`) y azul técnico (`#0284c7`).
  - [x] Configurar estrategia `darkMode: 'class'` en `client/tailwind.config.js` y variables CSS semánticas en `client/src/index.css`.
- [x] **12.2 Componente Switch de Tema Interactivo (`ThemeToggle.jsx`)**
  - [x] Diseñar botón toggle fluido con iconos animados de Sol (modo claro) y Luna (modo oscuro).
  - [x] Ubicar el switch en `Navbar.jsx` accesible tanto en desktop como en dispositivos móviles.
  - [x] Transiciones CSS suaves entre paletas (`transition-colors duration-200`).
- [x] **12.3 Contexto de Tema y Persistencia (`ThemeContext.jsx`)**
  - [x] Hook `useTheme()` para conmutación de estado entre `'dark'` y `'light'`.
  - [x] Detección automática de preferencia del sistema operativo (`window.matchMedia('(prefers-color-scheme: dark)')`).
  - [x] Persistencia inmediata en `localStorage` (`jobflow_theme`).
  - [x] Sincronización automática con la preferencia guardada en el perfil del usuario autenticado (`User.theme`) vía endpoint `PATCH /api/auth/theme`.
- [x] **12.4 Adaptación Visual Integral de Componentes**
  - [x] Tablero Kanban (`KanbanBoard.jsx`): columnas con fondos tintados suaves y tarjetas con contraste nítido.
  - [x] Tabla de Postulaciones (`ApplicationTable.jsx`): filas alternadas y encabezados contrastados.
  - [x] Métricas y KPIs (`KPICards.jsx`): tarjetas estadísticas con bordes sutiles y textos oscuros legibles.
  - [x] Modales y Drawer (`QuickAddModal`, `ApplicationDetailModal`, `ReportModal`, `RemindersDrawer`, `AuthModal`): adaptación completa sin perder la jerarquía visual.
  - [x] Barra de navegación móvil (`BottomNav.jsx`), banner de recordatorios (`UpcomingReminders.jsx`) y barra de búsqueda/filtros (`ViewToggle.jsx`).



