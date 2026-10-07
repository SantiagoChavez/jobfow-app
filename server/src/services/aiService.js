import { GoogleGenAI } from '@google/genai';

const DEFAULT_AI_SCHEMA = {
  companyName: '',
  companyWebsite: '',
  role: '',
  workMode: 'REMOTE',
  priority: 'MEDIUM',
  salary: undefined,
  companySummary: '',
  matchScore: 0,
  extractedSkills: [],
  keySkills: [],
  missingSkills: [],
  suggestedPitch: '',
};

/**
 * Limpia delimitadores markdown si el LLM responde con ```json ... ```
 */
const extractJson = (text) => {
  if (!text || typeof text !== 'string') return '{}';
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
};

/**
 * Analiza la descripción de una oferta laboral con Google Gemini AI
 * @param {string} rawText - Texto de la oferta de empleo
 * @param {string} [userProfile=''] - Perfil o stack técnico del postulante
 * @returns {Promise<typeof DEFAULT_AI_SCHEMA>}
 */
export const analyzeJobPosting = async (rawText, userProfile = '') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim() || apiKey === 'tu_api_key_aqui') {
    throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno.');
  }

  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    throw new Error('El texto de la vacante es obligatorio para el análisis.');
  }

  // 1. Truncado de seguridad y neutralización de delimitadores para blindar contexto
  const sanitizedText = rawText.slice(0, 6000).replace(/"""/g, "'''").trim();
  let candidateName = '';
  let candidateTitle = '';
  let candidateBio = '';
  let githubUrl = '';
  let linkedinUrl = '';
  let portfolioUrl = '';
  let skillsList = '';

  if (typeof userProfile === 'object' && userProfile !== null) {
    candidateName = userProfile.name?.trim() || '';
    candidateTitle = userProfile.headline?.trim() || 'Desarrollador / Profesional IT';
    candidateBio = userProfile.bio?.trim() || '';
    githubUrl = userProfile.links?.github?.trim() || process.env.CANDIDATE_GITHUB_URL || '';
    linkedinUrl = userProfile.links?.linkedin?.trim() || process.env.CANDIDATE_LINKEDIN_URL || '';
    portfolioUrl = userProfile.links?.portfolio?.trim() || '';

    skillsList = Array.isArray(userProfile.skills) && userProfile.skills.length > 0
      ? userProfile.skills.join(', ')
      : '';
  } else if (typeof userProfile === 'string' && userProfile.trim()) {
    candidateBio = userProfile.slice(0, 2000).replace(/"""/g, "'''").trim();
    candidateTitle = 'Desarrollador / Profesional IT';
  }

  // Si no se proporcionó nombre, usar saludo neutral
  const displayName = candidateName || 'el postulante';
  const displayTitle = candidateTitle || 'profesional en tecnología';

  // Construir perfil contextual
  let profileText = `Postulante: ${displayName} (${displayTitle}).`;
  if (candidateBio) profileText += `\nBio / Trayectoria: ${candidateBio}`;
  if (skillsList) profileText += `\nHabilidades técnicas declaradas: ${skillsList}`;

  const professionalLinks = [];
  if (githubUrl) professionalLinks.push(`- GitHub: ${githubUrl}`);
  if (linkedinUrl) professionalLinks.push(`- LinkedIn: ${linkedinUrl}`);
  if (portfolioUrl) professionalLinks.push(`- Portfolio: ${portfolioUrl}`);

  if (professionalLinks.length > 0) {
    profileText += `\nEnlaces profesionales:\n${professionalLinks.join('\n')}`;
  }

  // Construir plantilla base adaptativa según los enlaces reales del usuario
  const pitchLinksBullets = [];
  if (githubUrl) pitchLinksBullets.push(`• GitHub: ${githubUrl}`);
  if (linkedinUrl) pitchLinksBullets.push(`• LinkedIn: ${linkedinUrl}`);
  if (portfolioUrl) pitchLinksBullets.push(`• Portfolio: ${portfolioUrl}`);

  const pitchLinksBlock = pitchLinksBullets.length > 0
    ? `Los invito a explorar mis proyectos y trayectoria en mis enlaces profesionales:\n${pitchLinksBullets.join('\n')}`
    : `Quedo a su entera disposición para conversar en detalle sobre mi experiencia y proyectos.`;

  const basePitchTemplate = candidateName
    ? `Hola, espero tenga un excelente día.\nSoy ${candidateName}, ${displayTitle} y me interesaría formar parte de su equipo. Mi perfil y trayectoria me permiten aportar versatilidad, pragmatismo y compromiso técnico a sus metas de desarrollo. ${pitchLinksBlock}\nEspero noticias positivas y desde ya muy agradecido por su tiempo; que tenga una muy buena semana.`
    : `Hola, espero tenga un excelente día.\nMe interesaría postularme al rol de ${displayTitle} y formar parte de su equipo. Mi perfil y trayectoria me permiten aportar versatilidad, pragmatismo y compromiso técnico a sus metas de desarrollo. ${pitchLinksBlock}\nEspero noticias positivas y desde ya muy agradecido por su tiempo; que tenga una muy buena semana.`;

  const prompt = `
Eres un Copiloto Senior de Búsqueda Laboral y Reclutamiento Técnico para la plataforma JobFlow.
Tu objetivo es analizar minuciosamente la siguiente descripción de vacante de empleo y contrastarla contra el perfil del postulante.

Perfil del Postulante:
"""
${profileText}
"""

Plantilla Base del Postulante para el Pitch de Contacto:
"""
${basePitchTemplate}
"""

Oferta Laboral:
"""
${sanitizedText}
"""

Debes responder ÚNICAMENTE un objeto JSON estrictamente válido, sin texto adicional ni bloques explicativos, con la siguiente estructura:
{
  "companyName": "Nombre de la empresa identificada o cadena vacía si no se menciona",
  "companyWebsite": "URL del sitio web si se menciona o cadena vacía",
  "role": "Título claro y conciso del puesto",
  "workMode": "REMOTE | HYBRID | ON_SITE (deducir según la descripción; si no se menciona, REMOTE)",
  "priority": "LOW | MEDIUM | HIGH (HIGH si menciona senior/urgente o buen fit, MEDIUM por defecto)",
  "salary": número entero estimado de salario en USD si se menciona, o null si no se especifica,
  "companySummary": "Resumen conciso de 2 oraciones sobre a qué se dedica la empresa, industria y cultura.",
  "matchScore": número entero del 0 al 100 evaluando la afinidad entre los requisitos de la vacante y el perfil del postulante,
  "extractedSkills": ["array de strings con las tecnologías y habilidades requeridas por la empresa"],
  "missingSkills": ["array de strings con tecnologías secundarias o deseables que el postulante podría necesitar reforzar"],
  "suggestedPitch": "Adaptación sutil y contextualizada de la Plantilla Base del Postulante para la empresa y rol detectados. DEBES conservar fielmente la identidad del postulante, su trayectoria y los enlaces profesionales provistos si existen (sin inventar URLs inexistentes), sin alterar sustancialmente la estructura original del mensaje."
}
`;

  const primaryModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  // Invocación con control de timeout defensivo (12 segundos)
  const generateWithTimeout = async (modelName, timeoutMs = 12000) => {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error('Timeout: El servicio de IA tardó más de 12 segundos en responder.'));
      }, timeoutMs);
    });

    try {
      const apiPromise = ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const response = await Promise.race([apiPromise, timeoutPromise]);
      return response;
    } finally {
      clearTimeout(timer);
    }
  };

  let response;
  try {
    response = await generateWithTimeout(primaryModel);
  } catch (err) {
    // Si el modelo específico falla por no estar disponible, reintentar con modelo alternativo de respaldo
    const isModelNotFound = err.status === 404 || err.message?.includes('not found') || err.message?.includes('404');
    if (isModelNotFound) {
      const fallbackModel = primaryModel === 'gemini-1.5-flash' ? 'gemini-1.5-flash-latest' : 'gemini-1.5-flash';
      console.warn(`[AI Service] Modelo ${primaryModel} no disponible, intentando con ${fallbackModel} de respaldo...`);
      response = await generateWithTimeout(fallbackModel);
    } else {
      throw err;
    }
  }

  const rawJson = response?.text || (typeof response?.candidates?.[0]?.content?.parts?.[0]?.text === 'string' ? response.candidates[0].content.parts[0].text : '{}');
  const cleaned = extractJson(rawJson);

  let parsed = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    console.error('[AI Service] Error al parsear respuesta JSON de Gemini:', cleaned);
    throw new Error('La respuesta del modelo de IA no tuvo un formato JSON válido.');
  }

  // Normalización con tipado estricto y valores por defecto
  const validWorkModes = ['REMOTE', 'HYBRID', 'ON_SITE'];
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];

  const rawSkills = Array.isArray(parsed.extractedSkills)
    ? parsed.extractedSkills
    : Array.isArray(parsed.keySkills)
    ? parsed.keySkills
    : DEFAULT_AI_SCHEMA.extractedSkills;
  const cleanSkills = rawSkills.map((s) => String(s).trim()).filter(Boolean);

  const normalized = {
    companyName: typeof parsed.companyName === 'string' ? parsed.companyName.trim() : DEFAULT_AI_SCHEMA.companyName,
    companyWebsite: typeof parsed.companyWebsite === 'string' ? parsed.companyWebsite.trim() : DEFAULT_AI_SCHEMA.companyWebsite,
    role: typeof parsed.role === 'string' ? parsed.role.trim() : DEFAULT_AI_SCHEMA.role,
    workMode: validWorkModes.includes(String(parsed.workMode).toUpperCase())
      ? String(parsed.workMode).toUpperCase()
      : DEFAULT_AI_SCHEMA.workMode,
    priority: validPriorities.includes(String(parsed.priority).toUpperCase())
      ? String(parsed.priority).toUpperCase()
      : DEFAULT_AI_SCHEMA.priority,
    salary: Number.isFinite(Number(parsed.salary)) && Number(parsed.salary) > 0
      ? Math.round(Number(parsed.salary))
      : undefined,
    companySummary: typeof parsed.companySummary === 'string' ? parsed.companySummary.trim() : DEFAULT_AI_SCHEMA.companySummary,
    matchScore: Number.isFinite(Number(parsed.matchScore))
      ? Math.min(100, Math.max(0, Math.round(Number(parsed.matchScore))))
      : DEFAULT_AI_SCHEMA.matchScore,
    extractedSkills: cleanSkills,
    keySkills: cleanSkills,
    missingSkills: Array.isArray(parsed.missingSkills)
      ? parsed.missingSkills.map((s) => String(s).trim()).filter(Boolean)
      : DEFAULT_AI_SCHEMA.missingSkills,
    suggestedPitch: typeof parsed.suggestedPitch === 'string' ? parsed.suggestedPitch.trim() : DEFAULT_AI_SCHEMA.suggestedPitch,
  };

  return normalized;
};

/**
 * Genera un mensaje de seguimiento / follow-up profesional con IA adaptado a una postulación
 * @param {Object} params
 * @param {Object} params.application - Objeto de la postulación
 * @param {Object} [params.userProfile] - Perfil del postulante
 * @param {string} [params.tone='CORDIAL'] - 'CORDIAL' | 'ENTHUSIASTIC' | 'DIRECT'
 * @param {string} [params.customInstructions=''] - Instrucciones adicionales
 * @returns {Promise<{ subject: string, message: string, shortNote: string }>}
 */
export const generateFollowUpMessage = async ({
  application = {},
  userProfile = null,
  tone = 'CORDIAL',
  customInstructions = '',
} = {}) => {
  const companyName = application.company?.name || 'la empresa';
  const role = application.role || 'el puesto postulado';
  const recruiterName = application.recruiter?.name?.trim() || '';
  const previousPitch = application.suggestedPitch?.trim() || '';

  // Calcular días transcurridos
  let daysElapsed = 5;
  if (application.appliedAt) {
    const diffTime = Math.abs(Date.now() - new Date(application.appliedAt).getTime());
    daysElapsed = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  }

  const candidateName = userProfile?.name?.trim() || 'Santiago Chavez';
  const candidateTitle = userProfile?.headline?.trim() || 'Full Stack Developer';
  const skillsList = Array.isArray(userProfile?.skills) && userProfile.skills.length > 0
    ? userProfile.skills.slice(0, 5).join(', ')
    : 'React, Node.js, JavaScript';

  const githubUrl = userProfile?.links?.github || '';
  const linkedinUrl = userProfile?.links?.linkedin || '';
  const portfolioUrl = userProfile?.links?.portfolio || '';

  const linksArr = [];
  if (portfolioUrl) linksArr.push(`Portfolio: ${portfolioUrl}`);
  if (githubUrl) linksArr.push(`GitHub: ${githubUrl}`);
  if (linkedinUrl) linksArr.push(`LinkedIn: ${linkedinUrl}`);
  const linksText = linksArr.length > 0 ? `\n\nEnlaces profesionales:\n${linksArr.join('\n')}` : '';

  // Plantilla de respaldo (Fallback Offline)
  const getFallbackFollowUp = () => {
    const greeting = recruiterName
      ? `Estimado/a ${recruiterName},`
      : `Estimado equipo de selección de ${companyName},`;

    const subject = `Seguimiento de postulación: ${role} — ${candidateName}`;

    let body = '';
    if (tone === 'DIRECT') {
      body = `${greeting}\n\nEspero que estés teniendo una excelente semana. Te escribo para consultar sobre el estado del proceso para el rol de ${role} al cual me postulé hace ${daysElapsed} días.\n\nSigo con gran interés en sumarme a ${companyName}. Quedo a tu disposición ante cualquier consulta.${linksText}\n\n¡Muchas gracias por tu tiempo!\n\nSaludos cordiales,\n${candidateName}\n${candidateTitle}`;
    } else if (tone === 'ENTHUSIASTIC') {
      body = `${greeting}\n\n¡Espero que te encuentres muy bien! Me pongo en contacto para hacer un breve seguimiento de mi postulación al rol de ${role}, enviada hace ${daysElapsed} días.\n\nSigo sumamente entusiasmado con los desafíos técnicos de ${companyName} y convencido de que mi experiencia en ${skillsList} puede aportar valor inmediato al equipo.\n\nQuedo a total disposición para coordinar una llamada o responder cualquier duda sobre mi perfil.${linksText}\n\n¡Excelente semana y muchas gracias!\n\nSaludos cordiales,\n${candidateName}\n${candidateTitle}`;
    } else {
      // CORDIAL por defecto
      body = `${greeting}\n\nEspero que se encuentre muy bien. Le escribo para realizar un cordial seguimiento sobre mi postulación al puesto de ${role}, enviada hace ${daysElapsed} días.\n\nReitero mi sincero interés en la oportunidad de formar parte de ${companyName} y contribuir al equipo con mi experiencia y compromiso técnico.\n\nQuedo a su entera disposición en caso de que requieran información adicional o para coordinar los siguientes pasos del proceso.${linksText}\n\nMuchas gracias por su tiempo y consideración.\n\nSaludos cordiales,\n${candidateName}\n${candidateTitle}`;
    }

    // Nota corta ajustada estrictamente a <= 200 caracteres para notas de conexión en LinkedIn
    const shortGreeting = recruiterName ? `Hola ${recruiterName},` : `Hola equipo de ${companyName},`;
    const cleanRole = role.length > 28 ? `${role.slice(0, 25)}...` : role;
    const cleanCompany = companyName.length > 20 ? `${companyName.slice(0, 18)}...` : companyName;
    const rawShort = `${shortGreeting} ¿cómo estás? Quería consultar sobre el proceso para ${cleanRole}. ¡Sigo con gran interés en sumarme a ${cleanCompany}! Saludos, ${candidateName}.`;
    const shortNote = rawShort.length > 200 ? rawShort.slice(0, 197) + '...' : rawShort;

    return { subject, message: body, shortNote };
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim() || apiKey === 'tu_api_key_aqui') {
    return getFallbackFollowUp();
  }

  const prompt = `
Eres un Experto Senior en Comunicación Laboral y Reclutamiento IT para JobFlow.
Tu objetivo es redactar dos versiones de un MENSAJE DE SEGUIMIENTO (Follow-up) para un candidato que envió su postulación hace ${daysElapsed} días:

1. MENSAJE COMPLETO ("message"):
- Extensión de 2 a 3 párrafos concisos, profesionales y persuasivos.
- Ideal para Email o mensaje directo de LinkedIn/Chat.
- Hace referencia respetuosa a la postulación enviada hace ${daysElapsed} días para el rol de ${role}.
- Reafirma el interés genuino y valor técnico que ${candidateName} puede aportar a ${companyName}.
- Tono solicitado: ${tone} (CORDIAL, ENTHUSIASTIC o DIRECT).

2. NOTA CORTA DE CONEXIÓN ("shortNote"):
- **REGLA CRÍTICA ESTRICTA: MÁXIMO 190 A 200 CARACTERES TOTALES (incluyendo espacios)**.
- Diseñada específicamente para la "Nota de solicitud de contacto de LinkedIn", cuyo límite no permite más de 200 caracteres.
- Debe ser ultra directa: Saludo breve + consulta amigable sobre el rol de ${role} en ${companyName} + interés del candidato.

Contexto de la postulación:
- Empresa: "${companyName}"
- Puesto / Rol: "${role}"
- Reclutador / Contacto: "${recruiterName || 'Equipo de Selección'}"
- Días transcurridos desde postulación: ${daysElapsed} días
- Pitch inicial / Presentación previa: "${previousPitch || 'Postulación estándar'}"
- Perfil del candidato: ${candidateName} (${candidateTitle})
- Habilidades destacadas: ${skillsList}
- Tono solicitado: ${tone}
${customInstructions ? `- Instrucciones adicionales del usuario: "${customInstructions}"` : ''}

Debes responder ÚNICAMENTE un objeto JSON estrictamente válido con la siguiente estructura:
{
  "subject": "Asunto profesional para el correo electrónico",
  "message": "Cuerpo completo del mensaje de seguimiento adaptado",
  "shortNote": "Mensaje sintético de MÁXIMO 200 caracteres para nota de conexión en LinkedIn"
}
`;

  try {
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    const response = await ai.models.generateContent({
      model: primaryModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawJson = response?.text || (typeof response?.candidates?.[0]?.content?.parts?.[0]?.text === 'string' ? response.candidates[0].content.parts[0].text : '{}');
    const cleaned = extractJson(rawJson);
    const parsed = JSON.parse(cleaned);

    let parsedShort = typeof parsed.shortNote === 'string' && parsed.shortNote.trim()
      ? parsed.shortNote.trim()
      : getFallbackFollowUp().shortNote;

    // Garantía defensiva de corte si el LLM excede los 200 caracteres
    if (parsedShort.length > 200) {
      parsedShort = parsedShort.slice(0, 197) + '...';
    }

    return {
      subject: typeof parsed.subject === 'string' && parsed.subject.trim()
        ? parsed.subject.trim()
        : `Seguimiento de postulación: ${role} — ${candidateName}`,
      message: typeof parsed.message === 'string' && parsed.message.trim()
        ? parsed.message.trim()
        : getFallbackFollowUp().message,
      shortNote: parsedShort,
    };
  } catch (err) {
    console.warn('[AI Service] Error generando follow-up con Gemini, usando plantilla de respaldo:', err.message);
    return getFallbackFollowUp();
  }
};

/**
 * Genera un pitch de presentación y contacto directo personalizado para un reclutador con Google Gemini AI
 * @param {Object} options
 * @param {string} [options.recruiterName=''] - Nombre del reclutador
 * @param {string} [options.recruiterRole=''] - Cargo del reclutador (ej: Talent Acquisition Partner)
 * @param {string} [options.companyName=''] - Nombre de la empresa
 * @param {string} [options.companyWebsite=''] - Web o LinkedIn de la empresa
 * @param {string} [options.companyInfo=''] - Información o contexto sobre la empresa
 * @param {string} [options.targetRole=''] - Rol o puesto al que aspira el postulante
 * @param {string} [options.channel='LINKEDIN_DM'] - Canal (LINKEDIN_DM, LINKEDIN_NOTE, COLD_EMAIL, OTHER)
 * @param {string} [options.tone='CORDIAL'] - Tono (CORDIAL, ENTHUSIASTIC, DIRECT)
 * @param {Object|string} [options.userProfile=null] - Perfil del usuario
 * @param {string} [options.customInstructions=''] - Instrucciones adicionales
 * @returns {Promise<{ pitch: string, shortNote: string, subject: string, companySummary: string }>}
 */
export const generateDirectOutreachPitch = async ({
  recruiterName = '',
  recruiterRole = '',
  companyName = '',
  companyWebsite = '',
  companyInfo = '',
  targetRole = '',
  channel = 'LINKEDIN_DM',
  tone = 'CORDIAL',
  userProfile = null,
  customInstructions = '',
} = {}) => {
  const cleanCompany = companyName?.trim() || 'la empresa';
  const cleanRecruiter = recruiterName?.trim() || '';
  const cleanRecruiterRole = recruiterRole?.trim() || '';
  const cleanRole = targetRole?.trim() || 'Desarrollador / Profesional IT';

  const candidateName = userProfile?.name?.trim() || 'Santiago Chavez';
  const candidateTitle = userProfile?.headline?.trim() || 'Full Stack Developer';
  const skillsList = Array.isArray(userProfile?.skills) && userProfile.skills.length > 0
    ? userProfile.skills.slice(0, 6).join(', ')
    : 'React, Node.js, TypeScript, Express, MongoDB';

  const githubUrl = userProfile?.links?.github || '';
  const linkedinUrl = userProfile?.links?.linkedin || '';
  const portfolioUrl = userProfile?.links?.portfolio || '';

  const linksArr = [];
  if (portfolioUrl) linksArr.push(`• Portfolio: ${portfolioUrl}`);
  if (githubUrl) linksArr.push(`• GitHub: ${githubUrl}`);
  if (linkedinUrl) linksArr.push(`• LinkedIn: ${linkedinUrl}`);
  const linksText = linksArr.length > 0
    ? `\n\nTe invito a explorar mis proyectos y trayectoria:\n${linksArr.join('\n')}`
    : '';

  // Fallback Offline Generator
  const getFallbackDirectPitch = () => {
    const greeting = cleanRecruiter
      ? `Hola ${cleanRecruiter}, espero que te encuentres muy bien.`
      : `Hola equipo de selección de ${cleanCompany}, espero que tengan un excelente día.`;

    const emailGreeting = cleanRecruiter
      ? `Estimado/a ${cleanRecruiter},`
      : `Estimado equipo de selección de ${cleanCompany},`;

    const subject = cleanRecruiter
      ? `Interés en oportunidades de ${cleanRole} en ${cleanCompany} — ${candidateName}`
      : `Candidatura espontánea: ${cleanRole} — ${candidateName}`;

    let mainPitch = '';
    if (channel === 'COLD_EMAIL') {
      mainPitch = `${emailGreeting}\n\nEspero que se encuentre muy bien. Me pongo en contacto directamente porque sigo de cerca el trabajo de ${cleanCompany} y me interesa explorar la posibilidad de sumarme a su equipo de desarrollo como ${cleanRole}.\n\nCuento con experiencia trabajando con tecnologías como ${skillsList}, enfocándome en construir soluciones escalables, código limpio y aportar valor inmediato a los objetivos del equipo.${linksText}\n\nQuedo a su entera disposición en caso de que dispongan de 10-15 minutos para una breve conversación o si desean que les acerque mi CV actualizado.\n\nMuchas gracias por su tiempo y consideración.\n\nSaludos cordiales,\n${candidateName}\n${candidateTitle}`;
    } else if (tone === 'DIRECT') {
      mainPitch = `${greeting}\n\nVi tu perfil como ${cleanRecruiterRole || 'responsable de talento'} en ${cleanCompany} y quería escribirte directamente. Me especializo como ${candidateTitle} con foco en ${skillsList}.\n\nMe entusiasma mucho lo que están construyendo en ${cleanCompany} y me gustaría ponerme a disposición para oportunidades como ${cleanRole}.${linksText}\n\n¿Tendrías unos minutos esta semana para conversar o compartirte mi CV?\n\n¡Muchas gracias por tu tiempo!\n\nSaludos,\n${candidateName}`;
    } else if (tone === 'ENTHUSIASTIC') {
      mainPitch = `${greeting}\n\n¡Espero que estés teniendo una excelente semana! Sigo con gran admiración el crecimiento y proyectos de ${cleanCompany}. Como ${candidateTitle}, me apasiona resolver desafíos técnicos con ${skillsList}.\n\nMe encantaría conectar y evaluar si mi perfil puede ser de valor para el equipo en posiciones de ${cleanRole}.${linksText}\n\nQuedo a tu disposición para charlar cuando gustes.\n\n¡Un saludo cordial y muchas gracias!\n\n${candidateName}`;
    } else {
      // CORDIAL por defecto
      mainPitch = `${greeting}\n\nMe pongo en contacto contigo al ver tu rol en ${cleanCompany}. Soy ${candidateName}, ${candidateTitle}, y me interesa mucho la oportunidad de colaborar en su equipo técnico aportando mi experiencia en ${skillsList}.\n\nConsidero que mi enfoque pragmático y compromiso con la calidad pueden ser un gran aporte para los desafíos de ${cleanCompany}.${linksText}\n\nDesde ya muchas gracias por tu tiempo; quedo a tu total disposición si surge una oportunidad o si deseas conocer más de mi perfil.\n\n¡Que tengas una muy buena semana!\n\nSaludos cordiales,\n${candidateName}`;
    }

    const shortGreeting = cleanRecruiter ? `Hola ${cleanRecruiter},` : `Hola equipo de ${cleanCompany},`;
    const safeRole = cleanRole.length > 25 ? `${cleanRole.slice(0, 22)}...` : cleanRole;
    const safeCompany = cleanCompany.length > 18 ? `${cleanCompany.slice(0, 15)}...` : cleanCompany;
    let rawShort = `${shortGreeting} ¿cómo estás? Me gustaría conectar y ponerme a disposición para roles de ${safeRole} en ${safeCompany}. ¡Saludos!`;
    if (rawShort.length > 200) {
      rawShort = rawShort.slice(0, 197) + '...';
    }

    const companySummary = companyInfo
      ? companyInfo.slice(0, 250)
      : `${cleanCompany} es una empresa referente en su sector, orientada al crecimiento y la innovación tecnológica.`;

    return {
      pitch: mainPitch,
      shortNote: rawShort,
      subject,
      companySummary,
    };
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim() || apiKey === 'tu_api_key_aqui') {
    return getFallbackDirectPitch();
  }

  let profileContext = `Candidato: ${candidateName} (${candidateTitle}).`;
  if (userProfile?.bio) profileContext += `\nBio: ${userProfile.bio}`;
  if (skillsList) profileContext += `\nStack técnico: ${skillsList}`;
  if (linksArr.length > 0) profileContext += `\nEnlaces:\n${linksArr.join('\n')}`;

  const prompt = `
Eres un Experto Senior en Outbound Recruiting, Estrategias de Networking y Prospección Directa para Profesionales de Tecnología en JobFlow.
Tu objetivo es generar un MENSAJE DE CONTACTO DIRECTO (Cold Outreach / Pitch) sumamente natural, persuasivo, profesional y personalizado para enviarle a un reclutador o líder técnico.

Perfil del Candidato:
"""
${profileContext}
"""

Datos del Destinatario y la Empresa:
- Reclutador / Destinatario: "${cleanRecruiter || 'Responsable de Selección / Tech Recruiter'}"
- Cargo del Reclutador: "${cleanRecruiterRole || 'Talent Acquisition / Líder Técnico'}"
- Empresa: "${cleanCompany}"
- Sitio web / Enlace: "${companyWebsite || ''}"
- Información / Contexto de la Empresa: "${companyInfo || 'Empresa de tecnología'}"
- Rol de interés: "${cleanRole}"
- Canal preferido: "${channel}" (LINKEDIN_DM = Mensaje directo de LinkedIn, LINKEDIN_NOTE = Nota de conexión <=200 caracteres, COLD_EMAIL = Correo formal)
- Tono deseado: "${tone}" (CORDIAL, ENTHUSIASTIC o DIRECT)
${customInstructions ? `- Instrucciones adicionales del usuario: "${customInstructions}"` : ''}

REGLAS CRÍTICAS DE REDACCIÓN:
1. "pitch": Mensaje principal optimizado para el canal y tono solicitados.
   - Debe saludar al reclutador por su nombre de forma empática y natural.
   - Debe justificar brevemente el motivo del contacto conectando las habilidades técnicas del candidato con el valor que aportaría a la empresa.
   - Debe incluir los enlaces profesionales del candidato de forma orgánica.
   - Debe incluir un Call To Action (CTA) claro, amable y de bajo compromiso (ej. "disponibilidad para una breve llamada o compartir CV").
2. "shortNote": **LÍMITE ESTRICTO DE MÁXIMO 190-200 CARACTERES**. Para la nota de conexión de LinkedIn. Conciso, directo y educado.
3. "subject": Asunto atractivo y profesional para correo electrónico si aplica.
4. "companySummary": Resumen de 1-2 oraciones claras sobre a qué se dedica la empresa y qué la hace atractiva.

Responde ÚNICAMENTE un objeto JSON estrictamente válido:
{
  "pitch": "Texto completo del mensaje directo personalizado",
  "shortNote": "Mensaje corto de hasta 200 caracteres para nota de conexión",
  "subject": "Asunto recomendado para email",
  "companySummary": "Breve resumen contextual de la empresa"
}
`;

  try {
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    const response = await ai.models.generateContent({
      model: primaryModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawJson = response?.text || (typeof response?.candidates?.[0]?.content?.parts?.[0]?.text === 'string' ? response.candidates[0].content.parts[0].text : '{}');
    const cleaned = extractJson(rawJson);
    const parsed = JSON.parse(cleaned);

    const fallback = getFallbackDirectPitch();

    let parsedShort = typeof parsed.shortNote === 'string' && parsed.shortNote.trim()
      ? parsed.shortNote.trim()
      : fallback.shortNote;

    if (parsedShort.length > 200) {
      parsedShort = parsedShort.slice(0, 197) + '...';
    }

    return {
      pitch: typeof parsed.pitch === 'string' && parsed.pitch.trim() ? parsed.pitch.trim() : fallback.pitch,
      shortNote: parsedShort,
      subject: typeof parsed.subject === 'string' && parsed.subject.trim() ? parsed.subject.trim() : fallback.subject,
      companySummary: typeof parsed.companySummary === 'string' && parsed.companySummary.trim() ? parsed.companySummary.trim() : fallback.companySummary,
    };
  } catch (err) {
    console.warn('[AI Service] Error generando pitch directo con Gemini, usando fallback:', err.message);
    return getFallbackDirectPitch();
  }
};

export default {
  analyzeJobPosting,
  generateFollowUpMessage,
  generateDirectOutreachPitch,
};

