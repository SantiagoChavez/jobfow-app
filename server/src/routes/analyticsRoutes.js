import { Router } from 'express';
import { getAnalyticsSummary } from '../controllers/analyticsController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

// Endpoint consolidado de métricas: GET /api/analytics/summary
router.get('/summary', protect, getAnalyticsSummary);

export default router;
