/**
 * Jobflow — Content Script (Manifest V3)
 * Inyectado en páginas web para extraer información de ofertas laborales y perfiles de reclutadores.
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
   * Extrae los datos de un perfil de reclutador o líder en LinkedIn / GitHub / Web
   */
  const extractRecruiterProfile = () => {
    const currentUrl = window.location.href;
    const pageTitle = document.title || '';

    // 1. LinkedIn Profile (/in/...)
    if (currentUrl.includes('linkedin.com/in/')) {
      const nameEl = document.querySelector('h1.text-heading-xlarge, h1.inline.t-24, h1.v-align-middle, h1');
      const recruiterName = nameEl ? nameEl.innerText.trim() : '';

      const headlineEl = document.querySelector('div.text-body-medium, .pv-text-details__left-panel .text-body-medium, .pv-top-card--list-bullet');
      const recruiterRole = headlineEl ? headlineEl.innerText.trim() : '';

      let companyName = '';
      const companyEl = document.querySelector('.pv-text-details__right-panel button span, button[aria-label*="Empresa actual"] span, .pv-top-card--experience-list-item');
      if (companyEl) {
        companyName = companyEl.innerText.trim();
      }

      if (!companyName && recruiterRole) {
        const match = recruiterRole.match(/(?:at|en|@|para)\s+([A-Za-z0-9\s.,&-]+?)(?:\||\u2022|\.|$)/i);
        if (match && match[1]) {
          companyName = match[1].trim();
        }
      }

      const aboutEl = document.querySelector('#about ~ .display-flex .inline-show-more-text, section#about .inline-show-more-text, #about ~ div span[aria-hidden="true"]');
      const bio = aboutEl ? aboutEl.innerText.trim() : '';

      const avatarEl = document.querySelector('img.pv-top-card-profile-picture__image, img.presence-entity__image');
      const avatar = avatarEl ? avatarEl.src : '';

      if (recruiterName) {
        return {
          success: true,
          isRecruiter: true,
          type: 'RECRUITER_PROFILE',
          url: currentUrl.split('?')[0],
          title: pageTitle,
          recruiter: {
            name: recruiterName,
            role: recruiterRole,
            companyName: companyName || '',
            linkedinUrl: currentUrl.split('?')[0],
            bio: bio.slice(0, 1500),
            avatar,
          },
          text: `Reclutador: ${recruiterName}\nCargo: ${recruiterRole}\nEmpresa: ${companyName}\nBio: ${bio}`,
          source: 'LINKEDIN_PROFILE',
        };
      }
    }

    // 2. GitHub Profile (github.com/username)
    if (currentUrl.includes('github.com/') && !currentUrl.includes('/tab=') && !currentUrl.includes('/pulls')) {
      const nameEl = document.querySelector('.p-name');
      const orgEl = document.querySelector('.p-org, [itemprop="worksFor"]');
      const bioEl = document.querySelector('.p-note');

      if (nameEl && nameEl.innerText.trim()) {
        const name = nameEl.innerText.trim();
        const company = orgEl ? orgEl.innerText.trim() : '';
        const bio = bioEl ? bioEl.innerText.trim() : '';

        return {
          success: true,
          isRecruiter: true,
          type: 'GITHUB_PROFILE',
          url: currentUrl.split('?')[0],
          title: pageTitle,
          recruiter: {
            name,
            role: 'Engineering Lead / Tech Recruiter',
            companyName: company || '',
            linkedinUrl: currentUrl,
            bio,
          },
          text: `Contacto: ${name}\nEmpresa: ${company}\nBio: ${bio}`,
          source: 'GITHUB_PROFILE',
        };
      }
    }

    return null;
  };

  /**
   * Extrae la descripción de la vacante o reclutador utilizando estrategias en capas
   */
  const extractPageContent = () => {
    const currentUrl = window.location.href;
    const pageTitle = document.title || '';

    // Capa 1: ¿Es un perfil de reclutador directo?
    const recruiterData = extractRecruiterProfile();
    if (recruiterData) {
      return recruiterData;
    }

    // Capa 2: ¿El usuario seleccionó texto manualmente con el mouse? (Prioridad de control)
    const userSelection = window.getSelection ? window.getSelection().toString().trim() : '';
    if (userSelection && userSelection.length >= 40) {
      return {
        success: true,
        isRecruiter: false,
        url: currentUrl,
        title: pageTitle,
        text: userSelection,
        source: 'SELECCION_MANUAL',
      };
    }

    // Capa 3: Selectores específicos por portal de empleo
    const isLinkedIn = currentUrl.includes('linkedin.com');
    const isIndeed = currentUrl.includes('indeed.com');
    const isGlassdoor = currentUrl.includes('glassdoor.com');
    const isBambooHR = currentUrl.includes('bamboohr.com');

    // Detección de reclutador asignado en una vacante de LinkedIn
    let hiringTeam = null;
    if (isLinkedIn) {
      const hirerCard = document.querySelector('.hirer-card__hirer-information, .jobs-poster__name, .jobs-box--profile');
      if (hirerCard) {
        const nameEl = hirerCard.querySelector('a, .jobs-poster__name, h3, strong');
        const roleEl = hirerCard.querySelector('.hirer-card__hirer-job-title, .jobs-poster__headline, p');
        const linkEl = hirerCard.querySelector('a[href*="/in/"]');

        if (nameEl && nameEl.innerText.trim()) {
          hiringTeam = {
            name: nameEl.innerText.trim(),
            role: roleEl ? roleEl.innerText.trim() : 'Recruiter',
            linkedinUrl: linkEl ? linkEl.href.split('?')[0] : '',
          };
        }
      }
    }

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
              isRecruiter: false,
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
              isRecruiter: false,
              recruiter: hiringTeam,
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
              isRecruiter: false,
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
              isRecruiter: false,
              url: currentUrl,
              title: pageTitle,
              text,
              source: 'GLASSDOOR_SPECIFIC',
            };
          }
        }
      }
    }

    // Capa 4: Extracción semántica para portales generales o desconocidos
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
            isRecruiter: false,
            url: currentUrl,
            title: pageTitle,
            text: text.slice(0, 8000),
            source: 'SEMANTIC_GENERIC',
          };
        }
      }
    }

    // Capa 5: Fallback amplio del cuerpo del documento
    const bodyText = cleanNodeText(document.body);
    if (bodyText && bodyText.length >= 100) {
      return {
        success: true,
        isRecruiter: false,
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
      error: 'No se pudo identificar el contenido de la vacante o perfil. Selecciona el texto con el ratón e inténtalo de nuevo.',
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
      const result = extractPageContent();
      sendResponse(result);
      return true;
    }

    if (request.action === 'CHECK_PORTAL_SESSION') {
      const session = detectJobflowWebSession();
      sendResponse(session);
      return true;
    }

    if (request.action === 'NOTIFY_APPLICATION_SAVED') {
      try {
        window.dispatchEvent(
          new CustomEvent('jobflow:sync', {
            detail: {
              company: request.company,
              role: request.role,
            },
          })
        );
      } catch (err) {
        console.warn('Error al despachar evento de sincronización:', err);
      }
      sendResponse({ received: true });
      return true;
    }
  });
})();
