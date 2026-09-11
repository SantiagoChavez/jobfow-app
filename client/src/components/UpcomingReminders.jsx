import React from 'react';
import { ClockIcon, CalendarIcon, ChevronRightIcon } from './Icons.jsx';

export const UpcomingReminders = ({
  applications = [],
  onSelectApplication,
  onOpenReminders,
}) => {
  // Postulaciones activas que requieren seguimiento
  const activeApps = applications.filter((app) =>
    ['ENVIADA', 'CONTACTO', 'ENTREVISTA'].includes(app.status)
  );

  const getDaysAgo = (dateStr) => {
    if (!dateStr) return 0;
    return Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
  };

  // Filtrar las que llevan más de 4 días o están en entrevista
  const reminders = activeApps
    .map((app) => {
      const days = getDaysAgo(app.appliedAt);
      let alertType = 'normal';
      let message = 'En espera de primer contacto';

      if (app.status === 'ENTREVISTA') {
        alertType = 'high';
        message = 'Proceso activo: preparar preguntas técnicas';
      } else if (app.status === 'CONTACTO') {
        alertType = 'medium';
        message = 'Hubo respuesta: verificar próximos pasos';
      } else if (days >= 5) {
        alertType = 'warning';
        message = `Hace ${days} días sin respuesta: enviar seguimiento`;
      }

      return {
        ...app,
        days,
        alertType,
        message,
      };
    })
    .sort((a, b) => (b.status === 'ENTREVISTA' ? 1 : -1))
    .slice(0, 3);

  if (reminders.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 p-4 rounded-2xl bg-navy-surface/60 border border-slate-800 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-sky-tech" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Seguimientos y Alertas Clave
          </h4>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 font-medium">
            {reminders.length} prioritarios
          </span>
          {onOpenReminders && (
            <button
              onClick={onOpenReminders}
              className="text-xs font-bold text-sky-tech hover:text-gold-primary transition-colors flex items-center gap-0.5"
            >
              <span>Ver panel</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {reminders.map((rem) => (
          <div
            key={rem._id}
            onClick={() => onSelectApplication(rem)}
            className="p-3 rounded-xl bg-navy-base/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold text-white group-hover:text-gold-primary transition-colors truncate">
                  {rem.company?.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-800 text-sky-tech border border-slate-700">
                  {rem.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium mb-1 truncate">
                {rem.role}
              </p>
              <p className="text-[10px] text-gold-light/90 flex items-center gap-1 font-medium">
                <ClockIcon className="w-3 h-3 text-gold-primary flex-shrink-0" />
                <span>{rem.message}</span>
              </p>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-end text-[10px] font-bold text-sky-tech group-hover:text-gold-primary">
              <span>Gestionar</span>
              <ChevronRightIcon className="w-3 h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingReminders;
