import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { calculateJobMatch } from '../services/matchService.js';

describe('Servicio de Matching Algorítmico (calculateJobMatch)', () => {
  it('debe calcular 100% de afinidad cuando el texto solo contiene tecnologías dominadas', () => {
    const text = 'Buscamos Fullstack Dev con experiencia en Node.js, Express, React y MongoDB.';
    const result = calculateJobMatch(text);

    expect(result.totalDetected).toBe(4);
    expect(result.matchedSkills).toEqual(
      expect.arrayContaining(['Node.js', 'Express', 'React', 'MongoDB'])
    );
    expect(result.missingSkills).toHaveLength(0);
    expect(result.matchScore).toBe(100);
  });

  it('debe calcular afinidad mixta con skills dominadas y skills faltantes del mercado', () => {
    const text = 'Requisitos excluyentes: React y Node.js. Deseable experiencia en Docker, AWS y Kubernetes.';
    const result = calculateJobMatch(text);

    expect(result.totalDetected).toBe(5);
    expect(result.matchedSkills).toEqual(
      expect.arrayContaining(['React', 'Node.js'])
    );
    expect(result.missingSkills).toEqual(
      expect.arrayContaining(['Docker', 'AWS', 'Kubernetes'])
    );
    expect(result.matchScore).toBe(40); // 2 de 5 = 40%
  });

  it('debe retornar 0% de afinidad y listas vacías cuando no hay coincidencias técnicas en el texto', () => {
    const text = 'Se busca personal administrativo para atención al cliente y gestión de archivo contable.';
    const result = calculateJobMatch(text);

    expect(result.totalDetected).toBe(0);
    expect(result.matchedSkills).toHaveLength(0);
    expect(result.missingSkills).toHaveLength(0);
    expect(result.matchScore).toBe(0);
  });

  it('debe normalizar y reconocer alias y variaciones case-insensitive', () => {
    const text = 'Buscamos desarrollador con NODE.JS, ReactJS, mongodb, TYPESCRIPT y postgresql.';
    const result = calculateJobMatch(text);

    expect(result.matchedSkills).toEqual(
      expect.arrayContaining(['Node.js', 'React', 'MongoDB', 'TypeScript', 'PostgreSQL'])
    );
    expect(result.matchScore).toBe(100);
  });
});

describe('POST /api/applications/match-preview - Endpoint HTTP', () => {
  it('debe responder 200 OK con afinidad calculada usando campo "text"', async () => {
    const res = await request(app)
      .post('/api/applications/match-preview')
      .send({
        text: 'Buscamos desarrollador React y Node.js con conocimientos de Docker.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.matchScore).toBeDefined();
    expect(res.body.matchedSkills).toContain('React');
    expect(res.body.matchedSkills).toContain('Node.js');
    expect(res.body.missingSkills).toContain('Docker');
    expect(res.body.totalDetected).toBe(3);
  });

  it('debe responder 200 OK soportando el campo alternativo "requirementsRaw"', async () => {
    const res = await request(app)
      .post('/api/applications/match-preview')
      .send({
        requirementsRaw: 'Conocimientos de Python y PostgreSQL para tareas de backend.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.matchedSkills).toEqual(
      expect.arrayContaining(['Python', 'PostgreSQL'])
    );
    expect(res.body.matchScore).toBe(100);
  });

  it('debe responder 400 Bad Request cuando el texto es una cadena vacía o solo espacios', async () => {
    const res = await request(app)
      .post('/api/applications/match-preview')
      .send({ text: '    ' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it('debe responder 400 Bad Request cuando no se provee ningún campo de texto', async () => {
    const res = await request(app)
      .post('/api/applications/match-preview')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });
});
