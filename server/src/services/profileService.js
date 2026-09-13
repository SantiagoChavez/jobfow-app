import { GoogleGenAI } from '@google/genai';
import { TECH_DICTIONARY } from '../config/skillsCatalog.js';

/**
 * Parsea y extrae el nombre de usuario de GitHub a partir de una URL o input de texto
 * @param {string} input - URL de perfil o username
 * @returns {string} Username limpio
 */
export const parseGithubUsername = (input) => {
  if (!input || typeof input !== 'string') return '';
  const cleaned = input.trim().replace(/\/+$/, '');
  const match = cleaned.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : cleaned.replace(/^@/, '');
};

/**
 * Normaliza un término técnico o topic contra el catálogo oficial de JobFlow
 * @param {string} techName
 * @returns {string} Nombre canónico o término limpio
 */
export const canonicalizeSkill = (techName) => {
  if (!techName || typeof techName !== 'string') return '';
  const clean = techName.trim();
  const lower = clean.toLowerCase();

  for (const item of TECH_DICTIONARY) {
    if (item.name.toLowerCase() === lower) return item.name;
    if (item.aliases && item.aliases.some((a) => a.toLowerCase() === lower)) {
      return item.name;
    }
  }

  // Capitalización por defecto si es una tecnología no listada en el diccionario
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

/**
 * Consulta la API pública de GitHub para extraer lenguajes dominantes y topics de repositorios
 * @param {string} usernameOrUrl
 * @returns {Promise<{ username: string, name: string, bio: string, skills: string[], repoCount: number }>}
 */
export const extractSkillsFromGithub = async (usernameOrUrl) => {
  const username = parseGithubUsername(usernameOrUrl);
  if (!username) {
    throw new Error('Nombre de usuario de GitHub inválido.');
  }

  // 1. Obtener perfil básico del usuario con timeout defensivo de 8s
  let userRes;
  try {
    userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: {
        'User-Agent': 'JobFlow-App',
        Accept: 'application/vnd.github.v3+json',
      },
      signal: AbortSignal.timeout(8000),
    });
  } catch (netErr) {
    if (netErr.name === 'TimeoutError' || netErr.name === 'AbortError') {
      throw new Error('La consulta a GitHub excedió el tiempo límite de espera (timeout).');
    }
    throw new Error(`Error de conexión con GitHub: ${netErr.message}`);
  }

  if (!userRes.ok) {
    if (userRes.status === 404) {
      throw new Error(`El usuario de GitHub "${username}" no fue encontrado.`);
    }
    if (userRes.status === 403) {
      throw new Error('Límite de solicitudes de GitHub excedido. Por favor intenta más tarde.');
    }
    throw new Error(`Error al consultar GitHub API: ${userRes.statusText}`);
  }

  const userData = await userRes.json();

  // 2. Obtener lista de repositorios públicos con timeout defensivo
  let reposRes;
  try {
    reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
      {
        headers: {
          'User-Agent': 'JobFlow-App',
          Accept: 'application/vnd.github.v3+json',
        },
        signal: AbortSignal.timeout(8000),
      }
    );
  } catch {
    reposRes = { ok: false };
  }

  const repos = reposRes.ok ? await reposRes.json() : [];
  const skillsSet = new Set();

  if (Array.isArray(repos)) {
    for (const repo of repos) {
      // Lenguaje principal del repositorio
      if (repo.language && typeof repo.language === 'string') {
        const canonical = canonicalizeSkill(repo.language);
        if (canonical) skillsSet.add(canonical);
      }

      // Topics / tags del repositorio
      if (Array.isArray(repo.topics)) {
        for (const topic of repo.topics) {
          const canonical = canonicalizeSkill(topic);
          if (canonical && canonical.length > 1) {
            skillsSet.add(canonical);
          }
        }
      }
    }
  }

  return {
    username,
    name: userData.name || username,
    bio: userData.bio || '',
    skills: Array.from(skillsSet),
    repoCount: Array.isArray(repos) ? repos.length : 0,
  };
};

/**
 * Limpia delimitadores markdown en respuestas del LLM
 */
const extractJson = (text) => {
  if (!text || typeof text !== 'string') return '{}';
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
};

/**
 * Analiza el texto de un CV o sección de LinkedIn con Google Gemini para extraer perfil y skills
 * @param {string} rawText - Texto de CV o LinkedIn
 * @returns {Promise<{ headline: string, bio: string, skills: string[], links: Object }>}
 */
export const extractProfileFromCvText = async (rawText) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim() || apiKey === 'tu_api_key_aqui') {
    throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno.');
  }

  if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 20) {
    throw new Error('El texto proporcionado es demasiado corto para extraer un perfil (mínimo 20 caracteres).');
  }

  const sanitizedText = rawText.slice(0, 8000).replace(/"""/g, "'''").trim();

  const prompt = `
Eres un Asistente Senior de Reclutamiento Técnico y Análisis de Perfiles para la plataforma JobFlow.
Tu tarea es analizar el siguiente texto correspondiente al CV, extracto o perfil de LinkedIn de un candidato y extraer de forma estructurada sus datos profesionales y habilidades técnicas.

Texto del Perfil o CV:
"""
${sanitizedText}
"""

Responde ÚNICAMENTE un objeto JSON válido, sin bloques de código adicionales ni explicaciones:
{
  "headline": "Titular profesional claro y conciso (ej: Full Stack Developer | Node.js & React)",
  "bio": "Resumen profesional conciso en primera persona destacando su trayectoria, enfoque y valor diferencial (máximo 3 oraciones)",
  "skills": ["array de tecnologías, lenguajes, frameworks, librerías, bases de datos y herramientas dominadas"],
  "links": {
    "linkedin": "url de linkedin si se menciona en el texto, o cadena vacía",
    "github": "url de github si se menciona en el texto, o cadena vacía",
    "portfolio": "url de portafolio o sitio web si se menciona, o cadena vacía"
  }
}
`;

  const primaryModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

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
    const isModelNotFound = err.status === 404 || err.message?.includes('not found') || err.message?.includes('404');
    if (isModelNotFound) {
      const fallbackModel = primaryModel === 'gemini-1.5-flash' ? 'gemini-1.5-flash-latest' : 'gemini-1.5-flash';
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
    throw new Error('La respuesta del modelo de IA no tuvo un formato JSON válido.');
  }

  const rawSkills = Array.isArray(parsed.skills) ? parsed.skills : [];
  const normalizedSkills = Array.from(
    new Set(
      rawSkills
        .map((s) => canonicalizeSkill(String(s)))
        .filter(Boolean)
    )
  );

  return {
    headline: typeof parsed.headline === 'string' ? parsed.headline.trim() : 'Software Developer',
    bio: typeof parsed.bio === 'string' ? parsed.bio.trim() : '',
    skills: normalizedSkills,
    links: {
      linkedin: typeof parsed.links?.linkedin === 'string' ? parsed.links.linkedin.trim() : '',
      github: typeof parsed.links?.github === 'string' ? parsed.links.github.trim() : '',
      portfolio: typeof parsed.links?.portfolio === 'string' ? parsed.links.portfolio.trim() : '',
    },
  };
};

export default {
  parseGithubUsername,
  canonicalizeSkill,
  extractSkillsFromGithub,
  extractProfileFromCvText,
};
