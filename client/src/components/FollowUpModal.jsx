import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CloseIcon,
  SparklesIcon,
  MailIcon,
  CopyIcon,
  CheckCircleIcon,
  ClockIcon,
  RefreshIcon,
  SendIcon,
  ExternalLinkIcon,
  LinkedInIcon,
  UserIcon,
} from './Icons.jsx';
import { generateFollowUpMessage, updateApplication } from '../services/api.js';
import { createSafeMailto } from '../utils/mailto.js';
import { useModalA11y } from '../hooks/useModalA11y.js';
import { useToast } from '../context/ToastContext.jsx';

const FollowUpModalDialog = ({
  onClose,
  application,
  onAddInteraction,
}) => {
  const { showToast } = useToast();
  const [tone, setTone] = useState('CORDIAL');
  const [customInstructions, setCustomInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [shortNote, setShortNote] = useState('');
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedShort, setCopiedShort] = useState(false);
  const [savedInteraction, setSavedInteraction] = useState(false);

  // Estados locales de contacto editable inicializados de forma pura
  const [contactEmail, setContactEmail] = useState(application?.recruiter?.email || '');
  const [contactName, setContactName] = useState(application?.recruiter?.name || '');
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  useModalA11y(true, onClose);

  // Calcular días transcurridos de forma segura
  const appliedAt = application?.appliedAt;
  const daysAgo = useMemo(() => {
    if (!appliedAt) return 5;
    const appliedTime = new Date(appliedAt).getTime();
    if (isNaN(appliedTime)) return 5;
    return Math.max(1, Math.floor((new Date().getTime() - appliedTime) / (1000 * 60 * 60 * 24)));
  }, [appliedAt]);

  const handleGenerate = useCallback(async (selectedTone = tone, instructions = customInstructions) => {
    if (!application) return;
    try {
      setLoading(true);
      const res = await generateFollowUpMessage(application, {
        tone: selectedTone,
        customInstructions: instructions.trim(),
      });
      if (res) {
        setGeneratedSubject(res.subject || `Seguimiento de postulación: ${application.role}`);
        setGeneratedMessage(res.message || '');
        setShortNote(res.shortNote || '');
      }
    } catch (err) {
      console.error('Error al generar follow-up:', err);
      showToast(err.message || 'Error al generar el mensaje con IA', 'error');
    } finally {
      setLoading(false);
    }
  }, [application, tone, customInstructions, showToast]);

  // Generar automáticamente al montar el diálogo
  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        setLoading(true);
        const res = await generateFollowUpMessage(application, {
          tone: 'CORDIAL',
          customInstructions: '',
        });
        if (isMounted && res) {
          setGeneratedSubject(res.subject || `Seguimiento de postulación: ${application.role}`);
          setGeneratedMessage(res.message || '');
          setShortNote(res.shortNote || '');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error al generar follow-up:', err);
          showToast(err.message || 'Error al generar el mensaje con IA', 'error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [application, showToast]);

  const companyName = application.company?.name || 'la empresa';

  // Guardar contacto en la base de datos si el usuario lo completó aquí
  const handleSaveContact = async () => {
    if (!application._id) return;
    try {
      setIsSavingContact(true);
      await updateApplication(application._id, {
        recruiter: {
          email: contactEmail.trim() || undefined,
          name: contactName.trim() || undefined,
        },
      });
      setContactSaved(true);
      showToast('¡Datos de contacto guardados en la postulación!', 'success');
      setTimeout(() => setContactSaved(false), 2500);
    } catch (err) {
      console.error('Error al guardar contacto:', err);
      showToast('Error al guardar datos de contacto', 'error');
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleCopyFull = async () => {
    if (!generatedMessage) return;
    try {
      await navigator.clipboard.writeText(generatedMessage);
      setCopiedFull(true);
      showToast('¡Mensaje de seguimiento copiado al portapapeles!', 'success');
      setTimeout(() => setCopiedFull(false), 2200);
    } catch {
      showToast('No se pudo copiar al portapapeles', 'error');
    }
  };

  const handleCopyShort = async () => {
    if (!shortNote) return;
    try {
      await navigator.clipboard.writeText(shortNote);
      setCopiedShort(true);
      showToast('¡Mensaje corto copiado para LinkedIn/Chat!', 'success');
      setTimeout(() => setCopiedShort(false), 2200);
    } catch {
      showToast('No se pudo copiar al portapapeles', 'error');
    }
  };

  const handleSaveToTimeline = async () => {
    if (!onAddInteraction || savedInteraction) return;
    try {
      await onAddInteraction(application._id, {
        type: 'MENSAJE_ENVIADO',
        date: new Date(),
        notes: `Follow-up enviado (${tone}): "${shortNote || generatedMessage.slice(0, 120)}..."`,
      });
      setSavedInteraction(true);
      showToast('¡Seguimiento registrado en la línea de tiempo!', 'success');
    } catch {
      showToast('Error al registrar interacción en el historial', 'error');
    }
  };

  // Generador seguro de URL mailto (funciona con email o sin email destinatario para abrir cliente)
  const safeMailto = generatedMessage
    ? createSafeMailto({
        email: contactEmail.trim(),
        subject: generatedSubject,
        body: generatedMessage,
      })
    : null;

  // Búsqueda inteligente en LinkedIn para contactar al recruiter o equipo de selección
  const linkedInSearchUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(
    `${companyName} ${contactName.trim() || 'recruiter talent'}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-navy-base/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-navy-surface rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-2xl shadow-slate-900/20 dark:shadow-black/70 overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-navy-base/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Mensaje de Seguimiento con IA
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-700 dark:text-gold-primary border border-amber-500/30">
                  {daysAgo}d sin respuesta
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                {companyName} • <span className="font-semibold text-slate-700 dark:text-slate-300">{application.role}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar modal"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Canales y Destinatario de Contacto */}
          <div className="p-4 rounded-2xl bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-tech flex items-center gap-1.5">
                <MailIcon className="w-4 h-4" />
                ¿A dónde enviar este seguimiento?
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Email • LinkedIn • Portal de Empleo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <MailIcon className="w-3 h-3 text-slate-400" />
                  Correo del Recruiter / Empresa:
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="ej: recruiter@empresa.com"
                  className="w-full bg-white dark:bg-navy-base border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <UserIcon className="w-3 h-3 text-slate-400" />
                  Nombre del Recruiter (opcional):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="ej: María López"
                    className="flex-1 bg-white dark:bg-navy-base border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                  {(contactEmail !== (application.recruiter?.email || '') || contactName !== (application.recruiter?.name || '')) && (
                    <button
                      type="button"
                      onClick={handleSaveContact}
                      disabled={isSavingContact}
                      className="px-2.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-base text-[11px] font-bold flex items-center gap-1 transition-all flex-shrink-0"
                      title="Guardar contacto en la postulación"
                    >
                      {contactSaved ? <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-900" /> : null}
                      <span>{contactSaved ? 'Guardado' : 'Guardar'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Accesos directos a portales */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {safeMailto && (
                <a
                  href={safeMailto}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1.5 transition-all text-[11px]"
                >
                  <SendIcon className="w-3.5 h-3.5" />
                  <span>{contactEmail ? `Abrir Email a ${contactEmail}` : 'Abrir en mi Cliente de Correo'}</span>
                </a>
              )}

              <a
                href={linkedInSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 font-bold flex items-center gap-1.5 transition-all text-[11px]"
              >
                <LinkedInIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>Buscar en LinkedIn</span>
                <ExternalLinkIcon className="w-3 h-3 opacity-70" />
              </a>

              {application.jobUrl && (
                <a
                  href={application.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 transition-all text-[11px]"
                >
                  <span>Ir a la Oferta Original</span>
                  <ExternalLinkIcon className="w-3 h-3 opacity-70" />
                </a>
              )}
            </div>
          </div>

          {/* Selectores de Tono */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Tono de Comunicación
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTone('CORDIAL');
                  handleGenerate('CORDIAL');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                  tone === 'CORDIAL'
                    ? 'bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/40 shadow-xs'
                    : 'bg-slate-50 dark:bg-navy-base text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>🤝 Cordial & Formal</span>
                <span className="text-[9px] opacity-75 font-normal">Recomendado</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTone('ENTHUSIASTIC');
                  handleGenerate('ENTHUSIASTIC');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                  tone === 'ENTHUSIASTIC'
                    ? 'bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/40 shadow-xs'
                    : 'bg-slate-50 dark:bg-navy-base text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>🚀 Entusiasta</span>
                <span className="text-[9px] opacity-75 font-normal">Foco en skills</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTone('DIRECT');
                  handleGenerate('DIRECT');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                  tone === 'DIRECT'
                    ? 'bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/40 shadow-xs'
                    : 'bg-slate-50 dark:bg-navy-base text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>⚡ Breve / Chat</span>
                <span className="text-[9px] opacity-75 font-normal">LinkedIn / WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Asunto (para Email) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Asunto sugerido
            </label>
            <input
              type="text"
              value={generatedSubject}
              onChange={(e) => setGeneratedSubject(e.target.value)}
              className="w-full bg-slate-50 dark:bg-navy-base border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-cyan-500"
              placeholder="Asunto del correo de seguimiento..."
            />
          </div>

          {/* Cuerpo Principal del Mensaje (Email / InMail) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Mensaje Completo (Para Email o InMail sin límite)
              </label>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleGenerate(tone)}
                className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Redactando con IA...' : 'Regenerar'}</span>
              </button>
            </div>
            <textarea
              rows={5}
              value={generatedMessage}
              onChange={(e) => setGeneratedMessage(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-50 dark:bg-navy-base border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-cyan-500 disabled:opacity-60 resize-none transition-all shadow-inner"
              placeholder="Generando mensaje de seguimiento personalizado con Gemini IA..."
            />
          </div>

          {/* Versión Corta para Nota de Conexión de LinkedIn (< 200 caracteres) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-base/80 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <LinkedInIcon className="w-3.5 h-3.5 text-blue-500" />
                Nota de Conexión LinkedIn (Límite estricto 200 caracteres)
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    shortNote.length <= 200
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  }`}
                >
                  {shortNote.length}/200 chars
                </span>
                {shortNote.length > 200 && (
                  <button
                    type="button"
                    onClick={() => setShortNote(shortNote.slice(0, 197) + '...')}
                    className="text-[10px] font-bold text-amber-500 hover:text-amber-400 underline"
                  >
                    Ajustar a 200
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={2}
              value={shortNote}
              onChange={(e) => setShortNote(e.target.value)}
              className={`w-full bg-white dark:bg-navy-surface border rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none resize-none transition-all ${
                shortNote.length > 200
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:border-cyan-500'
              }`}
              placeholder="Nota ultra corta para solicitud de contacto en LinkedIn..."
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Ideal para pegar al presionar "Añadir una nota" al conectar en LinkedIn.
              </span>
              <button
                type="button"
                onClick={handleCopyShort}
                disabled={!shortNote}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-navy-surface hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
              >
                {copiedShort ? (
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <CopyIcon className="w-3.5 h-3.5" />
                )}
                <span>{copiedShort ? '¡Copiado!' : 'Copiar Nota (LinkedIn)'}</span>
              </button>
            </div>
          </div>

          {/* Notas / Instrucciones adicionales */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Instrucciones adicionales para la IA (opcional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGenerate(tone, customInstructions);
                  }
                }}
                className="flex-1 bg-slate-50 dark:bg-navy-base border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                placeholder="Ej: Mencionar que publiqué un nuevo proyecto en GitHub..."
              />
              <button
                type="button"
                onClick={() => handleGenerate(tone, customInstructions)}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all disabled:opacity-50"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>

        {/* Footer de Acciones */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-navy-base/80 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyFull}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-navy-surface hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 transition-all shadow-xs flex items-center gap-1.5"
            >
              {copiedFull ? (
                <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
              ) : (
                <CopyIcon className="w-4 h-4" />
              )}
              <span>{copiedFull ? '¡Copiado!' : 'Copiar Mensaje'}</span>
            </button>

            {safeMailto && (
              <a
                href={safeMailto}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-navy-base transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
              >
                <SendIcon className="w-4 h-4" />
                <span>Abrir en Email</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onAddInteraction && (
              <button
                type="button"
                disabled={savedInteraction}
                onClick={handleSaveToTimeline}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {savedInteraction ? (
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ClockIcon className="w-4 h-4 text-indigo-500" />
                )}
                <span>{savedInteraction ? '¡Registrado!' : 'Guardar en Historial'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FollowUpModal = (props) => {
  if (!props.isOpen || !props.application) return null;
  return <FollowUpModalDialog key={props.application._id} {...props} />;
};

export default FollowUpModal;
