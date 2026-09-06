import { Router } from 'express';
import { getAnalyticsSummary } from '../controllers/analyticsController.js';

const router = Router();

// Endpoint consolidado de métricas: GET /api/analytics/summary
router.get('/summary', getAnalyticsSummary);

export default router;
