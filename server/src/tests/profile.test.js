import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import * as profileService from '../services/profileService.js';

describe('Sistema de Perfil Profesional, Skills Dinámicas y Extracción (/api/auth/profile)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockUserId = new mongoose.Types.ObjectId('650000000000000000000123');

  describe('1. Actualización de Perfil (PATCH /api/auth/profile)', () => {
    it('debe actualizar headline, bio, skills y links del usuario autenticado (200)', async () => {
      const token = generateToken(mockUserId);

      const mockUserDoc = {
        _id: mockUserId,
        name: 'Santiago Chavez',
        email: 'santiago@test.com',
        avatar: '',
        theme: 'dark',
        headline: 'Frontend Developer',
        bio: 'Desarrollador apasionado',
        skills: ['React', 'CSS'],
        links: { github: '', linkedin: '', portfolio: '' },
        save: vi.fn().mockResolvedValue(true),
      };

      // Mock para middleware protect
      vi.spyOn(User, 'findById')
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue(mockUserDoc),
        })
        // Mock para updateProfile
        .mockResolvedValueOnce(mockUserDoc);

      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          headline: 'Full Stack Engineer | Node.js & React',
          bio: 'Especialista en backend escalable',
          skills: ['Node.js', 'React', 'TypeScript', 'MongoDB'],
          links: {
            github: 'https://github.com/SantiagoChavez',
            linkedin: 'https://linkedin.com/in/santiago-chavez',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.headline).toBe('Full Stack Engineer | Node.js & React');
      expect(res.body.user.skills).toEqual(['Node.js', 'React', 'TypeScript', 'MongoDB']);
      expect(res.body.user.links.github).toBe('https://github.com/SantiagoChavez');
      expect(mockUserDoc.save).toHaveBeenCalled();
    });

    it('debe responder 401 si no se envía encabezado Authorization', async () => {
      const res = await request(app)
        .patch('/api/auth/profile')
        .send({ headline: 'Dev' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Importación de Skills desde GitHub (POST /api/auth/profile/import-github)', () => {
    it('debe extraer skills de repositorios usando la API pública de GitHub', async () => {
      const token = generateToken(mockUserId);

      const mockUserDoc = {
        _id: mockUserId,
        name: 'Santiago',
        email: 'test@jobflow.dev',
      };

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUserDoc),
      });

      vi.spyOn(profileService, 'extractSkillsFromGithub').mockResolvedValue({
        username: 'SantiagoChavez',
        name: 'Santiago Chavez',
        bio: 'Full Stack Developer',
        skills: ['JavaScript', 'Node.js', 'React', 'MongoDB'],
        repoCount: 15,
      });

      const res = await request(app)
        .post('/api/auth/profile/import-github')
        .set('Authorization', `Bearer ${token}`)
        .send({ githubUrl: 'https://github.com/SantiagoChavez' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.skills).toContain('Node.js');
      expect(res.body.skills).toContain('React');
      expect(res.body.username).toBe('SantiagoChavez');
    });

    it('debe responder 400 si el campo githubUrl/username está vacío', async () => {
      const token = generateToken(mockUserId);

      const mockUserDoc = { _id: mockUserId };
      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUserDoc),
      });

      const res = await request(app)
        .post('/api/auth/profile/import-github')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Extracción de Perfil con IA desde Texto / CV (POST /api/auth/profile/extract-ai)', () => {
    it('debe analizar texto de CV y retornar headline, bio y skills estructuradas', async () => {
      const token = generateToken(mockUserId);

      const mockUserDoc = { _id: mockUserId };
      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUserDoc),
      });

      vi.spyOn(profileService, 'extractProfileFromCvText').mockResolvedValue({
        headline: 'Senior Backend Developer',
        bio: 'Desarrollador con más de 4 años diseñando microservicios.',
        skills: ['Python', 'FastAPI', 'Docker', 'PostgreSQL'],
        links: {
          linkedin: 'https://linkedin.com/in/test-dev',
          github: 'https://github.com/test-dev',
          portfolio: '',
        },
      });

      const res = await request(app)
        .post('/api/auth/profile/extract-ai')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Desarrollador Backend Senior con experiencia en Python, FastAPI, Docker y bases de datos PostgreSQL.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.headline).toBe('Senior Backend Developer');
      expect(res.body.skills).toEqual(['Python', 'FastAPI', 'Docker', 'PostgreSQL']);
    });

    it('debe responder 400 si el texto es menor a 20 caracteres', async () => {
      const token = generateToken(mockUserId);

      const mockUserDoc = { _id: mockUserId };
      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUserDoc),
      });

      const res = await request(app)
        .post('/api/auth/profile/extract-ai')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Texto corto' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Matching Algorítmico Dinámico con Skills del Usuario', () => {
    it('debe calcular afinidad usando las skills exclusivas del usuario autenticado', async () => {
      const token = generateToken(mockUserId);

      // Usuario personalizado solo con Python y Django (no sabe Node ni React)
      const mockCustomUser = {
        _id: mockUserId,
        name: 'Python Dev',
        skills: ['Python', 'Django'],
      };

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockCustomUser),
      });

      // Vacante que pide Python, Django, React y Node.js
      const res = await request(app)
        .post('/api/applications/match-preview')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Buscamos desarrollador con conocimientos en Python, Django, React y Node.js para nuestro equipo.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Coincide en Python y Django (2 de 4 detectadas -> 50% match)
      expect(res.body.matchedSkills).toContain('Python');
      expect(res.body.matchedSkills).toContain('Django');
      expect(res.body.missingSkills).toContain('React');
      expect(res.body.missingSkills).toContain('Node.js');
      expect(res.body.matchScore).toBe(50);
    });
  });
});
