import { Router } from 'express';
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  addInteraction,
} from '../controllers/applicationController.js';
import { previewMatch } from '../controllers/matchController.js';

const router = Router();

// Rutas base: /api/applications
// POST: Crear postulación
// GET: Listar postulaciones con soporte de paginación (?page, ?limit), ordenamiento (?sortBy, ?order) y filtros (?status, ?priority, ?workMode, ?search)
router.route('/')
  .post(createApplication)
  .get(getApplications);

// Previsualización de afinidad de skills: /api/applications/match-preview
router.route('/match-preview')
  .post(previewMatch);

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

