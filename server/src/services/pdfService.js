import PDFDocument from 'pdfkit-table';

const STATUS_MAP = {
  ENVIADA: 'Enviada',
  CONTACTO: 'En Contacto',
  ENTREVISTA: 'Entrevista',
  RECHAZADA: 'Rechazada',
  OFERTA: 'Oferta',
};

const WORK_MODE_MAP = {
  REMOTE: 'Remoto',
  HYBRID: 'Híbrido',
  ON_SITE: 'Presencial',
};

const PRIORITY_MAP = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

/**
 * Genera un reporte PDF vectorial estructurado con identidad visual JobFlow, KPIs y tabla de postulaciones.
 * @param {Array} applications - Lista de postulaciones filtradas
 * @param {Object} metrics - Resumen de métricas calculadas { totalApplications, totalInterviews, totalOffers, responseRate }
 * @param {Object} dateRange - Rango de fechas { from, to, label }
 * @param {Object} user - Usuario autenticado { name, email }
 * @returns {Promise<Buffer>} - Buffer binario del documento PDF generado
 */
export const generateApplicationsPdfReport = async (
  applications = [],
  metrics = {},
  dateRange = {},
  user = null
) => {
  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
    bufferPages: true,
  });

  const buffers = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  const bufferPromise = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));
  });

  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - 80;

  // 1. Barra decorativa superior (Identidad Deep Cobalt & Gold)
  doc.rect(0, 0, pageWidth, 6).fill('#1E3A8A');
  doc.rect(0, 6, pageWidth, 2).fill('#FACC15');

  // 2. Encabezado principal
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#0B1329')
    .text('JobFlow — Resumen de Postulaciones', 40, 24);

  // Información del postulante / candidato
  const candidateName = user?.name || 'Santiago Chavez';
  const candidateEmail = user?.email || 'chavezsantiago480@gmail.com';
  const candidateTitle = 'Full Stack Developer';

  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1E3A8A')
    .text(candidateName, 40, 48, { continued: true })
    .font('Helvetica').fillColor('#475569')
    .text(` • ${candidateTitle} `)
    .font('Helvetica').fillColor('#64748B')
    .text(candidateEmail, 40, 60);

  // Período de fechas y emisión
  doc.font('Helvetica').fontSize(8.5).fillColor('#64748B');
  const periodText = dateRange.label
    ? `Período: ${dateRange.label}`
    : `Período: ${dateRange.from || 'Inicio'} — ${dateRange.to || 'Hoy'}`;
  doc.text(periodText, 40, 74);

  const generatedAt = `Fecha de emisión: ${new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })}`;
  doc.text(generatedAt, pageWidth - 190, 74, { width: 150, align: 'right' });

  // Línea divisoria de encabezado
  doc.strokeColor('#E2E8F0').lineWidth(1)
    .moveTo(40, 88)
    .lineTo(pageWidth - 40, 88)
    .stroke();

  // 3. Bloque de Cajas Métricas (KPIs)
  const boxY = 96;
  const boxWidth = (contentWidth - 30) / 4;
  const boxHeight = 44;

  const kpiCards = [
    { label: 'Total Postulaciones', value: String(metrics.totalApplications || 0), color: '#1E3A8A' },
    { label: 'En Proceso / Entrevistas', value: String(metrics.totalInterviews || 0), color: '#0284C7' },
    { label: 'Ofertas Conseguidas', value: String(metrics.totalOffers || 0), color: '#16A34A' },
    { label: 'Tasa de Respuesta', value: `${metrics.responseRate || 0}%`, color: '#CA8A04' },
  ];

  kpiCards.forEach((kpi, idx) => {
    const currentX = 40 + idx * (boxWidth + 10);

    // Fondo y borde de la tarjeta
    doc.roundedRect(currentX, boxY, boxWidth, boxHeight, 4)
      .fillAndStroke('#F8FAFC', '#E2E8F0');

    // Borde lateral de acento de color
    doc.roundedRect(currentX, boxY, 3.5, boxHeight, 2).fill(kpi.color);

    // Texto KPI
    doc.font('Helvetica').fontSize(7.5).fillColor('#64748B')
      .text(kpi.label, currentX + 8, boxY + 7, { width: boxWidth - 12 });

    doc.font('Helvetica-Bold').fontSize(14).fillColor('#0F172A')
      .text(kpi.value, currentX + 8, boxY + 22, { width: boxWidth - 12 });
  });

  // 4. Tabla estructurada de postulaciones
  doc.y = boxY + boxHeight + 16;
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#0B1329')
    .text('Detalle de Postulaciones', 40, doc.y);

  doc.moveDown(0.6);

  // Formatear filas de postulaciones con traducciones amigables
  const tableRows = applications.length > 0
    ? applications.map((app) => [
        app.company?.name || 'N/A',
        app.role || 'N/A',
        STATUS_MAP[app.status] || app.status || 'Enviada',
        WORK_MODE_MAP[app.workMode] || app.workMode || 'Remoto',
        PRIORITY_MAP[app.priority] || app.priority || 'Media',
        app.appliedAt
          ? new Date(app.appliedAt).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : 'N/A',
      ])
    : [['-', 'Sin postulaciones registradas en este período', '-', '-', '-', '-']];

  const table = {
    headers: [
      { label: 'Empresa', width: 95, align: 'left', headerColor: '#1E3A8A', headerOpacity: 1 },
      { label: 'Puesto', width: 125, align: 'left', headerColor: '#1E3A8A', headerOpacity: 1 },
      { label: 'Estado', width: 75, align: 'center', headerColor: '#1E3A8A', headerOpacity: 1 },
      { label: 'Modalidad', width: 75, align: 'center', headerColor: '#1E3A8A', headerOpacity: 1 },
      { label: 'Prioridad', width: 65, align: 'center', headerColor: '#1E3A8A', headerOpacity: 1 },
      { label: 'Fecha', width: 75, align: 'center', headerColor: '#1E3A8A', headerOpacity: 1 },
    ],
    rows: tableRows,
  };

  await doc.table(table, {
    prepareHeader: () => {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#FFFFFF');
    },
    prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
      doc.font('Helvetica').fontSize(8).fillColor('#1E293B');
    },
    padding: 6,
    columnsSize: [95, 125, 75, 75, 65, 75],
  });

  // 5. Pie de página dinámico para todas las páginas
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    const oldBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    // Línea divisoria inferior
    doc.strokeColor('#E2E8F0').lineWidth(0.5)
      .moveTo(40, doc.page.height - 35)
      .lineTo(pageWidth - 40, doc.page.height - 35)
      .stroke();

    // Leyenda JobFlow
    doc.font('Helvetica').fontSize(8).fillColor('#94A3B8')
      .text('Generado automáticamente por JobFlow • Plataforma de Seguimiento Profesional', 40, doc.page.height - 26, {
        align: 'left',
        lineBreak: false,
      });

    // Paginación
    doc.font('Helvetica').fontSize(8).fillColor('#94A3B8')
      .text(`Página ${i + 1} de ${range.count}`, pageWidth - 140, doc.page.height - 26, {
        width: 100,
        align: 'right',
        lineBreak: false,
      });

    doc.page.margins.bottom = oldBottomMargin;
  }

  doc.end();
  return bufferPromise;
};
