import React, { useState, useCallback } from 'react';
import {
  CloseIcon,
  SparklesIcon,
  CopyIcon,
  CheckCircleIcon,
  MailIcon,
  LinkedInIcon,
  UserPlusIcon,
  BuildingIcon,
  UserIcon,
  ExternalLinkIcon,
  SendHorizontalIcon,
  GoogleIcon,
} from './Icons.jsx';
import { generateDirectPitch } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useModalA11y } from '../hooks/useModalA11y.js';
import { createSafeMailto, createGmailWebLink } from '../utils/mailto.js';

export const DirectContactModal = ({ isOpen, onClose, onSave }) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    recruiterName: '',
    recruiterRole: '',
    recruiterEmail: '',
    recruiterLinkedin: '',
    companyName: '',
    companyWebsite: '',
    companyInfo: '',
    targetRole: '',
    channel: 'LINKEDIN_DM', // 'LINKEDIN_DM' | 'LINKEDIN_NOTE' | 'COLD_EMAIL' | 'OTHER'
    tone: 'CORDIAL', // 'CORDIAL' | 'ENTHUSIASTIC' | 'DIRECT'
    customInstructions: '',
    pitch: '',
    shortNote: '',
    subject: '',
    companySummary: '',
    followUpDays: '5',
    priority: 'MEDIUM',
  });

  const [activeTab, setActiveTab] = useState('pitch'); // 'pitch' | 'shortNote' | 'email'
  const [generatingAI, setGeneratingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [copiedShort, setCopiedShort] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleModalClose = useCallback(() => {
    setErrorMsg('');
    setCopiedPitch(false);
    setCopiedShort(false);
    setCopiedSubject(false);
    onClose();
  }, [onClose]);

  useModalA11y(isOpen, handleModalClose);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg('');
  };

  // Generar Pitch con IA
  const handleGeneratePitch = async () => {
    if (!formData.companyName.trim()) {
      setErrorMsg('Por favor ingresa al menos el nombre de la empresa');
      showToast('Ingresa el nombre de la empresa para personalizar el mensaje', 'error');
      return;
    }

    try {
      setGeneratingAI(true);
      setErrorMsg('');

      const result = await generateDirectPitch({
        recruiterName: formData.recruiterName.trim(),
        recruiterRole: formData.recruiterRole.trim(),
        companyName: formData.companyName.trim(),
        companyWebsite: formData.companyWebsite.trim(),
        companyInfo: formData.companyInfo.trim(),
        targetRole: formData.targetRole.trim() || 'Full Stack Developer',
        channel: formData.channel,
        tone: formData.tone,
        customInstructions: formData.customInstructions.trim(),
      });

      setFormData((prev) => ({
        ...prev,
        pitch: result.pitch || prev.pitch,
        shortNote: result.shortNote || prev.shortNote,
        subject: result.subject || prev.subject,
        companySummary: result.companySummary || prev.companySummary,
      }));

      showToast('¡Pitch personalizado generado con IA!', 'success');
    } catch (err) {
      console.error('Error al generar pitch directo con IA:', err);
      showToast(err.message || 'Error al conectar con la IA', 'error');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Copiar Pitch
  const handleCopy = async (type) => {
    const textToCopy =
      type === 'shortNote'
        ? formData.shortNote
        : type === 'subject'
        ? formData.subject
        : formData.pitch;

    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      if (type === 'shortNote') {
        setCopiedShort(true);
        setTimeout(() => setCopiedShort(false), 2200);
      } else if (type === 'subject') {
        setCopiedSubject(true);
        setTimeout(() => setCopiedSubject(false), 2200);
      } else {
        setCopiedPitch(true);
        setTimeout(() => setCopiedPitch(false), 2200);
      }
      showToast('¡Copiado al portapapeles!', 'success');
    } catch {
      showToast('No se pudo copiar automáticamente', 'error');
    }
  };

  // Guardar en la base de datos
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.companyName.trim()) {
      setErrorMsg('El nombre de la empresa es obligatorio');
      return;
    }

    const effectiveRole = formData.targetRole.trim() || 'Contacto Directo / Candidatura Espontánea';

    try {
      setSaving(true);
      setErrorMsg('');

      const applicationPayload = {
        company: {
          name: formData.companyName.trim(),
          website: formData.companyWebsite.trim() || undefined,
          industry: formData.companyInfo.trim() || undefined,
        },
        role: effectiveRole,
        status: 'CONTACTO',
        origin: 'DIRECT_OUTREACH',
        priority: formData.priority || 'MEDIUM',
        workMode: 'REMOTE',
        recruiter: {
          name: formData.recruiterName.trim() || undefined,
          email: formData.recruiterEmail.trim() || undefined,
          role: formData.recruiterRole.trim() || undefined,
          linkedinUrl: formData.recruiterLinkedin.trim() || undefined,
          channel: formData.channel,
        },
        jobUrl: formData.recruiterLinkedin.trim() || formData.companyWebsite.trim() || undefined,
        suggestedPitch: formData.pitch.trim() || formData.shortNote.trim() || undefined,
        companySummary: formData.companySummary.trim() || undefined,
        initialInteractionType: 'MENSAJE_ENVIADO',
        notes: `Contacto directo vía ${
          formData.channel === 'LINKEDIN_DM'
            ? 'LinkedIn (Mensaje/InMail)'
            : formData.channel === 'LINKEDIN_NOTE'
            ? 'LinkedIn (Nota de conexión)'
            : formData.channel === 'COLD_EMAIL'
            ? 'Email directo'
            : 'Outreach directo'
        }${formData.recruiterName ? ` a ${formData.recruiterName.trim()}` : ''}.`,
      };

      if (onSave) {
        await onSave(applicationPayload);
      }

      showToast(`¡Contacto en "${formData.companyName}" guardado para seguimiento!`, 'success');
      handleModalClose();
    } catch (err) {
      console.error('Error al guardar contacto directo:', err);
      setErrorMsg(err.message || 'Error al guardar el contacto');
      showToast(err.message || 'Error al guardar el contacto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const effectiveSubject =
    formData.subject ||
    `Contacto profesional: ${formData.targetRole || 'Oportunidades'} — ${formData.companyName || 'JobFlow'}`;
  const effectiveBody = formData.pitch || formData.shortNote || '';

  const gmailWebLink = createGmailWebLink(
    formData.recruiterEmail || '',
    effectiveSubject,
    effectiveBody
  );

  const mailtoLink = createSafeMailto(
    formData.recruiterEmail || '',
    effectiveSubject,
    effectiveBody
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="direct-contact-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-navy-surface border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header con gradiente distinguido */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-r from-sky-50 via-cyan-50/40 to-transparent dark:from-sky-950/30 dark:via-cyan-950/10 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-md shadow-sky-500/20">
              <SendHorizontalIcon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2
                id="direct-contact-modal-title"
                className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight"
              >
                Mensaje Directo a Reclutador / Outreach
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registra tu contacto en frío, genera tu pitch adaptado con IA y activa el seguimiento.
              </p>
            </div>
          </div>

          <button
            onClick={handleModalClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-highlight transition-all"
            aria-label="Cerrar modal"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda: Datos del Reclutador y Empresa (7 cols) */}
            <div className="lg:col-span-6 space-y-4">
              {/* Sección Reclutador */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-navy-base/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  <UserIcon className="w-4 h-4" />
                  <span>Datos del Reclutador / Contacto</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre del Reclutador
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Valeria Rossi"
                      value={formData.recruiterName}
                      onChange={(e) => handleChange('recruiterName', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Cargo o Rol
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Tech Recruiter / EM"
                      value={formData.recruiterRole}
                      onChange={(e) => handleChange('recruiterRole', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <LinkedInIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span>Perfil de LinkedIn</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={formData.recruiterLinkedin}
                      onChange={(e) => handleChange('recruiterLinkedin', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <MailIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email directo (opcional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="reclutador@empresa.com"
                      value={formData.recruiterEmail}
                      onChange={(e) => handleChange('recruiterEmail', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sección Empresa y Posición */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-navy-base/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  <BuildingIcon className="w-4 h-4" />
                  <span>Empresa & Posición de Interés</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Empresa <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Mercado Libre / Auth0"
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Puesto o Especialidad
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Full Stack Developer"
                      value={formData.targetRole}
                      onChange={(e) => handleChange('targetRole', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Web / Industria
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. https://mercadolibre.com / Fintech"
                      value={formData.companyWebsite}
                      onChange={(e) => handleChange('companyWebsite', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Prioridad
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleChange('priority', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="HIGH">Alta Prioridad ⭐</option>
                      <option value="MEDIUM">Media</option>
                      <option value="LOW">Baja</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contexto o información sobre la empresa (opcional para alimentar la IA)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Empresa líder en pagos y comercio electrónico. Utilizan React, Node y microservicios..."
                    value={formData.companyInfo}
                    onChange={(e) => handleChange('companyInfo', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
                  />
                </div>
              </div>

              {/* Parámetros de la IA */}
              <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Canal de Contacto
                    </label>
                    <select
                      value={formData.channel}
                      onChange={(e) => handleChange('channel', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-medium"
                    >
                      <option value="LINKEDIN_DM">LinkedIn (Mensaje / InMail)</option>
                      <option value="LINKEDIN_NOTE">LinkedIn (Nota de Conexión &lt;200 car.)</option>
                      <option value="COLD_EMAIL">Email en Frío (Cold Email)</option>
                      <option value="OTHER">Otro Medio / Mensaje</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tono del Mensaje
                    </label>
                    <select
                      value={formData.tone}
                      onChange={(e) => handleChange('tone', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-medium"
                    >
                      <option value="CORDIAL">Cordial y Profesional (Recomendado)</option>
                      <option value="DIRECT">Directo y Conciso</option>
                      <option value="ENTHUSIASTIC">Entusiasta y Dinámico</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGeneratePitch}
                  disabled={generatingAI}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400 hover:from-sky-300 hover:to-teal-300 transition-all shadow-md shadow-sky-500/20 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <SparklesIcon className={`w-4 h-4 ${generatingAI ? 'animate-spin' : ''}`} />
                  <span>
                    {generatingAI
                      ? 'Analizando empresa y generando pitch...'
                      : '✨ Generar Pitch Adaptado con IA'}
                  </span>
                </button>
              </div>
            </div>

            {/* Columna Derecha: Pitch Generado, Preview & Acciones (6 cols) */}
            <div className="lg:col-span-6 flex flex-col space-y-4">
              <div className="flex-1 flex flex-col p-4 rounded-2xl bg-slate-50/80 dark:bg-navy-base/60 border border-slate-200/80 dark:border-slate-800 space-y-3 min-h-[360px]">
                {/* Selector de pestañas de formato */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('pitch')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'pitch'
                          ? 'bg-sky-500 text-slate-950 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-highlight'
                      }`}
                    >
                      Mensaje Principal
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('shortNote')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'shortNote'
                          ? 'bg-sky-500 text-slate-950 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-highlight'
                      }`}
                    >
                      Nota Conexión (&le;200)
                    </button>
                    {formData.subject && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('email')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          activeTab === 'email'
                            ? 'bg-sky-500 text-slate-950 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-highlight'
                        }`}
                      >
                        Asunto Email
                      </button>
                    )}
                  </div>

                  {activeTab === 'shortNote' ? (
                    <button
                      type="button"
                      onClick={() => handleCopy('shortNote')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-all shadow-sm"
                    >
                      {copiedShort ? (
                        <>
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon className="w-3.5 h-3.5" />
                          <span>Copiar Nota</span>
                        </>
                      )}
                    </button>
                  ) : activeTab === 'email' ? (
                    <button
                      type="button"
                      onClick={() => handleCopy('subject')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-all shadow-sm"
                    >
                      {copiedSubject ? (
                        <>
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">¡Asunto copiado!</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon className="w-3.5 h-3.5" />
                          <span>Copiar Asunto</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCopy('pitch')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-all shadow-sm"
                    >
                      {copiedPitch ? (
                        <>
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon className="w-3.5 h-3.5" />
                          <span>Copiar Pitch</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Editor del Pitch */}
                <div className="flex-1 flex flex-col">
                  {activeTab === 'pitch' ? (
                    <div className="flex-1 flex flex-col">
                      <textarea
                        rows={10}
                        placeholder="El pitch adaptado generado por la IA aparecerá aquí, o puedes escribir tu propio mensaje personalizado..."
                        value={formData.pitch}
                        onChange={(e) => handleChange('pitch', e.target.value)}
                        className="flex-1 w-full p-3 text-xs leading-relaxed rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none font-sans"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 self-end">
                        {formData.pitch.length} caracteres
                      </span>
                    </div>
                  ) : activeTab === 'shortNote' ? (
                    <div className="flex-1 flex flex-col">
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 mb-2 text-[11px] text-amber-800 dark:text-amber-300">
                        ⚡ <strong>Nota de conexión de LinkedIn:</strong> Ideal para enviar junto con la solicitud de conexión (límite oficial de LinkedIn: 200 caracteres).
                      </div>
                      <textarea
                        rows={5}
                        placeholder="Nota breve para solicitud de conexión en LinkedIn..."
                        value={formData.shortNote}
                        onChange={(e) => handleChange('shortNote', e.target.value)}
                        className="flex-1 w-full p-3 text-xs leading-relaxed rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
                      />
                      <div className="flex justify-between items-center text-[10px] mt-1">
                        <span className={formData.shortNote.length > 200 ? 'text-rose-500 font-bold' : 'text-slate-400'}>
                          {formData.shortNote.length} / 200 caracteres máx.
                        </span>
                        {formData.shortNote.length > 200 && (
                          <span className="text-rose-500">Excede el límite de LinkedIn</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Asunto sugerido para el correo / InMail:
                        </label>
                        <button
                          type="button"
                          onClick={() => handleCopy('subject')}
                          className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                        >
                          <CopyIcon className="w-3 h-3" />
                          <span>{copiedSubject ? '¡Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={formData.subject}
                          onChange={(e) => handleChange('subject', e.target.value)}
                          className="w-full px-3 py-2 pr-20 text-xs rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium"
                          placeholder="Asunto sugerido..."
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy('subject')}
                          className="absolute right-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-base hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-all"
                        >
                          {copiedSubject ? '¡Listo!' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Resumen de la empresa si existe */}
                {formData.companySummary && (
                  <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-navy-highlight/50 border border-slate-200 dark:border-slate-700/60 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                      🏢 Perfil de {formData.companyName || 'la empresa'}:
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      {formData.companySummary}
                    </p>
                  </div>
                )}

                {/* Enlaces Rápidos de Acción Externa */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  {formData.recruiterLinkedin && (
                    <a
                      href={formData.recruiterLinkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-[#0A66C2] hover:bg-[#004182] text-white transition-all shadow-sm active:scale-[0.98]"
                    >
                      <LinkedInIcon className="w-3.5 h-3.5" />
                      <span>Abrir LinkedIn</span>
                      <ExternalLinkIcon className="w-3 h-3 opacity-80" />
                    </a>
                  )}

                  {formData.recruiterEmail && (
                    <a
                      href={gmailWebLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-navy-surface text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-highlight border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-all shadow-sm active:scale-[0.98]"
                      title="Abrir redactor en Gmail Web con destinatario, asunto y pitch precargados"
                    >
                      <GoogleIcon className="w-3.5 h-3.5" />
                      <span>Abrir en Gmail</span>
                      <ExternalLinkIcon className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
              <span>Se guardará en la columna <strong>Contacto</strong> con seguimiento activo.</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleModalClose}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-highlight transition-all"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 transition-all shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CheckCircleIcon className="w-4 h-4 stroke-[2.5]" />
                <span>{saving ? 'Guardando...' : 'Guardar Contacto y Pitch'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DirectContactModal;
