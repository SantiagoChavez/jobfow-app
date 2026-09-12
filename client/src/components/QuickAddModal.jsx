import React, { useState, useEffect, useCallback } from 'react';
import { CloseIcon, SparklesIcon, BriefcaseIcon } from './Icons.jsx';
import { previewMatch, analyzeJobWithAI } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useModalA11y } from '../hooks/useModalA11y.js';

export const QuickAddModal = ({ isOpen, onClose, onSave }) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    companyName: '',
    companyWebsite: '',
    role: '',
    workMode: 'REMOTE',
    priority: 'MEDIUM',
    salary: '',
    jobUrl: '',
    recruiterName: '',
    recruiterEmail: '',
    requirementsRaw: '',
    companySummary: '',
    suggestedPitch: '',
  });

  const [saving, setSaving] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [analyzingMatch, setAnalyzingMatch] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados para Copiloto IA (Tarjeta 11)
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  const [copiedPitch, setCopiedPitch] = useState(false);

  // Cierre accesible
  const handleModalClose = useCallback(() => {
    setAiInsight(null);
    setCopiedPitch(false);
    setErrorMsg('');
    onClose();
  }, [onClose]);

  useModalA11y(isOpen, handleModalClose);

  // Manejador: Autocompletar con IA
  const handleAutofillWithAI = async () => {
    if (!formData.requirementsRaw || formData.requirementsRaw.trim().length < 15) {
      showToast('Pega al menos 15 caracteres en la descripción para analizar con IA', 'error');
      return;
    }

    try {
      setAnalyzingAI(true);
      const data = await analyzeJobWithAI(formData.requirementsRaw);

      setFormData((prev) => ({
        ...prev,
        companyName: data.companyName || prev.companyName,
        companyWebsite: data.companyWebsite || prev.companyWebsite,
        role: data.role || prev.role,
        workMode: data.workMode || prev.workMode,
        priority: data.priority || prev.priority,
        salary: data.salary ? String(data.salary) : prev.salary,
        companySummary: data.companySummary || prev.companySummary,
        suggestedPitch: data.suggestedPitch || prev.suggestedPitch,
      }));

      setAiInsight(data);

      if (data.extractedSkills?.length || data.missingSkills?.length || data.matchScore > 0) {
        setMatchData({
          matchScore: data.matchScore,
          matchedSkills: data.extractedSkills || [],
          missingSkills: data.missingSkills || [],
        });
      }

      showToast('¡Datos extraídos y pitch generado con IA!', 'success');
    } catch (err) {
      console.error('Error al analizar con IA:', err);
      showToast(err.message || 'Error al invocar el análisis de IA', 'error');
    } finally {
      setAnalyzingAI(false);
    }
  };

  // Manejador: Copiar Pitch Sugerido
  const handleCopyPitch = async () => {
    const pitchText = formData.suggestedPitch || aiInsight?.suggestedPitch;
    if (!pitchText) return;
    try {
      await navigator.clipboard.writeText(pitchText);
      setCopiedPitch(true);
      showToast('Pitch de presentación copiado al portapapeles');
      setTimeout(() => setCopiedPitch(false), 2200);
    } catch {
      showToast('No se pudo copiar al portapapeles', 'error');
    }
  };

  // Debounced análisis de afinidad de skills
  useEffect(() => {
    if (!formData.requirementsRaw || formData.requirementsRaw.trim().length < 5) {
      setMatchData((prev) => (prev !== null ? null : prev));
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setAnalyzingMatch(true);
        const result = await previewMatch(formData.requirementsRaw);
        setMatchData(result);
      } catch (err) {
        console.error('Error al analizar afinidad:', err);
      } finally {
        setAnalyzingMatch(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [formData.requirementsRaw]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.companyName.trim()) {
      setErrorMsg('El nombre de la empresa es obligatorio.');
      return;
    }
    if (!formData.role.trim()) {
      setErrorMsg('El puesto o rol es obligatorio.');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        company: {
          name: formData.companyName.trim(),
          website: formData.companyWebsite.trim() || undefined,
        },
        role: formData.role.trim(),
        workMode: formData.workMode,
        priority: formData.priority,
        salary: formData.salary ? Number(formData.salary) : undefined,
        jobUrl: formData.jobUrl.trim() || undefined,
        recruiter: formData.recruiterName.trim()
          ? {
              name: formData.recruiterName.trim(),
              email: formData.recruiterEmail.trim() || undefined,
            }
          : undefined,
        requirementsRaw: formData.requirementsRaw.trim() || undefined,
        extractedSkills: matchData?.matchedSkills || [],
        suggestedPitch: (formData.suggestedPitch ? formData.suggestedPitch.trim() : aiInsight?.suggestedPitch) || undefined,
        companySummary: (formData.companySummary ? formData.companySummary.trim() : aiInsight?.companySummary) || undefined,
        matchScore: matchData?.matchScore != null ? matchData.matchScore : undefined,
      });

      // Reset y cerrar
      setFormData({
        companyName: '',
        companyWebsite: '',
        role: '',
        workMode: 'REMOTE',
        priority: 'MEDIUM',
        salary: '',
        jobUrl: '',
        recruiterName: '',
        recruiterEmail: '',
        requirementsRaw: '',
        companySummary: '',
        suggestedPitch: '',
      });
      setAiInsight(null);
      setMatchData(null);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar la postulación');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-navy-base/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-navy-surface rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 overflow-hidden my-6 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-navy-base/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-gold-primary/10 border border-amber-500/30 dark:border-gold-primary/30 text-amber-600 dark:text-gold-primary">
              <BriefcaseIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Nueva Postulación</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Registra una vacante para monitoreo y seguimiento</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Fila 1: Empresa & Puesto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Empresa *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Ej: Mercado Libre, Globant..."
                className="w-full bg-slate-50 dark:bg-navy-base border border-slate-300 dark:border-slate-700/90 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 dark:focus:border-gold-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Puesto / Rol *
              </label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Ej: Fullstack Engineer, Backend Dev..."
                className="w-full bg-slate-50 dark:bg-navy-base border border-slate-300 dark:border-slate-700/90 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 dark:focus:border-gold-primary transition-colors"
              />
            </div>
          </div>

          {/* Fila 2: Modalidad & Prioridad & Salario */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Modalidad
              </label>
              <select
                value={formData.workMode}
                onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                className="w-full bg-slate-50 dark:bg-navy-base border border-slate-300 dark:border-slate-700/90 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-gold-primary transition-colors cursor-pointer"
              >
                <option value="REMOTE">Remoto</option>
                <option value="HYBRID">Híbrido</option>
                <option value="ON_SITE">Presencial</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-slate-50 dark:bg-navy-base border border-slate-300 dark:border-slate-700/90 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-gold-primary transition-colors cursor-pointer"
              >
                <option value="HIGH">Alta 🔥</option>
                <option value="MEDIUM">Media ⚡</option>
                <option value="LOW">Baja ☕</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Salario Estimado (USD)
              </label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="Ej: 3500"
                className="w-full bg-slate-50 dark:bg-navy-base border border-slate-300 dark:border-slate-700/90 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 dark:focus:border-gold-primary transition-colors"
              />
            </div>
          </div>

          {/* Fila 3: URL de la Oferta */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              URL de la Vacante
            </label>
            <input
              type="url"
              value={formData.jobUrl}
              onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
              placeholder="https://linkedin.com/jobs/view/..."
              className="w-full bg-slate-50 dark:bg-navy-base border border-slate-300 dark:border-slate-700/90 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 dark:focus:border-gold-primary transition-colors"
            />
          </div>

          {/* Fila 4: Requisitos Raw con Análisis en Vivo y Copiloto IA */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Descripción / Requisitos Técnicos
              </label>
              <div className="flex items-center gap-2">
                {analyzingMatch && (
                  <span className="text-[10px] text-sky-600 dark:text-sky-tech animate-pulse flex items-center gap-1 font-semibold">
                    <SparklesIcon className="w-3 h-3" /> Analizando afinidad...
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleAutofillWithAI}
                  disabled={analyzingAI || !formData.requirementsRaw.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-400 dark:from-gold-primary dark:to-amber-400 text-slate-950 dark:text-navy-base hover:brightness-105 active:scale-95 transition-all shadow-sm shadow-amber-500/20 dark:shadow-gold-primary/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                  title="Extraer datos con IA y autocompletar formulario"
                >
                  <SparklesIcon className={`w-3.5 h-3.5 ${analyzingAI ? 'animate-spin' : ''}`} />
                  {analyzingAI ? 'Analizando con IA...' : '✨ Autocompletar con IA'}
                </button>
              </div>
            </div>
            <textarea
              rows={4}
              value={formData.requirementsRaw}
              onChange={(e) => setFormData({ ...formData, requirementsRaw: e.target.value })}
              placeholder="Pega aquí la descripción u oferta de empleo completa. Luego haz clic en '✨ Autocompletar con IA' para rellenar los datos automáticamente..."
              className="w-full bg-slate-50 dark:bg-navy-base border border-slate-300 dark:border-slate-700/90 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 dark:focus:border-gold-primary transition-colors resize-none"
            />

            {/* Badge y Tags de Afinidad en Vivo */}
            {matchData && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-navy-base/90 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <SparklesIcon className="w-3.5 h-3.5 text-amber-600 dark:text-gold-primary" />
                    Afinidad con tu Perfil:
                  </span>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                      matchData.matchScore >= 70
                        ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                        : matchData.matchScore >= 40
                        ? 'bg-amber-500/15 dark:bg-gold-primary/20 text-amber-700 dark:text-gold-primary border-amber-500/40 dark:border-gold-primary/40'
                        : 'bg-rose-500/15 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {matchData.matchScore}% Coincidencia
                  </span>
                </div>

                {/* Skills detectadas */}
                <div className="flex flex-wrap gap-1.5">
                  {matchData.matchedSkills?.map((skill, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                  {matchData.missingSkills?.map((skill, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                    >
                      + {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tarjeta de Resumen y Pitch Generado por IA */}
            {aiInsight && (
              <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-slate-50 dark:from-navy-base dark:to-slate-900 border border-amber-500/30 dark:border-gold-primary/30 shadow-md shadow-slate-900/5 dark:shadow-black/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-700 dark:text-gold-primary flex items-center gap-1.5">
                    <SparklesIcon className="w-4 h-4 text-amber-600 dark:text-gold-primary" />
                    Copiloto IA: Pitch & Resumen
                  </span>
                  {aiInsight.suggestedPitch && (
                    <button
                      type="button"
                      onClick={handleCopyPitch}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-gold-primary/50 transition-colors shadow-sm"
                    >
                      {copiedPitch ? (
                        <>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span> ¡Pitch Copiado!
                        </>
                      ) : (
                        <>
                          <span>📋</span> Copiar Pitch
                        </>
                      )}
                    </button>
                  )}
                </div>

                {aiInsight.companySummary && (
                  <div className="text-xs text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-500 dark:text-slate-400 block text-[10px] uppercase tracking-wider mb-1">
                      🏢 Resumen de la Empresa
                    </span>
                    {aiInsight.companySummary}
                  </div>
                )}

                {aiInsight.suggestedPitch && (
                  <div className="text-xs text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-navy-base/80 p-2.5 rounded-xl border border-amber-500/20 dark:border-gold-primary/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-700 dark:text-gold-primary block text-[10px] uppercase tracking-wider">
                        💬 Pitch de Contacto Sugerido para Recruiters
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Personalizable</span>
                    </div>
                    <textarea
                      rows={4}
                      value={formData.suggestedPitch !== undefined && formData.suggestedPitch !== '' ? formData.suggestedPitch : aiInsight.suggestedPitch}
                      onChange={(e) => setFormData((prev) => ({ ...prev, suggestedPitch: e.target.value }))}
                      className="w-full text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-navy-surface/90 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700/80 focus:border-amber-500 dark:focus:border-gold-primary focus:outline-none leading-relaxed font-sans resize-y select-text"
                      placeholder="Escribe o ajusta tu pitch aquí..."
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 dark:bg-gold-primary dark:hover:bg-gold-light text-slate-950 dark:text-navy-base transition-all shadow-md shadow-amber-500/20 dark:shadow-gold-primary/20 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Postulación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddModal;
