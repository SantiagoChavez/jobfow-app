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

export default {
  analyzeJobPosting,
};
