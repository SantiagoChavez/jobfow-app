/**
 * Jobflow — Popup Controller (Manifest V3)
 * Coordina la extracción con content.js, análisis con Gemini y guardado en la API.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elementos DOM
  const connectionPill = document.getElementById('connectionPill');
  const connectionText = document.getElementById('connectionText');
  const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
  const settingsSection = document.getElementById('settingsSection');
  const environmentSelect = document.getElementById('environmentSelect');
  const customUrlGroup = document.getElementById('customUrlGroup');
  const customApiUrl = document.getElementById('customApiUrl');
  const jwtTokenInput = document.getElementById('jwtTokenInput');
  const toggleTokenVisibilityBtn = document.getElementById('toggleTokenVisibilityBtn');
  const syncFromTabBtn = document.getElementById('syncFromTabBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const quickFixEnvBtn = document.getElementById('quickFixEnvBtn');
  const errorSettingsBtn = document.getElementById('errorSettingsBtn');

  const tabTitle = document.getElementById('tabTitle');
  const tabUrl = document.getElementById('tabUrl');
  const tabDomainBadge = document.getElementById('tabDomainBadge');
  const sourceBadge = document.getElementById('sourceBadge');
  const noTokenAlert = document.getElementById('noTokenAlert');
  const openSettingsLink = document.getElementById('openSettingsLink');

  const captureBtn = document.getElementById('captureBtn');
  const loadingState = document.getElementById('loadingState');
  const loadingStatusText = document.getElementById('loadingStatusText');
  const progressFill = document.getElementById('progressFill');

  const successState = document.getElementById('successState');
  const resultCompany = document.getElementById('resultCompany');
  const resultRole = document.getElementById('resultRole');
  const resultWorkMode = document.getElementById('resultWorkMode');
  const resultPriority = document.getElementById('resultPriority');
  const resultScore = document.getElementById('resultScore');
  const skillsContainer = document.getElementById('skillsContainer');
  const skillsTags = document.getElementById('skillsTags');
  const openJobflowBtn = document.getElementById('openJobflowBtn');
  const resetCaptureBtn = document.getElementById('resetCaptureBtn');

  const errorState = document.getElementById('errorState');
  const errorTitle = document.getElementById('errorTitle');
  const errorMessage = document.getElementById('errorMessage');
  const retryBtn = document.getElementById('retryBtn');

  const PRODUCTION_API_URL = 'https://jobfow-api.onrender.com';
  const LOCAL_API_URL = 'http://localhost:5000';

  let currentTab = null;
  let activeApiUrl = PRODUCTION_API_URL;
  let activeToken = '';

  // 1. Cargar configuración persistente
  const loadConfig = async () => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['jobflow_api_url', 'jobflow_token', 'jobflow_env'], (items) => {
        let storedUrl = items.jobflow_api_url;
        let storedEnv = items.jobflow_env;

        // Migración proactiva: corregir URL histórica con typo si estaba guardada
        if (storedUrl && storedUrl.includes('jobflow-api.onrender.com')) {
          storedUrl = PRODUCTION_API_URL;
          chrome.storage.local.set({ jobflow_api_url: PRODUCTION_API_URL });
        }
        if (storedEnv && storedEnv.includes('jobflow-api.onrender.com')) {
          storedEnv = PRODUCTION_API_URL;
          chrome.storage.local.set({ jobflow_env: PRODUCTION_API_URL });
        }

        // Por defecto conectar a la API en la nube (Render)
        activeApiUrl = storedUrl || PRODUCTION_API_URL;
        activeToken = items.jobflow_token || '';

        // Sincronizar selector de entorno en UI
        if (storedEnv) {
          environmentSelect.value = (storedEnv === 'https://jobflow-api.onrender.com' || storedEnv === PRODUCTION_API_URL)
            ? PRODUCTION_API_URL
            : storedEnv;
        } else if (activeApiUrl === PRODUCTION_API_URL || activeApiUrl.includes('onrender.com')) {
          environmentSelect.value = PRODUCTION_API_URL;
        } else if (activeApiUrl.includes('localhost')) {
          environmentSelect.value = LOCAL_API_URL;
        } else {
          environmentSelect.value = 'custom';
        }

        if (environmentSelect.value === 'custom') {
          customUrlGroup.classList.remove('hidden');
          customApiUrl.value = activeApiUrl;
        } else {
          customUrlGroup.classList.add('hidden');
        }

        jwtTokenInput.value = activeToken;
        updateConnectionUI();
        resolve();
      });
    });
  };

  // Actualizar UI según presencia del token
  const updateConnectionUI = () => {
    if (activeToken && activeToken.trim().length > 20) {
      connectionPill.className = 'connection-pill status-connected';
      connectionText.textContent = 'Conectado';
      noTokenAlert.classList.add('hidden');
    } else {
      connectionPill.className = 'connection-pill status-disconnected';
      connectionText.textContent = 'Sin Token';
      noTokenAlert.classList.remove('hidden');
    }
  };

  // 2. Obtener información de la pestaña activa
  const initActiveTab = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs[0]) {
        currentTab = tabs[0];
        tabTitle.textContent = currentTab.title || 'Pestaña sin título';
        tabUrl.textContent = currentTab.url || '';

        try {
          const urlObj = new URL(currentTab.url);
          tabDomainBadge.textContent = urlObj.hostname.replace('www.', '');

          // Si es LinkedIn / Indeed / BambooHR / Glassdoor, destacar badge
          if (urlObj.hostname.includes('linkedin')) {
            sourceBadge.textContent = 'LinkedIn Jobs';
            sourceBadge.classList.remove('hidden');
          } else if (urlObj.hostname.includes('indeed')) {
            sourceBadge.textContent = 'Indeed';
            sourceBadge.classList.remove('hidden');
          } else if (urlObj.hostname.includes('bamboohr')) {
            sourceBadge.textContent = 'BambooHR';
            sourceBadge.classList.remove('hidden');
          } else if (urlObj.hostname.includes('glassdoor')) {
            sourceBadge.textContent = 'Glassdoor';
            sourceBadge.classList.remove('hidden');
          }

          // Si estamos en Jobflow Web en producción (Vercel), asegurar entorno producción
          if (urlObj.hostname.includes('vercel.app')) {
            if (activeApiUrl === LOCAL_API_URL) {
              activeApiUrl = PRODUCTION_API_URL;
              environmentSelect.value = PRODUCTION_API_URL;
              chrome.storage.local.set({ jobflow_api_url: PRODUCTION_API_URL, jobflow_env: PRODUCTION_API_URL });
            }
            checkJobflowWebSession(currentTab.id);
          } else if (urlObj.hostname.includes('localhost')) {
            checkJobflowWebSession(currentTab.id);
          }
        } catch {
          tabDomainBadge.textContent = 'Navegador';
        }
      }
    } catch (err) {
      console.error('Error al inspeccionar pestaña activa:', err);
    }
  };

  // Detectar sesión activa si la pestaña abierta es JobFlow Web
  const checkJobflowWebSession = (tabId) => {
    try {
      chrome.tabs.sendMessage(tabId, { action: 'CHECK_PORTAL_SESSION' }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response && response.token) {
          syncFromTabBtn.textContent = 'Sesión detectada (Aplicar)';
          syncFromTabBtn.onclick = () => {
            jwtTokenInput.value = response.token;
            if (currentTab?.url?.includes('vercel.app')) {
              environmentSelect.value = PRODUCTION_API_URL;
            }
            saveSettings();
          };
        }
      });
    } catch {
      // Ignorar errores si la pestaña no responde
    }
  };

  // 3. Guardar ajustes de conexión
  const saveSettings = () => {
    let selectedUrl = environmentSelect.value;
    const envVal = selectedUrl;

    if (selectedUrl === 'custom') {
      selectedUrl = customApiUrl.value.trim() || PRODUCTION_API_URL;
    }

    const tokenVal = jwtTokenInput.value.trim();

    chrome.storage.local.set(
      {
        jobflow_api_url: selectedUrl,
        jobflow_token: tokenVal,
        jobflow_env: envVal,
      },
      () => {
        activeApiUrl = selectedUrl;
        activeToken = tokenVal;
        updateConnectionUI();
        settingsSection.classList.add('hidden');
        errorState.classList.add('hidden');
      }
    );
  };

  // 4. Inyección segura de content script si la pestaña no responde
  const ensureContentScriptInjected = async (tabId) => {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['scripts/content.js'],
      });
    } catch (e) {
      console.warn('Inyección de fallback:', e);
    }
  };

  // 5. Flujo principal: Capturar, Procesar con Gemini y Guardar en JobFlow
  const handleCapture = async () => {
    if (!currentTab || !currentTab.id) {
      showError('Error de Navegación', 'No se pudo identificar la pestaña activa.');
      return;
    }

    // Verificar token
    if (!activeToken || activeToken.trim().length < 20) {
      settingsSection.classList.remove('hidden');
      showError('Token Requerido', 'Por favor ingresa tu token JWT en los ajustes para vincular la vacante a tu cuenta.');
      return;
    }

    // Resetear estados
    errorState.classList.add('hidden');
    successState.classList.add('hidden');
    captureBtn.disabled = true;
    loadingState.classList.remove('hidden');

    // Paso 1: Extrayendo contenido
    updateLoadingStep('Extrayendo texto de la vacante...', '25%');

    let extractedData = null;
    try {
      extractedData = await new Promise((resolve) => {
        chrome.tabs.sendMessage(currentTab.id, { action: 'EXTRACT_JOB' }, (response) => {
          if (chrome.runtime.lastError) {
            resolve(null);
          } else {
            resolve(response);
          }
        });
      });

      // Si falló la comunicación, intentar inyectar y reintentar
      if (!extractedData) {
        await ensureContentScriptInjected(currentTab.id);
        extractedData = await new Promise((resolve) => {
          chrome.tabs.sendMessage(currentTab.id, { action: 'EXTRACT_JOB' }, (response) => {
            if (chrome.runtime.lastError) {
              resolve(null);
            } else {
              resolve(response);
            }
          });
        });
      }
    } catch (err) {
      console.error('Error al extraer:', err);
    }

    if (!extractedData || !extractedData.success || !extractedData.text || extractedData.text.length < 20) {
      loadingState.classList.add('hidden');
      captureBtn.disabled = false;
      showError(
        'No se detectó el texto',
        extractedData?.error || 'No se pudo extraer la descripción de la vacante. Por favor selecciona el texto de la oferta con el ratón en la página e inténtalo de nuevo.'
      );
      return;
    }

    // Paso 2: Análisis con Gemini 3.5 Flash Lite
    updateLoadingStep('Analizando con IA (conectando con servidor)...', '60%');

    let aiResult = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const aiResponse = await fetch(`${activeApiUrl}/api/ai/analyze-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          text: extractedData.text,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const aiJson = await aiResponse.json().catch(() => ({}));

      if (!aiResponse.ok || !aiJson.success) {
        if (aiResponse.status === 401) {
          throw new Error('Tu token JWT ha expirado o no es válido. Actualízalo en Ajustes (⚙️).');
        }
        throw new Error(aiJson.message || aiJson.error || `Error ${aiResponse.status} al procesar la oferta con IA.`);
      }

      aiResult = aiJson.data || aiJson;
    } catch (err) {
      loadingState.classList.add('hidden');
      captureBtn.disabled = false;
      handleFetchError('Error en Análisis de IA', err);
      return;
    }

    // Paso 3: Guardar en MongoDB Atlas vía POST /api/applications
    updateLoadingStep('Guardando en tu tablero Kanban...', '90%');

    try {
      const companyName = (aiResult.companyName && aiResult.companyName.trim()) || 'Empresa Detectada';
      const roleName = (aiResult.role && aiResult.role.trim()) || extractedData.title || 'Puesto Detectado';

      const validWorkModes = ['REMOTE', 'HYBRID', 'ON_SITE'];
      const workMode = validWorkModes.includes(aiResult.workMode) ? aiResult.workMode : 'REMOTE';

      const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
      const priority = validPriorities.includes(aiResult.priority) ? aiResult.priority : 'MEDIUM';

      const applicationPayload = {
        company: {
          name: companyName,
          website: aiResult.companyWebsite || '',
        },
        role: roleName,
        status: 'ENVIADA',
        priority,
        workMode,
        salary: aiResult.salary ? String(aiResult.salary) : undefined,
        companySummary: aiResult.companySummary || '',
        matchScore: typeof aiResult.matchScore === 'number' ? aiResult.matchScore : null,
        extractedSkills: Array.isArray(aiResult.extractedSkills) ? aiResult.extractedSkills : [],
        requirementsRaw: extractedData.text.slice(0, 5000),
        jobUrl: extractedData.url || currentTab.url,
        suggestedPitch: aiResult.suggestedPitch || '',
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const saveResponse = await fetch(`${activeApiUrl}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify(applicationPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const saveJson = await saveResponse.json().catch(() => ({}));

      if (!saveResponse.ok) {
        if (saveResponse.status === 401) {
          throw new Error('Tu token JWT ha expirado o no es válido. Actualízalo en ajustes.');
        }
        throw new Error(saveJson.message || saveJson.error || `Error ${saveResponse.status} al crear la postulación.`);
      }

      // Éxito total
      updateLoadingStep('¡Completado!', '100%');
      setTimeout(() => {
        loadingState.classList.add('hidden');
        captureBtn.disabled = false;
        showSuccess(aiResult, companyName, roleName, workMode, priority);
      }, 400);
    } catch (err) {
      loadingState.classList.add('hidden');
      captureBtn.disabled = false;
      handleFetchError('Error al Guardar', err);
    }
  };

  const updateLoadingStep = (text, percentage) => {
    loadingStatusText.textContent = text;
    progressFill.style.width = percentage;
  };

  const showSuccess = (aiData, company, role, workMode, priority) => {
    resultCompany.textContent = company;
    resultRole.textContent = role;

    const workModeLabels = { REMOTE: 'Remoto', HYBRID: 'Híbrido', ON_SITE: 'Presencial' };
    const priorityLabels = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta' };

    resultWorkMode.textContent = workModeLabels[workMode] || workMode;
    resultPriority.textContent = priorityLabels[priority] || priority;

    const score = typeof aiData.matchScore === 'number' ? aiData.matchScore : 0;
    resultScore.textContent = `${score}% Match`;

    // Renderizar tags de skills
    skillsTags.innerHTML = '';
    const skills = aiData.extractedSkills || aiData.keySkills || [];
    if (skills.length > 0) {
      skillsContainer.classList.remove('hidden');
      skills.slice(0, 6).forEach((skill) => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.textContent = skill;
        skillsTags.appendChild(tag);
      });
    } else {
      skillsContainer.classList.add('hidden');
    }

    successState.classList.remove('hidden');
  };

  const handleFetchError = (title, err) => {
    let message = err.message || 'No se pudo comunicar con el servicio de Jobflow.';
    let isNetworkError = false;

    if (err.name === 'AbortError') {
      message = `Tiempo de espera agotado al contactar el servidor (${activeApiUrl}). Si el servicio en Render estaba inactivo (arranque en frío), puede tardar hasta 40 segundos en activarse. Por favor reintenta en instantes.`;
      isNetworkError = true;
    } else if (err.message === 'Failed to fetch' || err instanceof TypeError) {
      isNetworkError = true;
      if (activeApiUrl.includes('localhost')) {
        message = `No se pudo conectar a ${activeApiUrl}. Tu servidor local no parece estar iniciado en el puerto 5000. Si utilizas JobFlow en la nube, pulsa "Cambiar a Producción".`;
      } else {
        message = `No se pudo establecer conexión con el backend en ${activeApiUrl}. Si el servidor gratuito de Render estaba suspendido, puede requerir unos segundos para despertar. Vuelve a pulsar Reintentar.`;
      }
    }

    showError(title, message, isNetworkError);
  };

  const showError = (title, message, showQuickFix = false) => {
    errorTitle.textContent = title;
    errorMessage.textContent = message;

    if (quickFixEnvBtn) {
      if (showQuickFix && activeApiUrl !== PRODUCTION_API_URL) {
        quickFixEnvBtn.classList.remove('hidden');
        quickFixEnvBtn.onclick = () => {
          activeApiUrl = PRODUCTION_API_URL;
          environmentSelect.value = PRODUCTION_API_URL;
          chrome.storage.local.set(
            {
              jobflow_api_url: PRODUCTION_API_URL,
              jobflow_env: PRODUCTION_API_URL,
            },
            () => {
              errorState.classList.add('hidden');
              handleCapture(); // Reintentar de inmediato con la URL correcta
            }
          );
        };
      } else {
        quickFixEnvBtn.classList.add('hidden');
      }
    }

    errorState.classList.remove('hidden');
  };

  // Listeners
  toggleSettingsBtn.addEventListener('click', () => {
    settingsSection.classList.toggle('hidden');
  });

  closeSettingsBtn.addEventListener('click', () => {
    settingsSection.classList.add('hidden');
  });

  if (errorSettingsBtn) {
    errorSettingsBtn.addEventListener('click', () => {
      settingsSection.classList.remove('hidden');
      errorState.classList.add('hidden');
    });
  }

  environmentSelect.addEventListener('change', () => {
    if (environmentSelect.value === 'custom') {
      customUrlGroup.classList.remove('hidden');
    } else {
      customUrlGroup.classList.add('hidden');
    }
  });

  toggleTokenVisibilityBtn.addEventListener('click', () => {
    if (jwtTokenInput.type === 'password') {
      jwtTokenInput.type = 'text';
      toggleTokenVisibilityBtn.textContent = '🔒';
    } else {
      jwtTokenInput.type = 'password';
      toggleTokenVisibilityBtn.textContent = '👁️';
    }
  });

  openSettingsLink.addEventListener('click', () => {
    settingsSection.classList.remove('hidden');
  });

  saveSettingsBtn.addEventListener('click', saveSettings);
  captureBtn.addEventListener('click', handleCapture);
  retryBtn.addEventListener('click', handleCapture);

  resetCaptureBtn.addEventListener('click', () => {
    successState.classList.add('hidden');
    errorState.classList.add('hidden');
  });

  openJobflowBtn.addEventListener('click', () => {
    const webUrl = activeApiUrl.includes('localhost')
      ? 'http://localhost:5173'
      : 'https://jobfow-app.vercel.app';
    chrome.tabs.create({ url: webUrl });
  });

  // Inicialización
  await loadConfig();
  await initActiveTab();
});
