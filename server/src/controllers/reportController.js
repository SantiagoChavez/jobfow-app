import Application from '../models/Application.js';
import { generateApplicationsPdfReport } from '../services/pdfService.js';

/**
 * @desc    Generar y descargar reporte PDF estructurado de postulaciones
 * @route   GET /api/reports/pdf
 * @access  Private (requiere protect)
 */
export const downloadApplicationsPdf = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    let dateRangeLabel = '';

    // Filtrar por el usuario autenticado
    if (req.user?._id) {
      filter.user = req.user._id;
    }

    if (from || to) {
      filter.appliedAt = {};
      if (from) {
        const fromDate = from.includes('T') ? new Date(from) : new Date(`${from}T00:00:00.000Z`);
        if (!isNaN(fromDate.getTime())) {
          filter.appliedAt.$gte = fromDate;
        }
      }
      if (to) {
        // Asegurar que abarque hasta el último milisegundo del día (23:59:59.999) para incluir las postulaciones de hoy
        const toDate = to.includes('T') ? new Date(to) : new Date(`${to}T23:59:59.999Z`);
        if (!isNaN(toDate.getTime())) {
          filter.appliedAt.$lte = toDate;
        }
      }
      dateRangeLabel = `${from || 'Inicio'} — ${to || 'Hoy'}`;
    } else {
      // Por defecto: últimos 30 días
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filter.appliedAt = { $gte: thirtyDaysAgo };
      dateRangeLabel = 'Últimos 30 días';
    }

    // Consultar postulaciones filtradas
    const applications = await Application.find(filter).sort({ appliedAt: -1 });

    // Calcular métricas completas del período para estadísticas y gráficos
    const totalApplications = applications.length;
    const statusCounts = {
      ENVIADA: 0,
      CONTACTO: 0,
      ENTREVISTA: 0,
      RECHAZADA: 0,
      OFERTA: 0,
    };
    const workModeCounts = {
      REMOTE: 0,
      HYBRID: 0,
      ON_SITE: 0,
    };
    const priorityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    };

    let totalResponseDays = 0;
    let responseCount = 0;
    let pitchSentCount = 0;
    let totalMatchScore = 0;
    let matchScoreCount = 0;

    applications.forEach((app) => {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }
      if (workModeCounts[app.workMode] !== undefined) {
        workModeCounts[app.workMode]++;
      }
      if (priorityCounts[app.priority] !== undefined) {
        priorityCounts[app.priority]++;
      }
      if (app.responseTimeDays !== null && app.responseTimeDays !== undefined) {
        totalResponseDays += app.responseTimeDays;
        responseCount++;
      }
      if (app.suggestedPitch && app.suggestedPitch.trim().length > 0) {
        pitchSentCount++;
      }
      if (typeof app.matchScore === 'number' && !isNaN(app.matchScore)) {
        totalMatchScore += app.matchScore;
        matchScoreCount++;
      }
    });

    const totalInterviews = (statusCounts.ENTREVISTA || 0) + (statusCounts.OFERTA || 0);
    const totalOffers = statusCounts.OFERTA || 0;
    const totalResponded = responseCount > 0
      ? responseCount
      : (totalApplications - (statusCounts.ENVIADA || 0));
    const responseRate = totalApplications > 0
      ? Number(((totalResponded / totalApplications) * 100).toFixed(1))
      : 0;
    const avgResponseTime = responseCount > 0
      ? Number((totalResponseDays / responseCount).toFixed(1))
      : null;
    const pitchUsageRate = totalApplications > 0
      ? Number(((pitchSentCount / totalApplications) * 100).toFixed(1))
      : 0;
    const avgMatchScore = matchScoreCount > 0
      ? Math.round(totalMatchScore / matchScoreCount)
      : null;

    const metrics = {
      totalApplications,
      totalInterviews,
      totalOffers,
      totalResponded,
      responseRate,
      avgResponseTime,
      pitchSentCount,
      pitchUsageRate,
      avgMatchScore,
      statusCounts,
      workModeCounts,
      priorityCounts,
    };

    // Generar buffer binario del PDF
    const pdfBuffer = await generateApplicationsPdfReport(
      applications,
      metrics,
      {
        from,
        to,
        label: dateRangeLabel,
      },
      req.user
    );

    // Configurar encabezados HTTP para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="jobflow-reporte.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar reporte PDF de postulaciones:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al generar el reporte PDF',
      message: 'Error interno del servidor al generar el reporte PDF',
    });
  }
};
