import React, { useState, useEffect } from 'react';
import { CloseIcon, SparklesIcon, BuildingIcon, BriefcaseIcon, DollarIcon, ExternalLinkIcon } from './Icons.jsx';
import { previewMatch } from '../services/api.js';

export const QuickAddModal = ({ isOpen, onClose, onSave }) => {
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
  });

  const [saving, setSaving] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [analyzingMatch, setAnalyzingMatch] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Debounced análisis de afinidad de skills
  useEffect(() => {
    if (!formData.requirementsRaw || formData.requirementsRaw.trim().length < 5) {
      setMatchData(null);
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
      });
      setMatchData(null);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar la postulación');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-base/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-navy-surface rounded-3xl border border-slate-700/80 shadow-2xl shadow-black/60 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-navy-base/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold-primary/10 border border-gold-primary/30 text-gold-primary">
              <BriefcaseIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nueva Postulación</h3>
              <p className="text-xs text-slate-400">Registra una vacante para monitoreo y seguimiento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Fila 1: Empresa & Puesto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Empresa *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Ej: Mercado Libre, Globant..."
                className="w-full bg-navy-base border border-slate-700/90 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Puesto / Rol *
              </label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Ej: Fullstack Engineer, Backend Dev..."
                className="w-full bg-navy-base border border-slate-700/90 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-primary transition-colors"
              />
            </div>
          </div>

          {/* Fila 2: Modalidad & Prioridad & Salario */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Modalidad
              </label>
              <select
                value={formData.workMode}
                onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                className="w-full bg-navy-base border border-slate-700/90 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-gold-primary transition-colors cursor-pointer"
              >
                <option value="REMOTE">Remoto</option>
                <option value="HYBRID">Híbrido</option>
                <option value="ON_SITE">Presencial</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-navy-base border border-slate-700/90 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-gold-primary transition-colors cursor-pointer"
              >
                <option value="HIGH">Alta 🔥</option>
                <option value="MEDIUM">Media ⚡</option>
                <option value="LOW">Baja ☕</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Salario Estimado (USD)
              </label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="Ej: 3500"
                className="w-full bg-navy-base border border-slate-700/90 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-primary transition-colors"
              />
            </div>
          </div>

          {/* Fila 3: URL de la Oferta */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              URL de la Vacante
            </label>
            <input
              type="url"
              value={formData.jobUrl}
              onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
              placeholder="https://linkedin.com/jobs/view/..."
              className="w-full bg-navy-base border border-slate-700/90 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-primary transition-colors"
            />
          </div>

          {/* Fila 4: Requisitos Raw con Análisis en Vivo */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Descripción / Requisitos Técnicos
              </label>
              {analyzingMatch && (
                <span className="text-[10px] text-sky-tech animate-pulse flex items-center gap-1 font-semibold">
                  <SparklesIcon className="w-3 h-3" /> Analizando afinidad...
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={formData.requirementsRaw}
              onChange={(e) => setFormData({ ...formData, requirementsRaw: e.target.value })}
              placeholder="Pega aquí los requerimientos de la oferta (ej: Node.js, React, Docker, PostgreSQL) para ver la afinidad con tu perfil..."
              className="w-full bg-navy-base border border-slate-700/90 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-primary transition-colors resize-none"
            />

            {/* Badge y Tags de Afinidad en Vivo */}
            {matchData && (
              <div className="mt-2.5 p-3 rounded-xl bg-navy-base/90 border border-slate-700/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <SparklesIcon className="w-3.5 h-3.5 text-gold-primary" />
                    Afinidad con tu Perfil:
                  </span>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                      matchData.matchScore >= 70
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : matchData.matchScore >= 40
                        ? 'bg-gold-primary/20 text-gold-primary border-gold-primary/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
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
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                  {matchData.missingSkills?.map((skill, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700"
                    >
                      + {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-black bg-gold-primary hover:bg-gold-light text-navy-base transition-all shadow-md shadow-gold-primary/20 disabled:opacity-50"
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
