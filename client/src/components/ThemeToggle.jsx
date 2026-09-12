import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { SunIcon, MoonIcon } from './Icons.jsx';

/**
 * Componente interactivo para conmutar entre Modo Claro Armónico y Modo Oscuro (Deep Cobalt).
 * Presenta micro-animaciones en los iconos de Sol y Luna con diseño responsivo y accesible.
 */
export const ThemeToggle = ({ className = '' }) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-xl transition-all duration-300 border flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-gold-primary/50 ${
        isDark
          ? 'bg-navy-surface border-slate-700/80 text-gold-primary hover:text-gold-light hover:border-gold-primary/50 hover:bg-navy-highlight shadow-sm'
          : 'bg-white border-slate-200 text-amber-600 hover:text-amber-700 hover:border-amber-300 hover:bg-slate-50 shadow-sm shadow-slate-200/50'
      } ${className}`}
      title={isDark ? 'Cambiar a Modo Claro Armónico' : 'Cambiar a Modo Oscuro (Deep Cobalt)'}
      aria-label={isDark ? 'Activar tema claro' : 'Activar tema oscuro'}
    >
      <span className="sr-only">
        {isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
      </span>

      {/* Contenedor animado de iconos */}
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Icono de Sol (Modo Claro) */}
        <div
          className={`absolute transition-all duration-500 transform ${
            isDark
              ? 'opacity-0 rotate-90 scale-50 pointer-events-none'
              : 'opacity-100 rotate-0 scale-100 text-amber-500'
          }`}
        >
          <SunIcon className="w-5 h-5 stroke-[2.2]" />
        </div>

        {/* Icono de Luna (Modo Oscuro) */}
        <div
          className={`absolute transition-all duration-500 transform ${
            isDark
              ? 'opacity-100 rotate-0 scale-100 text-gold-primary'
              : 'opacity-0 -rotate-90 scale-50 pointer-events-none'
          }`}
        >
          <MoonIcon className="w-5 h-5 stroke-[2]" />
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
