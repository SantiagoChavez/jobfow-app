import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';

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
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xl shadow-black/40 flex items-center gap-2 animate-bounce transition-all select-none ${
            toast.type === 'error'
              ? 'bg-rose-950/95 text-rose-200 border border-rose-500/50'
              : 'bg-navy-highlight text-white border border-gold-primary/40'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              toast.type === 'error' ? 'bg-rose-400' : 'bg-gold-primary'
            }`}
          />
          <span>{toast.message}</span>
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
