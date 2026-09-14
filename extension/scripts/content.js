/**
 * Jobflow — Content Script (Manifest V3)
 * Inyectado en páginas web para extraer información y descripción de ofertas laborales.
 */

(() => {
  // Evitar inyección múltiple
  if (window.__JOBFLOW_CONTENT_SCRIPT_LOADED__) return;
  window.__JOBFLOW_CONTENT_SCRIPT_LOADED__ = true;

  /**
   * Limpia un nodo clonado eliminando elementos no textuales (scripts, estilos, navegación)
   * @param {HTMLElement} element - Nodo a limpiar
   * @returns {string} Texto limpio
   */
  const cleanNodeText = (element) => {
    if (!element) return '';
    const clone = element.cloneNode(true);
    const selectorsToRemove = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      'aside',
      'svg',
      'noscript',
      'button',
      'iframe',
      '.cookie-banner',
      '#cookie-notice',
    ];
    selectorsToRemove.forEach((sel) => {
      clone.querySelectorAll(sel).forEach((el) => el.remove());
    });
    return clone.innerText ? clone.innerText.trim() : '';
  };

  /**
   * Extrae la descripción de la vacante utilizando estrategias en capas (Selectores específicos -> Semántica -> Selección manual)
   */
  const extractJobContent = () => {
    const currentUrl = window.location.href;
    const pageTitle = document.title || '';

    // Capa 1: ¿El usuario seleccionó texto manualmente con el mouse? (Prioridad de control)
    const userSelection = window.getSelection ? window.getSelection().toString().trim() : '';
    if (userSelection && userSelection.length >= 40) {
      return {
        success: true,
        url: currentUrl,
        title: pageTitle,
        text: userSelection,
        source: 'SELECCION_MANUAL',
      };
    }

    // Capa 2: Selectores específicos por plataforma
    const isLinkedIn = currentUrl.includes('linkedin.com');
    const isIndeed = currentUrl.includes('indeed.com');
    const isGlassdoor = currentUrl.includes('glassdoor.com');
    const isBambooHR = currentUrl.includes('bamboohr.com');

    if (isBambooHR) {
      const bambooSelectors = [
        '[data-qa="job-description"]',
        '[data-qa="job-details"]',
        '.BambooHR-ATS-Jobs-Item',
        '.BambooHR-ATS-board',
        'div.pos-job-description',
        'section[class*="description"]',
        'div[class*="description"]',
        'main article',
        'main',
      ];
      for (const sel of bambooSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const text = cleanNodeText(el);
          if (text.length >= 50) {
            return {
              success: true,
              url: currentUrl,
              title: pageTitle,
              text: text.slice(0, 8000),
              source: 'BAMBOOHR_SPECIFIC',
            };
          }
        }
      }
    }

    if (isLinkedIn) {
      const linkedInSelectors = [
        '.jobs-description-content__text',
        '.jobs-box__html-content',
        '.jobs-description__content',
        '.job-view-layout .jobs-description',
        'article.jobs-description',
        '.jobs-search__job-details--container',
      ];
      for (const sel of linkedInSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const text = cleanNodeText(el);
          if (text.length >= 50) {
            return {
              success: true,
              url: currentUrl,
              title: pageTitle,
              text,
              source: 'LINKEDIN_SPECIFIC',
            };
          }
        }
      }
    }

    if (isIndeed) {
      const indeedSelectors = [
        '#jobDescriptionText',
        '.jobsearch-jobDescriptionText',
        '[data-testid="jobDescriptionText"]',
      ];
      for (const sel of indeedSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const text = cleanNodeText(el);
          if (text.length >= 50) {
            return {
              success: true,
              url: currentUrl,
              title: pageTitle,
              text,
              source: 'INDEED_SPECIFIC',
            };
          }
        }
      }
    }

    if (isGlassdoor) {
      const glassdoorSelectors = [
        '.jobDescriptionContent',
        '[data-test="jobDescriptionText"]',
        '.desc',
      ];
      for (const sel of glassdoorSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const text = cleanNodeText(el);
          if (text.length >= 50) {
            return {
              success: true,
              url: currentUrl,
              title: pageTitle,
              text,
              source: 'GLASSDOOR_SPECIFIC',
            };
          }
        }
      }
    }

    // Capa 3: Extracción semántica para portales generales o desconocidos
    const genericSelectors = [
      '[class*="job-description"]',
      '[id*="job-description"]',
      '[class*="jobDescription"]',
      '[id*="jobDescription"]',
      '[class*="job_description"]',
      '[class*="vacante"]',
      '[id*="vacante"]',
      'main article',
      'article',
      'main',
    ];

    for (const sel of genericSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = cleanNodeText(el);
        if (text.length >= 80) {
          return {
            success: true,
            url: currentUrl,
            title: pageTitle,
            text: text.slice(0, 8000), // Límite de seguridad
            source: 'SEMANTIC_GENERIC',
          };
        }
      }
    }

    // Capa 4: Fallback amplio del cuerpo del documento
    const bodyText = cleanNodeText(document.body);
    if (bodyText && bodyText.length >= 100) {
      return {
        success: true,
        url: currentUrl,
        title: pageTitle,
        text: bodyText.slice(0, 6000),
        source: 'BODY_FALLBACK',
      };
    }

    return {
      success: false,
      url: currentUrl,
      title: pageTitle,
      error: 'No se pudo identificar el contenido de la vacante. Selecciona el texto de la oferta con el ratón e inténtalo de nuevo.',
    };
  };

  /**
   * Detección de sesión activa si el usuario está en la app web de Jobflow
   */
  const detectJobflowWebSession = () => {
    try {
      const token = localStorage.getItem('jobflow_token');
      const userRaw = localStorage.getItem('jobflow_user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      return { token, user };
    } catch {
      return { token: null, user: null };
    }
  };

  // Receptor de mensajes del popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXTRACT_JOB') {
      const result = extractJobContent();
      sendResponse(result);
      return true;
    }

    if (request.action === 'CHECK_PORTAL_SESSION') {
      const session = detectJobflowWebSession();
      sendResponse(session);
      return true;
    }
  });
})();
