# 📚 Directorio de Documentación - Jobflow

Bienvenido a la carpeta de documentación centralizada de **Jobflow**. En este directorio se concentran todas las guías de usuario, manuales de arquitectura, roadmaps de desarrollo y especificaciones de diseño del proyecto.

---

## 📑 Índice de Documentos

| Documento | Formato | Audiencia / Propósito | Enlace |
| :--- | :--- | :--- | :--- |
| **Guía de Usuario Rápida** | Markdown (`.md`) | Postulantes, evaluadores y usuarios no técnicos que buscan una guía paso a paso intuitiva. | [GUIA_USUARIO.md](./GUIA_USUARIO.md) |
| **Guía Rápida Vectorial** | PDF Vectorial | Versión impresa o descargable de la guía de usuario con paleta Deep Cobalt & Gold. | [Guia-Rapida-Jobflow.pdf](./Guia-Rapida-Jobflow.pdf) |
| **Manual de Usuario Oficial** | PDF Vectorial (4 págs) | Manual integral con especificaciones de arquitectura, flujos de datos y contratos. | [Manual-de-Usuario-Jobflow.pdf](./Manual-de-Usuario-Jobflow.pdf) |
| **Backlog & Roadmap de Tareas** | Markdown (`.md`) | Desglose exhaustivo de fases técnicas, tarjetas de Trello (1 a 14) y criterios de aceptación. | [TASKS.md](./TASKS.md) |
| **Planificación del Proyecto** | PDF Documento | Análisis de requerimientos, alcance y planificación original del proyecto integrador. | [Planificacion de jobflow.pdf](./Planificacion%20de%20jobflow.pdf) |
| **Modelo de Referencia Visual** | PDF Diseño | Wireframes, flujos de pantallas y diseño de referencia visual de la aplicación. | [modelo para jobflow.pdf](./modelo%20para%20jobflow.pdf) |
| **Reporte Demo de Métricas** | PDF Ejemplo | Muestra del reporte semanal exportable generado por el servicio de reportes de Jobflow. | [jobflow-reporte-demo.pdf](./jobflow-reporte-demo.pdf) |

---

## 🛠️ Generación Automatizada de Documentación PDF

Los manuales en formato PDF se generan programáticamente con Node.js y la biblioteca `pdfkit-table`, garantizando tipografía nítida y consistencia de diseño vectorial:

- **Generar Guía Rápida:**
  ```bash
  node server/scripts/generateFriendlyGuidePdf.js
  ```
  *Salida:* `docs/Guia-Rapida-Jobflow.pdf`

- **Generar Manual de Usuario Oficial:**
  ```bash
  node server/scripts/generateManualPdf.js
  ```
  *Salida:* `docs/Manual-de-Usuario-Jobflow.pdf`

---

## 🧭 Documentos en la Raíz del Repositorio

Por convención de código abierto y directrices del proyecto, se mantienen en la raíz del repositorio:
- [`README.md`](../README.md): Ficha técnica principal, enlaces de despliegue en producción, arquitectura y puesta en marcha rápida.
- [`CHANGELOG.md`](../CHANGELOG.md): Registro histórico y cronológico de versiones y lanzamientos (Keep a Changelog).
