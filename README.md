# 🎯 JobHunter

> **Plataforma ágil de gestión y analítica de postulaciones laborales para desarrolladores.**

JobHunter nace para resolver un problema crítico en la búsqueda activa de empleo: el registro manual desordenado y la falta de métricas accionables para seguimiento personal y coaching profesional (evidencia de postulaciones, tiempos de respuesta y tasa de conversión).

---

## 📋 Tabla de Contenidos

- [Problema & Visión del Producto](#-problema--visión-del-producto)
- [Características del MVP](#-características-del-mvp)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Modelo de Datos](#-modelo-de-datos)
- [Contrato de API (Endpoints)](#-contrato-de-api-endpoints)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
- [Scripts Disponibles](#-scripts-disponibles)
- [Estructura del Repositorio](#-estructura-del-repositorio)
- [Roadmap de Tareas](#-roadmap-de-tareas)

---

## 💡 Problema & Visión del Producto

* **Dolor a resolver:** En procesos de acompañamiento y coaching laboral, suele exigirse un objetivo mínimo (por ejemplo, 2 postulaciones diarias registradas con evidencia de fechas, enlaces y respuestas). Registrarlo en hojas de cálculo o notas sueltas consume tiempo y no entrega métricas de valor.
* **Usuario objetivo:** Desarrolladores en búsqueda activa que necesitan cargar aplicaciones de forma inmediata (mobile-first / web rápida).
* **Propuesta de valor:** Carga veloz de ofertas, cálculo automático de tiempos de respuesta del mercado y generación de reportes semanales en PDF listos para enviar al coach o mentor.

---

## 🚀 Características del MVP

- [x] **Arquitectura base desacoplada (`/server` y `/client`)** con ES Modules y pnpm.
- [ ] **Formulario rápido de carga:** Registro de Empresa, Rol, URL de la oferta y texto de Requisitos.
- [ ] **Extracción básica de skills/keywords:** Detección de tecnologías clave a partir de la descripción.
- [ ] **Historial de interacciones:** Registro cronológico de eventos por postulación (*"Postulación enviada"*, *"Mensaje a recruiter"*, *"Respuesta recibida"*).
- [ ] **Lógica analítica de tiempos de respuesta:** Cálculo automático en días entre la postulación y la primera respuesta del reclutador.
- [ ] **Dashboard analítico básico:** Métricas de total enviadas, en proceso, tasa de respuesta y tiempos medios.
- [ ] **Generación de Reporte PDF semanal:** Exportación descargable con métricas resumidas y listado de actividad para presentar al coach.

---

## 🏗️ Arquitectura del Proyecto

El repositorio adopta una arquitectura desacoplada:

```text
jobhunter-app/
├── client/              # Frontend (React / Vite - Previsto para siguiente etapa)
├── server/              # Backend REST API (Node.js, Express, ES Modules)
├── README.md            # Documentación principal
├── CHANGELOG.md         # Registro histórico de cambios
└── TASKS.md             # Backlog y seguimiento de tareas
```

### Stack Tecnológico
* **Backend:** Node.js (>= v20), Express 5, ES Modules (`"type": "module"`).
* **Gestor de paquetes:** `pnpm` (v11+).
* **Base de datos:** MongoDB / Mongoose (Previsto para persistencia de postulaciones e interacciones).
* **Utilidades:** `cors`, `dotenv`, `nodemon` (desarrollo).

---

## 🗄️ Modelo de Datos

```text
[ EMPRESA ]
 └── nombre (String, requerido)
 └── web (String, opcional)
 └── rubro (String, opcional)

[ POSTULACIÓN ]
 └── empresaId / datosEmpresa
 └── rol (String, requerido)
 └── url (String, opcional)
 └── fechaAplicacion (Date, default: Date.now)
 └── estado (ENVIADA | CONTACTO | ENTREVISTA | RECHAZADA)
 └── requisitosTexto (String)
 └── skillsDetectadas ([String])
 └── tiempoRespuestaDias (Number, calculado al recibir primer contacto)
 └── interacciones: [
      ├── tipo (POSTULACION_ENVIADA | MENSAJE_RECRUITER | RESPUESTA_RECIBIDA | ENTREVISTA | RECHAZO)
      ├── fecha (Date)
      └── notas (String)
     ]
```

---

## 📡 Contrato de API (Endpoints)

| Método | Ruta | Descripción | Estado |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Chequeo de salud del servicio | ✅ Implementado |
| `POST` | `/api/applications` | Registrar una nueva postulación | ⏳ Planificado |
| `GET` | `/api/applications` | Listar y filtrar postulaciones activas | ⏳ Planificado |
| `POST` | `/api/applications/:id/interactions` | Añadir evento/interacción y recalcular métricas | ⏳ Planificado |
| `GET` | `/api/analytics/summary` | Resumen de métricas para dashboard | ⏳ Planificado |
| `GET` | `/api/reports/pdf?from=...&to=...` | Generar y descargar reporte PDF semanal | ⏳ Planificado |

---

## ⚙️ Requisitos Previos

* **Node.js:** Versión 20 o superior instalada.
* **pnpm:** Versión 10 u 11 (`npm install -g pnpm`).

---

## 🛠️ Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/SantiagoChavez/jobhunter-app.git
cd jobhunter-app
```

### 2. Configurar el Backend
```bash
cd server
pnpm install
```

### 3. Variables de Entorno
Copia el archivo `.env.example` a `.env` y define el puerto deseado:
```bash
cp .env.example .env
```
Contenido por defecto de `server/.env`:
```env
PORT=5000
```

### 4. Iniciar en Modo Desarrollo
```bash
pnpm run dev
```
El servidor quedará escuchando en `http://localhost:5000`.

---

## 📜 Scripts Disponibles

En el directorio `/server`:

* `pnpm run dev`: Inicia el servidor con recarga automática usando `nodemon`.
* `pnpm start`: Inicia el servidor en modo producción con Node nativo.

---

## 🗺️ Roadmap de Tareas

Para consultar el backlog detallado, criterios de aceptación y orden de ejecución paso a paso, consulta el archivo [TASKS.md](TASKS.md).
