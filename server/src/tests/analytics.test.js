import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Application from '../models/Application.js';

describe('GET /api/analytics/summary - Analítica y Métricas (MongoDB Aggregation Pipeline)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper para simular el comportamiento del Aggregation Pipeline sobre un dataset en memoria
   */
  const simulateAggregation = (applications) => {
    if (!applications || applications.length === 0) {
      return [
        {
          kpiMetrics: [],
          statusDistribution: [],
          responseStats: [],
          fastestCompanies: [],
        },
      ];
    }

    const totalApplications = applications.length;
    const totalInterviews = applications.filter((a) =>
      ['ENTREVISTA', 'OFERTA'].includes(a.status)
    ).length;
    const totalOffers = applications.filter((a) => a.status === 'OFERTA').length;
    const totalResponded = applications.filter(
      (a) => a.responseTimeDays !== null && a.responseTimeDays !== undefined
    ).length;

    // Distribución por estado
    const statusCounts = {};
    applications.forEach((a) => {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusCounts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // Métricas de respuesta
    const respondedApps = applications.filter(
      (a) => a.responseTimeDays !== null && a.responseTimeDays !== undefined
    );
    const avgResponseDays =
      respondedApps.length > 0
        ? respondedApps.reduce((acc, a) => acc + a.responseTimeDays, 0) / respondedApps.length
        : 0;
    const responseStats = respondedApps.length > 0 ? [{ avgResponseDays }] : [];

    // Ranking de empresas más ágiles
    const companyStats = {};
    respondedApps.forEach((a) => {
      const comp = a.company?.name;
      if (comp) {
        if (!companyStats[comp]) {
          companyStats[comp] = { sum: 0, count: 0 };
        }
        companyStats[comp].sum += a.responseTimeDays;
        companyStats[comp].count += 1;
      }
    });

    const fastestCompanies = Object.entries(companyStats)
      .map(([company, data]) => ({
        company,
        avgResponseDays: Number((data.sum / data.count).toFixed(1)),
        count: data.count,
      }))
      .sort((a, b) => a.avgResponseDays - b.avgResponseDays)
      .slice(0, 5);

    return [
      {
        kpiMetrics: [
          {
            totalApplications,
            totalInterviews,
            totalOffers,
            totalResponded,
          },
        ],
        statusDistribution,
        responseStats,
        fastestCompanies,
      },
    ];
  };

  it('Test 1 (Base vacía): Probar que GET /api/analytics/summary retorne status 200 con métricas en cero o arrays vacíos sin romper por división por cero', async () => {
    vi.spyOn(Application, 'aggregate').mockImplementation(() =>
      Promise.resolve(simulateAggregation([]))
    );

    const res = await request(app).get('/api/analytics/summary');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      kpis: {
        totalApplications: 0,
        totalInterviews: 0,
        totalOffers: 0,
        responseRate: 0,
      },
      statusDistribution: [],
      responseMetrics: {
        avgResponseDays: 0,
        fastestCompanies: [],
      },
    });
  });

  it('Test 2 (Métricas reales): Calcular conteos de KPIs, tasa de respuesta y promedio aritmético de días de respuesta', async () => {
    const sampleApplications = [
      { company: { name: 'Mercado Libre' }, role: 'Fullstack Dev', status: 'ENVIADA', responseTimeDays: null },
      { company: { name: 'Globant' }, role: 'Backend Dev', status: 'CONTACTO', responseTimeDays: 3 },
      { company: { name: 'Despegar' }, role: 'Node.js Dev', status: 'ENTREVISTA', responseTimeDays: 7 },
      { company: { name: 'Globant' }, role: 'Tech Lead', status: 'ENTREVISTA', responseTimeDays: 5 },
      { company: { name: 'Auth0' }, role: 'Software Engineer', status: 'OFERTA', responseTimeDays: 1 },
    ];

    vi.spyOn(Application, 'aggregate').mockImplementation(() =>
      Promise.resolve(simulateAggregation(sampleApplications))
    );

    const res = await request(app).get('/api/analytics/summary');

    expect(res.status).toBe(200);

    // 1. Verificación de KPIs
    // Total: 5 | Entrevistas (ENTREVISTA + OFERTA): 3 | Ofertas: 1 | Con Respuesta: 4
    expect(res.body.kpis.totalApplications).toBe(5);
    expect(res.body.kpis.totalInterviews).toBe(3);
    expect(res.body.kpis.totalOffers).toBe(1);

    // Tasa de respuesta: (4 / 5) * 100 = 80.0%
    expect(res.body.kpis.responseRate).toBe(80.0);

    // 2. Verificación de Promedio de Tiempos de Respuesta
    // (3 + 7 + 5 + 1) / 4 = 16 / 4 = 4.0 días
    expect(res.body.responseMetrics.avgResponseDays).toBe(4.0);

    // 3. Verificación de Ranking de Empresas más ágiles (ordenadas ascendente por tiempo)
    expect(res.body.responseMetrics.fastestCompanies).toHaveLength(3);
    expect(res.body.responseMetrics.fastestCompanies[0]).toEqual({
      company: 'Auth0',
      avgResponseDays: 1.0,
      count: 1,
    });
    expect(res.body.responseMetrics.fastestCompanies[1]).toEqual({
      company: 'Globant',
      avgResponseDays: 4.0, // (3 + 5) / 2
      count: 2,
    });
    expect(res.body.responseMetrics.fastestCompanies[2]).toEqual({
      company: 'Despegar',
      avgResponseDays: 7.0,
      count: 1,
    });

    // 4. Verificación de Distribución de Estados
    const entrevistaDist = res.body.statusDistribution.find((s) => s.status === 'ENTREVISTA');
    expect(entrevistaDist).toBeDefined();
    expect(entrevistaDist.count).toBe(2);
    expect(entrevistaDist.percentage).toBe(40.0); // (2 / 5) * 100
  });

  it('Manejo de Errores: Debe responder 500 si el pipeline de agregación arroja una excepción', async () => {
    vi.spyOn(Application, 'aggregate').mockRejectedValue(new Error('Fallo de conexión a la base de datos'));

    const res = await request(app).get('/api/analytics/summary');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error interno del servidor al calcular las analíticas');
  });
});
