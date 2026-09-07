import Application from '../models/Application.js';
import { generateApplicationsPdfReport } from '../services/pdfService.js';

/**
 * @desc    Generar y descargar reporte PDF estructurado de postulaciones
 * @route   GET /api/reports/pdf
 * @access  Public
 */
export const downloadApplicationsPdf = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    let dateRangeLabel = '';

    if (from || to) {
      filter.appliedAt = {};
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) {
          filter.appliedAt.$gte = fromDate;
        }
      }
      if (to) {
        const toDate = new Date(to);
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

    // Calcular métricas básicas del período
    const totalApplications = applications.length;
    const totalInterviews = applications.filter((app) =>
      ['ENTREVISTA', 'OFERTA'].includes(app.status)
    ).length;
    const totalOffers = applications.filter((app) => app.status === 'OFERTA').length;
    const totalResponded = applications.filter(
      (app) => app.responseTimeDays !== null && app.responseTimeDays !== undefined
    ).length;
    const responseRate = totalApplications > 0
      ? Number(((totalResponded / totalApplications) * 100).toFixed(1))
      : 0;

    const metrics = {
      totalApplications,
      totalInterviews,
      totalOffers,
      responseRate,
    };

    // Generar buffer binario del PDF
    const pdfBuffer = await generateApplicationsPdfReport(applications, metrics, {
      from,
      to,
      label: dateRangeLabel,
    });

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
