import { Router } from 'express';
import { downloadApplicationsPdf } from '../controllers/reportController.js';

const router = Router();

// Endpoint de descarga de reporte PDF: GET /api/reports/pdf
router.get('/pdf', downloadApplicationsPdf);

export default router;
