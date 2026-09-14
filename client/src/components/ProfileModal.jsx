import React, { useState, useRef } from 'react';
import {
  CloseIcon,
  UserIcon,
  SparklesIcon,
  CheckCircleIcon,
} from './Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  updateUserProfile,
  importGithubSkills,
  extractProfileFromText,
} from '../services/api.js';
import { useModalA11y } from '../hooks/useModalA11y.js';

const POPULAR_SKILLS_SUGGESTIONS = [
  'JavaScript', 'TypeScript', 'Node.js', 'Express', 'React', 'Next.js',
  'MongoDB', 'PostgreSQL', 'Python', 'FastAPI', 'Django', 'Docker',
  'AWS', 'Git', 'Tailwind CSS', 'GraphQL', 'REST API', 'Vitest',
  'Redux', 'Vue', 'Angular', 'Java', 'Spring Boot', 'C#', 'SQL',
];

const ProfileModalDialog = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const { showToast, success, error: showError } = useToast();

  const [activeImportTab, setActiveImportTab] = useState('github'); // 'github' | 'ai'
  const [githubInput, setGithubInput] = useState(user?.links?.github || '');
  const [cvText, setCvText] = useState('');
  const [isImportingGithub, setIsImportingGithub] = useState(false);
  const [isExtractingAi, setIsExtractingAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Campos de formulario inicializados reactivamente desde el perfil actual
  const [name, setName] = useState(user?.name || '');
  const [headline, setHeadline] = useState(user?.headline || 'Full Stack Developer');
  const [bio, setBio] = useState(user?.bio || '');
  const [skills, setSkills] = useState(
    Array.isArray(user?.skills) && user.skills.length > 0
      ? user.skills
      : ['JavaScript', 'TypeScript', 'Node.js', 'Express', 'React', 'MongoDB', 'Git', 'REST API']
  );
  const [newSkillInput, setNewSkillInput] = useState('');
  const [links, setLinks] = useState({
    linkedin: user?.links?.linkedin || '',
    github: user?.links?.github || '',
    portfolio: user?.links?.portfolio || '',
  });

  const skillInputRef = useRef(null);

  useModalA11y(isOpen, onClose);

  // Agregar habilidad (desde input o sugerencia)
  const handleAddSkill = (skillToAdd) => {
    const candidate = (skillToAdd || newSkillInput).trim();
    if (!candidate) return;

    // Normalizar capitalización si ya existe
    const exists = skills.some((s) => s.toLowerCase() === candidate.toLowerCase());
    if (!exists) {
      setSkills((prev) => [...prev, candidate]);
    }
    setNewSkillInput('');
    if (skillInputRef.current) {
      skillInputRef.current.focus();
    }
  };

  // Remover habilidad
  const handleRemoveSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // Importar desde GitHub
  const handleImportGithub = async () => {
    if (!githubInput.trim()) {
      showToast('Ingresa tu usuario o URL de perfil de GitHub', 'info');
      return;
    }

    setIsImportingGithub(true);
    try {
      const res = await importGithubSkills(githubInput.trim());
      const extracted = res.data || res;

      if (Array.isArray(extracted.skills) && extracted.skills.length > 0) {
        setSkills((prev) => {
          const combined = [...prev];
          const existingLower = new Set(prev.map((s) => s.toLowerCase()));
          for (const s of extracted.skills) {
            if (!existingLower.has(s.toLowerCase())) {
              existingLower.add(s.toLowerCase());
              combined.push(s);
            }
          }
          return combined;
        });
      }

      // Autocompletar enlace de GitHub y bio si estaban vacíos
      setLinks((prev) => ({
        ...prev,
        github: prev.github || `https://github.com/${extracted.username || githubInput.trim()}`,
      }));

      if (!bio && extracted.bio) {
        setBio(extracted.bio);
      }

      const toastFn = success || showToast;
      toastFn(`¡Se detectaron ${extracted.skills?.length || 0} tecnologías desde tus repositorios de GitHub!`);
    } catch (err) {
      console.error('Error al importar de GitHub:', err);
      const errFn = showError || showToast;
      errFn(err.message || 'No se pudieron extraer datos de GitHub.', 'error');
    } finally {
      setIsImportingGithub(false);
    }
  };

  // Extraer desde CV o LinkedIn con Gemini
  const handleExtractCv = async () => {
    if (!cvText.trim() || cvText.trim().length < 20) {
      showToast('Por favor pega al menos un párrafo de tu CV o perfil de LinkedIn (mínimo 20 caracteres)', 'info');
      return;
    }

    setIsExtractingAi(true);
    try {
      const res = await extractProfileFromText(cvText.trim());
      const data = res.data || res;

      if (data.headline) setHeadline(data.headline);
      if (data.bio) setBio(data.bio);
      if (Array.isArray(data.skills) && data.skills.length > 0) {
        setSkills((prev) => {
          const combined = [...prev];
          const existingLower = new Set(prev.map((s) => s.toLowerCase()));
          for (const s of data.skills) {
            if (!existingLower.has(s.toLowerCase())) {
              existingLower.add(s.toLowerCase());
              combined.push(s);
            }
          }
          return combined;
        });
      }

      if (data.links) {
        setLinks((prev) => ({
          linkedin: data.links.linkedin || prev.linkedin,
          github: data.links.github || prev.github,
          portfolio: data.links.portfolio || prev.portfolio,
        }));
      }

      const toastFn = success || showToast;
      toastFn('¡Perfil y habilidades extraídos con éxito con Gemini AI!');
      setCvText('');
    } catch (err) {
      console.error('Error al extraer con IA:', err);
      const errFn = showError || showToast;
      errFn(err.message || 'Error al analizar el texto con IA.', 'error');
    } finally {
      setIsExtractingAi(false);
    }
  };

  // Guardar Cambios
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        name: name.trim() || user?.name,
        headline: headline.trim(),
        bio: bio.trim(),
        skills,
        links: {
          linkedin: links.linkedin.trim(),
          github: links.github.trim(),
          portfolio: links.portfolio.trim(),
        },
      };

      const res = await updateUserProfile(payload);
      const updatedUser = res.user || payload;

      if (typeof updateUser === 'function') {
        updateUser(updatedUser);
      }

      const toastFn = success || showToast;
      toastFn('¡Perfil profesional actualizado exitosamente!');
      onClose();
    } catch (err) {
      console.error('Error al guardar perfil:', err);
      const errFn = showError || showToast;
      errFn(err.message || 'Error al guardar el perfil en el servidor.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Sugerencias no añadidas aún
  const unaddedSuggestions = POPULAR_SKILLS_SUGGESTIONS.filter(
    (s) => !skills.some((existing) => existing.toLowerCase() === s.toLowerCase())
  ).slice(0, 8);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-navy-base border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-navy-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-gold-primary/10 border border-amber-500/20 dark:border-gold-primary/20 flex items-center justify-center text-amber-600 dark:text-gold-primary">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Mi Perfil Profesional & Habilidades
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 dark:bg-gold-primary/10 text-amber-700 dark:text-gold-primary font-bold border border-amber-500/30 dark:border-gold-primary/30">
                  {skills.length} skills
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personaliza tu stack técnico para que el Copiloto IA y el Match % se adapten a ti
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cerrar modal"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Principal / Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(85vh-130px)] overflow-y-auto custom-scrollbar">
          
          {/* SECCIÓN 1: IMPORTACIÓN MÁGICA (GitHub & Gemini AI) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-sky-50/50 dark:from-navy-surface dark:to-navy-highlight/40 border border-amber-200/60 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-gold-primary flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4" /> Carga Mágica de Habilidades
              </span>
              <div className="flex items-center gap-1 bg-white dark:bg-navy-base p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveImportTab('github')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    activeImportTab === 'github'
                      ? 'bg-amber-500 text-white dark:bg-gold-primary dark:text-navy-base shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🐙 Desde GitHub
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImportTab('ai')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    activeImportTab === 'ai'
                      ? 'bg-amber-500 text-white dark:bg-gold-primary dark:text-navy-base shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  ✨ Pegar CV / LinkedIn
                </button>
              </div>
            </div>

            {/* Pestaña: GitHub */}
            {activeImportTab === 'github' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Escanea automáticamente los lenguajes y topics de tus repositorios públicos de GitHub:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={githubInput}
                    onChange={(e) => setGithubInput(e.target.value)}
                    placeholder="https://github.com/tu-usuario o tu-usuario"
                    className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-navy-base border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <button
                    type="button"
                    onClick={handleImportGithub}
                    disabled={isImportingGithub}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-gold-primary dark:hover:bg-gold-light dark:text-navy-base transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 flex-shrink-0"
                  >
                    {isImportingGithub ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Escaneando...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡ Extraer Skills</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Pestaña: CV / LinkedIn */}
            {activeImportTab === 'ai' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Pega el texto de tu CV o sección "Acerca de / Experiencia" de LinkedIn para que Gemini extraiga tus habilidades:
                </p>
                <textarea
                  rows={3}
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Pega aquí el texto de tu perfil o currículum..."
                  className="w-full p-3 rounded-xl text-xs bg-white dark:bg-navy-base border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleExtractCv}
                    disabled={isExtractingAi}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white dark:bg-gold-primary dark:hover:bg-gold-light dark:text-navy-base transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isExtractingAi ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Analizando con IA...</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-3.5 h-3.5" />
                        <span>✨ Extraer con IA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 2: GESTIÓN DE SKILLS INTERACTIVAS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Habilidades Técnicas ({skills.length})
              </label>
              <span className="text-[11px] text-slate-400">
                Haz clic en la cruz para eliminar o escribe para agregar
              </span>
            </div>

            {/* Chips de Skills Actuales */}
            <div className="flex flex-wrap gap-2 p-3 min-h-[64px] rounded-2xl bg-slate-50 dark:bg-navy-surface border border-slate-200 dark:border-slate-700/80 items-center">
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white dark:bg-navy-base border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 shadow-sm animate-scale-up group"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                      title={`Eliminar ${skill}`}
                    >
                      <CloseIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Aún no tienes habilidades configuradas. Escribe abajo o impórtalas de GitHub.
                </p>
              )}
            </div>

            {/* Input para nueva skill */}
            <div className="flex gap-2">
              <input
                ref={skillInputRef}
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Escribe una tecnología (ej: Docker, AWS, NestJS) y presiona Enter..."
                className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-colors"
              >
                + Agregar
              </button>
            </div>

            {/* Sugerencias Rápidas */}
            {unaddedSuggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400">Sugerencias:</span>
                {unaddedSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleAddSkill(sug)}
                    className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 dark:bg-navy-surface dark:hover:bg-gold-primary/20 dark:text-slate-300 dark:hover:text-gold-primary border border-slate-200/80 dark:border-slate-700/80 transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SECCIÓN 3: DATOS PROFESIONALES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nombre Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre y apellido"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Titular / Rol Profesional
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Ej: Full Stack Developer | Backend"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          {/* Resumen / Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Resumen Profesional (usado para el Pitch de IA)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Breve reseña sobre tu experiencia, enfoque y trayectoria..."
              className="w-full p-3 rounded-xl text-xs bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
            />
          </div>

          {/* Enlaces Profesionales */}
          <div className="space-y-3 pt-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Enlaces Profesionales
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">LinkedIn URL</span>
                <input
                  type="url"
                  value={links.linkedin}
                  onChange={(e) => setLinks({ ...links, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">GitHub URL</span>
                <input
                  type="url"
                  value={links.github}
                  onChange={(e) => setLinks({ ...links, github: e.target.value })}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Portafolio Web</span>
                <input
                  type="url"
                  value={links.portfolio}
                  onChange={(e) => setLinks({ ...links, portfolio: e.target.value })}
                  placeholder="https://tu-portfolio.dev"
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white dark:bg-gold-primary dark:hover:bg-gold-light dark:text-navy-base transition-all shadow-md shadow-amber-500/20 dark:shadow-gold-primary/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ProfileModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return <ProfileModalDialog isOpen={isOpen} onClose={onClose} />;
};

export default ProfileModal;

