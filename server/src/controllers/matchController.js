import jwt from 'jsonwebtoken';
import { calculateJobMatch } from '../services/matchService.js';
import User from '../models/User.js';
import { getJwtSecret } from '../utils/generateToken.js';

/**
 * @desc    Analizar requerimientos de una vacante y previsualizar afinidad de skills
 * @route   POST /api/applications/match-preview
 * @access  Public (con enriquecimiento opcional si está autenticado)
 */
export const previewMatch = async (req, res) => {
  try {
    const text = req.body?.text ?? req.body?.requirementsRaw;

    if (text === undefined || text === null || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El campo "text" o "requirementsRaw" es obligatorio y no puede estar vacío.',
        message: 'El campo "text" o "requirementsRaw" es obligatorio y no puede estar vacío.',
      });
    }

    // Resolver skills personalizadas si el usuario está autenticado
    let userSkills;
    if (Array.isArray(req.user?.skills) && req.user.skills.length > 0) {
      userSkills = req.user.skills;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, getJwtSecret());
        const user = await User.findById(decoded.id).select('skills');
        if (user && Array.isArray(user.skills) && user.skills.length > 0) {
          userSkills = user.skills;
        }
      } catch {
        // Fallback defensivo: usar catálogo maestro por defecto
      }
    }

    const result = calculateJobMatch(text, userSkills);

    return res.status(200).json({
      success: true,
      data: result,
      ...result,
    });
  } catch (error) {
    console.error('Error al procesar el análisis de afinidad de skills:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al procesar el matching de habilidades.',
      message: 'Error interno del servidor al procesar el matching de habilidades.',
    });
  }
};

export default {
  previewMatch,
};
