import React from 'react';
import { KanbanIcon, TableIcon, SearchIcon, FilterIcon } from './Icons.jsx';

export const ViewToggle = ({
  currentView,
  setCurrentView,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  totalCount,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6 bg-white/80 dark:bg-navy-surface/60 p-2.5 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none backdrop-blur-sm transition-colors">
      {/* Buscador Rápido */}
      <div className="relative flex-1">
        <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por empresa o rol técnico..."
          className="w-full bg-slate-50 dark:bg-navy-base/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 dark:focus:border-gold-primary/70 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Filtro por estado (opcional rápido) */}
        {currentView === 'table' && (
          <div className="relative flex items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-navy-base/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 dark:focus:border-gold-primary/70 transition-colors appearance-none pr-8 cursor-pointer"
            >
              <option value="">Todos los estados</option>
              <option value="ENVIADA">Enviada</option>
              <option value="CONTACTO">Contacto</option>
              <option value="ENTREVISTA">Entrevista</option>
              <option value="OFERTA">Oferta</option>
              <option value="RECHAZADA">Rechazada</option>
            </select>
            <FilterIcon className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>
        )}

        {/* Selector de Vista: Kanban / Tabla */}
        <div className="flex items-center bg-slate-100 dark:bg-navy-base/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80">
          <button
            onClick={() => setCurrentView('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'kanban'
                ? 'bg-white dark:bg-navy-highlight text-amber-700 dark:text-gold-primary shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Vista Tablero Kanban"
          >
            <KanbanIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Kanban</span>
          </button>

          <button
            onClick={() => setCurrentView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'table'
                ? 'bg-white dark:bg-navy-highlight text-amber-700 dark:text-gold-primary shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Vista Tabla"
          >
            <TableIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Tabla</span>
          </button>
        </div>

        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 hidden sm:inline">
          {totalCount} {totalCount === 1 ? 'registro' : 'registros'}
        </span>
      </div>
    </div>
  );
};

export default ViewToggle;
