import jwt from 'jsonwebtoken';

/**
 * Obtiene y valida la clave secreta para la firma y verificación de tokens JWT.
 * En entornos de producción exige obligatoriamente la presencia de process.env.JWT_SECRET.
 * @returns {string} Clave secreta
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ ADVERTENCIA: JWT_SECRET no configurado en entorno de producción. Usando clave secreta por defecto.');
    }
    return 'jobflow_secret_key_2026_production_grade';
  }
  return secret.trim();
};

/**
 * Genera un token JWT firmado con el ID de usuario y expiración a 30 días.
 * @param {string|import('mongoose').Types.ObjectId} id
 * @returns {string} Token JWT
 */
export const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: '30d',
  });
};

export default generateToken;
