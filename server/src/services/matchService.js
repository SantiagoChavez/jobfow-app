import { TECH_DICTIONARY, USER_SKILLS, isUserSkill } from '../config/skillsCatalog.js';

/**
 * Normaliza el texto para análisis de palabras clave.
 * @param {string} text
 * @returns {string}
 */
const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remueve tildes
};

/**
 * Analiza el texto de una vacante, extrae tecnologías y calcula la afinidad contra el perfil.
 * 
 * @param {string} jobDescriptionRaw - Texto de la oferta o descripción del puesto.
 * @param {Array<string>} [customUserSkills] - Catálogo opcional de skills del usuario.
 * @returns {{
 *   matchScore: number,
 *   matchedSkills: string[],
 *   missingSkills: string[],
 *   totalDetected: number
 * }}
 */
export const calculateJobMatch = (jobDescriptionRaw, customUserSkills = USER_SKILLS) => {
  if (!jobDescriptionRaw || typeof jobDescriptionRaw !== 'string' || !jobDescriptionRaw.trim()) {
    return {
      matchScore: 0,
      matchedSkills: [],
      missingSkills: [],
      totalDetected: 0,
    };
  }

  const normalizedText = normalizeText(jobDescriptionRaw);
  const detectedSkillsSet = new Set();

  // Escaneo contra el diccionario maestro de tecnologías
  for (const tech of TECH_DICTIONARY) {
    if (tech.regex) {
      if (tech.regex.test(jobDescriptionRaw) || tech.regex.test(normalizedText)) {
        detectedSkillsSet.add(tech.name);
      }
    } else if (tech.aliases && Array.isArray(tech.aliases)) {
      const found = tech.aliases.some((alias) => {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`\\b${escaped}\\b`, 'i');
        return pattern.test(normalizedText);
      });
      if (found) {
        detectedSkillsSet.add(tech.name);
      }
    }
  }

  const detectedSkills = Array.from(detectedSkillsSet);
  const totalDetected = detectedSkills.length;

  if (totalDetected === 0) {
    return {
      matchScore: 0,
      matchedSkills: [],
      missingSkills: [],
      totalDetected: 0,
    };
  }

  const matchedSkills = [];
  const missingSkills = [];

  for (const skill of detectedSkills) {
    if (isUserSkill(skill, customUserSkills)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const matchScore = Math.round((matchedSkills.length / totalDetected) * 100);

  return {
    matchScore,
    matchedSkills,
    missingSkills,
    totalDetected,
  };
};

export default {
  calculateJobMatch,
};
