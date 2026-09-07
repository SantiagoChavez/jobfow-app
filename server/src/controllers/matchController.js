import { calculateJobMatch } from '../services/matchService.js';

/**
 * @desc    Analizar requerimientos de una vacante y previsualizar afinidad de skills
 * @route   POST /api/applications/match-preview
 * @access  Public
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

    const result = calculateJobMatch(text);

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
