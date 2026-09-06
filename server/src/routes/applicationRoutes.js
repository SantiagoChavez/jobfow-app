import { Router } from 'express';
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  addInteraction,
} from '../controllers/applicationController.js';

const router = Router();

// Rutas base: /api/applications
router.route('/')
  .post(createApplication)
  .get(getApplications);

// Rutas por ID: /api/applications/:id
router.route('/:id')
  .get(getApplicationById)
  .delete(deleteApplication);

// Cambio de estado: /api/applications/:id/status
router.route('/:id/status')
  .patch(updateApplicationStatus);

// Registro de interacciones: /api/applications/:id/interactions
router.route('/:id/interactions')
  .post(addInteraction);

export default router;

