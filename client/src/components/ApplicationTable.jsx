import React from 'react';
import {
  BuildingIcon,
  TrashIcon,
  ExternalLinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from './Icons.jsx';

const STATUS_BADGES = {
  ENVIADA: 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30',
  CONTACTO: 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30',
  ENTREVISTA: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-gold-primary/10 dark:text-gold-primary dark:border-gold-primary/30',
  OFERTA: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
  RECHAZADA: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30',
};

const PRIORITY_BADGES = {
  HIGH: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  MEDIUM: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-gold-primary/15 dark:text-gold-light dark:border-gold-primary/30',
  LOW: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/40',
};

export const ApplicationTable = ({
  applications = [],
  pagination,
  currentPage,
  onPageChange,
  onSelectApplication,
  onDeleteApplication,
  onOpenAddModal,
}) => {
  if (applications.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-navy-surface/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <BuildingIcon className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-200 mb-1">
          No se encontraron postulaciones
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
          Comienza registrando tus vacantes de empleo para realizar seguimiento y analizar afinidad.
        </p>
        <button
          onClick={onOpenAddModal}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 dark:bg-gold-primary dark:hover:bg-gold-light text-slate-950 transition-all shadow-md shadow-amber-500/20 dark:shadow-gold-primary/20"
        >
          + Cargar Primera Postulación
        </button>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const activePage = currentPage || pagination?.currentPage || 1;
  const totalPages = pagination?.totalPages || 1;
  const hasPrev = pagination?.hasPrevPage ?? (activePage > 1);
  const hasNext = pagination?.hasNextPage ?? (activePage < totalPages);

  const getPageNumbers = (current, total) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages = [];
    if (current <= 3) {
      pages.push(1, 2, 3, 4, '...', total);
    } else if (current >= total - 2) {
      pages.push(1, '...', total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
    return pages;
  };

  const pages = getPageNumbers(activePage, totalPages);

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-surface/60 shadow-sm dark:shadow-lg dark:shadow-black/20 pb-20 md:pb-0 transition-colors">
      <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
        <thead className="bg-slate-100/80 dark:bg-navy-base/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="py-3 px-4">Empresa</th>
            <th className="py-3 px-4">Puesto / Rol</th>
            <th className="py-3 px-4">Modalidad</th>
            <th className="py-3 px-4">Prioridad</th>
            <th className="py-3 px-4">Estado</th>
            <th className="py-3 px-4">Fecha Aplicada</th>
            <th className="py-3 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {applications.map((app) => (
            <tr
              key={app._id}
              onClick={() => onSelectApplication(app)}
              className="hover:bg-slate-50/90 dark:hover:bg-navy-highlight/40 cursor-pointer transition-colors group"
            >
              {/* Empresa */}
              <td className="py-3 px-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-navy-base border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-black text-sky-600 dark:text-sky-tech">
                    {app.company?.name ? app.company.name.charAt(0).toUpperCase() : 'J'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-gold-primary transition-colors block">
                      {app.company?.name || 'Sin empresa'}
                    </span>
                    {app.company?.industry && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {app.company.industry}
                      </span>
                    )}
                  </div>
                </div>
              </td>

              {/* Rol */}
              <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                {app.role}
              </td>

              {/* Modalidad */}
              <td className="py-3 px-4">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold">
                  {app.workMode || 'REMOTE'}
                </span>
              </td>

              {/* Prioridad */}
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                    PRIORITY_BADGES[app.priority] || PRIORITY_BADGES.MEDIUM
                  }`}
                >
                  {app.priority || 'MEDIUM'}
                </span>
              </td>

              {/* Estado */}
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                    STATUS_BADGES[app.status] || STATUS_BADGES.ENVIADA
                  }`}
                >
                  {app.status}
                </span>
              </td>

              {/* Fecha Aplicada */}
              <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                {formatDate(app.appliedAt)}
              </td>

              {/* Acciones */}
              <td className="py-3 px-4 text-right">
                <div
                  className="flex items-center justify-end gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {app.jobUrl && (
                    <a
                      href={app.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-tech hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Ver oferta original"
                    >
                      <ExternalLinkIcon className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => onDeleteApplication(app._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    title="Eliminar postulación"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Barra de Paginación Interactiva del Servidor */}
      <div className="py-3.5 px-4 bg-slate-50/90 dark:bg-navy-base/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>
            Mostrando página <strong className="text-slate-900 dark:text-white font-bold">{activePage}</strong> de{' '}
            <strong className="text-slate-900 dark:text-white font-bold">{totalPages}</strong>
            {pagination?.totalDocs != null && (
              <> ({pagination.totalDocs} postulaciones en total)</>
            )}
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 select-none">
            {/* Botón < Anterior */}
            <button
              onClick={() => onPageChange && onPageChange(activePage - 1)}
              disabled={!hasPrev || activePage <= 1}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                hasPrev && activePage > 1
                  ? 'bg-white dark:bg-navy-surface text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700 active:scale-95 shadow-sm'
                  : 'bg-slate-100 dark:bg-navy-surface/40 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed'
              }`}
              aria-label="Página anterior"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            {/* Botones Numéricos de Página */}
            {pages.map((page, idx) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 py-1 text-slate-400 dark:text-slate-500 font-bold"
                  >
                    ...
                  </span>
                );
              }

              const isCurrent = page === activePage;

              return (
                <button
                  key={`page-${page}`}
                  onClick={() => onPageChange && onPageChange(page)}
                  disabled={isCurrent}
                  className={`w-8 h-8 rounded-xl border text-xs font-bold transition-all flex items-center justify-center ${
                    isCurrent
                      ? 'bg-amber-500 dark:bg-gold-primary text-slate-950 dark:text-navy-base border-amber-500 dark:border-gold-primary shadow-md shadow-amber-500/20 dark:shadow-gold-primary/20 cursor-default'
                      : 'bg-white dark:bg-navy-surface text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700 active:scale-95 shadow-sm'
                  }`}
                  aria-label={`Ir a página ${page}`}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {page}
                </button>
              );
            })}

            {/* Botón Siguiente > */}
            <button
              onClick={() => onPageChange && onPageChange(activePage + 1)}
              disabled={!hasNext || activePage >= totalPages}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                hasNext && activePage < totalPages
                  ? 'bg-white dark:bg-navy-surface text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700 active:scale-95 shadow-sm'
                  : 'bg-slate-100 dark:bg-navy-surface/40 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed'
              }`}
              aria-label="Página siguiente"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

};

export default ApplicationTable;
