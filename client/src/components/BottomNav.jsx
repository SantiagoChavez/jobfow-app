import React from 'react';
import { KanbanIcon, TableIcon, PlusIcon, FileTextIcon, RefreshIcon } from './Icons.jsx';

export const BottomNav = ({ currentView, setCurrentView, onOpenAddModal, onOpenReportModal, onRefresh }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-navy-base/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-around shadow-lg dark:shadow-none transition-colors">
      <button
        onClick={() => setCurrentView('kanban')}
        className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium transition-colors ${
          currentView === 'kanban' ? 'text-amber-700 dark:text-gold-primary font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <KanbanIcon className="w-5 h-5" />
        <span>Tracker</span>
      </button>

      <button
        onClick={() => setCurrentView('table')}
        className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium transition-colors ${
          currentView === 'table' ? 'text-amber-700 dark:text-gold-primary font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <TableIcon className="w-5 h-5" />
        <span>Tabla</span>
      </button>

      {/* Botón Central + Nueva Postulación */}
      <button
        onClick={onOpenAddModal}
        className="relative -top-3 w-12 h-12 rounded-full bg-amber-500 dark:bg-gold-primary text-slate-950 dark:text-navy-base flex items-center justify-center shadow-lg shadow-amber-500/30 dark:shadow-gold-primary/30 active:scale-95 transition-transform"
        title="Nueva Postulación"
      >
        <PlusIcon className="w-6 h-6 stroke-[3]" />
      </button>

      <button
        onClick={onOpenReportModal}
        className="flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
      >
        <FileTextIcon className="w-5 h-5 text-sky-600 dark:text-sky-tech" />
        <span>Reporte</span>
      </button>

      <button
        onClick={onRefresh}
        className="flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
      >
        <RefreshIcon className="w-5 h-5" />
        <span>Recargar</span>
      </button>
    </div>
  );
};

export default BottomNav;
