import { Router } from 'express';
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
} from '../controllers/applicationController.js';

const router = Router();

// Rutas base: /api/applications
router.route('/')
  .post(createApplication)
  .get(getApplications);

// Rutas por ID: /api/applications/:id
router.route('/:id')
  .get(getApplicationById);

// Cambio de estado: /api/applications/:id/status
router.route('/:id/status')
  .patch(updateApplicationStatus);

export default router;
