import { Router } from 'express';
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  addInteraction,
  updateInteraction,
  deleteInteraction,
} from '../controllers/applicationController.js';
import { previewMatch } from '../controllers/matchController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

// Previsualización de afinidad de skills (algorítmica): /api/applications/match-preview
router.route('/match-preview')
  .post(previewMatch);

// Proteger todas las operaciones privadas de postulaciones
router.use(protect);

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

// Edición y eliminación de interacciones individuales: /api/applications/:id/interactions/:interactionId
router.route('/:id/interactions/:interactionId')
  .put(updateInteraction)
  .delete(deleteInteraction);

export default router;

