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

  const success = useCallback((message, duration) => showToast(message, 'success', duration), [showToast]);
  const error = useCallback((message, duration) => showToast(message, 'error', duration), [showToast]);
  const info = useCallback((message, duration) => showToast(message, 'info', duration), [showToast]);

  const contextValue = useMemo(
    () => ({
      showToast,
      hideToast,
      success,
      error,
      info,
    }),
    [showToast, hideToast, success, error, info]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-24 sm:top-28 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-[calc(100%-2rem)] sm:w-auto sm:min-w-[340px] pointer-events-none transition-all duration-300 transform translate-y-0 opacity-100 animate-fade-in"
        >
          <div
            className={`pointer-events-auto p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm font-semibold shadow-2xl backdrop-blur-md flex items-center justify-between gap-3.5 border ${
              toast.type === 'error'
                ? 'bg-rose-950/95 text-rose-100 border-rose-500/50 shadow-rose-950/60'
                : toast.type === 'info'
                ? 'bg-white text-slate-900 border-sky-300 shadow-sky-500/20 dark:bg-navy-surface/95 dark:text-sky-200 dark:border-sky-500/50 dark:shadow-sky-950/50'
                : 'bg-white text-slate-900 border-emerald-300 shadow-emerald-500/20 dark:bg-navy-surface/95 dark:text-white dark:border-emerald-500/50 dark:shadow-emerald-950/40'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {toast.type === 'error' ? (
                <AlertCircleIcon className="w-5 h-5 text-rose-400 flex-shrink-0" />
              ) : toast.type === 'info' ? (
                <SparklesIcon className="w-5 h-5 text-sky-600 dark:text-sky-tech flex-shrink-0" />
              ) : (
                <CheckCircleIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
              )}
              <span className="leading-snug">{toast.message}</span>
            </div>

            <button
              onClick={hideToast}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors flex-shrink-0"
              title="Cerrar notificación"
            >
              <CloseIcon className="w-4 h-4" />
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
