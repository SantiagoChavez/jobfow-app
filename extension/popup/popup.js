/**
 * Jobflow — Popup Controller (Manifest V3)
 * Captura inteligente de vacantes y perfiles de reclutadores con IA (Google Gemini).
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Configuración de endpoints oficiales (personalizables en ajustes)
  let JOBFLOW_API_URL = 'https://jobfow-api.onrender.com';
  const JOBFLOW_WEB_URL = 'https://jobfow-app.vercel.app';

  // Elementos DOM
  const connectionPill = document.getElementById('connectionPill');
  const connectionText = document.getElementById('connectionText');
  const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
  const settingsSection = document.getElementById('settingsSection');
  const jwtTokenInput = document.getElementById('jwtTokenInput');
  const apiUrlInput = document.getElementById('apiUrlInput');
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

  // Selector de Modo
  const modeVacancyBtn = document.getElementById('modeVacancyBtn');
  const modeRecruiterBtn = document.getElementById('modeRecruiterBtn');

  // Sección Reclutador
  const recruiterDetectedCard = document.getElementById('recruiterDetectedCard');
  const recruiterNameInput = document.getElementById('recruiterNameInput');
  const recruiterRoleInput = document.getElementById('recruiterRoleInput');
  const recruiterCompanyInput = document.getElementById('recruiterCompanyInput');
  const recruiterChannelSelect = document.getElementById('recruiterChannelSelect');
  const recruiterToneSelect = document.getElementById('recruiterToneSelect');

  const captureBtn = document.getElementById('captureBtn');
  const captureBtnText = document.getElementById('captureBtnText');
  const loadingState = document.getElementById('loadingState');
  const loadingStatusText = document.getElementById('loadingStatusText');
  const progressFill = document.getElementById('progressFill');

  // Sección Éxito
  const successState = document.getElementById('successState');
  const successTitle = document.getElementById('successTitle');
  const successSubtitle = document.getElementById('successSubtitle');

  const vacancyResultBody = document.getElementById('vacancyResultBody');
  const resultCompany = document.getElementById('resultCompany');
  const resultRole = document.getElementById('resultRole');
  const resultWorkMode = document.getElementById('resultWorkMode');
  const resultPriority = document.getElementById('resultPriority');
  const resultScore = document.getElementById('resultScore');
  const skillsContainer = document.getElementById('skillsContainer');
  const skillsTags = document.getElementById('skillsTags');

  const recruiterResultBody = document.getElementById('recruiterResultBody');
  const resultRecruiterName = document.getElementById('resultRecruiterName');
  const resultRecruiterCompany = document.getElementById('resultRecruiterCompany');
  const resultPitchText = document.getElementById('resultPitchText');
  const copyPitchBtn = document.getElementById('copyPitchBtn');
  const shortNoteBox = document.getElementById('shortNoteBox');
  const resultShortNoteText = document.getElementById('resultShortNoteText');
  const copyShortNoteBtn = document.getElementById('copyShortNoteBtn');

  const openJobflowBtn = document.getElementById('openJobflowBtn');
  const resetCaptureBtn = document.getElementById('resetCaptureBtn');

  const errorState = document.getElementById('errorState');
  const errorTitle = document.getElementById('errorTitle');
  const errorMessage = document.getElementById('errorMessage');
  const retryBtn = document.getElementById('retryBtn');

  let currentTab = null;
  let activeToken = '';
  let extractedDataCache = null;
  let isRecruiterMode = false;

  // Cambiar entre Modo Vacante y Modo Reclutador
  const setCaptureMode = (mode) => {
    if (mode === 'recruiter') {
      isRecruiterMode = true;
      if (modeVacancyBtn) modeVacancyBtn.classList.remove('active');
      if (modeRecruiterBtn) modeRecruiterBtn.classList.add('active', 'mode-recruiter');
      recruiterDetectedCard.classList.remove('hidden');
      captureBtnText.textContent = '✨ Generar Pitch & Guardar Contacto';
    } else {
      isRecruiterMode = false;
      if (modeRecruiterBtn) modeRecruiterBtn.classList.remove('active', 'mode-recruiter');
      if (modeVacancyBtn) modeVacancyBtn.classList.add('active');
      recruiterDetectedCard.classList.add('hidden');
      captureBtnText.textContent = '⚡ Capturar y Procesar con IA';
    }
  };

  // 1. Cargar token y configuración persistente
  const loadConfig = async () => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['jobflow_token', 'jobflow_api_url'], (items) => {
        activeToken = items.jobflow_token || '';
        if (items.jobflow_api_url) {
          JOBFLOW_API_URL = items.jobflow_api_url.trim().replace(/\/+$/, '');
        }
        jwtTokenInput.value = activeToken;
        if (apiUrlInput) apiUrlInput.value = JOBFLOW_API_URL;
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

  // 2. Obtener información de la pestaña activa e inspeccionar contenido inicial
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

          // Detectar portal
          const isLinkedInProfile = urlObj.hostname.includes('linkedin.com') && currentTab.url.includes('/in/');
          if (isLinkedInProfile) {
            sourceBadge.textContent = 'LinkedIn Perfil';
            sourceBadge.classList.remove('hidden');
            setCaptureMode('recruiter');
          } else if (urlObj.hostname.includes('linkedin')) {
            sourceBadge.textContent = 'LinkedIn Jobs';
            sourceBadge.classList.remove('hidden');
          } else if (urlObj.hostname.includes('indeed')) {
            sourceBadge.textContent = 'Indeed';
            sourceBadge.classList.remove('hidden');
          } else if (urlObj.hostname.includes('bamboohr')) {
            sourceBadge.textContent = 'BambooHR';
            sourceBadge.classList.remove('hidden');
          }

          // Si estamos en Jobflow Web, sincronizar sesión
          if (urlObj.hostname.includes('vercel.app') || urlObj.hostname.includes('localhost') || urlObj.hostname.includes('jobflow')) {
            checkJobflowWebSession(currentTab.id);
          }

          // Inspección rápida de la página para extraer datos
          await probePageContent(currentTab.id);
        } catch {
          tabDomainBadge.textContent = 'Navegador';
        }
      }
    } catch (err) {
      console.error('Error al inspeccionar pestaña activa:', err);
    }
  };

  // Inspeccionar si es reclutador o vacante
  const probePageContent = async (tabId) => {
    try {
      extractedDataCache = await new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { action: 'EXTRACT_JOB' }, (response) => {
          if (chrome.runtime.lastError) resolve(null);
          else resolve(response);
        });
      });

      if (extractedDataCache && extractedDataCache.isRecruiter && extractedDataCache.recruiter) {
        setCaptureMode('recruiter');
        recruiterNameInput.value = extractedDataCache.recruiter.name || '';
        recruiterRoleInput.value = extractedDataCache.recruiter.role || '';
        recruiterCompanyInput.value = extractedDataCache.recruiter.companyName || '';
      } else if (currentTab?.url && (currentTab.url.includes('/in/') || currentTab.url.includes('linkedin.com/in/'))) {
        setCaptureMode('recruiter');
      } else {
        setCaptureMode('vacancy');
      }
    } catch (err) {
      console.warn('Error en sondeo de pestaña:', err);
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
      // Ignorar errores
    }
  };

  // 3. Guardar ajustes y token
  const saveSettings = () => {
    const tokenVal = jwtTokenInput.value.trim();
    const apiUrlVal = apiUrlInput ? apiUrlInput.value.trim().replace(/\/+$/, '') : JOBFLOW_API_URL;

    chrome.storage.local.set(
      {
        jobflow_token: tokenVal,
        jobflow_api_url: apiUrlVal,
      },
      () => {
        activeToken = tokenVal;
        if (apiUrlVal) JOBFLOW_API_URL = apiUrlVal;
        updateConnectionUI();
        settingsSection.classList.add('hidden');
        errorState.classList.add('hidden');
      }
    );
  };

  // Inyección de fallback
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

  // 4. Flujo Principal: Captura & Procesamiento
  const handleCapture = async () => {
    if (!currentTab || !currentTab.id) {
      showError('Error de Navegación', 'No se pudo identificar la pestaña activa del navegador.');
      return;
    }

    if (!activeToken || activeToken.trim().length < 20) {
      settingsSection.classList.remove('hidden');
      showError(
        'Token de Autenticación Requerido',
        'Por favor abre Ajustes (⚙️) e ingresa tu token de Jobflow para asociar las postulaciones o contactos a tu cuenta.'
      );
      return;
    }

    errorState.classList.add('hidden');
    successState.classList.add('hidden');
    captureBtn.disabled = true;
    loadingState.classList.remove('hidden');

    updateLoadingStep('Extrayendo datos de la página...', '25%');

    let pageData = extractedDataCache;
    if (!pageData) {
      try {
        pageData = await new Promise((resolve) => {
          chrome.tabs.sendMessage(currentTab.id, { action: 'EXTRACT_JOB' }, (res) => {
            if (chrome.runtime.lastError) resolve(null);
            else resolve(res);
          });
        });

        if (!pageData) {
          await ensureContentScriptInjected(currentTab.id);
          pageData = await new Promise((resolve) => {
            chrome.tabs.sendMessage(currentTab.id, { action: 'EXTRACT_JOB' }, (res) => {
              if (chrome.runtime.lastError) resolve(null);
              else resolve(res);
            });
          });
        }
      } catch (err) {
        console.error('Error al extraer:', err);
      }
    }

    // ==========================================
    // MODO A: CONTACTO DIRECTO A RECLUTADOR
    // ==========================================
    if (isRecruiterMode || pageData?.isRecruiter) {
      const recName = recruiterNameInput.value.trim() || pageData?.recruiter?.name || 'Reclutador';
      const recRole = recruiterRoleInput.value.trim() || pageData?.recruiter?.role || 'Talent Acquisition';
      const company = recruiterCompanyInput.value.trim() || pageData?.recruiter?.companyName || 'Empresa';
      const channel = recruiterChannelSelect ? recruiterChannelSelect.value : 'LINKEDIN_DM';
      const tone = recruiterToneSelect ? recruiterToneSelect.value : 'CORDIAL';

      updateLoadingStep('Generando pitch personalizado con Gemini AI...', '60%');

      try {
        const pitchController = new AbortController();
        const pitchTimeout = setTimeout(() => pitchController.abort(), 45000);

        const pitchRes = await fetch(`${JOBFLOW_API_URL}/api/ai/direct-pitch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify({
            recruiterName: recName,
            recruiterRole: recRole,
            companyName: company,
            companyWebsite: currentTab.url,
            companyInfo: pageData?.recruiter?.bio || '',
            targetRole: 'Full Stack Developer',
            channel,
            tone,
          }),
          signal: pitchController.signal,
        });

        clearTimeout(pitchTimeout);
        const pitchJson = await pitchRes.json().catch(() => ({}));
        const pitchData = pitchJson.data || pitchJson;

        updateLoadingStep('Guardando contacto en tu Kanban de JobFlow...', '85%');

        const saveController = new AbortController();
        const saveTimeout = setTimeout(() => saveController.abort(), 30000);

        const appPayload = {
          company: {
            name: company,
            website: currentTab.url,
          },
          role: `Contacto Directo: ${recName}`,
          status: 'CONTACTO',
          origin: 'DIRECT_OUTREACH',
          priority: 'MEDIUM',
          workMode: 'REMOTE',
          recruiter: {
            name: recName,
            role: recRole,
            linkedinUrl: currentTab.url,
            channel,
          },
          jobUrl: currentTab.url,
          suggestedPitch: pitchData.pitch || pitchData.shortNote || '',
          companySummary: pitchData.companySummary || '',
          initialInteractionType: 'MENSAJE_ENVIADO',
          notes: `Contacto directo vía ${
            channel === 'LINKEDIN_DM'
              ? 'LinkedIn (Mensaje/InMail)'
              : channel === 'LINKEDIN_NOTE'
              ? 'LinkedIn (Nota de conexión)'
              : channel === 'COLD_EMAIL'
              ? 'Email en frío'
              : 'Outreach directo'
          } a ${recName} (${recRole}).`,
        };

        const saveRes = await fetch(`${JOBFLOW_API_URL}/api/applications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify(appPayload),
          signal: saveController.signal,
        });

        clearTimeout(saveTimeout);
        const saveJson = await saveRes.json().catch(() => ({}));

        if (!saveRes.ok) {
          throw new Error(saveJson.message || saveJson.error || 'Error al guardar el contacto.');
        }

        updateLoadingStep('¡Completado!', '100%');
        notifyJobflowTabs(company, recRole);

        setTimeout(() => {
          loadingState.classList.add('hidden');
          captureBtn.disabled = false;
          showRecruiterSuccess(recName, company, pitchData);
        }, 350);
      } catch (err) {
        loadingState.classList.add('hidden');
        captureBtn.disabled = false;
        handleFetchError('Error al procesar contacto directo', err);
      }
      return;
    }

    // ==========================================
    // MODO B: CAPTURA DE VACANTE TRADICIONAL
    // ==========================================
    if (!pageData || !pageData.text || pageData.text.length < 20) {
      loadingState.classList.add('hidden');
      captureBtn.disabled = false;
      showError(
        'Texto no detectado',
        pageData?.error || 'Por favor selecciona el texto de la oferta con el ratón e inténtalo de nuevo.'
      );
      return;
    }

    updateLoadingStep('Analizando oferta con Inteligencia Artificial...', '60%');

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
          text: pageData.text,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const aiJson = await aiResponse.json().catch(() => ({}));

      if (!aiResponse.ok) {
        throw new Error(aiJson.message || aiJson.error || 'Error al invocar la IA.');
      }

      aiResult = aiJson.data || aiJson;

      updateLoadingStep('Guardando en tu cuenta de Jobflow...', '85%');

      const companyName = aiResult.companyName?.trim() || 'Empresa Confidencial';
      const roleName = aiResult.role?.trim() || 'Desarrollador / Profesional IT';
      const workMode = ['REMOTE', 'HYBRID', 'ON_SITE'].includes(aiResult.workMode) ? aiResult.workMode : 'REMOTE';
      const priority = ['LOW', 'MEDIUM', 'HIGH'].includes(aiResult.priority) ? aiResult.priority : 'MEDIUM';

      const applicationPayload = {
        company: {
          name: companyName,
          website: aiResult.companyWebsite || currentTab.url,
        },
        role: roleName,
        status: 'ENVIADA',
        origin: 'JOB_POSTING',
        priority,
        workMode,
        salary: aiResult.salary || undefined,
        jobUrl: currentTab.url,
        requirementsRaw: pageData.text.slice(0, 5000),
        extractedSkills: aiResult.extractedSkills || [],
        suggestedPitch: aiResult.suggestedPitch || undefined,
        companySummary: aiResult.companySummary || undefined,
        matchScore: typeof aiResult.matchScore === 'number' ? aiResult.matchScore : undefined,
        recruiter: pageData.recruiter || undefined,
        notes: `Capturado desde extensión (${pageData.source || 'Web'}).`,
      };

      const saveController = new AbortController();
      const saveTimeout = setTimeout(() => saveController.abort(), 30000);

      const saveResponse = await fetch(`${JOBFLOW_API_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify(applicationPayload),
        signal: saveController.signal,
      });

      clearTimeout(saveTimeout);
      const saveJson = await saveResponse.json().catch(() => ({}));

      if (!saveResponse.ok) {
        throw new Error(saveJson.message || saveJson.error || 'Error al guardar la postulación.');
      }

      updateLoadingStep('¡Completado!', '100%');
      notifyJobflowTabs(companyName, roleName);

      setTimeout(() => {
        loadingState.classList.add('hidden');
        captureBtn.disabled = false;
        showVacancySuccess(aiResult, companyName, roleName, workMode, priority);
      }, 350);
    } catch (err) {
      loadingState.classList.add('hidden');
      captureBtn.disabled = false;
      handleFetchError('Error al guardar vacante', err);
    }
  };

  const updateLoadingStep = (text, percentage) => {
    loadingStatusText.textContent = text;
    progressFill.style.width = percentage;
  };

  const notifyJobflowTabs = (company, role) => {
    try {
      chrome.tabs.query({}, (tabs) => {
        if (chrome.runtime.lastError || !tabs) return;
        tabs.forEach((t) => {
          if (t.url && (t.url.includes('localhost') || t.url.includes('vercel.app') || t.url.includes('jobflow') || t.url.includes('jobfow'))) {
            chrome.tabs.sendMessage(t.id, {
              action: 'NOTIFY_APPLICATION_SAVED',
              company,
              role,
            }, () => {
              if (chrome.runtime.lastError) { /* noop */ }
            });
          }
        });
      });
    } catch {
      // Ignorar errores de notificación
    }
  };

  const showRecruiterSuccess = (recName, company, pitchData) => {
    successTitle.textContent = '¡Contacto Guardado en JobFlow!';
    successSubtitle.textContent = 'Añadido a la columna CONTACTO con seguimiento';

    vacancyResultBody.classList.add('hidden');
    recruiterResultBody.classList.remove('hidden');

    resultRecruiterName.textContent = recName;
    resultRecruiterCompany.textContent = company;
    resultPitchText.value = pitchData.pitch || 'Pitch generado exitosamente.';

    if (pitchData.shortNote) {
      resultShortNoteText.value = pitchData.shortNote;
      shortNoteBox.classList.remove('hidden');
    } else {
      shortNoteBox.classList.add('hidden');
    }

    successState.classList.remove('hidden');
  };

  const showVacancySuccess = (aiData, company, role, workMode, priority) => {
    successTitle.textContent = '¡Guardada en JobFlow!';
    successSubtitle.textContent = 'Postulación añadida a tu Kanban';

    recruiterResultBody.classList.add('hidden');
    vacancyResultBody.classList.remove('hidden');

    resultCompany.textContent = company;
    resultRole.textContent = role;

    const workModeLabels = { REMOTE: 'Remoto', HYBRID: 'Híbrido', ON_SITE: 'Presencial' };
    const priorityLabels = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta' };

    resultWorkMode.textContent = workModeLabels[workMode] || workMode;
    resultPriority.textContent = priorityLabels[priority] || priority;

    const score = typeof aiData.matchScore === 'number' ? aiData.matchScore : 0;
    resultScore.textContent = `${score}% Match`;

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
      message = 'Tiempo de espera agotado al comunicar con los servidores. Reintenta.';
    } else if (err.message === 'Failed to fetch' || err instanceof TypeError) {
      message = 'No se pudo conectar con los servidores de JobFlow. Verifica tu conexión o la URL en Ajustes.';
    }
    showError(title, message);
  };

  const showError = (title, message) => {
    errorTitle.textContent = title;
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
  };

  // Copiar Pitch
  copyPitchBtn.addEventListener('click', async () => {
    if (!resultPitchText.value) return;
    try {
      await navigator.clipboard.writeText(resultPitchText.value);
      copyPitchBtn.textContent = '✓ ¡Copiado!';
      setTimeout(() => (copyPitchBtn.textContent = '📋 Copiar'), 2000);
    } catch {
      copyPitchBtn.textContent = 'Error al copiar';
    }
  });

  copyShortNoteBtn.addEventListener('click', async () => {
    if (!resultShortNoteText.value) return;
    try {
      await navigator.clipboard.writeText(resultShortNoteText.value);
      copyShortNoteBtn.textContent = '✓ ¡Copiado!';
      setTimeout(() => (copyShortNoteBtn.textContent = '📋 Copiar Nota'), 2000);
    } catch {
      copyShortNoteBtn.textContent = 'Error al copiar';
    }
  });

  // Listeners de Cambio de Modo
  if (modeVacancyBtn) {
    modeVacancyBtn.addEventListener('click', () => setCaptureMode('vacancy'));
  }
  if (modeRecruiterBtn) {
    modeRecruiterBtn.addEventListener('click', () => setCaptureMode('recruiter'));
  }

  // Listeners Generales
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
