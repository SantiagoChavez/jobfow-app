import jwt from 'jsonwebtoken';
import { analyzeJobPosting } from '../services/aiService.js';
import User from '../models/User.js';
import { getJwtSecret } from '../utils/generateToken.js';

/**
 * @desc    Analizar descripción de empleo con IA y generar pitch de presentación
 * @route   POST /api/ai/analyze-job
 * @access  Public (enriquecido con perfil si está autenticado)
 */
export const analyzeJob = async (req, res) => {
  try {
    const rawText = req.body?.text ?? req.body?.jobDescription ?? req.body?.requirementsRaw;
    let userProfile = req.body?.userProfile;

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 15) {
      return res.status(400).json({
        success: false,
        error: 'El texto de la vacante es requerido y debe ser representativo (mínimo 15 caracteres).',
        message: 'El texto de la vacante es requerido y debe ser representativo (mínimo 15 caracteres).',
      });
    }

    // Si no se proporcionó perfil explícito pero el usuario está autenticado
    if (!userProfile) {
      let resolvedUser = req.user;
      if (!resolvedUser && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, getJwtSecret());
          resolvedUser = await User.findById(decoded.id).select('-password');
        } catch {
          // Fallback defensivo a perfil por defecto
        }
      }

      if (resolvedUser) {
        userProfile = {
          name: resolvedUser.name,
          headline: resolvedUser.headline || 'Full Stack Developer',
          bio: resolvedUser.bio || '',
          skills: resolvedUser.skills || [],
          links: resolvedUser.links || {},
        };
      }
    }

    const result = await analyzeJobPosting(rawText.trim(), userProfile);

    return res.status(200).json({
      success: true,
      data: result,
      ...result,
    });
  } catch (error) {
    console.error('Error al analizar vacante con IA:', error);

    const isTimeout = error.message?.includes('Timeout');
    const isApiKeyError = error.message?.includes('GEMINI_API_KEY');
    const statusCode = isTimeout ? 504 : isApiKeyError ? 500 : 502;

    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Error al procesar el análisis de la vacante con IA.',
      message: error.message || 'Error al procesar el análisis de la vacante con IA.',
    });
  }
};

export default {
  analyzeJob,
};
