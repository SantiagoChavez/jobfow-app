import PDFDocument from 'pdfkit-table';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, '../../Manual-de-Usuario-Jobflow.pdf');

async function generateManual() {
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
    goldDark: '#CA8A04',
    skyTech: '#38BDF8',
    slateDark: '#1E293B',
    slateBody: '#334155',
    slateMuted: '#64748B',
    borderLight: '#E2E8F0',
    bgCard: '#F8FAFC',
    successBg: '#ECFDF5',
    successBorder: '#10B981',
    accentBlueBg: '#EFF6FF',
    accentBlueBorder: '#3B82F6',
    pillBg: '#1E293B',
  };

  // Helper de encabezado superior decorativo en páginas de contenido
  const drawPageHeader = (title = 'JobFlow - Manual de Usuario') => {
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

  // Helper de caja destacada (Callout / Card)
  const drawCallout = (y, height, title, text, borderColor = colors.skyTech, bgColor = colors.accentBlueBg) => {
    doc.roundedRect(40, y, contentWidth, height, 6).fillAndStroke(bgColor, borderColor);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.navySurface)
      .text(title, 52, y + 10, { width: contentWidth - 24, lineBreak: false });
    doc.font('Helvetica').fontSize(8.5).fillColor(colors.slateBody)
      .text(text, 52, y + 26, { width: contentWidth - 24, lineGap: 2.5 });
  };

  // ==========================================
  // PÁGINA 1: PORTADA PROFESIONAL
  // ==========================================
  doc.rect(0, 0, pageWidth, pageHeight).fill(colors.navyBase);

  // Acentos geométricos dorados y cobalt
  doc.rect(0, 0, pageWidth, 8).fill(colors.goldPrimary);
  doc.rect(40, 60, 4, 90).fill(colors.goldPrimary);

  // Títulos de portada
  doc.font('Helvetica-Bold').fontSize(36).fillColor('#FFFFFF')
    .text('JobFlow', 56, 65);
  doc.font('Helvetica').fontSize(16).fillColor(colors.goldPrimary)
    .text('RADAR & CAREER TRACKER', 56, 110);
  doc.font('Helvetica').fontSize(11).fillColor('#94A3B8')
    .text('Plataforma Inteligente de Gestion y Analitica de Postulaciones Laborales', 56, 134);

  // Tarjeta central de la portada
  const coverCardY = 220;
  doc.roundedRect(40, coverCardY, contentWidth, 230, 12)
    .fillAndStroke('#131F3F', '#243B73');

  doc.font('Helvetica-Bold').fontSize(18).fillColor('#FFFFFF')
    .text('Manual de Usuario & Especificacion de IA', 64, coverCardY + 28);

  doc.font('Helvetica').fontSize(10.5).fillColor('#CBD5E1')
    .text(
      'Guia integral de uso y arquitectura funcional disenada para desarrolladores en busqueda activa de empleo. ' +
      'Este manual documenta el funcionamiento operativo de los tableros, el seguimiento de metricas ' +
      'y el comportamiento detallado del Copiloto de Inteligencia Artificial impulsado por Google Gemini.',
      64,
      coverCardY + 62,
      { width: contentWidth - 48, lineGap: 4 }
    );

  // Puntos clave en la portada
  const bulletY = coverCardY + 135;
  const bullets = [
    '• Gestion visual de candidaturas con Tablero Kanban y Drag & Drop con idempotencia.',
    '• Copiloto de IA: Extraccion estructurada, afinidad de skills y redaccion de pitch.',
    '• Monitoreo de KPIs: Tasa de respuesta, tiempos de respuesta y reportes ejecutivos en PDF.',
    '• Despliegue en produccion en la nube (Vercel, Render y MongoDB Atlas).'
  ];
  bullets.forEach((b, idx) => {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.goldPrimary)
      .text(b, 64, bulletY + (idx * 20));
  });

  // Metadatos al pie de portada
  const metaY = pageHeight - 140;
  doc.strokeColor('#243B73').lineWidth(1)
    .moveTo(40, metaY)
    .lineTo(pageWidth - 40, metaY)
    .stroke();

  doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.goldPrimary)
    .text('VERSION 1.0 - PRODUCCION ESTABLE', 40, metaY + 16);

  doc.font('Helvetica').fontSize(9).fillColor('#94A3B8')
    .text('Autor y Desarrollador: Santiago Chavez', 40, metaY + 34);
  doc.text('Stack Tecnologico: React 19, Node.js, Express, MongoDB Atlas & Google Gemini AI', 40, metaY + 50);
  doc.text('Acceso Web: https://jobfow-app.vercel.app', 40, metaY + 66);

  // ==========================================
  // PÁGINA 2: INTRODUCCIÓN Y MÓDULOS DEL SISTEMA
  // ==========================================
  doc.addPage();
  drawPageHeader('Capitulo 1: Introduccion y Modulos de la Plataforma');

  doc.font('Helvetica-Bold').fontSize(18).fillColor(colors.navyBase)
    .text('1. Introduccion y Propuesta de Valor', 40, 42);

  doc.font('Helvetica').fontSize(9.5).fillColor(colors.slateBody)
    .text(
      'Durante procesos de busqueda activa de empleo y coaching profesional, registrar diariamente las postulaciones ' +
      'en planillas de calculo resulta tedioso, poco intuitivo y carente de retroalimentacion en tiempo real. ' +
      'JobFlow resuelve este problema centralizando todo el ciclo de postulacion en una interfaz mobile-first agil, ' +
      'con metricas analiticas accionables y automatizacion impulsada por modelos de inteligencia artificial.',
      40,
      68,
      { width: contentWidth, lineGap: 3 }
    );

  doc.font('Helvetica-Bold').fontSize(14).fillColor(colors.navySurface)
    .text('2. Arquitectura de Modulos Funcionales', 40, 130);

  drawCallout(
    155,
    75,
    '[A] Dashboard de KPIs y Metricas Consolidadas',
    'Permite visualizar de un vistazo el pulso de tu busqueda de empleo. En la cabecera del sistema se calculan en tiempo real: ' +
    'el total de postulaciones registradas, entrevistas agendadas, ofertas formales recibidas y la tasa de conversion porcentual. ' +
    'Ademas, un algoritmo en MongoDB calcula los dias promedio que tardan los reclutadores en responderte.',
    colors.navyHighlight,
    colors.bgCard
  );

  drawCallout(
    240,
    75,
    '[B] Tablero Tracker (Kanban Interactivo con Drag & Drop)',
    'Organiza tus candidaturas en 5 columnas de estado: Postulado, Contacto Inicial, Entrevista, Oferta y Descartado. ' +
    'Podes arrastrar tarjetas libremente entre columnas gracias a @hello-pangea/dnd con actualizacion optimista inmediata. ' +
    'Incluye salvaguarda contra degradacion accidental de estados (HTTP 409): si intentas mover una postulacion de Oferta a otro estado, te pedira confirmacion explicita.',
    colors.navyHighlight,
    colors.bgCard
  );

  drawCallout(
    325,
    75,
    '[C] Vista de Tabla Paginada y Filtros Dinamicos',
    'Ideal para consultar grandes volumenes de postulaciones. Consume el endpoint paginado del servidor (GET /api/applications?page=X&limit=10). ' +
    'Permite buscar por empresa, rol o palabra clave en tiempo real, filtrar por modalidad (Remoto, Hibrido, Presencial) y estado, ' +
    'con botonera numerica interactiva (< Anterior, 1, 2, 3... Siguiente).',
    colors.navyHighlight,
    colors.bgCard
  );

  drawCallout(
    410,
    75,
    '[D] Panel Lateral de Recordatorios y Alertas Clave (Drawer)',
    'Accesible mediante el boton de campana en la barra superior (con badge numerico reactivo). ' +
    'Agrupa automaticamente las postulaciones que requieren atencion urgente (ej. mas de 5 dias sin contacto o entrevistas proximas). ' +
    'Permite filtrar por criticidad (ALTA / MEDIA) e incluye un disparador seguro mailto: que abre tu cliente de correo con el email, asunto y cuerpo preformateados.',
    colors.navyHighlight,
    colors.bgCard
  );

  drawCallout(
    495,
    75,
    '[E] Generacion y Descarga de Reportes PDF Semanales',
    'Exportacion documental en formato vectorial A4 pensada para presentar evidencia ante tu coach laboral o mentor. ' +
    'Permite seleccionar rangos de fechas (ultimos 7 dias, 30 dias o personalizados) y descarga un PDF con KPIs consolidados, ' +
    'tabla formateada de postulaciones y membrete oficial de JobFlow.',
    colors.navyHighlight,
    colors.bgCard
  );

  // ==========================================
  // PÁGINA 3: EL COPILOTO DE IA (ESPECIFICACIÓN PROFUNDA)
  // ==========================================
  doc.addPage();
  drawPageHeader('Capitulo 2: El Copiloto de Inteligencia Artificial');

  doc.font('Helvetica-Bold').fontSize(18).fillColor(colors.navyBase)
    .text('3. El Copiloto de IA: Google Gemini 3.5 Flash Lite', 40, 42);

  doc.font('Helvetica').fontSize(9.5).fillColor(colors.slateBody)
    .text(
      'En el modal de nueva postulacion ("+ Nueva Postulacion"), JobFlow integra un Copiloto de IA server-side ' +
      'conectado al modelo gemini-3.5-flash-lite de Google (a traves del SDK oficial @google/genai). ' +
      'Al pegar el texto sin procesar de cualquier oferta laboral de LinkedIn, Indeed o portales de empleo, ' +
      'la IA realiza 5 acciones cognitivas simultaneas en menos de 1 segundo:',
      40,
      68,
      { width: contentWidth, lineGap: 3 }
    );

  drawCallout(
    125,
    65,
    'Accion 1: Extraccion Estructurada y Normalizacion de Campos',
    'La IA analiza la vacante y extrae automaticamente: Nombre de la Empresa, Rol o Puesto, Modalidad laboral ' +
    '(REMOTE, HYBRID, ONSITE), Nivel de Prioridad estimado y Salario anual/mensual en USD si estuviera publicado. ' +
    'Autocompleta el formulario al instante, ahorrando minutos de carga manual.',
    colors.goldDark,
    '#FEFCE8'
  );

  drawCallout(
    200,
    65,
    'Accion 2: Calculo de Afinidad Tecnica (Match Score 0-100%)',
    'Compara semanticamente los requisitos y el stack tecnico de la empresa con el perfil del candidato. ' +
    'Calcula un puntaje del 0 al 100% que te ayuda a priorizar tus esfuerzos en las ofertas con mayor probabilidad de contratacion.',
    colors.goldDark,
    '#FEFCE8'
  );

  drawCallout(
    275,
    65,
    'Accion 3: Deteccion de Habilidades Clave y Brechas (Gap Analysis)',
    'Clasifica las tecnologias en dos grupos: "Extracted Skills" (habilidades que dominas requeridas por la empresa) ' +
    'y "Missing Skills" (tecnologias deseables o secundarias que la vacante pide pero tu perfil no destaca, ' +
    'indicandote que temas repasar antes de la entrevista tecnica).',
    colors.goldDark,
    '#FEFCE8'
  );

  drawCallout(
    350,
    65,
    'Accion 4: Resumen Ejecutivo de la Compania (Company Insight)',
    'Genera una sintesis concisa de 2 oraciones que describe el modelo de negocio de la empresa, su industria y cultura corporativa, ' +
    'brindandote contexto inmediato sin tener que investigar en Google por separado.',
    colors.goldDark,
    '#FEFCE8'
  );

  drawCallout(
    425,
    75,
    'Accion 5: Redaccion de Pitch de Contacto Personalizado (Icebreaker)',
    'Redacta un mensaje persuasivo de 3 a 4 lineas listo para enviar al reclutador por mensaje directo de LinkedIn o correo electronico. ' +
    'Destaca tu afinidad con el puesto, menciona tu experiencia relevante y propone una conversacion breve. ' +
    'La interfaz incluye un boton para copiar el pitch al portapapeles en 1 solo clic.',
    colors.goldDark,
    '#FEFCE8'
  );

  drawCallout(
    510,
    75,
    'Seguridad, Privacidad y Resiliencia de la IA',
    '• Truncado Defensivo: Las entradas de texto se limitan a 6.000 caracteres para evitar desbordes y costos innecesarios.\n' +
    '• Neutralizacion de Prompt Injection: Se sanean comillas triples (\"\"\") para impedir ataques de manipulacion de contexto.\n' +
    '• Timeout & Fallback: Timeout estricto de 12s y conmutacion automatica de modelo de respaldo si la version primaria experimenta contingencias.',
    colors.successBorder,
    colors.successBg
  );

  // ==========================================
  // PÁGINA 4: GUÍA PASO A PASO Y ACCESOS
  // ==========================================
  doc.addPage();
  drawPageHeader('Capitulo 3: Guia de Uso Diario y Enlaces de Produccion');

  doc.font('Helvetica-Bold').fontSize(18).fillColor(colors.navyBase)
    .text('4. Flujo de Trabajo Recomendado (Dia a Dia)', 40, 42);

  const steps = [
    {
      num: 'Paso 1',
      title: 'Encontrar y Analizar una Vacante',
      desc: 'Copia el texto de una oferta en LinkedIn o Indeed. En JobFlow, hace clic en "+ Nueva Postulacion", pega el texto en el campo de requisitos y pulsa "Autocompletar con IA". En 1 segundo el formulario quedara completo.'
    },
    {
      num: 'Paso 2',
      title: 'Enviar la Postulacion y Usar el Pitch',
      desc: 'Revisa los datos sugeridos, copia el "Pitch de presentacion" generado por la IA con el boton de copiado y envialo al reclutador. Luego hace clic en "Guardar Postulacion".'
    },
    {
      num: 'Paso 3',
      title: 'Gestion Visual en el Kanban',
      desc: 'Mueve tus tarjetas entre las columnas conforme avances: de "Postulado" a "Contacto Inicial" cuando te respondan, o a "Entrevista". Podes hacer clic en cualquier tarjeta para abrir su historial completo de interacciones.'
    },
    {
      num: 'Paso 4',
      title: 'Monitorear Alertas en el Drawer',
      desc: 'Revisa periodicamente el icono de la campana en la barra superior. Si tenes postulaciones con mas de 5 dias sin novedades, el Drawer te alertara para que envies un mensaje de seguimiento rapido con un clic.'
    },
    {
      num: 'Paso 5',
      title: 'Exportar tu Reporte para Coaching',
      desc: 'Al final de la semana, hace clic en "Reporte PDF", selecciona el rango de fechas y descarga tu documento formal para compartir con tu coach o mentor laboral.'
    },
  ];

  let stepY = 70;
  steps.forEach((s) => {
    doc.roundedRect(40, stepY, 52, 22, 4).fill(colors.navyHighlight);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF')
      .text(s.num, 44, stepY + 6, { width: 44, align: 'center', lineBreak: false });

    doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.navySurface)
      .text(s.title, 102, stepY + 3, { lineBreak: false });

    doc.font('Helvetica').fontSize(8.5).fillColor(colors.slateBody)
      .text(s.desc, 102, stepY + 20, { width: contentWidth - 62, lineGap: 2 });

    stepY += 56;
  });

  // Sección de Enlaces Oficiales
  doc.strokeColor(colors.borderLight).lineWidth(1)
    .moveTo(40, 360)
    .lineTo(pageWidth - 40, 360)
    .stroke();

  doc.font('Helvetica-Bold').fontSize(14).fillColor(colors.navyBase)
    .text('5. Enlaces de Ejecucion y Recursos en la Nube', 40, 375);

  const linksData = {
    headers: ['Componente', 'Plataforma', 'URL Publica / Acceso'],
    rows: [
      ['Frontend Web App', 'Vercel (Hobby)', 'https://jobfow-app.vercel.app'],
      ['Backend REST API', 'Render (Web Service)', 'https://jobfow-api.onrender.com'],
      ['Health Check Endpoint', 'Render API', 'https://jobfow-api.onrender.com/health'],
      ['Base de Datos Cloud', 'MongoDB Atlas', 'Cluster0 (M0 Free Tier, AWS)'],
      ['Modelo de IA', 'Google AI Studio', 'gemini-3.5-flash-lite (15 RPM / 500 RPD)'],
      ['Codigo Fuente', 'GitHub', 'https://github.com/SantiagoChavez/jobfow-app'],
    ]
  };

  doc.table(linksData, {
    x: 40,
    y: 395,
    width: contentWidth,
    prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.navyBase),
    prepareRow: () => doc.font('Helvetica').fontSize(8).fillColor(colors.slateBody),
  });

  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(colors.slateMuted)
    .text(
      'Documento emitido para usuarios y evaluadores de JobFlow. Desarrollado con los mas altos estandares de arquitectura Full-Stack moderna.',
      40,
      525,
      { width: contentWidth, align: 'center' }
    );

  // ==========================================
  // NUMERACIÓN DE PÁGINAS (FOOTER DEFENSIVO SIN AUTO-PAGE-BREAK)
  // ==========================================
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    // Omitir pie en portada
    if (i === 0) continue;

    const oldBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc.strokeColor(colors.borderLight).lineWidth(0.5)
      .moveTo(40, pageHeight - 35)
      .lineTo(pageWidth - 40, pageHeight - 35)
      .stroke();

    doc.font('Helvetica').fontSize(8).fillColor(colors.slateMuted)
      .text('JobFlow - Plataforma de Gestion y Analitica de Postulaciones', 40, pageHeight - 26, {
        lineBreak: false,
      });

    const pageNumText = `Pagina ${i + 1} de ${range.count}`;
    doc.text(pageNumText, pageWidth - 140, pageHeight - 26, {
      width: 100,
      align: 'right',
      lineBreak: false,
    });

    doc.page.margins.bottom = oldBottomMargin;
  }

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(outputPath));
    writeStream.on('error', reject);
  });
}

generateManual();
