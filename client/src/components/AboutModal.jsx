import React from 'react';
import { useModalA11y } from '../hooks/useModalA11y.js';
import {
  RadarIcon,
  CloseIcon,
  GithubIcon,
  ReactIcon,
  TailwindIcon,
  ViteIcon,
  NodeIcon,
  ExpressIcon,
  MongoIcon,
  GeminiIcon,
  GoogleIcon,
  SoftwareChavezIcon,
} from './Icons.jsx';

/**
 * Modal "Acerca de JobFlow"
 * Presenta la misión del proyecto, el stack tecnológico con sus logotipos oficiales
 * y la autoría de SoftwareChavez con enlaces directos.
 */
export const AboutModal = ({ isOpen, onClose }) => {
  useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const techStack = [
    {
      name: 'Google Gemini AI',
      role: 'Copiloto de IA',
      desc: 'Extracción de vacantes, cálculo de afinidad técnica y generación de pitch.',
      icon: <GeminiIcon className="w-6 h-6" />,
      tag: 'GenAI',
    },
    {
      name: 'React 19',
      role: 'Frontend Reactivo',
      desc: 'Arquitectura de componentes funcionales, hooks y renderizado fluido.',
      icon: <ReactIcon className="w-6 h-6" />,
      tag: 'UI Library',
    },
    {
      name: 'Tailwind CSS',
      role: 'Diseño & Estilos',
      desc: 'Sistema de tokens de diseño atómicos con soporte nativo de tema dual.',
      icon: <TailwindIcon className="w-6 h-6" />,
      tag: 'Styling',
    },
    {
      name: 'Vite',
      role: 'Bundler & Servidor',
      desc: 'Compilación y empaquetado de alto rendimiento con Hot Module Replacement.',
      icon: <ViteIcon className="w-6 h-6" />,
      tag: 'Build Tool',
    },
    {
      name: 'Node.js',
      role: 'Entorno de Ejecución',
      desc: 'Motor asíncrono sobre JavaScript para operaciones de backend.',
      icon: <NodeIcon className="w-6 h-6" />,
      tag: 'Runtime',
    },
    {
      name: 'Express 5',
      role: 'Servidor RESTful',
      desc: 'Arquitectura de endpoints modulares, validaciones y middlewares de seguridad.',
      icon: <ExpressIcon className="w-6 h-6 text-slate-800 dark:text-slate-100" />,
      tag: 'Backend',
    },
    {
      name: 'MongoDB Atlas',
      role: 'Base de Datos NoSQL',
      desc: 'Persistencia distribuida, esquemas Mongoose y pipelines de agregación analítica.',
      icon: <MongoIcon className="w-6 h-6" />,
      tag: 'Database',
    },
    {
      name: 'Google OAuth 2.0',
      role: 'Autenticación',
      desc: 'Acceso federado seguro mediante tokens criptográficos JWT y Google Identity.',
      icon: <GoogleIcon className="w-6 h-6" />,
      tag: 'Security',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-navy-base border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
      >
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-navy-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-gold-primary/10 border border-amber-500/30 dark:border-gold-primary/30 flex items-center justify-center text-amber-600 dark:text-gold-primary">
              <RadarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="about-modal-title"
                  className="text-lg font-black text-slate-900 dark:text-white tracking-tight"
                >
                  Acerca de JobFlow
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 dark:bg-gold-primary/15 text-amber-700 dark:text-gold-primary border border-amber-500/30 dark:border-gold-primary/30">
                  PRO v1.2.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Radar & Career Tracker impulsado por Inteligencia Artificial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            aria-label="Cerrar modal"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-left">
          {/* Misión y Propósito */}
          <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-gold-primary/5 border border-amber-500/20 dark:border-gold-primary/20">
            <h3 className="text-xs font-bold text-amber-700 dark:text-gold-primary uppercase tracking-wider mb-1.5">
              Propósito del Proyecto
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              JobFlow fue creado para potenciar y simplificar la búsqueda laboral de desarrolladores y profesionales tecnológicos.
              Centraliza postulaciones en un tablero interactivo, analiza requerimientos con Inteligencia Artificial,
              calcula afinidad técnica en tiempo real y exporta reportes ejecutivos en PDF.
            </p>
          </div>

          {/* Stack Tecnológico con Logotipos Oficiales */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Stack Tecnológico
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">8 Tecnologías Clave</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {techStack.map((tech) => (
                <div
                  key={tech.name}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-navy-surface/80 border border-slate-200 dark:border-slate-800/80 hover:border-amber-400/50 dark:hover:border-gold-primary/50 transition-all flex items-start gap-3 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-white dark:bg-navy-base border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    {tech.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {tech.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-navy-highlight text-slate-600 dark:text-slate-300">
                        {tech.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight line-clamp-2">
                      {tech.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tarjeta del Autor / Creador */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-surface/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                translate="no"
                className="notranslate w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 dark:from-gold-primary dark:to-amber-200 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 select-none overflow-hidden"
                title="SoftwareChavez"
                aria-label="SoftwareChavez"
              >
                <SoftwareChavezIcon className="w-6 h-6 text-slate-950 notranslate pointer-events-none" />
              </div>
              <div translate="no" className="notranslate">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white notranslate" translate="no">
                    SoftwareChavez
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Creator
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Full Stack Developer & AI Solutions
                </p>
              </div>
            </div>

            <a
              href="https://github.com/SantiagoChavez"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-sm group"
            >
              <GithubIcon className="w-4 h-4 text-white dark:text-slate-950" />
              <span>Ver en GitHub</span>
              <span className="text-[11px] opacity-70 group-hover:opacity-100 transition-opacity">↗</span>
            </a>
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-navy-surface/50 text-xs">
          <span className="text-slate-400 dark:text-slate-500 text-[11px]">
            JobFlow PRO • SoftwareChavez
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-bold bg-slate-200/80 dark:bg-navy-highlight hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
