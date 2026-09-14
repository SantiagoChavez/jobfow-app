/**
 * Jobflow — Popup Controller (Manifest V3)
 * Conexión directa a JobFlow Cloud, extracción de ofertas con IA y guardado en la cuenta del usuario.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Configuración de endpoints oficiales
  const JOBFLOW_API_URL = 'https://jobfow-api.onrender.com';
  const JOBFLOW_WEB_URL = 'https://jobfow-app.vercel.app';

  // Elementos DOM
  const connectionPill = document.getElementById('connectionPill');
  const connectionText = document.getElementById('connectionText');
  const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
  const settingsSection = document.getElementById('settingsSection');
  const jwtTokenInput = document.getElementById('jwtTokenInput');
  const toggleTokenVisibilityBtn = document.getElementById('toggleTokenVisibilityBtn');
  const syncFromTabBtn = document.getElementById('syncFromTabBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
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

  let currentTab = null;
  let activeToken = '';

  // 1. Cargar token persistente
  const loadConfig = async () => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['jobflow_token'], (items) => {
        activeToken = items.jobflow_token || '';
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

          // Si es un portal laboral reconocido, destacar badge
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

          // Si estamos en Jobflow Web, autocompletar sesión si está abierta
          if (urlObj.hostname.includes('vercel.app') || urlObj.hostname.includes('jobflow')) {
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
            saveSettings();
          };
        }
      });
    } catch {
      // Ignorar errores si la pestaña no responde
    }
  };

  // 3. Guardar token de autenticación
  const saveSettings = () => {
    const tokenVal = jwtTokenInput.value.trim();

    chrome.storage.local.set(
      {
        jobflow_token: tokenVal,
      },
      () => {
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
      showError('Error de Navegación', 'No se pudo identificar la pestaña activa del navegador.');
      return;
    }

    // Verificar token
    if (!activeToken || activeToken.trim().length < 20) {
      settingsSection.classList.remove('hidden');
      showError(
        'Token de Autenticación Requerido',
        'Por favor abre Ajustes (⚙️) e ingresa tu token de Jobflow para asociar las postulaciones a tu cuenta.'
      );
      return;
    }

    // Resetear estados
    errorState.classList.add('hidden');
    successState.classList.add('hidden');
    captureBtn.disabled = true;
    loadingState.classList.remove('hidden');

    // Paso 1: Extrayendo contenido
    updateLoadingStep('Extrayendo texto de la oferta...', '25%');

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
        'Texto de la vacante no detectado',
        extractedData?.error || 'No se pudo extraer la descripción de la oferta en esta página. Por favor selecciona el texto de la vacante con el ratón e inténtalo de nuevo.'
      );
      return;
    }

    // Paso 2: Análisis con Gemini
    updateLoadingStep('Analizando con Inteligencia Artificial...', '60%');

    let aiResult = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const aiResponse = await fetch(`${JOBFLOW_API_URL}/api/ai/analyze-job`, {
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
          throw new Error('Tu sesión ha expirado o el token no es válido. Actualízalo en Ajustes (⚙️).');
        }
        throw new Error(aiJson.message || aiJson.error || `Error del servidor (${aiResponse.status}) al analizar la vacante con IA.`);
      }

      aiResult = aiJson.data || aiJson;
    } catch (err) {
      loadingState.classList.add('hidden');
      captureBtn.disabled = false;
      handleFetchError('Error al analizar con IA', err);
      return;
    }

    // Paso 3: Guardar en la base de datos de JobFlow
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

      const saveResponse = await fetch(`${JOBFLOW_API_URL}/api/applications`, {
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
          throw new Error('Tu sesión ha expirado o el token no es válido. Actualízalo en Ajustes (⚙️).');
        }
        throw new Error(saveJson.message || saveJson.error || `Error (${saveResponse.status}) al guardar la postulación en tu cuenta.`);
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
      handleFetchError('Error al guardar en la app', err);
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
    let message = err.message || 'Ocurrió un error inesperado al comunicar con el servicio de Jobflow.';

    if (err.name === 'AbortError') {
      message = 'Tiempo de espera agotado al comunicar con los servidores de JobFlow. Por favor verifica tu conexión y pulsa Reintentar.';
    } else if (err.message === 'Failed to fetch' || err instanceof TypeError) {
      message = 'No se pudo establecer conexión con los servidores de JobFlow. Por favor verifica tu conexión a internet o reintenta en unos instantes.';
    }

    showError(title, message);
  };

  const showError = (title, message) => {
    errorTitle.textContent = title;
    errorMessage.textContent = message;
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
    chrome.tabs.create({ url: JOBFLOW_WEB_URL });
  });

  // Inicialización
  await loadConfig();
  await initActiveTab();
});
