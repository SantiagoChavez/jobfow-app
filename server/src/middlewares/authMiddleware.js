import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getJwtSecret } from '../utils/generateToken.js';

/**
 * Middleware para proteger rutas privadas mediante validación de token JWT Bearer.
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extraer token del encabezado 'Bearer <token>'
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, getJwtSecret());

      // Obtener usuario excluyendo el campo password
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado, usuario no encontrado',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('Error al verificar token JWT:', error.message);
      return res.status(401).json({
        success: false,
        message: 'No autorizado, token inválido o expirado',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado, token no proporcionado',
    });
  }
};

export default protect;
