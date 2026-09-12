import { Router } from 'express';
import { downloadApplicationsPdf } from '../controllers/reportController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

// Endpoint de descarga de reporte PDF: GET /api/reports/pdf
router.get('/pdf', protect, downloadApplicationsPdf);

export default router;
