import { Router } from 'express';
import {
  createApplication,
  getApplications,
} from '../controllers/applicationController.js';

const router = Router();

// Rutas base: /api/applications
router.route('/')
  .post(createApplication)
  .get(getApplications);

export default router;
