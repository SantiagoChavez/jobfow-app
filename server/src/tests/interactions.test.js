import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import Application from '../models/Application.js';

describe('POST /api/applications/:id/interactions - Registro de Interacciones y Cálculo de Tiempos', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const createMockApplication = (overrides = {}) => {
    const appliedAt = overrides.appliedAt || new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const appDoc = new Application({
      _id: new mongoose.Types.ObjectId(),
      company: { name: 'Empresa Test', website: 'https://test.com' },
      role: 'Backend Developer',
      status: 'ENVIADA',
      appliedAt,
      responseTimeDays: null,
      interactions: [
        {
          type: 'POSTULACION_ENVIADA',
          date: appliedAt,
          notes: 'Postulación enviada inicialmente',
        },
      ],
      ...overrides,
    });

    appDoc.save = vi.fn().mockResolvedValue(appDoc);
    return appDoc;
  };

  it('Caso feliz: Registrar una interacción de tipo MENSAJE_ENVIADO y verificar que se inserta en el array interactions (status 201)', async () => {
    const mockApp = createMockApplication();
    vi.spyOn(Application, 'findById').mockResolvedValue(mockApp);

    const res = await request(app)
      .post(`/api/applications/${mockApp._id}/interactions`)
      .send({
        type: 'MENSAJE_ENVIADO',
        notes: 'Mensaje de seguimiento por LinkedIn',
      });

    expect(res.status).toBe(201);
    expect(res.body.interactions).toHaveLength(2);
    expect(res.body.interactions[1].type).toBe('MENSAJE_ENVIADO');
    expect(res.body.interactions[1].notes).toBe('Mensaje de seguimiento por LinkedIn');
    expect(mockApp.save).toHaveBeenCalledTimes(1);
  });

  it('Caso de negocio 1: Al registrar RESPUESTA_RECIBIDA, calcular correctamente responseTimeDays y cambiar status a CONTACTO', async () => {
    const appliedAt = new Date('2026-09-01T10:00:00.000Z');
    const responseDate = new Date('2026-09-06T10:00:00.000Z'); // 5 días de diferencia exacta
    const mockApp = createMockApplication({ appliedAt, status: 'ENVIADA', responseTimeDays: null });
    vi.spyOn(Application, 'findById').mockResolvedValue(mockApp);

    const res = await request(app)
      .post(`/api/applications/${mockApp._id}/interactions`)
      .send({
        type: 'RESPUESTA_RECIBIDA',
        date: responseDate.toISOString(),
        notes: 'El reclutador respondió por correo',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('CONTACTO');
    expect(res.body.responseTimeDays).toBe(5);
    expect(res.body.interactions).toHaveLength(2);
    expect(res.body.interactions[1].type).toBe('RESPUESTA_RECIBIDA');
    expect(mockApp.save).toHaveBeenCalledTimes(1);
  });

  it('Edge case 1 (Idempotencia): Una segunda RESPUESTA_RECIBIDA posterior NO debe alterar el valor original de responseTimeDays', async () => {
    const appliedAt = new Date('2026-09-01T10:00:00.000Z');
    const mockApp = createMockApplication({
      appliedAt,
      status: 'CONTACTO',
      responseTimeDays: 4, // Valor previamente calculado
    });
    vi.spyOn(Application, 'findById').mockResolvedValue(mockApp);

    const laterDate = new Date('2026-09-15T10:00:00.000Z'); // 14 días después
    const res = await request(app)
      .post(`/api/applications/${mockApp._id}/interactions`)
      .send({
        type: 'RESPUESTA_RECIBIDA',
        date: laterDate.toISOString(),
        notes: 'Segunda respuesta recibida de otro reclutador',
      });

    expect(res.status).toBe(201);
    expect(res.body.responseTimeDays).toBe(4);
    expect(res.body.interactions).toHaveLength(2);
    expect(res.body.interactions[1].type).toBe('RESPUESTA_RECIBIDA');
    expect(mockApp.save).toHaveBeenCalledTimes(1);
  });

  it('Edge case 2 (Mismo día): Respuesta recibida el mismo día de la postulación debe retornar 0 días (sin valores negativos)', async () => {
    const appliedAt = new Date('2026-09-06T08:00:00.000Z');
    const sameDayResponse = new Date('2026-09-06T12:00:00.000Z'); // 4 horas después
    const mockApp = createMockApplication({ appliedAt, status: 'ENVIADA', responseTimeDays: null });
    vi.spyOn(Application, 'findById').mockResolvedValue(mockApp);

    const res = await request(app)
      .post(`/api/applications/${mockApp._id}/interactions`)
      .send({
        type: 'RESPUESTA_RECIBIDA',
        date: sameDayResponse.toISOString(),
        notes: 'Respuesta inmediata en la misma jornada',
      });

    expect(res.status).toBe(201);
    expect(res.body.responseTimeDays).toBe(0);
    expect(res.body.status).toBe('CONTACTO');
    expect(mockApp.save).toHaveBeenCalledTimes(1);
  });

  it('Edge case 3: ID con formato inválido debe retornar 400', async () => {
    const res = await request(app)
      .post('/api/applications/invalid-mongo-id/interactions')
      .send({
        type: 'MENSAJE_ENVIADO',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ID de postulación inválido');
  });

  it('Edge case 4: ID que no existe en la base de datos debe retornar 404', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    vi.spyOn(Application, 'findById').mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/applications/${nonExistentId}/interactions`)
      .send({
        type: 'MENSAJE_ENVIADO',
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Postulación no encontrada');
  });

  it('Edge case 5: Enviar un type inexistente debe retornar 400', async () => {
    const validId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/applications/${validId}/interactions`)
      .send({
        type: 'TIPO_TOTALMENTE_INVALIDO',
        notes: 'Test',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Tipo de interacción inválido');
  });

  it('Transición a ENTREVISTA: Al registrar ENTREVISTA, cambia status a ENTREVISTA si no está en OFERTA', async () => {
    const mockApp = createMockApplication({ status: 'CONTACTO' });
    vi.spyOn(Application, 'findById').mockResolvedValue(mockApp);

    const res = await request(app)
      .post(`/api/applications/${mockApp._id}/interactions`)
      .send({
        type: 'ENTREVISTA',
        notes: 'Primera entrevista técnica con el líder del equipo',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ENTREVISTA');
  });

  it('Protección de estado OFERTA: No debe degradar el status si la postulación ya tiene estado OFERTA', async () => {
    const mockApp = createMockApplication({ status: 'OFERTA' });
    vi.spyOn(Application, 'findById').mockResolvedValue(mockApp);

    const res = await request(app)
      .post(`/api/applications/${mockApp._id}/interactions`)
      .send({
        type: 'ENTREVISTA',
        notes: 'Llamada posterior para negociar beneficios',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('OFERTA');
  });

  it('Idempotencia en PATCH status: Si se actualiza al mismo estado, responder 200 sin guardar interacciones duplicadas', async () => {
    const mockApp = createMockApplication({ status: 'CONTACTO' });
    vi.spyOn(Application, 'findById').mockResolvedValue(mockApp);

    const res = await request(app)
      .patch(`/api/applications/${mockApp._id}/status`)
      .send({ status: 'CONTACTO' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('ya se encuentra en estado CONTACTO');
    expect(mockApp.save).not.toHaveBeenCalled();
  });
});
