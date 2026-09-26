import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateApplicationsPdfReport } from '../src/services/pdfService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, '../../docs/jobflow-reporte-demo.pdf');

async function testPdf() {
  const mockApplications = [
    {
      company: { name: 'Mercado Libre', website: 'https://mercadolibre.com' },
      role: 'Senior Fullstack Engineer',
      status: 'ENTREVISTA',
      workMode: 'REMOTE',
      priority: 'HIGH',
      appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      responseTimeDays: 3,
      matchScore: 94,
      suggestedPitch: 'Hola equipo de MeLi! Cuento con sólida experiencia en React 19, Node.js y arquitecturas escalables de alto tráfico para potenciar su ecosistema fintech.',
      recruiter: { name: 'Mariana Lopez', email: 'mlopez@mercadolibre.com' },
      interactions: [
        {
          type: 'POSTULACION_ENVIADA',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          notes: 'Postulación enviada vía LinkedIn con pitch personalizado y portfolio.',
        },
        {
          type: 'RESPUESTA_RECIBIDA',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          notes: 'Reclutadora destacó portfolio y agendó primera entrevista de fit cultural.',
        },
        {
          type: 'ENTREVISTA',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          notes: 'Entrevista superada con éxito. Próximo paso: Live Coding con Tech Lead.',
        },
      ],
    },
    {
      company: { name: 'Globant', website: 'https://globant.com' },
      role: 'Backend Node.js Developer',
      status: 'OFERTA',
      workMode: 'HYBRID',
      priority: 'HIGH',
      appliedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      responseTimeDays: 4,
      matchScore: 88,
      suggestedPitch: 'Especialista en Express 5, bases de datos no relacionales y microservicios orientados a microfrontends.',
      recruiter: { name: 'Carlos Díaz', email: 'carlos.diaz@globant.com' },
      interactions: [
        {
          type: 'RESPUESTA_RECIBIDA',
          date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          notes: 'Recruiter solicitó disponibilidad para challenge técnico.',
        },
        {
          type: 'CHALLENGE_TECNICO',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          notes: 'Challenge técnico entregado y calificado con 100/100.',
        },
        {
          type: 'OFERTA',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          notes: 'Propuesta formal recibida por USD 2,800 + beneficios de salud.',
        },
      ],
    },
    {
      company: { name: 'Auth0 / Okta' },
      role: 'Cloud & Auth Security Engineer',
      status: 'CONTACTO',
      workMode: 'REMOTE',
      priority: 'MEDIUM',
      appliedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      responseTimeDays: 2,
      matchScore: 91,
      suggestedPitch: 'Dominio de protocolos OAuth 2.0, tokens JWT con expiración estricta y seguridad de identidad en la nube.',
      recruiter: { name: 'Sofia Keller', email: 'skeller@okta.com' },
      interactions: [
        {
          type: 'RESPUESTA_RECIBIDA',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          notes: 'Mensaje de recruiter por LinkedIn solicitando CV en inglés.',
        },
      ],
    },
    {
      company: { name: 'Despegar' },
      role: 'Frontend React Developer',
      status: 'ENVIADA',
      workMode: 'REMOTE',
      priority: 'MEDIUM',
      appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      responseTimeDays: null,
      matchScore: 82,
      suggestedPitch: 'Experiencia en optimización Web Vitals, Tailwind CSS y componentes de alta accesibilidad.',
      interactions: [],
    },
    {
      company: { name: 'Accenture' },
      role: 'Junior Fullstack Dev',
      status: 'RECHAZADA',
      workMode: 'ON_SITE',
      priority: 'LOW',
      appliedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      responseTimeDays: 8,
      matchScore: 72,
      interactions: [
        {
          type: 'RECHAZO',
          date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          notes: 'Búsqueda reorientada a perfil presencial en Córdoba.',
        },
      ],
    },
  ];

  const metrics = {
    totalApplications: 5,
    totalInterviews: 2,
    totalOffers: 1,
    totalResponded: 4,
    responseRate: 80.0,
    avgResponseTime: 4.3,
    pitchSentCount: 4,
    pitchUsageRate: 80.0,
    avgMatchScore: 85,
    statusCounts: {
      ENVIADA: 1,
      CONTACTO: 1,
      ENTREVISTA: 1,
      RECHAZADA: 1,
      OFERTA: 1,
    },
    workModeCounts: {
      REMOTE: 3,
      HYBRID: 1,
      ON_SITE: 1,
    },
    priorityCounts: {
      HIGH: 2,
      MEDIUM: 2,
      LOW: 1,
    },
  };

  const buffer = await generateApplicationsPdfReport(
    mockApplications,
    metrics,
    { label: 'Últimos 30 días' },
    { name: 'Santiago Chavez', email: 'chavezsantiago480@gmail.com', headline: 'Full Stack Developer & IT Specialist' }
  );

  fs.writeFileSync(outputPath, buffer);
  console.log('PDF generado exitosamente en:', outputPath, 'Tamaño:', buffer.length, 'bytes');
}

testPdf();
