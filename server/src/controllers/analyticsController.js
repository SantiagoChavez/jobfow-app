import Application from '../models/Application.js';

/**
 * @desc    Obtener métricas y analíticas consolidadas mediante Aggregation Pipeline de MongoDB
 * @route   GET /api/analytics/summary
 * @access  Public
 */
export const getAnalyticsSummary = async (req, res) => {
  try {
    const [result] = await Application.aggregate([
      {
        $facet: {
          // Pipeline 1: Métricas KPI Principales
          kpiMetrics: [
            {
              $group: {
                _id: null,
                totalApplications: { $sum: 1 },
                totalInterviews: {
                  $sum: {
                    $cond: [{ $in: ['$status', ['ENTREVISTA', 'OFERTA']] }, 1, 0],
                  },
                },
                totalOffers: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'OFERTA'] }, 1, 0],
                  },
                },
                totalResponded: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ['$responseTimeDays', null] },
                          { $ne: [{ $type: '$responseTimeDays' }, 'missing'] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],

          // Pipeline 2: Distribución de Postulaciones por Estado
          statusDistribution: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
            {
              $sort: { count: -1 },
            },
            {
              $project: {
                _id: 0,
                status: '$_id',
                count: 1,
              },
            },
          ],

          // Pipeline 3: Promedio Global de Tiempos de Respuesta
          responseStats: [
            {
              $match: {
                responseTimeDays: { $ne: null },
              },
            },
            {
              $group: {
                _id: null,
                avgResponseDays: { $avg: '$responseTimeDays' },
              },
            },
          ],

          // Pipeline 4: Empresas más Ágiles (Top 5 en Tiempo de Respuesta)
          fastestCompanies: [
            {
              $match: {
                responseTimeDays: { $ne: null },
                'company.name': { $exists: true, $ne: '' },
              },
            },
            {
              $group: {
                _id: '$company.name',
                avgResponseDays: { $avg: '$responseTimeDays' },
                count: { $sum: 1 },
              },
            },
            {
              $sort: { avgResponseDays: 1, count: -1 },
            },
            {
              $limit: 5,
            },
            {
              $project: {
                _id: 0,
                company: '$_id',
                avgResponseDays: { $round: ['$avgResponseDays', 1] },
                count: 1,
              },
            },
          ],
        },
      },
    ]);

    // 1. Extraer y procesar KPIs
    const kpiData = result?.kpiMetrics?.[0] || {};
    const totalApplications = kpiData.totalApplications || 0;
    const totalInterviews = kpiData.totalInterviews || 0;
    const totalOffers = kpiData.totalOffers || 0;
    const totalResponded = kpiData.totalResponded || 0;

    const responseRate = totalApplications > 0
      ? Number(((totalResponded / totalApplications) * 100).toFixed(1))
      : 0;

    const kpis = {
      totalApplications,
      totalInterviews,
      totalOffers,
      responseRate,
    };

    // 2. Procesar Distribución por Estado con cálculo de porcentaje
    const statusDistribution = (result?.statusDistribution || []).map((item) => ({
      status: item.status,
      count: item.count,
      percentage: totalApplications > 0
        ? Number(((item.count / totalApplications) * 100).toFixed(1))
        : 0,
    }));

    // 3. Procesar Tiempos de Respuesta y Empresas Ágiles
    const responseStats = result?.responseStats?.[0];
    const avgResponseDays = responseStats?.avgResponseDays != null
      ? Number(Number(responseStats.avgResponseDays).toFixed(1))
      : 0;

    const fastestCompanies = (result?.fastestCompanies || []).map((item) => ({
      company: item.company,
      avgResponseDays: Number(Number(item.avgResponseDays).toFixed(1)),
      count: item.count,
    }));

    const responseMetrics = {
      avgResponseDays,
      fastestCompanies,
    };

    // 4. Retornar Respuesta Consolidada
    return res.status(200).json({
      kpis,
      statusDistribution,
      responseMetrics,
    });
  } catch (error) {
    console.error('Error al obtener analíticas consolidadas:', error);
    return res.status(500).json({
      error: 'Error interno del servidor al calcular las analíticas',
    });
  }
};
