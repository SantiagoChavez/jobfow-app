import React from 'react';
import { RadarIcon, PlusIcon, FileTextIcon, KanbanIcon, TableIcon, BellIcon } from './Icons.jsx';

export const Navbar = ({
  currentView,
  setCurrentView,
  onOpenAddModal,
  onOpenReportModal,
  remindersCount = 0,
  onOpenReminders,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-navy-base/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Marca */}
        <div 
          onClick={() => setCurrentView('kanban')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-navy-surface border border-slate-700/80 flex items-center justify-center group-hover:border-gold-primary/60 transition-all duration-300 shadow-lg shadow-black/20">
            <RadarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-white group-hover:text-gold-primary transition-colors">
                Job<span className="text-gold-primary">Flow</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold-primary/10 text-gold-primary font-bold border border-gold-primary/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-medium tracking-wider uppercase text-sky-tech/90 hidden sm:block">
              Radar & Career Tracker
            </p>
          </div>
        </div>

        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center gap-1 bg-navy-surface/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setCurrentView('kanban')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'kanban'
                ? 'bg-navy-highlight text-gold-primary shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <KanbanIcon className="w-4 h-4" />
            Tablero Tracker
          </button>
          <button
            onClick={() => setCurrentView('table')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'table'
                ? 'bg-navy-highlight text-gold-primary shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            Tabla
          </button>
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all"
          >
            <FileTextIcon className="w-4 h-4 text-sky-tech" />
            Reporte PDF
          </button>
        </nav>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2.5">
          {/* Botón de Campana / Alertas y Seguimientos */}
          <button
            onClick={onOpenReminders}
            className="relative p-2 rounded-xl bg-navy-surface border border-slate-700/80 text-slate-300 hover:text-gold-primary hover:border-gold-primary/50 hover:bg-navy-highlight transition-all"
            title="Ver seguimientos y alertas prioritarias"
            aria-label="Abrir panel de recordatorios"
          >
            <BellIcon className="w-5 h-5" />
            {remindersCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-navy-base animate-pulse">
                {remindersCount > 9 ? '9+' : remindersCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenReportModal}
            className="md:hidden p-2 rounded-xl bg-navy-surface border border-slate-700/80 text-sky-tech hover:bg-navy-highlight transition-all"
            title="Generar Reporte PDF"
          >
            <FileTextIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm bg-gold-primary hover:bg-gold-light text-navy-base transition-all duration-200 shadow-md shadow-gold-primary/20 hover:shadow-gold-primary/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusIcon className="w-4 h-4 stroke-[3]" />
            <span>+ Nueva Postulación</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
