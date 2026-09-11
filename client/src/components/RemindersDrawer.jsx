import React, { useState, useMemo } from 'react';
import {
  CloseIcon,
  BellIcon,
  MailIcon,
  ClockIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  UserIcon,
} from './Icons.jsx';
import { createSafeMailto } from '../utils/mailto.js';
import { useModalA11y } from '../hooks/useModalA11y.js';

const STATUS_BADGES = {
  ENVIADA: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  CONTACTO: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  ENTREVISTA: 'bg-gold-primary/10 text-gold-primary border-gold-primary/30',
  OFERTA: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  RECHAZADA: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const STATUS_LABELS = {
  ENVIADA: 'Postulado',
  CONTACTO: 'Contacto Inicial',
  ENTREVISTA: 'Entrevista',
  OFERTA: 'Oferta Recibida',
  RECHAZADA: 'Descartado',
};

/**
 * Calcula días transcurridos de forma segura
 */
const getDaysAgo = (dateStr) => {
  if (!dateStr) return 0;
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return 0;
  return Math.max(0, Math.floor((new Date() - parsed) / (1000 * 60 * 60 * 24)));
};

/**
 * Formatea fecha en español de forma amigable
 */
const formatDate = (dateStr) => {
  if (!dateStr) return 'fecha reciente';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'fecha reciente';
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const RemindersDrawer = ({
  isOpen,
  onClose,
  applications = [],
  onSelectApplication,
}) => {
  const [criticalityFilter, setCriticalityFilter] = useState('ALL'); // 'ALL' | 'URGENT' | 'INTERVIEW' | 'CONTACT' | 'OFFER'

  useModalA11y(isOpen, onClose);

  // Normalizar y enriquecer postulaciones activas con cálculo de criticidad
  const processedReminders = useMemo(() => {
    const activeApps = applications.filter((app) =>
      ['ENVIADA', 'CONTACTO', 'ENTREVISTA', 'OFERTA'].includes(app.status)
    );

    return activeApps.map((app) => {
      const days = getDaysAgo(app.appliedAt);
      let urgencyLevel = 'LOW';
      let urgencyLabel = 'En curso';
      let message = 'Seguimiento programado';
      let isUrgent = false;

      if (app.status === 'ENTREVISTA') {
        urgencyLevel = 'HIGH';
        urgencyLabel = 'Entrevista';
        message = 'Proceso activo: preparar preguntas técnicas y objetivos';
      } else if (app.status === 'OFERTA') {
        urgencyLevel = 'HIGH';
        urgencyLabel = 'Oferta activa';
        message = 'Oferta sobre la mesa: evaluar compensación y responder';
      } else if (app.status === 'CONTACTO') {
        urgencyLevel = 'MEDIUM';
        urgencyLabel = 'Contacto';
        message = 'Hubo respuesta: verificar siguientes pasos con el reclutador';
      } else if (days >= 5) {
        urgencyLevel = 'URGENT';
        urgencyLabel = `Crítico (${days}d)`;
        message = `Hace ${days} días sin novedad: enviar correo de seguimiento`;
        isUrgent = true;
      } else {
        urgencyLevel = 'LOW';
        urgencyLabel = `${days}d enviado`;
        message = 'En espera de primer contacto o revisión del perfil';
      }

      return {
        ...app,
        days,
        urgencyLevel,
        urgencyLabel,
        message,
        isUrgent,
      };
    });
  }, [applications]);

  // Contadores para las pestañas de filtro
  const counts = useMemo(() => {
    return {
      ALL: processedReminders.length,
      URGENT: processedReminders.filter((r) => r.isUrgent).length,
      INTERVIEW: processedReminders.filter((r) => r.status === 'ENTREVISTA').length,
      CONTACT: processedReminders.filter((r) => r.status === 'CONTACTO').length,
      OFFER: processedReminders.filter((r) => r.status === 'OFERTA').length,
    };
  }, [processedReminders]);

  // Filtrar según la pestaña seleccionada
  const filteredReminders = useMemo(() => {
    let list = processedReminders;

    if (criticalityFilter === 'URGENT') {
      list = list.filter((r) => r.isUrgent);
    } else if (criticalityFilter === 'INTERVIEW') {
      list = list.filter((r) => r.status === 'ENTREVISTA');
    } else if (criticalityFilter === 'CONTACT') {
      list = list.filter((r) => r.status === 'CONTACTO');
    } else if (criticalityFilter === 'OFFER') {
      list = list.filter((r) => r.status === 'OFERTA');
    }

    // Ordenar priorizando Urgentes, luego Entrevistas, luego Ofertas, luego días transcurridos
    return [...list].sort((a, b) => {
      const priorityWeights = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const weightDiff = (priorityWeights[b.urgencyLevel] || 0) - (priorityWeights[a.urgencyLevel] || 0);
      if (weightDiff !== 0) return weightDiff;
      return b.days - a.days;
    });
  }, [processedReminders, criticalityFilter]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminders-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop oscuro con desenfoque y cierre al clic */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-navy-base/80 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-navy-surface border-l border-slate-800 shadow-2xl shadow-black/80 flex flex-col z-10">
          {/* Header del Drawer */}
          <div className="p-5 border-b border-slate-800 bg-navy-base/70">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gold-primary/10 border border-gold-primary/30 text-gold-primary">
                  <BellIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="reminders-drawer-title"
                    className="text-base font-bold text-white tracking-tight"
                  >
                    Seguimientos y Alertas
                  </h3>
                  <p className="text-xs text-slate-400">
                    {processedReminders.length} postulaciones activas bajo radar
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Cerrar panel de recordatorios"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Filtros de Criticidad */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-semibold scrollbar-none">
              <button
                onClick={() => setCriticalityFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  criticalityFilter === 'ALL'
                    ? 'bg-gold-primary text-navy-base border-gold-primary font-bold shadow-md shadow-gold-primary/20'
                    : 'bg-navy-surface text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>Todos</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                  {counts.ALL}
                </span>
              </button>

              <button
                onClick={() => setCriticalityFilter('URGENT')}
                className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  criticalityFilter === 'URGENT'
                    ? 'bg-rose-500 text-white border-rose-500 font-bold shadow-md shadow-rose-500/20'
                    : 'bg-navy-surface text-rose-300 border-rose-500/30 hover:bg-rose-500/10'
                }`}
              >
                <span>Urgentes (&gt; 5d)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-950/60 border border-rose-500/30">
                  {counts.URGENT}
                </span>
              </button>

              <button
                onClick={() => setCriticalityFilter('INTERVIEW')}
                className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  criticalityFilter === 'INTERVIEW'
                    ? 'bg-gold-primary text-navy-base border-gold-primary font-bold shadow-md shadow-gold-primary/20'
                    : 'bg-navy-surface text-gold-light border-gold-primary/30 hover:bg-gold-primary/10'
                }`}
              >
                <span>Entrevistas</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-navy-base/60">
                  {counts.INTERVIEW}
                </span>
              </button>

              <button
                onClick={() => setCriticalityFilter('CONTACT')}
                className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  criticalityFilter === 'CONTACT'
                    ? 'bg-indigo-500 text-white border-indigo-500 font-bold shadow-md shadow-indigo-500/20'
                    : 'bg-navy-surface text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/10'
                }`}
              >
                <span>Contacto</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-navy-base/60">
                  {counts.CONTACT}
                </span>
              </button>
            </div>
          </div>

          {/* Listado de Tarjetas */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredReminders.length === 0 ? (
              <div className="text-center py-16 px-4 bg-navy-base/40 rounded-2xl border border-slate-800 my-6">
                <BellIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-200 mb-1">
                  Sin recordatorios pendientes
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {criticalityFilter === 'URGENT'
                    ? '¡Excelente! No tienes postulaciones con más de 5 días sin seguimiento.'
                    : 'No hay postulaciones que coincidan con este filtro de criticidad.'}
                </p>
              </div>
            ) : (
              filteredReminders.map((rem) => {
                const recruiterEmail = rem.recruiter?.email?.trim();
                const recruiterName = rem.recruiter?.name?.trim();

                // Plantilla formal y personalizada para el trigger mailto:
                const mailSubject = `Seguimiento de postulación - ${rem.role} - ${rem.company?.name || ''}`;
                const mailBody = `Estimado/a ${recruiterName || 'equipo de selección de ' + (rem.company?.name || 'la empresa')},\n\nEspero que se encuentre muy bien. Le escribo para realizar un cordial seguimiento sobre mi postulación al rol de ${rem.role}, enviada el ${formatDate(rem.appliedAt)}.\n\nSigo sumamente interesado/a en la oportunidad y en aportar al equipo. Quedo atento/a a cualquier novedad o paso adicional en el proceso.\n\nMuchas gracias por su tiempo y consideración.\n\nSaludos cordiales,`;

                const safeMailtoUrl = recruiterEmail
                  ? createSafeMailto({
                      email: recruiterEmail,
                      subject: mailSubject,
                      body: mailBody,
                    })
                  : null;

                return (
                  <div
                    key={rem._id}
                    className="p-4 rounded-2xl bg-navy-base/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-md shadow-black/20"
                  >
                    <div>
                      {/* Cabecera de la Tarjeta */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-navy-surface border border-slate-700 flex items-center justify-center text-xs font-black text-sky-tech flex-shrink-0">
                            {rem.company?.name ? rem.company.name.charAt(0).toUpperCase() : 'J'}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-sm font-bold text-white truncate group-hover:text-gold-primary transition-colors">
                              {rem.company?.name || 'Sin empresa'}
                            </h5>
                            <p className="text-xs text-slate-300 font-medium truncate">
                              {rem.role}
                            </p>
                          </div>
                        </div>

                        {/* Badges de Estado y Criticidad */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                              STATUS_BADGES[rem.status] || STATUS_BADGES.ENVIADA
                            }`}
                          >
                            {STATUS_LABELS[rem.status] || rem.status}
                          </span>

                          {rem.isUrgent && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1">
                              <AlertCircleIcon className="w-3 h-3 text-rose-400" />
                              <span>{rem.urgencyLabel}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mensaje de Alerta Contextual */}
                      <div className="mt-2.5 p-2.5 rounded-xl bg-navy-surface/80 border border-slate-800 text-[11px] text-gold-light/95 flex items-start gap-2">
                        <ClockIcon className="w-3.5 h-3.5 text-gold-primary flex-shrink-0 mt-0.5" />
                        <span className="leading-snug">{rem.message}</span>
                      </div>

                      {/* Datos del Reclutador si existen */}
                      {rem.recruiter && (recruiterName || recruiterEmail) && (
                        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                          <UserIcon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="truncate">
                            {recruiterName ? recruiterName : ''}
                            {recruiterName && recruiterEmail ? ' • ' : ''}
                            {recruiterEmail ? recruiterEmail : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Acciones de la Tarjeta */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      {/* Botón de Contacto Rápido por Email (Trigger mailto:) */}
                      {safeMailtoUrl ? (
                        <a
                          href={safeMailtoUrl}
                          className="px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-tech hover:bg-sky-500/25 border border-sky-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                          title={`Enviar email a ${recruiterEmail}`}
                        >
                          <MailIcon className="w-3.5 h-3.5" />
                          <span>Contactar</span>
                        </a>
                      ) : (
                        <span
                          className="px-3 py-1.5 rounded-xl bg-slate-800/50 text-slate-500 border border-slate-800 text-xs font-medium flex items-center gap-1.5 cursor-not-allowed select-none"
                          title="No hay correo de reclutador asignado"
                        >
                          <MailIcon className="w-3.5 h-3.5" />
                          <span>Sin email</span>
                        </span>
                      )}

                      {/* Botón para Abrir Detalle */}
                      <button
                        onClick={() => {
                          onSelectApplication(rem);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-navy-surface text-slate-200 hover:text-white hover:bg-slate-700/60 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-all group-hover:border-gold-primary/40"
                      >
                        <span>Ver Detalle</span>
                        <ChevronRightIcon className="w-3.5 h-3.5 text-gold-primary" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer del Drawer */}
          <div className="p-4 border-t border-slate-800 bg-navy-base/80 flex items-center justify-between text-xs text-slate-400">
            <span>
              Mostrando <strong className="text-white">{filteredReminders.length}</strong> de {processedReminders.length}
            </span>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Cerrar Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemindersDrawer;
