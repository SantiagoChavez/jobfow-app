import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Application from '../models/Application.js';
import * as aiService from '../services/aiService.js';
import { GoogleGenAI } from '@google/genai';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      constructor() {
        this.models = {
          generateContent: mockGenerateContent,
        };
      }
    },
  };
});

describe('POST /api/ai/analyze-job - Copiloto de Postulación con IA', () => {
  const originalApiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GEMINI_API_KEY = 'mock-test-key-12345';
  });

  const mockValidAiResponse = {
    companyName: 'Globant',
    companyWebsite: 'https://globant.com',
    role: 'Node.js Backend Developer',
    workMode: 'REMOTE',
    priority: 'HIGH',
    salary: 4500,
    companySummary: 'Compañía global de tecnología especializada en transformación digital e innovación.',
    matchScore: 90,
    extractedSkills: ['Node.js', 'Express', 'MongoDB', 'TypeScript'],
    missingSkills: ['Kubernetes'],
    suggestedPitch: 'Hola María, vi la vacante de Node.js Backend Developer en Globant y me pareció muy atractiva por el desafío técnico. Cuento con 4 años construyendo arquitecturas escalables con Express y MongoDB.',
  };

  it('1. Caso feliz: Debe responder 200 OK con esquema JSON tipado al analizar una vacante válida', async () => {
    vi.spyOn(aiService, 'analyzeJobPosting').mockResolvedValue(mockValidAiResponse);

    const res = await request(app)
      .post('/api/ai/analyze-job')
      .send({
        text: 'Buscamos Node.js Backend Developer Senior para Globant, 100% remoto, salario USD 4500. Requisitos: Express, MongoDB, TypeScript.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.companyName).toBe('Globant');
    expect(res.body.data.role).toBe('Node.js Backend Developer');
    expect(res.body.data.workMode).toBe('REMOTE');
    expect(res.body.data.priority).toBe('HIGH');
    expect(res.body.data.salary).toBe(4500);
    expect(res.body.data.matchScore).toBe(90);
    expect(res.body.data.extractedSkills).toEqual(expect.arrayContaining(['Node.js', 'MongoDB']));
    expect(res.body.data.suggestedPitch).toContain('Globant');
  });

  it('2. Compatibilidad: Debe aceptar el campo alternativo "jobDescription" y "requirementsRaw"', async () => {
    vi.spyOn(aiService, 'analyzeJobPosting').mockResolvedValue(mockValidAiResponse);

    const res = await request(app)
      .post('/api/ai/analyze-job')
      .send({
        jobDescription: 'Oferta de empleo completa con más de 15 caracteres de descripción requerida.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.companyName).toBe('Globant');
  });

  it('3. Validación de input: Debe responder 400 Bad Request si el texto está ausente o tiene menos de 15 caracteres', async () => {
    const resEmpty = await request(app)
      .post('/api/ai/analyze-job')
      .send({});

    expect(resEmpty.status).toBe(400);
    expect(resEmpty.body.success).toBe(false);
    expect(resEmpty.body.error).toContain('mínimo 15 caracteres');

    const resShort = await request(app)
      .post('/api/ai/analyze-job')
      .send({ text: 'Rol junior' });

    expect(resShort.status).toBe(400);
    expect(resShort.body.success).toBe(false);
  });

  it('4. Resiliencia ante Timeout: Debe responder 504 Gateway Timeout si el servicio de IA excede el tiempo límite', async () => {
    vi.spyOn(aiService, 'analyzeJobPosting').mockRejectedValue(
      new Error('Timeout: El servicio de IA tardó más de 12 segundos en responder.')
    );

    const res = await request(app)
      .post('/api/ai/analyze-job')
      .send({
        text: 'Descripción de vacante suficientemente larga para pasar la validación inicial.',
      });

    expect(res.status).toBe(504);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Timeout');
  });

  it('5. Resiliencia ante Fallos de Proveedor: Debe responder 502 Bad Gateway si la API externa arroja error de cuota o red', async () => {
    vi.spyOn(aiService, 'analyzeJobPosting').mockRejectedValue(
      new Error('Error en API externa de Gemini: Quota exceeded 429')
    );

    const res = await request(app)
      .post('/api/ai/analyze-job')
      .send({
        text: 'Descripción de vacante suficientemente larga para pasar la validación inicial.',
      });

    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Quota exceeded');
  });

  it('6. Resiliencia ante Falta de API Key: Debe responder 500 si la clave de Gemini no está configurada', async () => {
    vi.spyOn(aiService, 'analyzeJobPosting').mockRejectedValue(
      new Error('GEMINI_API_KEY no está configurada en las variables de entorno.')
    );

    const res = await request(app)
      .post('/api/ai/analyze-job')
      .send({
        text: 'Descripción de vacante suficientemente larga para pasar la validación inicial.',
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('GEMINI_API_KEY');
  });

  describe('Unidad: aiService.analyzeJobPosting con mock de GoogleGenAI', () => {
    it('Debe llamar al SDK de GoogleGenAI y parsear correctamente el payload JSON de salida', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(mockValidAiResponse),
      });

      const result = await aiService.analyzeJobPosting(
        'Buscamos Full Stack Developer para Globant con Node.js y React, remoto.'
      );

      expect(result.companyName).toBe('Globant');
      expect(result.role).toBe('Node.js Backend Developer');
      expect(result.matchScore).toBe(90);
      expect(result.workMode).toBe('REMOTE');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('Debe limpiar delimitadores markdown (```json ... ```) si el modelo los genera', async () => {
      const markdownJson = `\`\`\`json
      {
        "companyName": "Mercado Libre",
        "role": "Frontend Tech Lead",
        "workMode": "HYBRID",
        "priority": "HIGH",
        "salary": 5000,
        "companySummary": "E-commerce líder de América Latina.",
        "matchScore": 88,
        "extractedSkills": ["React", "TypeScript"],
        "missingSkills": ["GraphQL"],
        "suggestedPitch": "Hola equipo Meli, vi la posición..."
      }
      \`\`\``;

      mockGenerateContent.mockResolvedValueOnce({
        text: markdownJson,
      });

      const result = await aiService.analyzeJobPosting(
        'Buscamos Frontend Tech Lead para Mercado Libre, híbrido, salario 5000 USD.'
      );

      expect(result.companyName).toBe('Mercado Libre');
      expect(result.role).toBe('Frontend Tech Lead');
      expect(result.workMode).toBe('HYBRID');
    });

    it('Debe aplicar valores por defecto tipados si el LLM devuelve un JSON con campos faltantes', async () => {
      const incompleteJson = `{"companyName": "Startup X"}`;

      mockGenerateContent.mockResolvedValueOnce({
        text: incompleteJson,
      });

      const result = await aiService.analyzeJobPosting('Vacante sin muchos detalles para Startup X.');

      expect(result.companyName).toBe('Startup X');
      expect(result.role).toBe('');
      expect(result.workMode).toBe('REMOTE');
      expect(result.priority).toBe('MEDIUM');
      expect(result.matchScore).toBe(0);
      expect(result.extractedSkills).toEqual([]);
      expect(result.keySkills).toEqual([]);
      expect(result.missingSkills).toEqual([]);
      expect(result.suggestedPitch).toBe('');
    });
  });

  describe('Persistencia de Pitch y Resumen de IA en POST /api/applications', () => {
    it('Debe persistir suggestedPitch, companySummary y matchScore al guardar una postulación', async () => {
      const mockCreatedApp = {
        _id: 'app-123',
        company: { name: 'Globant', website: 'https://globant.com' },
        role: 'Backend Developer',
        suggestedPitch: 'Hola, soy Santiago, Full Stack Dev orientado a backend...',
        companySummary: 'Empresa multinacional de tecnología.',
        matchScore: 92,
        status: 'ENVIADA',
      };
      const createSpy = vi.spyOn(Application, 'create').mockResolvedValue(mockCreatedApp);

      const res = await request(app)
        .post('/api/applications')
        .send({
          company: { name: 'Globant', website: 'https://globant.com' },
          role: 'Backend Developer',
          suggestedPitch: 'Hola, soy Santiago, Full Stack Dev orientado a backend...',
          companySummary: 'Empresa multinacional de tecnología.',
          matchScore: 92,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          suggestedPitch: 'Hola, soy Santiago, Full Stack Dev orientado a backend...',
          companySummary: 'Empresa multinacional de tecnología.',
          matchScore: 92,
        })
      );
      expect(res.body.data.suggestedPitch).toContain('Santiago');
      expect(res.body.data.matchScore).toBe(92);
    });
  });
});

