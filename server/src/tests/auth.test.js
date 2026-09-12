import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { OAuth2Client } from 'google-auth-library';

describe('Sistema de Autenticación y Autorización (/api/auth & Middleware protect)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockUserId = new mongoose.Types.ObjectId('650000000000000000000099');

  describe('1. Registro de Usuario (POST /api/auth/register)', () => {
    it('debe registrar un usuario exitosamente y retornar token JWT con DTO sanitizado (201)', async () => {
      const mockCreatedUser = {
        _id: mockUserId,
        name: 'Santiago Chavez',
        email: 'santiago@test.com',
        avatar: '',
        theme: 'dark',
      };

      vi.spyOn(User, 'findOne').mockResolvedValue(null);
      vi.spyOn(User, 'create').mockResolvedValue(mockCreatedUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Santiago Chavez',
          email: 'santiago@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toEqual({
        _id: mockUserId.toString(),
        name: 'Santiago Chavez',
        email: 'santiago@test.com',
        avatar: '',
        theme: 'dark',
      });
      expect(res.body.user.password).toBeUndefined();
    });

    it('debe responder 400 Bad Request si faltan campos obligatorios', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('El nombre es obligatorio');
    });

    it('debe responder 400 Bad Request si la contraseña tiene menos de 6 caracteres', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test',
          email: 'test@test.com',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('al menos 6 caracteres');
    });

    it('debe responder 400 Bad Request si el correo ya está registrado', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue({ _id: mockUserId, email: 'existente@test.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test',
          email: 'existente@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('ya está registrado');
    });
  });

  describe('2. Inicio de Sesión Tradicional (POST /api/auth/login)', () => {
    it('debe autenticar exitosamente con credenciales válidas (200)', async () => {
      const mockUser = {
        _id: mockUserId,
        name: 'Santiago Chavez',
        email: 'santiago@test.com',
        password: 'hashed_password',
        avatar: '',
        theme: 'dark',
        matchPassword: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'santiago@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.name).toBe('Santiago Chavez');
      expect(res.body.user.email).toBe('santiago@test.com');
      expect(mockUser.matchPassword).toHaveBeenCalledWith('password123');
    });

    it('debe responder 401 Unauthorized si la contraseña es incorrecta', async () => {
      const mockUser = {
        _id: mockUserId,
        email: 'santiago@test.com',
        password: 'hashed_password',
        matchPassword: vi.fn().mockResolvedValue(false),
      };

      vi.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'santiago@test.com',
          password: 'wrong_password',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Credenciales inválidas');
    });

    it('debe responder 401 Unauthorized si el correo no existe', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'noexiste@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Credenciales inválidas');
    });

    it('debe responder 400 Bad Request si la cuenta fue creada con Google sin contraseña', async () => {
      const mockGoogleUser = {
        _id: mockUserId,
        email: 'google@test.com',
        googleId: 'google-sub-12345',
        password: null,
      };

      vi.spyOn(User, 'findOne').mockResolvedValue(mockGoogleUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'google@test.com',
          password: 'anyPassword',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Esta cuenta fue creada con Google');
    });
  });

  describe('3. Google OAuth Federado (POST /api/auth/google)', () => {
    it('debe registrar y autenticar un usuario nuevo con Google token válido (200)', async () => {
      const mockPayload = {
        sub: 'google-sub-98765',
        email: 'googleuser@gmail.com',
        name: 'Google User',
        picture: 'https://lh3.googleusercontent.com/photo.jpg',
      };

      vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => mockPayload,
      });

      vi.spyOn(User, 'findOne').mockResolvedValue(null);
      vi.spyOn(User, 'create').mockResolvedValue({
        _id: mockUserId,
        name: mockPayload.name,
        email: mockPayload.email,
        googleId: mockPayload.sub,
        avatar: mockPayload.picture,
        theme: 'dark',
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'valid_google_jwt_token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('googleuser@gmail.com');
      expect(res.body.user.avatar).toBe('https://lh3.googleusercontent.com/photo.jpg');
    });

    it('debe responder 401 si el token de Google es inválido o no puede verificarse', async () => {
      vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockRejectedValue(
        new Error('Token signature invalid')
      );

      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'invalid_token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Token de Google inválido o expirado');
    });

    it('debe responder 400 si no se envía credential ni token en el body', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Token de Google no proporcionado');
    });
  });

  describe('4. Verificación de Perfil Activo (GET /api/auth/me)', () => {
    it('debe retornar los datos del usuario autenticado con token Bearer válido (200)', async () => {
      const token = generateToken(mockUserId);

      const mockUserDoc = {
        _id: mockUserId,
        name: 'Santiago Chavez',
        email: 'santiago@test.com',
        avatar: '',
        theme: 'dark',
      };

      const selectMock = {
        select: vi.fn().mockResolvedValue(mockUserDoc),
      };
      vi.spyOn(User, 'findById').mockReturnValue(selectMock);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('Santiago Chavez');
      expect(res.body.user.email).toBe('santiago@test.com');
    });

    it('debe responder 401 Unauthorized si no se incluye encabezado Authorization', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('token no proporcionado');
    });

    it('debe responder 401 Unauthorized si el token JWT es inválido o corrupto', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token_invalido_123');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('token inválido o expirado');
    });
  });

  describe('5. Protección de Rutas de la Aplicación con protect (401 Unauthorized)', () => {
    it('debe denegar acceso 401 a GET /api/applications sin token Bearer', async () => {
      const res = await request(app).get('/api/applications');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('token no proporcionado');
    });

    it('debe denegar acceso 401 a GET /api/analytics/summary sin token Bearer', async () => {
      const res = await request(app).get('/api/analytics/summary');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('token no proporcionado');
    });

    it('debe denegar acceso 401 a GET /api/reports/pdf sin token Bearer', async () => {
      const res = await request(app).get('/api/reports/pdf');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('token no proporcionado');
    });
  });
});
