# 🧩 JobFlow — Extensión de Chrome (Manifest V3)

Extensión complementaria oficial de **JobFlow** para capturar, analizar con Inteligencia Artificial (Google Gemini) y registrar ofertas laborales en tu tablero Kanban con un solo clic desde cualquier portal de empleo.

---

## ⚡ Características Principales

* **Captura con 1 Clic:** Detecta automáticamente el contenido de la vacante abierta en portales como **LinkedIn Jobs**, **Indeed**, **Glassdoor** y sitios web de empleo generales.
* **Fallback de Selección Manual:** Si el portal tiene un diseño complejo, basta con seleccionar el texto de la oferta con el ratón y la extensión lo capturará con prioridad.
* **Procesamiento con Gemini 3.5 Flash Lite:** Extrae con precisión el nombre de la empresa, puesto, modalidad (Remoto/Híbrido/Presencial), nivel de prioridad, skills requeridas, afinidad (%) y un pitch de presentación personalizado.
* **Integración Directa con la API:** Guarda la postulación de inmediato en tu base de datos MongoDB Atlas vinculada a tu cuenta de usuario.
* **Estética Deep Cobalt:** Interfaz popup moderna y compacta que sigue fielmente la línea de diseño de JobFlow.

---

## 📁 Estructura del Módulo

```text
extension/
├── manifest.json       # Manifiesto V3 estricto con permisos mínimos
├── popup/
│   ├── popup.html      # Estructura de la interfaz de usuario
│   ├── popup.css       # Estilos temáticos Deep Cobalt & Crisp Gold
│   └── popup.js        # Lógica de conexión con content.js y API REST
├── scripts/
│   └── content.js      # Extractor de texto en capas para portales laborales
├── assets/             # Iconos oficiales (16x16, 48x48, 128x128)
└── README.md           # Guía de instalación y uso
```

---

## 🚀 Guía de Instalación en Google Chrome

Para instalar y probar la extensión localmente en tu navegador:

1. Abre Google Chrome y escribe en la barra de direcciones:
   ```text
   chrome://extensions/
   ```
2. En la esquina superior derecha, activa el interruptor **"Modo de desarrollador"** (*Developer mode*).
3. Haz clic en el botón **"Cargar descomprimida"** (*Load unpacked*) en la esquina superior izquierda.
4. En el explorador de archivos, selecciona la carpeta `extension` ubicada en la raíz de este proyecto:
   ```text
   c:\Users\Santiago\Proyectos integradores\Jobfow-app\extension
   ```
5. ¡Listo! Verás aparecer **Jobflow — Capturador Rápido de Vacantes** en tu barra de extensiones de Chrome. (Recomendado: haz clic en el icono de la pieza de rompecabezas en Chrome y "fija" la extensión para tenerla siempre a mano).

---

## ⚙️ Configuración Inicial (Token JWT y Entorno)

1. **Abre el Popup de la Extensión** haciendo clic en su icono en la barra superior del navegador.
2. Por defecto, la extensión viene configurada para conectarse a **Producción (Render API: `https://jobfow-api.onrender.com`)**.
3. Haz clic en el icono de **Engranaje (⚙️)** en la esquina superior derecha del popup si deseas revisar o cambiar los ajustes:
   * **Entorno del Backend:**
     * `Producción (Render API)`: Conexión con la API en la nube (`https://jobfow-api.onrender.com`). *(Recomendado para uso diario)*.
     * `Desarrollo Local (localhost:5000)`: Para desarrolladores con el servidor backend corriendo en su máquina.
     * `URL Personalizada...`: Para instancias privadas o túneles de desarrollo.
   * **Token de Autenticación (JWT):**
     * En la web de JobFlow, haz clic en tu avatar en el menú superior y pulsa **"Copiar Token Extensión"**.
     * Pega el token en el campo correspondiente del popup.
     * *(Tip: Si tienes abierta la pestaña de JobFlow Web, puedes pulsar "Detectar sesión" para que lo autocomplete automáticamente).*
4. Haz clic en **"Guardar Configuración"**. El indicador superior cambiará a **"Conectado"** en color verde.

---

## 🔄 Actualizar la Extensión (Si ya la tenías instalada)

Si has actualizado el código del proyecto o recibido una nueva versión:
1. Ve a `chrome://extensions/` en tu navegador.
2. Localiza la tarjeta de **Jobflow — Capturador Rápido de Vacantes**.
3. Haz clic en el icono circular de **Recargar (🔄)** en la esquina inferior derecha de la tarjeta.
4. La extensión se actualizará inmediatamente a la versión más reciente (`v1.0.1`).

---

## 🎯 Cómo Usar la Extensión

1. Navega a una oferta de trabajo (por ejemplo, en LinkedIn Jobs, Indeed, BambooHR o Glassdoor).
2. Haz clic en el icono de **JobFlow** en tu barra de extensiones.
3. Verifica que detecte la pestaña activa y haz clic en el botón dorado:
   ```text
   ⚡ Capturar y Procesar con IA
   ```
4. Observa el progreso en vivo:
   * Extracción de texto ➔ Análisis con Gemini ➔ Creación en MongoDB.
5. Al completarse, verás la tarjeta de resumen con la empresa, puesto, score de afinidad y tags de skills, y la postulación ya estará visible en tu **Tablero Kanban**.

---

## 🛠️ Diagnóstico y Solución de Problemas

| Síntoma | Causa Probable | Solución |
| :--- | :--- | :--- |
| **"Sin Token" o Error 401** | No se configuró el JWT o expiró la sesión | Abre la web de Jobflow, copia tu token desde el perfil y pégalo en los ajustes del popup. |
| **"No se detectó el texto"** | El portal usa iframes o clases CSS desconocidas | Selecciona con el mouse el texto de la vacante en la página y vuelve a pulsar el botón en el popup. |
| **"Failed to fetch" (Error en Análisis de IA)** | El backend seleccionado está inactivo o apuntando a localhost:5000 | Si estás en el navegador diario sin el backend local corriendo, haz clic en **"Cambiar a Producción"** en el mensaje de error o en Ajustes (⚙️) selecciona `Producción (Render API)`. Si el backend de Render estaba suspendido (plan gratuito), espera 20-30 segundos a que despierte y pulsa **Reintentar**. |
| **Cambios no se reflejan tras actualizar código** | Chrome mantiene en caché la versión previa de la extensión | Abre `chrome://extensions/` y haz clic en el botón de recarga (🔄) de la extensión JobFlow. |
