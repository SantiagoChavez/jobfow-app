import { Router } from 'express';
import {
  registerUser,
  loginUser,
  googleAuthUser,
  getMe,
  updateTheme,
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

export default router;
