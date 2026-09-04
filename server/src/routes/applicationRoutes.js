import { Router } from 'express';
import { createApplication } from '../controllers/applicationController.js';

const router = Router();

// Rutas base: /api/applications
router.route('/').post(createApplication);

export default router;
