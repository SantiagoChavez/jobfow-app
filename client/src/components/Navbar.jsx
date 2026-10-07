import React, { useState, useRef, useEffect } from 'react';
import {
  RadarIcon,
  PlusIcon,
  FileTextIcon,
  KanbanIcon,
  TableIcon,
  BellIcon,
  UserIcon,
  LogOutIcon,
  ChevronDownIcon,
  KeyIcon,
  InfoIcon,
  SendHorizontalIcon,
} from './Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';

export const Navbar = ({
  currentView,
  setCurrentView,
  onOpenAddModal,
  onOpenDirectContactModal,
  onOpenReportModal,
  remindersCount = 0,
  onOpenReminders,
  onOpenProfileModal,
  onOpenAboutModal,
}) => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { success, showToast } = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-navy-base/90 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/80 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 transition-colors duration-200 shadow-sm dark:shadow-none w-full">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 w-full">
        {/* Logo & Marca */}
        <div 
          onClick={() => setCurrentView('kanban')}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none flex-shrink-0"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-navy-surface border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-amber-600 dark:text-gold-primary group-hover:border-amber-500/60 dark:group-hover:border-gold-primary/60 transition-all duration-300 shadow-sm dark:shadow-lg dark:shadow-black/20">
            <RadarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-gold-primary transition-colors">
                Job<span className="text-amber-600 dark:text-gold-primary">Flow</span>
              </span>
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-gold-primary/10 text-amber-700 dark:text-gold-primary font-bold border border-amber-500/30 dark:border-gold-primary/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-sky-600 dark:text-sky-tech/90 hidden sm:block">
              Radar & Career Tracker
            </p>
          </div>
        </div>

        {/* Navegación Desktop */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 dark:bg-navy-surface/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setCurrentView('kanban')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'kanban'
                  ? 'bg-white text-amber-700 shadow-sm border border-slate-200/80 dark:bg-navy-highlight dark:text-gold-primary dark:border-transparent'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/50'
              }`}
            >
              <KanbanIcon className="w-4 h-4" />
              Tablero Tracker
            </button>
            <button
              onClick={() => setCurrentView('table')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'table'
                  ? 'bg-white text-amber-700 shadow-sm border border-slate-200/80 dark:bg-navy-highlight dark:text-gold-primary dark:border-transparent'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/50'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              Tabla
            </button>
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/50 transition-all"
            >
              <FileTextIcon className="w-4 h-4 text-sky-600 dark:text-sky-tech" />
              Reporte PDF
            </button>
          </nav>
        )}

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Switch de Tema Dual (Sol / Luna) */}
          <ThemeToggle />

          {!isAuthenticated ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Botón Acerca de */}
              <button
                onClick={onOpenAboutModal}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-gold-primary hover:bg-slate-100 dark:hover:bg-navy-surface border border-slate-200/80 dark:border-slate-800 transition-all shadow-xs"
                title="Conoce más sobre JobFlow y su stack tecnológico"
              >
                <InfoIcon className="w-4 h-4 text-amber-500 dark:text-gold-primary" />
                <span className="hidden sm:inline">Acerca de</span>
              </button>

              {/* Botón de Ingreso cuando no está autenticado */}
              <button
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 dark:bg-gold-primary dark:hover:bg-gold-light text-slate-950 transition-all duration-200 shadow-md shadow-amber-500/20 dark:shadow-gold-primary/20 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
              >
                <UserIcon className="w-4 h-4" />
                <span>Ingresar</span>
              </button>
            </div>
          ) : (
            <>
              {/* Botón Acerca de (siempre accesible) */}
              <button
                onClick={onOpenAboutModal}
                className="p-2 rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-gold-primary hover:border-amber-300 dark:hover:border-gold-primary/50 hover:bg-slate-50 dark:hover:bg-navy-highlight transition-all shadow-sm"
                title="Acerca de JobFlow y Stack Tecnológico"
                aria-label="Acerca de JobFlow"
              >
                <InfoIcon className="w-5 h-5 text-amber-500 dark:text-gold-primary" />
              </button>

              {/* Botón de Campana / Alertas y Seguimientos */}
              <button
                onClick={onOpenReminders}
                className="relative p-2 rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-gold-primary hover:border-amber-300 dark:hover:border-gold-primary/50 hover:bg-slate-50 dark:hover:bg-navy-highlight transition-all shadow-sm"
                title="Ver seguimientos y alertas prioritarias"
                aria-label="Abrir panel de recordatorios"
              >
                <BellIcon className="w-5 h-5" />
                {remindersCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-navy-base animate-pulse">
                    {remindersCount > 9 ? '9+' : remindersCount}
                  </span>
                )}
              </button>

              {/* Botones de Acción: + Postulación y + Contacto Directo */}
              <div className="hidden sm:flex items-center gap-2">
                {/* Botón + Postulación (Compacto y equilibrado) */}
                <button
                  onClick={onOpenAddModal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 dark:bg-gold-primary dark:hover:bg-gold-light text-slate-950 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-amber-500/20 dark:hover:shadow-gold-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                  title="Registrar postulación a vacante pública"
                >
                  <PlusIcon className="w-3.5 h-3.5 stroke-[3]" />
                  <span className="hidden xl:inline">+ Nueva Postulación</span>
                  <span className="xl:hidden">+ Postulación</span>
                </button>

                {/* Botón + Mensaje a Reclutador (Nuevo) */}
                <button
                  onClick={onOpenDirectContactModal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-sky-500/25 hover:scale-[1.02] active:scale-[0.98]"
                  title="Registrar contacto directo y generar pitch para reclutador con IA"
                >
                  <SendHorizontalIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="hidden xl:inline">+ Mensaje a Reclutador</span>
                  <span className="xl:hidden">+ Contacto</span>
                </button>
              </div>

              {/* Menú de Usuario / Login */}
              {user && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white dark:bg-navy-surface border border-slate-200 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-gold-primary/50 hover:bg-slate-50 dark:hover:bg-navy-highlight transition-all duration-200 group shadow-sm"
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-7 h-7 rounded-lg object-cover border border-amber-500/40 dark:border-gold-primary/40 group-hover:border-amber-500 dark:group-hover:border-gold-primary"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-navy-highlight border border-amber-500/40 dark:border-gold-primary/40 text-amber-600 dark:text-gold-primary font-black text-xs flex items-center justify-center group-hover:border-amber-500 dark:group-hover:border-gold-primary">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <span className="hidden lg:block text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white max-w-[110px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDownIcon
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180 text-amber-600 dark:text-gold-primary' : ''
                      }`}
                    />
                  </button>

                  {/* Menú Desplegable */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-navy-base border border-slate-200 dark:border-slate-700/90 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden py-1 z-50 animate-scale-up">
                      {/* Info Usuario */}
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold text-amber-700 dark:text-gold-primary bg-amber-500/10 dark:bg-gold-primary/10 px-2 py-0.5 rounded-full border border-amber-500/30 dark:border-gold-primary/30">
                          Cuenta Activa
                        </span>
                      </div>

                      {/* Acciones */}
                      <div className="p-1 space-y-0.5">
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            if (typeof onOpenProfileModal === 'function') {
                              onOpenProfileModal();
                            }
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-gold-primary hover:bg-slate-50 dark:hover:bg-navy-highlight rounded-xl transition-colors text-left"
                        >
                          <UserIcon className="w-4 h-4 text-amber-500 dark:text-gold-primary" />
                          <span>Mi Perfil & Skills</span>
                        </button>

                        <button
                          onClick={() => {
                            const token = localStorage.getItem('jobflow_token');
                            if (token) {
                              navigator.clipboard.writeText(token);
                              if (typeof success === 'function') {
                                success('Token copiado al portapapeles para la extensión');
                              } else if (typeof showToast === 'function') {
                                showToast('Token copiado al portapapeles para la extensión', 'success');
                              }
                            }
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-gold-primary hover:bg-slate-50 dark:hover:bg-navy-highlight rounded-xl transition-colors text-left"
                          title="Copiar token para usar en la extensión de Chrome"
                        >
                          <KeyIcon className="w-4 h-4 text-amber-500 dark:text-gold-primary" />
                          <span>Copiar Token Extensión</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            if (typeof onOpenAboutModal === 'function') {
                              onOpenAboutModal();
                            }
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-gold-primary hover:bg-slate-50 dark:hover:bg-navy-highlight rounded-xl transition-colors text-left"
                        >
                          <InfoIcon className="w-4 h-4 text-amber-500 dark:text-gold-primary" />
                          <span>Acerca de JobFlow</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                        >
                          <LogOutIcon className="w-4 h-4" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Fila de Acciones Rápidas para Móviles (Visible y accesible en pantallas < sm) */}
      {isAuthenticated && (
        <div className="sm:hidden grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
          <button
            onClick={onOpenAddModal}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 dark:bg-gold-primary dark:hover:bg-gold-light text-slate-950 shadow-sm active:scale-[0.98] transition-all"
            title="Registrar nueva postulación de vacante"
          >
            <PlusIcon className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Postulación</span>
          </button>

          <button
            onClick={onOpenDirectContactModal}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 shadow-sm active:scale-[0.98] transition-all"
            title="Registrar contacto directo y generar pitch"
          >
            <SendHorizontalIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Reclutador</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
