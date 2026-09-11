import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { CheckCircleIcon, AlertCircleIcon, SparklesIcon, CloseIcon } from '../components/Icons.jsx';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast({ message, type });
    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, duration);
  }, []);

  // Cleanup en desmontaje para prevenir memory leaks
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      showToast,
      hideToast,
    }),
    [showToast, hideToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-50 max-w-sm w-full pointer-events-none transition-all duration-300 transform translate-y-0 opacity-100"
        >
          <div
            className={`pointer-events-auto p-3.5 rounded-2xl text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 border ${
              toast.type === 'error'
                ? 'bg-rose-950/95 text-rose-100 border-rose-500/50 shadow-rose-950/50'
                : toast.type === 'info'
                ? 'bg-navy-surface/95 text-sky-200 border-sky-500/40 shadow-sky-950/40'
                : 'bg-navy-surface/95 text-white border-emerald-500/40 shadow-emerald-950/30'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toast.type === 'error' ? (
                <AlertCircleIcon className="w-4 h-4 text-rose-400 flex-shrink-0" />
              ) : toast.type === 'info' ? (
                <SparklesIcon className="w-4 h-4 text-sky-tech flex-shrink-0" />
              ) : (
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
              <span className="truncate">{toast.message}</span>
            </div>

            <button
              onClick={hideToast}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors flex-shrink-0"
              title="Cerrar notificación"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser utilizado dentro de un ToastProvider');
  }
  return context;
};

export default ToastContext;
