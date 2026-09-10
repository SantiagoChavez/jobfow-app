import { analyzeJobPosting } from '../services/aiService.js';

/**
 * @desc    Analizar descripción de empleo con IA y generar pitch de presentación
 * @route   POST /api/ai/analyze-job
 * @access  Public
 */
export const analyzeJob = async (req, res) => {
  try {
    const rawText = req.body?.text ?? req.body?.jobDescription ?? req.body?.requirementsRaw;
    const userProfile = req.body?.userProfile;

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 15) {
      return res.status(400).json({
        success: false,
        error: 'El texto de la vacante es requerido y debe ser representativo (mínimo 15 caracteres).',
        message: 'El texto de la vacante es requerido y debe ser representativo (mínimo 15 caracteres).',
      });
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
