import React, { useState } from 'react';
import { createSafeMailto } from '../utils/mailto.js';
import {
  CloseIcon,
  BuildingIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  DollarIcon,
  ExternalLinkIcon,
  UserIcon,
  MailIcon,
  MessageIcon,
  CheckCircleIcon,
  SparklesIcon,
  TrashIcon,
} from './Icons.jsx';

const STATUS_OPTIONS = [
  { value: 'ENVIADA', label: 'Postulado' },
  { value: 'CONTACTO', label: 'Contacto Inicial' },
  { value: 'ENTREVISTA', label: 'Entrevistas' },
  { value: 'OFERTA', label: 'Oferta Recibida' },
  { value: 'RECHAZADA', label: 'Descartado' },
];

const INTERACTION_TYPES = [
  { value: 'RESPUESTA_RECIBIDA', label: '⚡ Respuesta Recibida' },
  { value: 'ENTREVISTA', label: '📅 Entrevista' },
  { value: 'MENSAJE_ENVIADO', label: '✉️ Mensaje / Seguimiento' },
  { value: 'OFERTA', label: '🎉 Oferta Recibida' },
  { value: 'RECHAZO', label: '🚫 Rechazo' },
  { value: 'POSTULACION_ENVIADA', label: '📤 Postulación Enviada' },
];

export const ApplicationDetailModal = ({
  application,
  isOpen,
  onClose,
  onStatusChange,
  onAddInteraction,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'timeline' | 'recruiter'

  // Estado del formulario de nueva interacción
  const [interactionForm, setInteractionForm] = useState({
    type: 'RESPUESTA_RECIBIDA',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submittingInteraction, setSubmittingInteraction] = useState(false);

  if (!isOpen || !application) return null;

  const handleAddInteractionSubmit = async (e) => {
    e.preventDefault();
    if (!interactionForm.type) return;

    try {
      setSubmittingInteraction(true);
      await onAddInteraction(application._id, {
        type: interactionForm.type,
        date: interactionForm.date ? new Date(interactionForm.date) : new Date(),
        notes: interactionForm.notes.trim() || undefined,
      });
      setInteractionForm({
        type: 'RESPUESTA_RECIBIDA',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (err) {
      console.error('Error al agregar interacción:', err);
    } finally {
      setSubmittingInteraction(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-base/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-navy-surface rounded-3xl border border-slate-700/80 shadow-2xl shadow-black/60 overflow-hidden my-6">
        {/* Header Principal */}
        <div className="p-6 border-b border-slate-800 bg-navy-base/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-navy-surface border border-slate-700 flex items-center justify-center text-lg font-black text-sky-tech">
                {application.company?.name ? application.company.name.charAt(0).toUpperCase() : 'J'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">
                    {application.company?.name}
                  </h3>
                  {application.jobUrl && (
                    <a
                      href={application.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-tech hover:text-gold-primary transition-colors"
                      title="Abrir enlace de la vacante"
                    >
                      <ExternalLinkIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-300">
                  {application.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Selector Rápido de Estado */}
              <select
                value={application.status}
                onChange={(e) => onStatusChange(application._id, e.target.value)}
                className="bg-navy-surface border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gold-primary focus:outline-none focus:border-gold-primary transition-colors cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Badges de Información Rápida */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {application.workMode || 'REMOTE'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gold-primary/15 text-gold-light border border-gold-primary/30">
              Prioridad {application.priority || 'MEDIUM'}
            </span>
            {application.salary && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                <DollarIcon className="w-3 h-3" />
                {application.salary} USD
              </span>
            )}
            {application.responseTimeDays != null && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                Respuesta en {application.responseTimeDays} días
              </span>
            )}
          </div>

          {/* Navegación por Pestañas */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-navy-highlight text-gold-primary border border-gold-primary/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-navy-highlight text-gold-primary border border-gold-primary/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Timeline
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {application.interactions?.length || 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('recruiter')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'recruiter'
                  ? 'bg-navy-highlight text-gold-primary border border-gold-primary/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Reclutador
            </button>
          </div>
        </div>

        {/* Contenido de Pestañas */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* 1. OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Descripción y Requisitos Técnicos
                </h4>
                {application.requirementsRaw ? (
                  <div className="p-4 rounded-2xl bg-navy-base/90 border border-slate-800 text-xs text-slate-300 leading-relaxed max-h-52 overflow-y-auto whitespace-pre-wrap">
                    {application.requirementsRaw}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    No se especificaron requisitos detallados para esta postulación.
                  </p>
                )}
              </div>

              {/* Skills Detectadas */}
              {application.extractedSkills && application.extractedSkills.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Skills Técnicas Clave
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {application.extractedSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-tech border border-sky-500/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Postulación enviada: {formatDate(application.appliedAt)}</span>
              </div>
            </div>
          )}

          {/* 2. TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {/* Formulario para registrar nueva interacción */}
              <form
                onSubmit={handleAddInteractionSubmit}
                className="p-4 rounded-2xl bg-navy-base/90 border border-slate-800 space-y-3"
              >
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <SparklesIcon className="w-3.5 h-3.5 text-gold-primary" />
                  Registrar Nuevo Evento
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Tipo de Evento
                    </label>
                    <select
                      value={interactionForm.type}
                      onChange={(e) =>
                        setInteractionForm({ ...interactionForm, type: e.target.value })
                      }
                      className="w-full bg-navy-surface border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold-primary cursor-pointer"
                    >
                      {INTERACTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={interactionForm.date}
                      onChange={(e) =>
                        setInteractionForm({ ...interactionForm, date: e.target.value })
                      }
                      className="w-full bg-navy-surface border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Notas / Feedback recibido
                  </label>
                  <input
                    type="text"
                    value={interactionForm.notes}
                    onChange={(e) =>
                      setInteractionForm({ ...interactionForm, notes: e.target.value })
                    }
                    placeholder="Ej: Entrevista técnica con líder de equipo sobre Node.js y React..."
                    className="w-full bg-navy-surface border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-primary"
                  />
                </div>

                <div className="text-right">
                  <button
                    type="submit"
                    disabled={submittingInteraction}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gold-primary hover:bg-gold-light text-navy-base transition-all disabled:opacity-50"
                  >
                    {submittingInteraction ? 'Guardando...' : '+ Registrar Evento'}
                  </button>
                </div>
              </form>

              {/* Lista Cronológica */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {application.interactions && application.interactions.length > 0 ? (
                  [...application.interactions]
                    .reverse()
                    .map((item, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-gold-primary border-2 border-navy-surface shadow-sm" />
                        <div className="p-3 rounded-xl bg-navy-base/60 border border-slate-800">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-white">
                              {item.type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatDate(item.date)}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-slate-300 mt-1">{item.notes}</p>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Sin eventos registrados aún.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 3. RECRUITER */}
          {activeTab === 'recruiter' && (
            <div className="space-y-4">
              {application.recruiter?.name || application.recruiter?.email ? (
                <div className="p-4 rounded-2xl bg-navy-base/90 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy-surface border border-slate-700 flex items-center justify-center text-sky-tech">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {application.recruiter.name || 'Reclutador no especificado'}
                      </h4>
                      <p className="text-xs text-slate-400">Contacto de Selección</p>
                    </div>
                  </div>

                  {application.recruiter.email && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <MailIcon className="w-4 h-4 text-slate-400" />
                        <span>{application.recruiter.email}</span>
                      </div>
                      <a
                        href={createSafeMailto({
                          email: application.recruiter.email,
                          subject: `Seguimiento de postulación: ${application.role} - ${application.company?.name || ''}`,
                        })}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-sky-500/10 text-sky-tech hover:bg-sky-500/20 border border-sky-500/30 transition-all"
                      >
                        Enviar Correo
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-navy-base/40 rounded-2xl border border-dashed border-slate-800 p-4">
                  <UserIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">
                    No se han registrado datos de contacto del reclutador para esta oferta.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-navy-base/60 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('¿Deseas eliminar esta postulación?')) {
                onDelete(application._id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-xl transition-colors font-medium"
          >
            <TrashIcon className="w-4 h-4" />
            Eliminar Postulación
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailModal;
