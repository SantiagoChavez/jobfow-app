<p align="center">
  <img src="./client/src/assets/Jobflow-banner.png" alt="Jobflow - Radar & Career Tracker" width="540" />
</p>

# 🎯 Jobflow

> **Plataforma ágil de gestión y analítica de postulaciones laborales para desarrolladores.**

Jobflow nace para resolver un problema crítico en la búsqueda activa de empleo: el registro manual desordenado y la falta de métricas accionables para seguimiento personal y coaching profesional (evidencia de postulaciones, tiempos de respuesta y tasa de conversión).

---

## 📋 Tabla de Contenidos

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
- [ ] **Formulario rápido de carga:** Registro de Empresa, Rol, URL de la oferta y texto de Requisitos.
- [ ] **Extracción básica de skills/keywords:** Detección de tecnologías clave a partir de la descripción.
- [ ] **Historial de interacciones:** Registro cronológico de eventos por postulación (*"Postulación enviada"*, *"Mensaje a recruiter"*, *"Respuesta recibida"*).
- [ ] **Lógica analítica de tiempos de respuesta:** Cálculo automático en días entre la postulación y la primera respuesta del reclutador.
- [ ] **Dashboard analítico básico:** Métricas de total enviadas, en proceso, tasa de respuesta y tiempos medios.
- [ ] **Generación de Reporte PDF semanal:** Exportación descargable con métricas resumidas y listado de actividad para presentar al coach.

---

## 🌿 Estrategia de Ramas (Git Workflow)

El proyecto sigue un flujo de ramificación ordenado para garantizar estabilidad:

* **`main`**: Rama de producción final y versiones estables publicadas.
* **`pre-staging`**: Rama de integración y despliegue previo a producción para pruebas finales de QA.
* **`dev`**: Rama activa de desarrollo diario donde se integran los avances, características y fixes.

---

## 🎨 Diseño y Modelo de Referencia

El diseño de la interfaz se basa en el documento de especificación visual `modelo para jobflow.pdf`, adoptando el sistema estético **"Deep Cobalt & Crisp Gold"**:

* **Paleta cromática base:**
  * Fondo principal: `#0B1329` (`bg-navy-base`)
  * Superficies y tarjetas: `#172554` (`bg-navy-surface`)
  * Resaltados: `#1E3A8A` (`bg-navy-highlight`)
  * Acentos dorados primarios: `#FACC15` (`text-gold-primary`)
  * Variantes doradas: `#FEF08A` (light) y `#CA8A04` (dark)
  * Acentos técnicos: `#38BDF8` (`sky-tech`) y `#93C5FD` (`ice-blue`)
* **Vistas proyectadas en el modelo:**
  * **Dashboard:** Tarjetas resumen (Postulaciones, Entrevistas, Ofertas, Tasa de respuesta), gráfico de actividad y postulaciones por estado.
  * **Tablero Tracker (Kanban):** Columnas de estado (*Guardadas*, *Aplicadas*, *Entrevista*, *Oferta*, *Rechazada*).
  * **Listado de Postulaciones:** Tabla detallada con filtros, fechas, estados y acciones rápidas.
  * **Detalle de Postulación:** Línea de tiempo de eventos, notas, datos del recruiter y documentos.

---

## 🏗️ Arquitectura del Proyecto

```text
Jobflow-app/
├── client/                     # Frontend SPA (React 19, Vite, Tailwind CSS)
│   ├── src/
│   │   ├── App.jsx             # Componente raíz
│   │   ├── index.css           # Directivas Tailwind y estilos globales
│   │   └── main.jsx            # Punto de entrada de React
│   ├── tailwind.config.js      # Configuración y tokens de color
│   └── package.json
├── server/                     # Backend REST API (Node.js, Express, ES Modules)
│   ├── src/
│   │   ├── config/             # Configuración de BD y variables
│   │   ├── controllers/        # Controladores de negocio
│   │   ├── models/             # Esquemas de persistencia
│   │   ├── routes/             # Enrutadores Express
│   │   ├── utils/              # Utilidades auxiliares (skillExtractor, etc.)
│   │   └── server.js           # Servidor Express
│   └── package.json
├── README.md                   # Documentación principal
├── CHANGELOG.md                # Registro histórico de versiones
└── TASKS.md                    # Backlog y seguimiento de tareas
```

### Stack Tecnológico
* **Frontend:** React 19, Vite 8, Tailwind CSS v3, PostCSS, Autoprefixer.
* **Backend:** Node.js (>= v20), Express 5, ES Modules (`"type": "module"`).
* **Gestor de paquetes:** `pnpm` (v11+).
* **Base de datos:** MongoDB Atlas / Mongoose 9 (Conexión y modelo `Application` implementados).
* **Utilidades:** `cors`, `dotenv`, `nodemon` (desarrollo backend).

---

## 🗄️ Modelo de Datos

```text
[ APPLICATION ]
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
| `POST` | `/api/applications` | Registrar una nueva postulación con validaciones | ✅ Implementado |
| `GET` | `/api/applications` | Listar postulaciones con filtros por estado y prioridad | ✅ Implementado |
| `GET` | `/api/applications/:id` | Obtener detalle completo de una postulación por ID | ✅ Implementado |
| `PATCH` | `/api/applications/:id/status` | Actualizar estado de postulación y recalcular métricas | ✅ Implementado |
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
* `pnpm test`: Ejecuta la suite de pruebas unitarias y de integración con Vitest.
* `pnpm run test:watch`: Ejecuta las pruebas en modo interactivo/watch.

### En `/client`:
* `pnpm run dev`: Inicia el servidor de desarrollo de Vite con HMR.
* `pnpm run build`: Compila la aplicación frontend optimizada para producción.
* `pnpm run preview`: Previsualiza la compilación de producción localmente.

---

## 🗺️ Roadmap de Tareas

Para consultar el backlog detallado, criterios de aceptación y orden de ejecución paso a paso, consulta el archivo [TASKS.md](TASKS.md).
