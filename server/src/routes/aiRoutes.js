import { Router } from 'express';
import { analyzeJob, generateFollowUp } from '../controllers/aiController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

// POST /api/ai/analyze-job - Analizar vacante y generar pitch de contacto con IA
router.post('/analyze-job', analyzeJob);

// POST /api/ai/follow-up - Generar mensaje de seguimiento personalizado con IA
router.post('/follow-up', protect, generateFollowUp);

export default router;

