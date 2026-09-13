import { Router } from 'express';
import {
  registerUser,
  loginUser,
  googleAuthUser,
  getMe,
  updateTheme,
  updateProfile,
  importGithubProfile,
  extractProfileFromCv,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas públicas de autenticación
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuthUser);

// Rutas privadas para perfil y preferencias
router.get('/me', protect, getMe);
router.patch('/theme', protect, updateTheme);
router.patch('/profile', protect, updateProfile);
router.post('/profile/import-github', protect, importGithubProfile);
router.post('/profile/extract-ai', protect, extractProfileFromCv);

export default router;
