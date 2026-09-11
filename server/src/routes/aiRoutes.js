import { Router } from 'express';
import { analyzeJob } from '../controllers/aiController.js';

const router = Router();

// POST /api/ai/analyze-job - Analizar vacante y generar pitch de contacto con IA
router.post('/analyze-job', analyzeJob);

export default router;
