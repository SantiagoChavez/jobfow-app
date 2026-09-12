import PDFDocument from 'pdfkit-table';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, '../../docs/Guia-Rapida-Jobflow.pdf');

async function generateFriendlyGuide() {
  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
    bufferPages: true,
  });

  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentWidth = pageWidth - 80;

  // Paleta de colores Deep Cobalt & Gold
  const colors = {
    navyBase: '#0B1329',
    navySurface: '#172554',
    navyHighlight: '#1E3A8A',
    goldPrimary: '#FACC15',
    goldDark: '#B45309',
    skyTech: '#0284C7',
    slateDark: '#0F172A',
    slateBody: '#334155',
    slateMuted: '#64748B',
    borderLight: '#E2E8F0',
    bgCard: '#F8FAFC',
    successBg: '#ECFDF5',
    successBorder: '#10B981',
    accentBlueBg: '#F0F9FF',
    accentBlueBorder: '#BAE6FD',
  };

  const drawPageHeader = (title = 'Guia de Inicio Rapido') => {
    doc.rect(0, 0, pageWidth, 6).fill(colors.navyHighlight);
    doc.rect(0, 6, pageWidth, 2).fill(colors.goldPrimary);

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.navyHighlight)
      .text('JOBFLOW', 40, 16, { lineBreak: false });
    doc.font('Helvetica').fontSize(8.5).fillColor(colors.slateMuted)
      .text(` |  ${title}`, 92, 16, { lineBreak: false });

    doc.strokeColor(colors.borderLight).lineWidth(0.5)
      .moveTo(40, 28)
      .lineTo(pageWidth - 40, 28)
      .stroke();
  };

  const drawStepBox = (y, height, stepNum, title, text, tip = null) => {
    doc.roundedRect(40, y, contentWidth, height, 8)
      .fillAndStroke(colors.bgCard, colors.borderLight);

    // Badge numérico circular
    doc.circle(62, y + 20, 12).fill(colors.navyHighlight);
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF')
      .text(String(stepNum), 56, y + 14, { width: 12, align: 'center' });

    // Título del paso
    doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.navySurface)
      .text(title, 82, y + 14, { width: contentWidth - 95 });

    // Texto descriptivo
    doc.font('Helvetica').fontSize(9).fillColor(colors.slateBody)
      .text(text, 82, y + 32, { width: contentWidth - 95, lineGap: 3 });

    // Tip opcional
    if (tip) {
      const tipY = y + height - 24;
      doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.goldDark)
        .text(`TIP: ${tip}`, 82, tipY, { width: contentWidth - 95 });
    }
  };

  // ==========================================
  // PÁGINA 1: PORTADA & PROPÓSITO
  // ==========================================
  doc.rect(0, 0, pageWidth, pageHeight).fill(colors.navyBase);

  // Detalles decorativos
  doc.rect(0, 0, pageWidth, 8).fill(colors.goldPrimary);
  doc.rect(40, 50, 4, 80).fill(colors.goldPrimary);

  doc.font('Helvetica-Bold').fontSize(34).fillColor('#FFFFFF')
    .text('JobFlow', 56, 54);
  doc.font('Helvetica').fontSize(15).fillColor(colors.goldPrimary)
    .text('GUIA DE USO FACIL E INTUITIVA', 56, 96);
  doc.font('Helvetica').fontSize(10.5).fillColor('#94A3B8')
    .text('Aprende a gestionar tus busquedas laborales y conectar con reclutadores sin estres', 56, 118);

  // Tarjeta de bienvenida
  const welcomeY = 175;
  doc.roundedRect(40, welcomeY, contentWidth, 165, 10)
    .fillAndStroke('#131F3F', '#243B73');

  doc.font('Helvetica-Bold').fontSize(16).fillColor('#FFFFFF')
    .text('Bienvenido a una busqueda de empleo organizada', 60, welcomeY + 20);

  doc.font('Helvetica').fontSize(9.5).fillColor('#CBD5E1')
    .text(
      'Buscar trabajo no deberia ser una experiencia caotica de planillas desordenadas y correos olvidados. ' +
      'Jobflow fue creado para que tengas el control total de tus oportunidades, sepas en que etapa se encuentra cada postulacion ' +
      'y ahorres horas de trabajo redactando presentaciones con la ayuda de nuestro Asistente de Inteligencia Artificial.',
      60,
      welcomeY + 48,
      { width: contentWidth - 40, lineGap: 4 }
    );

  // 3 Pilares clave
  const pilares = [
    {
      titulo: '1. Tablero Visual (Kanban)',
      desc: 'Mueve tus postulaciones arrastrando tarjetas segun avances en el proceso.',
    },
    {
      titulo: '2. Asistente con Inteligencia Artificial',
      desc: 'Pega el aviso de trabajo y la IA completa la ficha y te redacta un mensaje de contacto.',
    },
    {
      titulo: '3. Alertas de Seguimiento',
      desc: 'Te recuerda cuando escribirle nuevamente a una empresa para no perder oportunidades.',
    },
  ];

  pilares.forEach((p, i) => {
    const colW = (contentWidth - 20) / 3;
    const colX = 40 + i * (colW + 10);
    const cardH = 135;
    const cardY = 360;

    doc.roundedRect(colX, cardY, colW, cardH, 8)
      .fillAndStroke('#172554', '#1E3A8A');

    doc.rect(colX, cardY, colW, 4).fill(i === 1 ? colors.goldPrimary : colors.skyTech);

    doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#FFFFFF')
      .text(p.titulo, colX + 12, cardY + 16, { width: colW - 24 });

    doc.font('Helvetica').fontSize(8.5).fillColor('#94A3B8')
      .text(p.desc, colX + 12, cardY + 54, { width: colW - 24, lineGap: 3 });
  });

  // Pie de portada
  const footY = pageHeight - 110;
  doc.strokeColor('#243B73').lineWidth(0.8)
    .moveTo(40, footY)
    .lineTo(pageWidth - 40, footY)
    .stroke();

  doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.goldPrimary)
    .text('APLICACION WEB DISPONIBLE EN LINEA:', 40, footY + 14);
  doc.font('Helvetica').fontSize(9).fillColor('#E2E8F0')
    .text('https://jobfow-app.vercel.app', 40, footY + 30);
  doc.font('Helvetica').fontSize(8.5).fillColor('#94A3B8')
    .text('Desarrollado con dedicacion por Santiago Chavez para impulsar tu carrera profesional.', 40, footY + 50);

  // ==========================================
  // PÁGINA 2: PASO A PASO (TABLERO & IA)
  // ==========================================
  doc.addPage();
  drawPageHeader('Paso a Paso: Tablero y Copiloto de Inteligencia Artificial');

  doc.font('Helvetica-Bold').fontSize(15).fillColor(colors.navyBase)
    .text('Como utilizar Jobflow en tu dia a dia', 40, 38);

  doc.font('Helvetica').fontSize(9).fillColor(colors.slateBody)
    .text('Sigue estos pasos sencillos para llevar el registro de tus postulaciones y destacar ante los reclutadores.', 40, 56);

  // Paso 1: El Tablero
  drawStepBox(
    76,
    88,
    1,
    'Tu Tablero de Oportunidades (Kanban)',
    'En la pantalla principal veras 5 columnas: Postulado, Contacto Inicial, Entrevistas, Oferta y Descartado. ' +
    'Simplemente arrastra cualquier tarjeta con el mouse hacia la derecha a medida que avances. ' +
    'Si pasas una tarjeta a Contacto o Entrevista, el sistema medira automaticamente cuantos dias tardaron en responderte.',
    'No borres las postulaciones descartadas; tener el historial completo te ayudara a conocer tus metricas.'
  );

  // Paso 2: Autocompletar con IA
  drawStepBox(
    174,
    108,
    2,
    'Registrar una Postulacion con Inteligencia Artificial (1 Clic)',
    'Cuando veas una oferta interesante en LinkedIn, Computrabajo o cualquier sitio web:\n' +
    '1. Haz clic en el boton "+ Nueva Postulacion" (arriba a la derecha).\n' +
    '2. Pega el texto completo del aviso en el campo "Descripcion o Requisitos".\n' +
    '3. Presiona el boton "Autocompletar con IA".\n' +
    'En segundos, Jobflow detectara el nombre de la empresa, el puesto, la modalidad (remoto/hibrido) ' +
    'y redactara un mensaje de contacto profesional personalizado para enviar al reclutador.',
    'Puedes retocar cualquier palabra en el cuadro de texto del pitch antes de guardar.'
  );

  // Paso 3: Consultar y Copiar el Pitch
  drawStepBox(
    292,
    95,
    3,
    'Consultar y Copiar tu Pitch en Cualquier Momento',
    'Si una empresa te escribe semanas despues de postularte, no te preocupes por recordar que decia el aviso:\n' +
    '1. Haz clic en la tarjeta de la empresa en el tablero para abrir el Detalle.\n' +
    '2. En la pestana General encontraras la tarjeta destacada con tu Pitch de Presentacion.\n' +
    '3. Haz clic en el boton "Copiar Pitch" y pegalo directamente en LinkedIn o por correo para responder con total seguridad.',
    'El pitch incluye tus enlaces profesionales y tu formacion para causar una excelente primera impresion.'
  );

  // Cuadro informativo: Que hace la IA por ti
  const aiBoxY = 398;
  doc.roundedRect(40, aiBoxY, contentWidth, 120, 8)
    .fillAndStroke(colors.accentBlueBg, colors.accentBlueBorder);

  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(colors.navyHighlight)
    .text('¿Que hace exactamente el Asistente de IA de Jobflow?', 56, aiBoxY + 14);

  const aiPoints = [
    '• Lee y resume la oferta: Extrae empresa, puesto, modalidad de trabajo y salario sugerido.',
    '• Analiza afinidad (Match %): Compara los requisitos de la vacante con tus habilidades.',
    '• Redacta tu presentacion: Crea un mensaje formal y entusiasta listo para enviar al equipo de seleccion.',
    '• Resume la empresa: Te brinda una breve descripcion de a que se dedica la compania para tu entrevista.'
  ];
  aiPoints.forEach((pt, i) => {
    doc.font('Helvetica').fontSize(8.5).fillColor(colors.slateBody)
      .text(pt, 56, aiBoxY + 36 + (i * 18));
  });

  // ==========================================
  // PÁGINA 3: SEGUIMIENTOS, REPORTES Y CONSEJOS
  // ==========================================
  doc.addPage();
  drawPageHeader('Seguimientos, Reportes y Consejos para tu Busqueda');

  // Paso 4: Alertas y Seguimiento
  drawStepBox(
    40,
    96,
    4,
    'Campana de Alertas y Envio de Correos de Seguimiento',
    'Uno de los secretos para conseguir entrevistas es hacer seguimiento a las empresas donde te postulaste:\n' +
    '• En la barra superior veras un icono de Campana con un contador numerico.\n' +
    '• Si pasaron mas de 5 dias sin respuesta, la campana te alertara como "Seguimiento Urgente".\n' +
    '• Al abrir el panel, presiona el boton "Enviar Correo": se abrira tu programa de correo habitual con el email, ' +
    'el asunto y el mensaje de seguimiento redactado y listo para enviar.',
    'Enviar un mensaje amable a los 5-7 dias demuestra proactividad e interes genuino.'
  );

  // Paso 5: Reportes y Planilla
  drawStepBox(
    146,
    88,
    5,
    'Descarga de Reportes en PDF y Vista de Lista',
    '• Pestaña "Lista": Te permite ver todas tus postulaciones como una planilla ordenada con buscador.\n' +
    '• Boton "Descargar Reporte": Te permite exportar un informe en formato PDF con tus estadisticas de postulaciones, ' +
    'tasa de respuesta y el detalle completo de tus avances para evaluar tu desempeno.',
    'Guarda una copia de tus reportes cada mes para ver como evoluciona tu efectividad.'
  );

  // Consejos de Oro
  const tipsY = 246;
  doc.roundedRect(40, tipsY, contentWidth, 195, 8)
    .fillAndStroke(colors.successBg, colors.successBorder);

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#065F46')
    .text('Consejos de Oro para Acelerar tu Insercion Laboral', 56, tipsY + 16);

  const tipsList = [
    {
      t: '1. Constancia diaria de 15 minutos:',
      d: 'Revisa tu tablero cada manana, atiende las alertas de la campana y envia tus seguimientos.',
    },
    {
      t: '2. Adapta tu mensaje:',
      d: 'El pitch que genera la IA te ahorra el 90% del trabajo; dale tu toque final mencionando algun proyecto reciente.',
    },
    {
      t: '3. Registra cada entrevista de inmediato:',
      d: 'Al terminar una llamada con un reclutador, anota en las notas de la postulacion lo que te preguntaron para preparar la siguiente ronda.',
    },
    {
      t: '4. El rechazo es parte del camino:',
      d: 'Si una empresa descarta tu perfil, muevela a "Descartado" sin dudar. Mantener tu tablero limpio te permitira enfocar tu energia en las que estan activas.',
    },
  ];

  tipsList.forEach((tip, idx) => {
    const itemY = tipsY + 42 + idx * 36;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#065F46')
      .text(tip.t, 56, itemY);
    doc.font('Helvetica').fontSize(8.5).fillColor(colors.slateBody)
      .text(tip.d, 56, itemY + 12, { width: contentWidth - 32 });
  });

  // Mensaje final inspirador
  const finalY = 460;
  doc.roundedRect(40, finalY, contentWidth, 75, 8)
    .fillAndStroke(colors.bgCard, colors.borderLight);

  doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.navyHighlight)
    .text('¡Muchos exitos en tu busqueda laboral!', 56, finalY + 14);

  doc.font('Helvetica').fontSize(8.5).fillColor(colors.slateBody)
    .text(
      'Jobflow esta disenado para que cada paso de tu proceso cuente. Mantente proactivo, constante y preparado. ' +
      'Tu proxima gran oportunidad esta a solo unas postulaciones de distancia.',
      56,
      finalY + 32,
      { width: contentWidth - 32, lineGap: 3 }
    );

  // Numeración de páginas en el pie
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc.font('Helvetica').fontSize(8).fillColor(i === 0 ? '#64748B' : colors.slateMuted)
      .text(
        `Jobflow - Guia de Usuario | Pagina ${i + 1} de ${totalPages}`,
        40,
        pageHeight - 24,
        { width: contentWidth, align: 'center' }
      );
  }

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => {
      console.log(`Guia amigable generada exitosamente en: ${outputPath}`);
      resolve(outputPath);
    });
    writeStream.on('error', reject);
  });
}

generateFriendlyGuide().catch((err) => {
  console.error('Error al generar la guia:', err);
  process.exit(1);
});
