import React, { useState } from 'react';
import { createSafeMailto } from '../utils/mailto.js';
import { useModalA11y } from '../hooks/useModalA11y.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  CloseIcon,
  ClockIcon,
  DollarIcon,
  ExternalLinkIcon,
  UserIcon,
  MailIcon,
  SparklesIcon,
  BuildingIcon,
  CheckCircleIcon,
  TrashIcon,
  PencilIcon,
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
  { value: 'CHALLENGE_TECNICO', label: '💻 Challenge / Prueba Técnica' },
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
  onUpdateInteraction,
  onDeleteInteraction,
  onDelete,
  onOpenFollowUp,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'timeline' | 'recruiter'
  const [copiedPitch, setCopiedPitch] = useState(false);

  // Estado del formulario de nueva interacción
  const [interactionForm, setInteractionForm] = useState({
    type: 'RESPUESTA_RECIBIDA',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submittingInteraction, setSubmittingInteraction] = useState(false);

  // Estado de edición inline de una interacción existente
  const [editingInteractionId, setEditingInteractionId] = useState(null);
  const [editForm, setEditForm] = useState({
    type: 'RESPUESTA_RECIBIDA',
    date: '',
    notes: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingInteractionId, setDeletingInteractionId] = useState(null);

  useModalA11y(isOpen, onClose);

  const handleCopyDetailPitch = async () => {
    if (!application?.suggestedPitch) return;
    try {
      await navigator.clipboard.writeText(application.suggestedPitch);
      setCopiedPitch(true);
      showToast('¡Pitch de presentación copiado al portapapeles!', 'success');
      setTimeout(() => setCopiedPitch(false), 2200);
    } catch {
      showToast('No se pudo copiar al portapapeles', 'error');
    }
  };

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

  const handleStartEdit = (interaction) => {
    setEditingInteractionId(interaction._id);
    setEditForm({
      type: interaction.type || 'RESPUESTA_RECIBIDA',
      date: interaction.date
        ? new Date(interaction.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      notes: interaction.notes || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingInteractionId(null);
    setEditForm({ type: 'RESPUESTA_RECIBIDA', date: '', notes: '' });
  };

  const handleSaveEdit = async (interactionId) => {
    if (!onUpdateInteraction) return;
    try {
      setIsSavingEdit(true);
      await onUpdateInteraction(application._id, interactionId, {
        type: editForm.type,
        date: editForm.date ? new Date(editForm.date) : new Date(),
        notes: editForm.notes.trim() || undefined,
      });
      setEditingInteractionId(null);
    } catch (err) {
      console.error('Error al actualizar interacción:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteInteractionClick = async (interactionId, hasNotes) => {
    if (!onDeleteInteraction) return;
    if (hasNotes) {
      if (!window.confirm('¿Seguro que deseas eliminar este evento del historial?')) {
        return;
      }
    }
    try {
      setDeletingInteractionId(interactionId);
      await onDeleteInteraction(application._id, interactionId);
    } catch (err) {
      console.error('Error al eliminar interacción:', err);
    } finally {
      setDeletingInteractionId(null);
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

  const getInteractionTypeLabel = (type) => {
    switch (type) {
      case 'CHALLENGE_TECNICO':
      case 'PRUEBA_TECNICA':
        return 'CHALLENGE / PRUEBA TÉCNICA';
      case 'RESPUESTA_RECIBIDA':
        return 'RESPUESTA RECIBIDA';
      case 'ENTREVISTA':
        return 'ENTREVISTA';
      case 'MENSAJE_ENVIADO':
        return 'MENSAJE / SEGUIMIENTO';
      case 'OFERTA':
        return 'OFERTA RECIBIDA';
      case 'RECHAZO':
        return 'RECHAZO';
      case 'POSTULACION_ENVIADA':
        return 'POSTULACIÓN ENVIADA';
      default:
        return (type || '').replace(/_/g, ' ');
    }
  };

  const getNotesPlaceholder = (type) => {
    if (type === 'CHALLENGE_TECNICO') {
      return 'Ej: Challenge de Node/React, link a GitHub o feedback técnico recibido...';
    }
    if (type === 'ENTREVISTA') {
      return 'Ej: Entrevista técnica con el líder de equipo sobre arquitectura...';
    }
    if (type === 'RECHAZO') {
      return 'Ej: Correo de agradecimiento y descarte del proceso...';
    }
    return 'Ej: Respuesta recibida del equipo de recruiting o feedback...';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-navy-base/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-navy-surface rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 overflow-hidden my-6 transition-colors">
        {/* Header Principal */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-navy-base/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-navy-surface border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg font-black text-sky-700 dark:text-sky-tech shadow-sm">
                {application.company?.name ? application.company.name.charAt(0).toUpperCase() : 'J'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {application.company?.name}
                  </h3>
                  {application.jobUrl && (
                    <a
                      href={application.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-tech hover:text-amber-600 dark:hover:text-gold-primary transition-colors"
                      title="Abrir enlace de la vacante"
                    >
                      <ExternalLinkIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {application.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Selector Rápido de Estado */}
              <select
                value={application.status}
                onChange={(e) => onStatusChange(application._id, e.target.value)}
                className="bg-slate-100 dark:bg-navy-surface border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-gold-primary focus:outline-none focus:border-amber-500 dark:focus:border-gold-primary transition-colors cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Badges de Información Rápida */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              {application.workMode || 'REMOTE'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 dark:bg-gold-primary/15 text-amber-700 dark:text-gold-light border border-amber-500/30 dark:border-gold-primary/30">
              Prioridad {application.priority || 'MEDIUM'}
            </span>
            {application.salary && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                <DollarIcon className="w-3 h-3" />
                {application.salary} USD
              </span>
            )}
            {application.responseTimeDays != null && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                Respuesta en {application.responseTimeDays} días
              </span>
            )}
            {application.matchScore != null && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-sky-500/10 dark:bg-sky-500/15 text-sky-700 dark:text-sky-tech border border-sky-500/30 flex items-center gap-1">
                <SparklesIcon className="w-3 h-3 text-sky-600 dark:text-sky-tech" />
                Match {application.matchScore}%
              </span>
            )}
          </div>

          {/* Navegación por Pestañas */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-amber-500/15 dark:bg-navy-highlight text-amber-700 dark:text-gold-primary border border-amber-500/40 dark:border-gold-primary/30 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-amber-500/15 dark:bg-navy-highlight text-amber-700 dark:text-gold-primary border border-amber-500/40 dark:border-gold-primary/30 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Timeline
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                {application.interactions?.length || 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('recruiter')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'recruiter'
                  ? 'bg-amber-500/15 dark:bg-navy-highlight text-amber-700 dark:text-gold-primary border border-amber-500/40 dark:border-gold-primary/30 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
              {/* Pitch de Presentación Personalizado (si fue generado) */}
              {application.suggestedPitch && (
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-navy-base/90 border border-amber-500/30 dark:border-gold-primary/30 shadow-sm dark:shadow-black/20 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-gold-primary">
                      <SparklesIcon className="w-4 h-4 text-amber-600 dark:text-gold-primary" />
                      <span>Pitch de Presentación Personalizado (IA)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyDetailPitch}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-gold-primary/20 hover:bg-slate-50 dark:hover:bg-gold-primary/30 text-amber-700 dark:text-gold-primary border border-amber-500/40 dark:border-gold-primary/40 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                      title="Copiar pitch al portapapeles"
                    >
                      {copiedPitch ? (
                        <>
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-700 dark:text-emerald-400">¡Copiado!</span>
                        </>
                      ) : (
                        <span>Copiar Pitch</span>
                      )}
                    </button>
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans bg-white/90 dark:bg-navy-surface/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/70 select-text">
                    {application.suggestedPitch}
                  </div>
                </div>
              )}

              {/* Resumen de la Empresa (si fue generado) */}
              {application.companySummary && (
                <div className="p-3.5 rounded-2xl bg-sky-500/10 dark:bg-sky-950/30 border border-sky-500/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-tech">
                    <BuildingIcon className="w-3.5 h-3.5" />
                    <span>Sobre la Empresa</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {application.companySummary}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Descripción y Requisitos Técnicos
                </h4>
                {application.requirementsRaw ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-base/90 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-52 overflow-y-auto whitespace-pre-wrap">
                    {application.requirementsRaw}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    No se especificaron requisitos detallados para esta postulación.
                  </p>
                )}
              </div>

              {/* Skills Detectadas */}
              {application.extractedSkills && application.extractedSkills.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Skills Técnicas Clave
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {application.extractedSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-tech border border-sky-500/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
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
                className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-base/90 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <SparklesIcon className="w-3.5 h-3.5 text-amber-600 dark:text-gold-primary" />
                  Registrar Nuevo Evento
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Tipo de Evento
                    </label>
                    <select
                      value={interactionForm.type}
                      onChange={(e) =>
                        setInteractionForm({ ...interactionForm, type: e.target.value })
                      }
                      className="w-full bg-white dark:bg-navy-surface border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-gold-primary cursor-pointer"
                    >
                      {INTERACTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={interactionForm.date}
                      onChange={(e) =>
                        setInteractionForm({ ...interactionForm, date: e.target.value })
                      }
                      className="w-full bg-white dark:bg-navy-surface border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-gold-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Notas / Feedback recibido / Challenge
                  </label>
                  <input
                    type="text"
                    value={interactionForm.notes}
                    onChange={(e) =>
                      setInteractionForm({ ...interactionForm, notes: e.target.value })
                    }
                    placeholder={getNotesPlaceholder(interactionForm.type)}
                    className="w-full bg-white dark:bg-navy-surface border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 dark:focus:border-gold-primary"
                  />
                </div>

                <div className="text-right">
                  <button
                    type="submit"
                    disabled={submittingInteraction}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 dark:bg-gold-primary dark:hover:bg-gold-light text-slate-950 dark:text-navy-base transition-all disabled:opacity-50 shadow-sm"
                  >
                    {submittingInteraction ? 'Guardando...' : '+ Registrar Evento'}
                  </button>
                </div>
              </form>

              {/* Lista Cronológica */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {application.interactions && application.interactions.length > 0 ? (
                  [...application.interactions]
                    .reverse()
                    .map((item, idx) => {
                      const isEditing = editingInteractionId === item._id;
                      const hasNotes = Boolean(item.notes && item.notes.trim());

                      let dotColor = 'bg-amber-500 dark:bg-gold-primary';
                      if (item.type === 'CHALLENGE_TECNICO' || item.type === 'PRUEBA_TECNICA') {
                        dotColor = 'bg-indigo-500 dark:bg-indigo-400';
                      } else if (item.type === 'RECHAZO') {
                        dotColor = 'bg-rose-500 dark:bg-rose-400';
                      } else if (item.type === 'OFERTA') {
                        dotColor = 'bg-emerald-500 dark:bg-emerald-400';
                      }

                      return (
                        <div key={item._id || idx} className="relative">
                          <div className={`absolute -left-[23px] top-2.5 w-3 h-3 rounded-full ${dotColor} border-2 border-white dark:border-navy-surface shadow-sm`} />
                          
                          {isEditing ? (
                            /* Formulario de Edición Inline */
                            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-navy-base/90 border border-amber-500/40 dark:border-gold-primary/40 shadow-sm space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-800 dark:text-gold-light flex items-center gap-1.5">
                                  <PencilIcon className="w-3.5 h-3.5" />
                                  Editar Evento
                                </span>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                                >
                                  Cancelar
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                    Tipo
                                  </label>
                                  <select
                                    value={editForm.type}
                                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                                    className="w-full bg-white dark:bg-navy-surface border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-900 dark:text-white"
                                  >
                                    {INTERACTION_TYPES.map((t) => (
                                      <option key={t.value} value={t.value}>
                                        {t.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                    Fecha
                                  </label>
                                  <input
                                    type="date"
                                    value={editForm.date}
                                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                    className="w-full bg-white dark:bg-navy-surface border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-900 dark:text-white"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                  Notas / Feedback
                                </label>
                                <textarea
                                  rows={2}
                                  value={editForm.notes}
                                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                  placeholder={getNotesPlaceholder(editForm.type)}
                                  className="w-full bg-white dark:bg-navy-surface border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:border-amber-500 dark:focus:border-gold-primary"
                                />
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  disabled={isSavingEdit}
                                  onClick={() => handleSaveEdit(item._id)}
                                  className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 dark:bg-gold-primary dark:hover:bg-gold-light text-slate-950 dark:text-navy-base transition-all disabled:opacity-50"
                                >
                                  {isSavingEdit ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Vista Normal de Tarjeta de Evento */
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-base/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none group transition-all">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    {getInteractionTypeLabel(item.type)}
                                  </span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                    • {formatDate(item.date)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(item)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors"
                                    title="Editar evento o notas"
                                  >
                                    <PencilIcon className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteInteractionClick(item._id, hasNotes)}
                                    disabled={deletingInteractionId === item._id}
                                    className="p-1 rounded-lg text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                                    title="Eliminar este evento"
                                  >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {hasNotes ? (
                                <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap leading-relaxed">
                                  {item.notes}
                                </p>
                              ) : (
                                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-500 italic">
                                  <span>Sin notas registradas</span>
                                  <div className="flex items-center gap-2 not-italic">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(item)}
                                      className="text-sky-600 dark:text-sky-tech hover:underline font-semibold text-[11px]"
                                    >
                                      + Agregar nota
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteInteractionClick(item._id, false)}
                                      className="text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-semibold text-[11px] flex items-center gap-0.5"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
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
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-base/90 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sky-600 dark:text-sky-tech shadow-sm">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {application.recruiter.name || 'Reclutador no especificado'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Contacto de Selección</p>
                    </div>
                  </div>

                  {application.recruiter.email && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <MailIcon className="w-4 h-4 text-slate-400" />
                        <span>{application.recruiter.email}</span>
                      </div>
                      <a
                        href={createSafeMailto({
                          email: application.recruiter.email,
                          subject: `Seguimiento de postulación: ${application.role} - ${application.company?.name || ''}`,
                        })}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-sky-500/10 text-sky-700 dark:text-sky-tech hover:bg-sky-500/20 border border-sky-500/30 transition-all"
                      >
                        Enviar Correo
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50/50 dark:bg-navy-base/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-4">
                  <UserIcon className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No se han registrado datos de contacto del reclutador para esta oferta.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-navy-base/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('¿Deseas eliminar esta postulación?')) {
                  onDelete(application._id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-xl transition-colors font-semibold"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Eliminar</span>
            </button>

            {onOpenFollowUp && (
              <button
                type="button"
                onClick={() => {
                  onOpenFollowUp(application);
                }}
                className="flex items-center gap-1.5 text-xs text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 rounded-xl font-bold transition-all shadow-xs"
                title="Generar mensaje de seguimiento personalizado con IA"
              >
                <SparklesIcon className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Follow-up con IA</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailModal;
