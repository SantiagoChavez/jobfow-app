import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { BuildingIcon, ClockIcon, SparklesIcon, CheckCircleIcon } from './Icons.jsx';

const COLUMNS = [
  {
    id: 'ENVIADA',
    title: 'Postulado',
    color: 'border-sky-500/40 text-sky-400 bg-sky-500/10',
    dotColor: 'bg-sky-400',
  },
  {
    id: 'CONTACTO',
    title: 'Contacto Inicial',
    color: 'border-indigo-500/40 text-indigo-300 bg-indigo-500/10',
    dotColor: 'bg-indigo-400',
  },
  {
    id: 'ENTREVISTA',
    title: 'Entrevistas',
    color: 'border-gold-primary/40 text-gold-primary bg-gold-primary/10',
    dotColor: 'bg-gold-primary',
  },
  {
    id: 'OFERTA',
    title: 'Oferta Recibida',
    color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    dotColor: 'bg-emerald-400',
  },
  {
    id: 'RECHAZADA',
    title: 'Descartado',
    color: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
    dotColor: 'bg-rose-400',
  },
];

const PRIORITY_BADGES = {
  HIGH: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  MEDIUM: 'bg-gold-primary/15 text-gold-light border-gold-primary/30',
  LOW: 'bg-slate-700/50 text-slate-300 border-slate-600/40',
};

const WORKMODE_LABELS = {
  REMOTE: 'Remoto',
  HYBRID: 'Híbrido',
  ON_SITE: 'Presencial',
};

export const KanbanBoard = ({
  applications,
  onSelectApplication,
  onQuickStatusChange,
  onOpenAddModal,
  onDragEnd,
}) => {
  const getDaysAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    return `hace ${diff}d`;
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 pb-20 md:pb-6 overflow-x-auto">
        {COLUMNS.map((col) => {
          const columnApps = applications.filter((app) => app.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col bg-navy-surface/50 rounded-2xl border border-slate-800 p-3 min-w-[260px] md:min-w-0"
            >
              {/* Header de la Columna */}
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {col.title}
                  </h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-black border ${col.color}`}>
                  {columnApps.length}
                </span>
              </div>

              {/* Columna Droppable */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col gap-2.5 flex-1 min-h-[160px] overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5 rounded-xl transition-all duration-200 ${
                      snapshot.isDraggingOver
                        ? 'bg-navy-highlight/40 ring-2 ring-sky-tech/40 border border-sky-tech/30'
                        : ''
                    }`}
                  >
                    {columnApps.length === 0 ? (
                      <div className="py-8 text-center border-2 border-dashed border-slate-800/60 rounded-xl my-auto">
                        <p className="text-xs text-slate-500 font-medium">Sin postulaciones</p>
                        {col.id === 'ENVIADA' && (
                          <button
                            type="button"
                            onClick={onOpenAddModal}
                            className="mt-2 text-[11px] text-gold-primary hover:underline font-semibold"
                          >
                            + Añadir una
                          </button>
                        )}
                      </div>
                    ) : (
                      columnApps.map((app, index) => (
                        <Draggable
                          key={app._id}
                          draggableId={app._id}
                          index={index}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              onClick={() => onSelectApplication(app)}
                              style={{
                                ...dragProvided.draggableProps.style,
                              }}
                              className={`group relative p-3.5 rounded-xl transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
                                dragSnapshot.isDragging
                                  ? 'bg-navy-surface/95 shadow-2xl shadow-black/90 border-2 border-gold-primary ring-2 ring-gold-primary/40 scale-105 rotate-1 z-50'
                                  : 'bg-navy-base/80 hover:bg-navy-surface border border-slate-800 hover:border-slate-600/80 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                              }`}
                            >
                              {/* Fila Empresa y Días */}
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-navy-surface border border-slate-700 flex items-center justify-center text-[10px] font-black text-sky-tech flex-shrink-0">
                                    {app.company?.name ? app.company.name.charAt(0).toUpperCase() : 'J'}
                                  </div>
                                  <span className="text-xs font-bold text-slate-200 truncate group-hover:text-gold-primary transition-colors">
                                    {app.company?.name || 'Sin empresa'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">
                                  {getDaysAgo(app.appliedAt)}
                                </span>
                              </div>

                              {/* Rol Técnico */}
                              <h5 className="text-sm font-semibold text-white mb-2 leading-snug line-clamp-1">
                                {app.role}
                              </h5>

                              {/* Badges de Estado / Modalidad / Prioridad */}
                              <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                                {app.priority && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                      PRIORITY_BADGES[app.priority] || PRIORITY_BADGES.MEDIUM
                                    }`}
                                  >
                                    {app.priority}
                                  </span>
                                )}
                                {app.workMode && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                                    {WORKMODE_LABELS[app.workMode] || app.workMode}
                                  </span>
                                )}
                                {app.responseTimeDays != null && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-700/40 flex items-center gap-0.5">
                                    <ClockIcon className="w-2.5 h-2.5" />
                                    {app.responseTimeDays}d resp.
                                  </span>
                                )}
                              </div>

                              {/* Acciones Rápidas */}
                              {app.status === 'ENVIADA' && (
                                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onQuickStatusChange(app._id, 'CONTACTO');
                                    }}
                                    className="w-full text-[11px] font-bold py-1 px-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-tech border border-sky-500/30 transition-all flex items-center justify-center gap-1"
                                  >
                                    <SparklesIcon className="w-3 h-3" />
                                    ⚡ Me respondieron
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
