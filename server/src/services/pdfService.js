import PDFDocument from 'pdfkit-table';

const STATUS_MAP = {
  ENVIADA: 'Enviada',
  CONTACTO: 'En Contacto',
  ENTREVISTA: 'Entrevista',
  RECHAZADA: 'Rechazada',
  OFERTA: 'Oferta',
};

const STATUS_COLOR_MAP = {
  ENVIADA: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF', bar: '#1E3A8A' },
  CONTACTO: { bg: '#F0F9FF', border: '#0284C7', text: '#0369A1', bar: '#0284C7' },
  ENTREVISTA: { bg: '#FEFCE8', border: '#CA8A04', text: '#854D0E', bar: '#CA8A04' },
  OFERTA: { bg: '#F0FDF4', border: '#16A34A', text: '#15803D', bar: '#16A34A' },
  RECHAZADA: { bg: '#F8FAFC', border: '#94A3B8', text: '#475569', bar: '#64748B' },
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

const INTERACTION_TYPE_MAP = {
  POSTULACION_ENVIADA: '📤 Postulación Enviada',
  MENSAJE_ENVIADO: '💬 Mensaje / Pitch Enviado',
  RESPUESTA_RECIBIDA: '📥 Respuesta Recibida',
  CHALLENGE_TECNICO: '💻 Challenge Técnico',
  PRUEBA_TECNICA: '🧪 Prueba Técnica',
  ENTREVISTA: '🎙️ Entrevista Agendada',
  RECHAZO: '❌ Notificación de Rechazo',
  OFERTA: '🎉 Propuesta / Oferta Recibida',
};

/**
 * Formatea fechas a string DD/MM/YYYY
 */
const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

/**
 * Dibuja barra decorativa superior
 */
const drawTopBar = (doc) => {
  const pageWidth = doc.page.width;
  doc.rect(0, 0, pageWidth, 6).fill('#1E3A8A');
  doc.rect(0, 6, pageWidth, 2).fill('#FACC15');
};

/**
 * Dibuja encabezado para páginas secundarias
 */
const drawPageHeader = (doc, title = 'Bitácora Detallada por Empresa') => {
  drawTopBar(doc);
  const pageWidth = doc.page.width;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1E3A8A')
    .text('JOBFLOW', 40, 16, { lineBreak: false });
  doc.font('Helvetica').fontSize(8.5).fillColor('#64748B')
    .text(` |  ${title}`, 92, 16, { lineBreak: false });

  doc.strokeColor('#E2E8F0').lineWidth(0.5)
    .moveTo(40, 28)
    .lineTo(pageWidth - 40, 28)
    .stroke();
  doc.y = 38;
};

/**
 * Genera un reporte PDF vectorial estructurado con identidad visual JobFlow,
 * gráficos estadísticos, tabla ejecutiva y bitácora detallada de pitch/respuestas por empresa.
 *
 * @param {Array} applications - Lista de postulaciones
 * @param {Object} metrics - Resumen de métricas calculadas
 * @param {Object} dateRange - Rango de fechas { from, to, label }
 * @param {Object} user - Usuario autenticado
 * @returns {Promise<Buffer>} - Buffer binario del documento PDF
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
  const pageHeight = doc.page.height;
  const contentWidth = pageWidth - 80;

  // ==========================================
  // PÁGINA 1: RESUMEN EJECUTIVO, KPIS Y GRÁFICOS
  // ==========================================
  drawTopBar(doc);

  // 1. Encabezado principal
  doc.font('Helvetica-Bold').fontSize(17).fillColor('#0B1329')
    .text('JobFlow — Informe Ejecutivo & Bitácora', 40, 22);

  // Información del postulante / candidato
  const candidateName = user?.name || 'Santiago Chavez';
  const candidateEmail = user?.email || 'chavezsantiago480@gmail.com';
  const candidateTitle = user?.headline || 'Full Stack Developer';

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1E3A8A')
    .text(candidateName, 40, 44, { continued: true })
    .font('Helvetica').fillColor('#475569')
    .text(` • ${candidateTitle} `)
    .font('Helvetica').fillColor('#64748B')
    .text(candidateEmail, 40, 55);

  // Período de fechas y emisión
  doc.font('Helvetica').fontSize(8).fillColor('#64748B');
  const periodText = dateRange.label
    ? `Período: ${dateRange.label}`
    : `Período: ${dateRange.from || 'Inicio'} — ${dateRange.to || 'Hoy'}`;
  doc.text(periodText, 40, 68);

  const generatedAt = `Fecha de emisión: ${new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })}`;
  doc.text(generatedAt, pageWidth - 190, 68, { width: 150, align: 'right' });

  // Línea divisoria de encabezado
  doc.strokeColor('#E2E8F0').lineWidth(0.8)
    .moveTo(40, 80)
    .lineTo(pageWidth - 40, 80)
    .stroke();

  // 2. Bloque de 6 Cajas Métricas (KPI Cards - 2 filas)
  const totalApps = metrics.totalApplications || applications.length || 0;
  const totalInterviews = metrics.totalInterviews || 0;
  const totalOffers = metrics.totalOffers || 0;
  const responseRate = metrics.responseRate || 0;
  const avgResponseTime = metrics.avgResponseTime ? `${metrics.avgResponseTime} d` : 'N/A';
  const pitchSentCount = metrics.pitchSentCount || 0;
  const pitchUsageRate = metrics.pitchUsageRate || (totalApps > 0 ? Math.round((pitchSentCount / totalApps) * 100) : 0);

  const kpisRow1 = [
    { label: 'Total Postulaciones', value: String(totalApps), color: '#1E3A8A' },
    { label: 'Entrevistas / Proceso', value: String(totalInterviews), color: '#0284C7' },
    { label: 'Ofertas Conseguidas', value: String(totalOffers), color: '#16A34A' },
  ];

  const kpisRow2 = [
    { label: 'Tasa de Respuesta', value: `${responseRate}%`, color: '#CA8A04' },
    { label: 'Tiempo Prom. Respuesta', value: avgResponseTime, color: '#6366F1' },
    { label: 'Pitches de IA Enviados', value: `${pitchSentCount} (${pitchUsageRate}%)`, color: '#0EA5E9' },
  ];

  const kpiY1 = 88;
  const kpiY2 = 130;
  const cardW = (contentWidth - 16) / 3;
  const cardH = 36;

  const drawKpiRow = (cards, startY) => {
    cards.forEach((kpi, idx) => {
      const curX = 40 + idx * (cardW + 8);
      doc.roundedRect(curX, startY, cardW, cardH, 4)
        .fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.roundedRect(curX, startY, 3, cardH, 2).fill(kpi.color);
      doc.font('Helvetica').fontSize(7).fillColor('#64748B')
        .text(kpi.label, curX + 7, startY + 5, { width: cardW - 10 });
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A')
        .text(kpi.value, curX + 7, startY + 17, { width: cardW - 10 });
    });
  };

  drawKpiRow(kpisRow1, kpiY1);
  drawKpiRow(kpisRow2, kpiY2);

  // 3. Sección de Gráficos Estadísticos Vectoriales
  const chartsY = 174;
  const chartBoxW = (contentWidth - 12) / 2;
  const chartBoxH = 104;

  // --- Gráfico 1: Embudo & Distribución por Estado ---
  doc.roundedRect(40, chartsY, chartBoxW, chartBoxH, 6)
    .fillAndStroke('#FFFFFF', '#E2E8F0');
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0B1329')
    .text('📊 Distribución por Estado de Postulación', 48, chartsY + 8);

  const statusCounts = metrics.statusCounts || {
    ENVIADA: applications.filter((a) => a.status === 'ENVIADA').length,
    CONTACTO: applications.filter((a) => a.status === 'CONTACTO').length,
    ENTREVISTA: applications.filter((a) => a.status === 'ENTREVISTA').length,
    RECHAZADA: applications.filter((a) => a.status === 'RECHAZADA').length,
    OFERTA: applications.filter((a) => a.status === 'OFERTA').length,
  };

  const statusChartItems = [
    { label: 'Enviadas', count: statusCounts.ENVIADA || 0, color: '#1E3A8A' },
    { label: 'En Contacto', count: statusCounts.CONTACTO || 0, color: '#0284C7' },
    { label: 'Entrevistas', count: statusCounts.ENTREVISTA || 0, color: '#CA8A04' },
    { label: 'Ofertas', count: statusCounts.OFERTA || 0, color: '#16A34A' },
    { label: 'Rechazadas', count: statusCounts.RECHAZADA || 0, color: '#94A3B8' },
  ];

  const maxBarWidth = chartBoxW - 110;
  statusChartItems.forEach((item, idx) => {
    const itemY = chartsY + 26 + idx * 15;
    const pct = totalApps > 0 ? (item.count / totalApps) : 0;
    const barWidth = Math.max(Math.round(pct * maxBarWidth), item.count > 0 ? 3 : 0);

    doc.font('Helvetica').fontSize(7).fillColor('#475569')
      .text(item.label, 48, itemY + 1, { width: 45 });

    // Barra de fondo gris
    doc.roundedRect(95, itemY + 1, maxBarWidth, 7, 2).fill('#F1F5F9');
    // Barra de color
    if (barWidth > 0) {
      doc.roundedRect(95, itemY + 1, barWidth, 7, 2).fill(item.color);
    }
    // Valor numérico y porcentaje
    const pctText = `${item.count} (${Math.round(pct * 100)}%)`;
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#334155')
      .text(pctText, 95 + maxBarWidth + 4, itemY + 1, { width: 40, align: 'left' });
  });

  // --- Gráfico 2: Modalidades & Afinidad Técnica ---
  const chart2X = 40 + chartBoxW + 12;
  doc.roundedRect(chart2X, chartsY, chartBoxW, chartBoxH, 6)
    .fillAndStroke('#FFFFFF', '#E2E8F0');
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0B1329')
    .text('🎯 Modalidad & Afinidad Técnica (IA)', chart2X + 8, chartsY + 8);

  const workModeCounts = metrics.workModeCounts || {
    REMOTE: applications.filter((a) => a.workMode === 'REMOTE').length,
    HYBRID: applications.filter((a) => a.workMode === 'HYBRID').length,
    ON_SITE: applications.filter((a) => a.workMode === 'ON_SITE').length,
  };

  const workModes = [
    { label: 'Remoto', count: workModeCounts.REMOTE || 0, color: '#0284C7' },
    { label: 'Híbrido', count: workModeCounts.HYBRID || 0, color: '#6366F1' },
    { label: 'Presencial', count: workModeCounts.ON_SITE || 0, color: '#64748B' },
  ];

  workModes.forEach((wm, idx) => {
    const wmY = chartsY + 26 + idx * 15;
    const wmPct = totalApps > 0 ? (wm.count / totalApps) : 0;
    const wmBarW = Math.max(Math.round(wmPct * maxBarWidth), wm.count > 0 ? 3 : 0);

    doc.font('Helvetica').fontSize(7).fillColor('#475569')
      .text(wm.label, chart2X + 8, wmY + 1, { width: 45 });

    doc.roundedRect(chart2X + 55, wmY + 1, maxBarWidth, 7, 2).fill('#F1F5F9');
    if (wmBarW > 0) {
      doc.roundedRect(chart2X + 55, wmY + 1, wmBarW, 7, 2).fill(wm.color);
    }
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#334155')
      .text(`${wm.count} (${Math.round(wmPct * 100)}%)`, chart2X + 55 + maxBarWidth + 4, wmY + 1, { width: 40 });
  });

  // Indicador de Afinidad Técnica Promedio
  const avgMatch = metrics.avgMatchScore !== null && metrics.avgMatchScore !== undefined
    ? metrics.avgMatchScore
    : (totalApps > 0
        ? Math.round(
            applications.filter((a) => a.matchScore).reduce((acc, a) => acc + a.matchScore, 0) /
            Math.max(applications.filter((a) => a.matchScore).length, 1)
          ) || 0
        : 0);

  const matchY = chartsY + 76;
  doc.strokeColor('#E2E8F0').lineWidth(0.5)
    .moveTo(chart2X + 8, matchY - 4)
    .lineTo(chart2X + chartBoxW - 8, matchY - 4)
    .stroke();

  doc.font('Helvetica-Bold').fontSize(7).fillColor('#0F172A')
    .text('Match Técnico Promedio:', chart2X + 8, matchY);
  doc.font('Helvetica-Bold').fontSize(7).fillColor('#0284C7')
    .text(`${avgMatch}%`, chart2X + chartBoxW - 35, matchY, { width: 25, align: 'right' });

  doc.roundedRect(chart2X + 8, matchY + 11, chartBoxW - 16, 6, 2).fill('#F1F5F9');
  const matchBarW = Math.round(((avgMatch || 0) / 100) * (chartBoxW - 16));
  if (matchBarW > 0) {
    doc.roundedRect(chart2X + 8, matchY + 11, matchBarW, 6, 2).fill('#0284C7');
  }

  // 4. Tabla Ejecutiva de Postulaciones (Página 1)
  const tableTitleY = chartsY + chartBoxH + 14;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#0B1329')
    .text('📋 Tabla Resumen de Postulaciones', 40, tableTitleY);

  const tableRows = applications.length > 0
    ? applications.map((app) => [
        app.company?.name || 'N/A',
        app.role || 'N/A',
        STATUS_MAP[app.status] || app.status || 'Enviada',
        WORK_MODE_MAP[app.workMode] || app.workMode || 'Remoto',
        PRIORITY_MAP[app.priority] || app.priority || 'Media',
        app.matchScore ? `${app.matchScore}%` : 'N/A',
        formatDate(app.appliedAt),
      ])
    : [['-', 'Sin postulaciones registradas en este período', '-', '-', '-', '-', '-']];

  const table = {
    headers: [
      { label: 'Empresa', width: 90, align: 'left', headerColor: '#1E3A8A', headerOpacity: 1 },
      { label: 'Puesto / Rol', width: 125, align: 'left', headerColor: '#1E3A8A', headerOpacity: 1 },
      { label: 'Estado', width: 68, align: 'center', headerColor: '#1E3A8A', headerOpacity: 1 },
      { label: 'Modalidad', width: 65, align: 'center', headerColor: '#1E3A8A', headerOpacity: 1 },
      { label: 'Prioridad', width: 55, align: 'center', headerColor: '#1E3A8A', headerOpacity: 1 },
      { label: 'Match', width: 45, align: 'center', headerColor: '#1E3A8A', headerOpacity: 1 },
      { label: 'Fecha', width: 67, align: 'center', headerColor: '#1E3A8A', headerOpacity: 1 },
    ],
    rows: tableRows,
  };

  doc.y = tableTitleY + 12;

  await doc.table(table, {
    prepareHeader: () => {
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#FFFFFF');
    },
    prepareRow: () => {
      doc.font('Helvetica').fontSize(7.5).fillColor('#1E293B');
    },
    padding: 4,
    columnsSize: [90, 125, 68, 65, 55, 45, 67],
  });

  // =========================================================================
  // PÁGINA 2 EN ADELANTE: BITÁCORA DETALLADA POR EMPRESA (PITCH & RESPUESTAS)
  // =========================================================================
  if (applications.length > 0) {
    doc.addPage();
    drawPageHeader(doc, 'Bitácora Detallada por Empresa (Pitches y Respuestas)');

    // Callout de introducción de la sección
    doc.roundedRect(40, doc.y + 4, contentWidth, 32, 4)
      .fillAndStroke('#F8FAFC', '#E2E8F0');
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1E3A8A')
      .text('🎯 Bitácora de Comunicación & Seguimiento Personalizado', 50, doc.y + 10);
    doc.font('Helvetica').fontSize(7.5).fillColor('#64748B')
      .text('Detalle individualizado por empresa: propuesta enviada / pitch de presentación y feedback o respuestas obtenidas.', 50, doc.y + 22);

    doc.y += 44;

    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];
      const companyName = app.company?.name || 'Empresa Confidencial';
      const role = app.role || 'Puesto no especificado';
      const statusLabel = STATUS_MAP[app.status] || app.status || 'Enviada';
      const statusColor = STATUS_COLOR_MAP[app.status] || STATUS_COLOR_MAP.ENVIADA;
      const workModeLabel = WORK_MODE_MAP[app.workMode] || 'Remoto';
      const priorityLabel = PRIORITY_MAP[app.priority] || 'Media';
      const appliedDate = formatDate(app.appliedAt);
      const pitchText = app.suggestedPitch && app.suggestedPitch.trim().length > 0
        ? app.suggestedPitch.trim()
        : null;

      // Recolectar interacciones recibidas / respuestas
      const interactions = Array.isArray(app.interactions) ? app.interactions : [];
      const responseInteractions = interactions.filter((inter) =>
        ['RESPUESTA_RECIBIDA', 'ENTREVISTA', 'CHALLENGE_TECNICO', 'PRUEBA_TECNICA', 'RECHAZO', 'OFERTA'].includes(inter.type)
      );

      // Calcular altura requerida para estimar si entra en la página actual
      doc.font('Helvetica').fontSize(7.5);
      const pitchHeight = pitchText ? Math.min(doc.heightOfString(pitchText, { width: contentWidth - 24, lineGap: 2 }), 90) : 18;
      
      let responsesEstimatedHeight = 24;
      if (responseInteractions.length > 0) {
        responseInteractions.forEach((inter) => {
          const noteText = inter.notes ? `: ${inter.notes}` : '';
          responsesEstimatedHeight += doc.heightOfString(noteText, { width: contentWidth - 30, lineGap: 2 }) + 14;
        });
      }

      const totalCardHeight = 40 + pitchHeight + responsesEstimatedHeight + 25;

      // Si no entra en la página, salto de página
      if (doc.y + totalCardHeight > pageHeight - 45) {
        doc.addPage();
        drawPageHeader(doc, 'Bitácora Detallada por Empresa (Continuación)');
        doc.y = 42;
      }

      const cardStartY = doc.y;

      // 1. Cabecera de la ficha de empresa
      doc.roundedRect(40, cardStartY, contentWidth, 24, 4)
        .fillAndStroke('#F1F5F9', '#CBD5E1');

      // Nombre de Empresa y Rol
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F172A')
        .text(`${i + 1}. ${companyName}`, 48, cardStartY + 7, { continued: true })
        .font('Helvetica').fillColor('#475569')
        .text(` — ${role}`);

      // Badge de Estado en la esquina derecha
      const badgeWidth = 65;
      const badgeX = pageWidth - 40 - badgeWidth - 6;
      doc.roundedRect(badgeX, cardStartY + 4, badgeWidth, 16, 3)
        .fillAndStroke(statusColor.bg, statusColor.border);
      doc.font('Helvetica-Bold').fontSize(7).fillColor(statusColor.text)
        .text(statusLabel, badgeX, cardStartY + 8, { width: badgeWidth, align: 'center' });

      // Sub-datos de la postulación
      let curY = cardStartY + 28;
      doc.font('Helvetica').fontSize(7).fillColor('#64748B');
      let metaText = `Fecha de Postulación: ${appliedDate}  |  Modalidad: ${workModeLabel}  |  Prioridad: ${priorityLabel}`;
      if (app.matchScore) {
        metaText += `  |  Match Técnico: ${app.matchScore}%`;
      }
      if (app.recruiter?.name) {
        metaText += `  |  Contacto: ${app.recruiter.name} ${app.recruiter.email ? `(${app.recruiter.email})` : ''}`;
      }
      doc.text(metaText, 48, curY);
      curY += 12;

      // 2. Sub-tarjeta: 📤 ¿Qué envié yo? (Pitch de Presentación)
      const pitchBoxStartY = curY;
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0369A1')
        .text('📤 Propuesta Enviada / Pitch de Presentación:', 48, pitchBoxStartY);
      curY += 11;

      if (pitchText) {
        doc.roundedRect(48, curY, contentWidth - 16, pitchHeight + 8, 3)
          .fillAndStroke('#F0F9FF', '#BAE6FD');
        doc.font('Helvetica-Oblique').fontSize(7).fillColor('#0C4A6E')
          .text(`"${pitchText}"`, 54, curY + 4, {
            width: contentWidth - 28,
            lineGap: 2,
            height: pitchHeight,
            ellipsis: true,
          });
        curY += pitchHeight + 14;
      } else {
        doc.font('Helvetica').fontSize(7).fillColor('#64748B')
          .text('• Postulación estándar enviada (CV y formulario de empleo). Sin pitch personalizado registrado.', 54, curY);
        curY += 13;
      }

      // 3. Sub-tarjeta: 📥 ¿Qué me respondieron? (Feedback y Respuestas)
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#15803D')
        .text('📥 Respuestas & Feedback de la Empresa:', 48, curY);
      curY += 11;

      if (responseInteractions.length > 0) {
        responseInteractions.forEach((inter) => {
          const typeLabel = INTERACTION_TYPE_MAP[inter.type] || inter.type;
          const interDate = formatDate(inter.date);
          const notes = inter.notes ? `"${inter.notes}"` : 'Sin notas adicionales adjuntas.';

          doc.font('Helvetica-Bold').fontSize(7).fillColor('#1E293B')
            .text(`• [${interDate}] ${typeLabel}: `, 54, curY, { continued: true })
            .font('Helvetica').fillColor('#334155')
            .text(notes, { width: contentWidth - 35, lineGap: 1.5 });

          curY = doc.y + 3;
        });
      } else if (['ENTREVISTA', 'OFERTA'].includes(app.status)) {
        const respTime = app.responseTimeDays ? ` (Tiempo de respuesta: ${app.responseTimeDays} días)` : '';
        doc.font('Helvetica').fontSize(7).fillColor('#15803D')
          .text(`• En proceso avanzado: ${statusLabel}${respTime}. En espera de próximas fases.`, 54, curY);
        curY += 11;
      } else if (app.status === 'RECHAZADA') {
        const respTime = app.responseTimeDays ? ` (Tiempo de respuesta: ${app.responseTimeDays} días)` : '';
        doc.font('Helvetica').fontSize(7).fillColor('#64748B')
          .text(`• Proceso finalizado: Postulación no seleccionada${respTime}.`, 54, curY);
        curY += 11;
      } else if (app.status === 'CONTACTO') {
        doc.font('Helvetica').fontSize(7).fillColor('#0284C7')
          .text('• Primer contacto establecido con el reclutador. En conversación preliminar.', 54, curY);
        curY += 11;
      } else {
        const daysFromApply = app.appliedAt
          ? Math.max(0, Math.floor((Date.now() - new Date(app.appliedAt).getTime()) / (1000 * 60 * 60 * 24)))
          : 0;
        doc.font('Helvetica').fontSize(7).fillColor('#94A3B8')
          .text(`• En espera de primer contacto / respuesta del equipo de selección (${daysFromApply} días transcurridos).`, 54, curY);
        curY += 11;
      }

      // Separador sutil
      curY += 4;
      doc.strokeColor('#E2E8F0').lineWidth(0.5)
        .moveTo(40, curY)
        .lineTo(pageWidth - 40, curY)
        .stroke();

      doc.y = curY + 8;
    }
  }

  // ==========================================
  // PIE DE PÁGINA DINÁMICO EN TODAS LAS PÁGINAS
  // ==========================================
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    const oldBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    // Línea divisoria inferior
    doc.strokeColor('#E2E8F0').lineWidth(0.5)
      .moveTo(40, doc.page.height - 30)
      .lineTo(pageWidth - 40, doc.page.height - 30)
      .stroke();

    // Leyenda JobFlow
    doc.font('Helvetica').fontSize(7.5).fillColor('#94A3B8')
      .text('Generado automáticamente por JobFlow • Plataforma de Seguimiento Profesional', 40, doc.page.height - 22, {
        align: 'left',
        lineBreak: false,
      });

    // Paginación
    doc.font('Helvetica').fontSize(7.5).fillColor('#94A3B8')
      .text(`Página ${i + 1} de ${range.count}`, pageWidth - 140, doc.page.height - 22, {
        width: 100,
        align: 'right',
        lineBreak: false,
      });

    doc.page.margins.bottom = oldBottomMargin;
  }

  doc.end();
  return bufferPromise;
};
