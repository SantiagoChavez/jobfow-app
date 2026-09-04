import { Router } from 'express';
import {
  createApplication,
  getApplications,
  getApplicationById,
} from '../controllers/applicationController.js';

const router = Router();

// Rutas base: /api/applications
router.route('/')
  .post(createApplication)
  .get(getApplications);

// Rutas por ID: /api/applications/:id
router.route('/:id')
  .get(getApplicationById);

export default router;
