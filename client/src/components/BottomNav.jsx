import React, { useState, useRef, useEffect } from 'react';
import {
  KanbanIcon,
  TableIcon,
  PlusIcon,
  FileTextIcon,
  RefreshIcon,
  BriefcaseIcon,
  SendHorizontalIcon,
} from './Icons.jsx';

export const BottomNav = ({
  currentView,
  setCurrentView,
  onOpenAddModal,
  onOpenDirectContactModal,
  onOpenReportModal,
  onRefresh,
}) => {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowActionMenu(false);
      }
    };
    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showActionMenu]);

  return (
    <>
      {/* Mini Menú Flotante Móvil de Creación */}
      {showActionMenu && (
        <div
          ref={menuRef}
          className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xs bg-white/95 dark:bg-navy-base/95 border border-slate-200 dark:border-slate-700/90 rounded-2xl shadow-2xl p-2 animate-scale-up space-y-1.5 backdrop-blur-md"
        >
          <button
            onClick={() => {
              setShowActionMenu(false);
              onOpenAddModal();
            }}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-gold-primary transition-all text-left group"
          >
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-gold-primary group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <BriefcaseIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold">+ Nueva Postulación</p>
              <p className="text-[10px] font-normal text-slate-400">Analizar oferta y JD con IA</p>
            </div>
          </button>

          <button
            onClick={() => {
              setShowActionMenu(false);
              onOpenDirectContactModal?.();
            }}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-sky-50 dark:hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-all text-left group"
          >
            <div className="p-2 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">
              <SendHorizontalIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold">+ Mensaje a Reclutador</p>
              <p className="text-[10px] font-normal text-slate-400">Contacto directo & pitch IA</p>
            </div>
          </button>
        </div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-navy-base/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-around shadow-lg dark:shadow-none transition-colors">
        <button
          onClick={() => setCurrentView('kanban')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium transition-colors ${
            currentView === 'kanban'
              ? 'text-amber-700 dark:text-gold-primary font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <KanbanIcon className="w-5 h-5" />
          <span>Tracker</span>
        </button>

        <button
          onClick={() => setCurrentView('table')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium transition-colors ${
            currentView === 'table'
              ? 'text-amber-700 dark:text-gold-primary font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <TableIcon className="w-5 h-5" />
          <span>Tabla</span>
        </button>

        {/* Botón Central de Creación */}
        <button
          onClick={() => setShowActionMenu(!showActionMenu)}
          className={`relative -top-3 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 via-amber-400 to-sky-500 dark:from-gold-primary dark:to-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 dark:shadow-gold-primary/30 active:scale-95 transition-transform ${
            showActionMenu ? 'rotate-45' : ''
          }`}
          title="Crear nueva postulación o contacto directo"
        >
          <PlusIcon className="w-6 h-6 stroke-[3]" />
        </button>

        <button
          onClick={onOpenReportModal}
          className="flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <FileTextIcon className="w-5 h-5 text-sky-600 dark:text-sky-tech" />
          <span>Reporte</span>
        </button>

        <button
          onClick={onRefresh}
          className="flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <RefreshIcon className="w-5 h-5" />
          <span>Recargar</span>
        </button>
      </div>
    </>
  );
};

export default BottomNav;
