import React from 'react';
import { RadarIcon } from './Icons.jsx';

/**
 * Footer Fijo de la aplicación JobFlow
 * - Izquierda: Firma del creador freelance (SoftwareChavez Dev) con enlace a GitHub
 * - Derecha: Logotipo del Radar institucional + versión oficial de la aplicación (v1.2.0)
 * - Posicionamiento adaptativo: Fijo en el fondo de la pantalla (en móvil se eleva automáticamente sobre el BottomNav)
 */
export const Footer = ({ isAuthenticated = false }) => {
  return (
    <footer
      className={`fixed left-0 right-0 z-30 bg-white/95 dark:bg-navy-base/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-4 lg:px-8 py-2 transition-all duration-200 flex items-center justify-between text-xs select-none shadow-sm dark:shadow-none ${
        isAuthenticated ? 'bottom-[52px] md:bottom-0' : 'bottom-0'
      }`}
    >
      {/* Izquierda: Firma SoftwareChavez */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <a
          href="https://github.com/SantiagoChavez"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-gold-primary transition-colors flex items-center gap-1.5 group text-[11px] sm:text-xs"
          title="Ver perfil de SoftwareChavez en GitHub"
        >
          <span className="text-slate-400 dark:text-slate-500 font-normal">by</span>
          <span className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-gold-primary transition-colors">
            SoftwareChavez
          </span>
          <span className="text-[10px] text-slate-400 group-hover:text-amber-500 transition-colors opacity-70 group-hover:opacity-100">↗</span>
        </a>
      </div>

      {/* Derecha: Logo de Radar + Nombre + Versión */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-[11px] sm:text-xs">
          <RadarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 dark:text-gold-primary" />
          <span className="hidden sm:inline">JobFlow</span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-navy-surface text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80">
          v1.2.0
        </span>
      </div>
    </footer>
  );
};

export default Footer;
