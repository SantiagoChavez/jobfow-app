import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @desc    Registrar nuevo usuario tradicional (email y contraseña)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validar nombre
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es obligatorio',
      });
    }

    // Validar email
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico es obligatorio',
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona un correo electrónico válido',
      });
    }

    // Validar contraseña
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verificar si ya existe usuario con ese correo
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado',
      });
    }

    // Crear el usuario
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        theme: user.theme || 'dark',
      },
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al registrar usuario',
    });
  }
};

/**
 * @desc    Autenticar usuario con email y contraseña
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona correo y contraseña',
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Si fue registrado sólo por Google y no tiene password configurado
    if (!user.password && user.googleId) {
      return res.status(400).json({
        success: false,
        message: 'Esta cuenta fue creada con Google. Por favor inicia sesión con Google.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        theme: user.theme || 'dark',
      },
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al iniciar sesión',
    });
  }
};

/**
 * @desc    Autenticación federada con Google OAuth (Google Identity Services)
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleAuthUser = async (req, res) => {
  try {
    const { credential, token: incomingToken } = req.body;
    const idToken = credential || incomingToken;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Token de Google no proporcionado',
      });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : '';
    if (!googleClientId && process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth no está configurado en el servidor (GOOGLE_CLIENT_ID ausente).',
      });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: googleClientId || undefined,
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error('Error al verificar token con Google OAuth:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Token de Google inválido o expirado (o audiencia no autorizada)',
      });
    }

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Payload del token de Google no contiene correo válido',
      });
    }

    const { sub: googleId, email, name, picture } = payload;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Buscar si ya existe usuario con este googleId
    let user = await User.findOne({ googleId });

    // 2. Si no, buscar por email para vincular cuenta
    if (!user) {
      user = await User.findOne({ email: normalizedEmail });

      if (user) {
        user.googleId = googleId;
        if (!user.avatar && picture) {
          user.avatar = picture;
        }
        await user.save();
      } else {
        // 3. Crear nuevo usuario federado
        user = await User.create({
          name: name || 'Usuario Google',
          email: normalizedEmail,
          googleId,
          avatar: picture || '',
        });
      }
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        theme: user.theme || 'dark',
      },
    });
  } catch (error) {
    console.error('Error en autenticación con Google:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar autenticación con Google',
    });
  }
};

/**
 * @desc    Obtener datos del usuario autenticado
 * @route   GET /api/auth/me
 * @access  Private (requiere protect)
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};
