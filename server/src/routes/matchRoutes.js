import { Router } from 'express';
import { previewMatch } from '../controllers/matchController.js';

const router = Router();

// POST /api/applications/match-preview o /api/match/preview
router.post('/match-preview', previewMatch);
router.post('/preview', previewMatch);

export default router;
