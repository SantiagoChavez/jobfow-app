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
} from './Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const Navbar = ({
  currentView,
  setCurrentView,
  onOpenAddModal,
  onOpenReportModal,
  remindersCount = 0,
  onOpenReminders,
}) => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
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
    <header className="sticky top-0 z-30 bg-navy-base/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Marca */}
        <div 
          onClick={() => setCurrentView('kanban')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-navy-surface border border-slate-700/80 flex items-center justify-center group-hover:border-gold-primary/60 transition-all duration-300 shadow-lg shadow-black/20">
            <RadarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-white group-hover:text-gold-primary transition-colors">
                Job<span className="text-gold-primary">Flow</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold-primary/10 text-gold-primary font-bold border border-gold-primary/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-medium tracking-wider uppercase text-sky-tech/90 hidden sm:block">
              Radar & Career Tracker
            </p>
          </div>
        </div>

        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center gap-1 bg-navy-surface/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setCurrentView('kanban')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'kanban'
                ? 'bg-navy-highlight text-gold-primary shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <KanbanIcon className="w-4 h-4" />
            Tablero Tracker
          </button>
          <button
            onClick={() => setCurrentView('table')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'table'
                ? 'bg-navy-highlight text-gold-primary shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            Tabla
          </button>
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all"
          >
            <FileTextIcon className="w-4 h-4 text-sky-tech" />
            Reporte PDF
          </button>
        </nav>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2.5">
          {/* Botón de Campana / Alertas y Seguimientos */}
          <button
            onClick={onOpenReminders}
            className="relative p-2 rounded-xl bg-navy-surface border border-slate-700/80 text-slate-300 hover:text-gold-primary hover:border-gold-primary/50 hover:bg-navy-highlight transition-all"
            title="Ver seguimientos y alertas prioritarias"
            aria-label="Abrir panel de recordatorios"
          >
            <BellIcon className="w-5 h-5" />
            {remindersCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-navy-base animate-pulse">
                {remindersCount > 9 ? '9+' : remindersCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenReportModal}
            className="md:hidden p-2 rounded-xl bg-navy-surface border border-slate-700/80 text-sky-tech hover:bg-navy-highlight transition-all"
            title="Generar Reporte PDF"
          >
            <FileTextIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm bg-gold-primary hover:bg-gold-light text-navy-base transition-all duration-200 shadow-md shadow-gold-primary/20 hover:shadow-gold-primary/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusIcon className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">+ Nueva Postulación</span>
            <span className="sm:hidden">+ Nueva</span>
          </button>

          {/* Menú de Usuario / Login */}
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-navy-surface border border-slate-700/80 hover:border-gold-primary/50 hover:bg-navy-highlight transition-all duration-200 group"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover border border-gold-primary/40 group-hover:border-gold-primary"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-navy-highlight border border-gold-primary/40 text-gold-primary font-black text-xs flex items-center justify-center group-hover:border-gold-primary">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="hidden lg:block text-xs font-semibold text-slate-200 group-hover:text-white max-w-[110px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-gold-primary' : ''
                  }`}
                />
              </button>

              {/* Menú Desplegable */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-navy-base border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden py-1 z-50 animate-scale-up">
                  {/* Info Usuario */}
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-gold-primary bg-gold-primary/10 px-2 py-0.5 rounded-full border border-gold-primary/30">
                      Cuenta Activa
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                    >
                      <LogOutIcon className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-navy-surface border border-slate-700/80 text-slate-200 hover:text-white hover:border-gold-primary/50 hover:bg-navy-highlight transition-all duration-200"
            >
              <UserIcon className="w-4 h-4 text-gold-primary" />
              <span>Ingresar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
