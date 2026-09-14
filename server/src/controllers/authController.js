import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { extractSkillsFromGithub, extractProfileFromCvText } from '../services/profileService.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Precalentamiento en memoria de certificados públicos de Google para acelerar login inicial
if (typeof googleClient.getFederatedSignonCertsAsync === 'function') {
  googleClient.getFederatedSignonCertsAsync().catch(() => null);
}

/**
 * Normaliza y formatea el DTO de usuario respetando compatibilidad hacia atrás
 */
export const formatUserDto = (user) => {
  if (!user) return null;
  const dto = {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    theme: user.theme || 'dark',
  };
  if (user.headline !== undefined) dto.headline = user.headline;
  if (user.bio !== undefined) dto.bio = user.bio;
  if (user.skills !== undefined) dto.skills = user.skills;
  if (user.links !== undefined) dto.links = user.links;
  return dto;
};

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

    // 1. Buscar usuario de forma atómica indexada (por googleId o por correo normalizado)
    let user = await User.findOne({
      $or: [{ googleId }, { email: normalizedEmail }],
    });

    if (user) {
      let needsSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        needsSave = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    } else {
      // 2. Crear nuevo usuario federado si es su primer acceso
      user = await User.create({
        name: name || 'Usuario Google',
        email: normalizedEmail,
        googleId,
        avatar: picture || '',
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

/**
 * @desc    Actualizar la preferencia de tema visual del usuario ('dark' | 'light')
 * @route   PATCH /api/auth/theme
 * @access  Private (requiere protect)
 */
export const updateTheme = async (req, res) => {
  try {
    const { theme } = req.body;

    if (!theme || !['dark', 'light'].includes(theme)) {
      return res.status(400).json({
        success: false,
        message: "El tema debe ser 'dark' o 'light'",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    user.theme = theme;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Preferencia de tema actualizada a ${theme}`,
      theme: user.theme,
    });
  } catch (error) {
    console.error('Error al actualizar tema del usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar tema',
    });
  }
};

/**
 * @desc    Actualizar datos del perfil profesional y habilidades técnicas
 * @route   PATCH /api/auth/profile
 * @access  Private (requiere protect)
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, headline, bio, skills, links } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    if (name && typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }

    if (headline !== undefined && typeof headline === 'string') {
      user.headline = headline.trim();
    }

    if (bio !== undefined && typeof bio === 'string') {
      user.bio = bio.trim();
    }

    if (Array.isArray(skills)) {
      const cleanSkills = Array.from(
        new Set(
          skills
            .map((s) => (typeof s === 'string' ? s.trim() : ''))
            .filter(Boolean)
        )
      );
      user.skills = cleanSkills;
    }

    if (links && typeof links === 'object') {
      user.links = {
        github: typeof links.github === 'string' ? links.github.trim() : user.links?.github || '',
        linkedin: typeof links.linkedin === 'string' ? links.linkedin.trim() : user.links?.linkedin || '',
        portfolio: typeof links.portfolio === 'string' ? links.portfolio.trim() : user.links?.portfolio || '',
      };
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Perfil profesional actualizado exitosamente',
      user: formatUserDto(user),
    });
  } catch (error) {
    console.error('Error al actualizar perfil del usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar el perfil profesional',
    });
  }
};

/**
 * @desc    Extraer automáticamente habilidades técnicas y repositorios desde la API pública de GitHub
 * @route   POST /api/auth/profile/import-github
 * @access  Private (requiere protect)
 */
export const importGithubProfile = async (req, res) => {
  try {
    const { githubUrl, username } = req.body;
    const target = githubUrl || username;

    if (!target || typeof target !== 'string' || !target.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar una URL o nombre de usuario de GitHub válido.',
      });
    }

    const result = await extractSkillsFromGithub(target.trim());

    return res.status(200).json({
      success: true,
      data: result,
      ...result,
    });
  } catch (error) {
    console.error('Error al importar skills desde GitHub:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al importar datos desde GitHub.',
    });
  }
};

/**
 * @desc    Extraer perfil y habilidades desde texto libre de CV o LinkedIn con Gemini AI
 * @route   POST /api/auth/profile/extract-ai
 * @access  Private (requiere protect)
 */
export const extractProfileFromCv = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'El texto del CV o LinkedIn es obligatorio y debe tener al menos 20 caracteres.',
      });
    }

    const result = await extractProfileFromCvText(text.trim());

    return res.status(200).json({
      success: true,
      data: result,
      ...result,
    });
  } catch (error) {
    console.error('Error al extraer perfil con IA:', error.message);
    const statusCode = error.message?.includes('Timeout') ? 504 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al procesar el análisis de perfil con IA.',
    });
  }
};


