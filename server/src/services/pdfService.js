import PDFDocument from 'pdfkit-table';

/**
 * Genera un reporte PDF vectorial estructurado con identidad visual JobFlow, KPIs y tabla de postulaciones.
 * @param {Array} applications - Lista de postulaciones filtradas
 * @param {Object} metrics - Resumen de métricas calculadas { totalApplications, totalInterviews, totalOffers, responseRate }
 * @param {Object} dateRange - Rango de fechas { from, to, label }
 * @returns {Promise<Buffer>} - Buffer binario del documento PDF generado
 */
export const generateApplicationsPdfReport = async (applications = [], metrics = {}, dateRange = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        bufferPages: true,
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - 80;

      // 1. Barra decorativa superior (Identidad Deep Cobalt & Gold)
      doc.rect(0, 0, pageWidth, 6).fill('#1E3A8A');
      doc.rect(0, 6, pageWidth, 2).fill('#FACC15');

      // 2. Encabezado principal
      doc.moveDown(1.2);
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#0B1329')
        .text('JobFlow — Resumen de Postulaciones', 40, 26);

      doc.font('Helvetica').fontSize(9).fillColor('#6B7280');
      const periodText = dateRange.label
        ? `Período: ${dateRange.label}`
        : `Período: ${dateRange.from || 'Inicio'} — ${dateRange.to || 'Hoy'}`;
      doc.text(periodText, 40, 50);

      const generatedAt = `Fecha de emisión: ${new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })}`;
      doc.text(generatedAt, pageWidth - 190, 50, { width: 150, align: 'right' });

      // Línea divisoria de encabezado
      doc.strokeColor('#E5E7EB').lineWidth(1)
        .moveTo(40, 66)
        .lineTo(pageWidth - 40, 66)
        .stroke();

      // 3. Bloque de Cajas Métricas (KPIs)
      const boxY = 76;
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

      // Formatear filas de postulaciones
      const tableRows = applications.length > 0
        ? applications.map((app) => [
            app.company?.name || 'N/A',
            app.role || 'N/A',
            app.status || 'ENVIADA',
            app.workMode || 'REMOTE',
            app.priority || 'MEDIUM',
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
          { label: 'Empresa', width: 95, align: 'left' },
          { label: 'Puesto', width: 125, align: 'left' },
          { label: 'Estado', width: 75, align: 'center' },
          { label: 'Modalidad', width: 75, align: 'center' },
          { label: 'Prioridad', width: 65, align: 'center' },
          { label: 'Fecha', width: 75, align: 'center' },
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
        padding: 5,
        columnsSize: [95, 125, 75, 75, 65, 75],
      });

      // 5. Pie de página dinámico para todas las páginas
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);

        // Línea divisoria inferior
        doc.strokeColor('#E2E8F0').lineWidth(0.5)
          .moveTo(40, doc.page.height - 35)
          .lineTo(pageWidth - 40, doc.page.height - 35)
          .stroke();

        // Leyenda JobFlow
        doc.font('Helvetica').fontSize(8).fillColor('#94A3B8')
          .text('Generado automáticamente por JobFlow • Plataforma de Seguimiento Profesional', 40, doc.page.height - 27, {
            align: 'left',
          });

        // Paginación
        doc.font('Helvetica').fontSize(8).fillColor('#94A3B8')
          .text(`Página ${i + 1} de ${range.count}`, pageWidth - 140, doc.page.height - 27, {
            width: 100,
            align: 'right',
          });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
