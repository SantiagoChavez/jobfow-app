import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import Application from '../models/Application.js';

const mockUserId = new mongoose.Types.ObjectId('650000000000000000000001');

vi.mock('../middlewares/authMiddleware.js', () => ({
  protect: (req, _res, next) => {
    req.user = {
      _id: mockUserId,
      name: 'Test User',
      email: 'test@jobflow.dev',
    };
    next();
  },
}));

describe('GET /api/reports/pdf - Generación y Descarga de Reportes PDF', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('debe responder 200 OK con Content-Type application/pdf, Content-Disposition attachment y Buffer válido', async () => {
    const mockApplications = [
      {
        company: { name: 'Mercado Libre' },
        role: 'Fullstack Dev',
        status: 'ENTREVISTA',
        workMode: 'REMOTE',
        priority: 'HIGH',
        appliedAt: new Date('2026-09-02'),
        responseTimeDays: 3,
      },
      {
        company: { name: 'Globant' },
        role: 'Backend Dev',
        status: 'OFERTA',
        workMode: 'HYBRID',
        priority: 'MEDIUM',
        appliedAt: new Date('2026-09-04'),
        responseTimeDays: 5,
      },
    ];

    vi.spyOn(Application, 'find').mockReturnValue({
      sort: vi.fn().mockResolvedValue(mockApplications),
    });

    const res = await request(app).get('/api/reports/pdf');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('filename="jobflow-reporte.pdf"');

    // Verificar que el cuerpo devuelto sea un Buffer binario no vacío
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    // Verificar firma mágica de archivo PDF (%PDF)
    const pdfSignature = res.body.subarray(0, 4).toString();
    expect(pdfSignature).toBe('%PDF');
  });

  it('debe aceptar parámetros de fecha ?from=...&to=... y filtrar las postulaciones adecuadamente', async () => {
    const fromDate = '2026-09-01';
    const toDate = '2026-09-06';

    const sortMock = vi.fn().mockResolvedValue([
      {
        company: { name: 'Despegar' },
        role: 'Tech Lead',
        status: 'ENVIADA',
        workMode: 'REMOTE',
        priority: 'HIGH',
        appliedAt: new Date('2026-09-03'),
        responseTimeDays: null,
      },
    ]);

    const findSpy = vi.spyOn(Application, 'find').mockReturnValue({
      sort: sortMock,
    });

    const res = await request(app).get(`/api/reports/pdf?from=${fromDate}&to=${toDate}`);

    expect(res.status).toBe(200);
    expect(findSpy).toHaveBeenCalled();

    const queryArg = findSpy.mock.calls[0][0];
    expect(queryArg.appliedAt).toBeDefined();
    expect(queryArg.appliedAt.$gte).toEqual(new Date(`${fromDate}T00:00:00.000Z`));
    expect(queryArg.appliedAt.$lte).toEqual(new Date(`${toDate}T23:59:59.999Z`));

    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('debe generar un PDF válido aún si no hay postulaciones en el período (base vacía)', async () => {
    vi.spyOn(Application, 'find').mockReturnValue({
      sort: vi.fn().mockResolvedValue([]),
    });

    const res = await request(app).get('/api/reports/pdf');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('debe generar correctamente el PDF con bitácora detallada de pitches enviados, respuestas de empresas y gráficos', async () => {
    const mockDetailedApplications = [
      {
        company: { name: 'Mercado Libre', website: 'https://mercadolibre.com' },
        role: 'Full Stack Engineer',
        status: 'ENTREVISTA',
        workMode: 'REMOTE',
        priority: 'HIGH',
        appliedAt: new Date('2026-09-02'),
        responseTimeDays: 3,
        matchScore: 92,
        suggestedPitch: 'Hola equipo de MeLi! Cuento con experiencia en React, Node.js y microservicios para escalar la plataforma de pagos.',
        recruiter: { name: 'Ana Gómez', email: 'ana.gomez@meli.com' },
        interactions: [
          {
            type: 'POSTULACION_ENVIADA',
            date: new Date('2026-09-02'),
            notes: 'Postulación enviada vía LinkedIn con pitch personalizado.',
          },
          {
            type: 'RESPUESTA_RECIBIDA',
            date: new Date('2026-09-04'),
            notes: 'Reclutadora interesada en perfil. Agendó screening telefónico.',
          },
          {
            type: 'ENTREVISTA',
            date: new Date('2026-09-05'),
            notes: 'Screening superado exitosamente. Próximo paso: Live Coding.',
          },
        ],
      },
      {
        company: { name: 'Auth0 / Okta' },
        role: 'Backend Node.js Developer',
        status: 'ENVIADA',
        workMode: 'REMOTE',
        priority: 'MEDIUM',
        appliedAt: new Date('2026-09-05'),
        responseTimeDays: null,
        matchScore: 85,
        suggestedPitch: 'Especializado en seguridad JWT, arquitectura limpia y autenticación federada.',
        interactions: [],
      },
      {
        company: { name: 'Globant' },
        role: 'React Developer',
        status: 'RECHAZADA',
        workMode: 'HYBRID',
        priority: 'LOW',
        appliedAt: new Date('2026-08-20'),
        responseTimeDays: 7,
        matchScore: 78,
        interactions: [
          {
            type: 'RECHAZO',
            date: new Date('2026-08-27'),
            notes: 'Decidieron avanzar con un candidato con más años en AWS.',
          },
        ],
      },
    ];

    vi.spyOn(Application, 'find').mockReturnValue({
      sort: vi.fn().mockResolvedValue(mockDetailedApplications),
    });

    const res = await request(app).get('/api/reports/pdf');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(1000);

    const pdfSignature = res.body.subarray(0, 4).toString();
    expect(pdfSignature).toBe('%PDF');
  });

  it('debe responder 500 con formato JSON controlado si la base de datos falla', async () => {
    vi.spyOn(Application, 'find').mockReturnValue({
      sort: vi.fn().mockRejectedValue(new Error('Fallo crítico de base de datos')),
    });

    const res = await request(app).get('/api/reports/pdf');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Error interno del servidor al generar el reporte PDF');
  });
});

