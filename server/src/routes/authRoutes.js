import { Router } from 'express';
import {
  registerUser,
  loginUser,
  googleAuthUser,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas públicas de autenticación
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuthUser);

// Ruta privada para verificar sesión activa y perfil
router.get('/me', protect, getMe);

export default router;
