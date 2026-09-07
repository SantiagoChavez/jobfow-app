import React from 'react';
import { BuildingIcon, ClockIcon, TrashIcon, SparklesIcon, ExternalLinkIcon } from './Icons.jsx';

const STATUS_BADGES = {
  ENVIADA: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  CONTACTO: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  ENTREVISTA: 'bg-gold-primary/10 text-gold-primary border-gold-primary/30',
  OFERTA: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  RECHAZADA: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const PRIORITY_BADGES = {
  HIGH: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  MEDIUM: 'bg-gold-primary/15 text-gold-light border-gold-primary/30',
  LOW: 'bg-slate-700/50 text-slate-300 border-slate-600/40',
};

export const ApplicationTable = ({
  applications,
  onSelectApplication,
  onDeleteApplication,
  onOpenAddModal,
}) => {
  if (applications.length === 0) {
    return (
      <div className="text-center py-16 bg-navy-surface/40 rounded-2xl border border-slate-800 p-6">
        <BuildingIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-200 mb-1">
          No se encontraron postulaciones
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
          Comienza registrando tus vacantes de empleo para realizar seguimiento y analizar afinidad.
        </p>
        <button
          onClick={onOpenAddModal}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-gold-primary text-navy-base hover:bg-gold-light transition-all shadow-md shadow-gold-primary/20"
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

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-navy-surface/60 shadow-lg shadow-black/20 pb-20 md:pb-0">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-navy-base/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
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
        <tbody className="divide-y divide-slate-800/80">
          {applications.map((app) => (
            <tr
              key={app._id}
              onClick={() => onSelectApplication(app)}
              className="hover:bg-navy-highlight/40 cursor-pointer transition-colors group"
            >
              {/* Empresa */}
              <td className="py-3 px-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-navy-base border border-slate-700 flex items-center justify-center text-xs font-black text-sky-tech">
                    {app.company?.name ? app.company.name.charAt(0).toUpperCase() : 'J'}
                  </div>
                  <div>
                    <span className="font-bold text-white group-hover:text-gold-primary transition-colors block">
                      {app.company?.name || 'Sin empresa'}
                    </span>
                    {app.company?.industry && (
                      <span className="text-[10px] text-slate-400">
                        {app.company.industry}
                      </span>
                    )}
                  </div>
                </div>
              </td>

              {/* Rol */}
              <td className="py-3 px-4 font-semibold text-slate-200">
                {app.role}
              </td>

              {/* Modalidad */}
              <td className="py-3 px-4">
                <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700 text-[10px] font-medium">
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
              <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
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
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-tech hover:bg-slate-800 transition-colors"
                      title="Ver oferta original"
                    >
                      <ExternalLinkIcon className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => onDeleteApplication(app._id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
    </div>
  );
};

export default ApplicationTable;
