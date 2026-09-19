import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import { updateUserTheme } from '../services/api.js';

const ThemeContext = createContext(null);

/**
 * Aplica de forma directa e inmediata las clases CSS correspondientes al elemento <html>
 * @param {'dark'|'light'} targetTheme
 */
const applyThemeToDom = (targetTheme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (targetTheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
};

/**
 * Obtiene el tema inicial según orden de prioridad:
 * 1. Valor guardado en localStorage ('dark' | 'light')
 * 2. Preferencia del sistema operativo (prefers-color-scheme)
 * 3. Fallback por defecto ('dark')
 */
const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';

  try {
    const stored = localStorage.getItem('jobflow_theme');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch (err) {
    console.warn('Error al leer preferencia de tema inicial:', err);
  }

  return 'dark';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme);
  const { user, isAuthenticated, updateUser } = useAuth();

  // Referencias para rastrear el último usuario y tema sincronizados desde el backend
  const prevUserIdRef = useRef(user?._id);
  const prevUserThemeRef = useRef(user?.theme);

  // Aplicar clase en el DOM y persistir en localStorage cuando theme cambia
  useEffect(() => {
    applyThemeToDom(theme);
    try {
      localStorage.setItem('jobflow_theme', theme);
    } catch (err) {
      console.warn('Error al persistir tema en localStorage:', err);
    }
  }, [theme]);

  // Sincronizar con el perfil del usuario autenticado SOLO ante nuevo login o cambio remoto de usuario
  useEffect(() => {
    if (!user) {
      prevUserIdRef.current = null;
      prevUserThemeRef.current = null;
      return;
    }

    const isNewUserSession = user._id !== prevUserIdRef.current;
    const isThemeUpdatedFromBackend = user.theme && user.theme !== prevUserThemeRef.current;

    if (isNewUserSession || isThemeUpdatedFromBackend) {
      prevUserIdRef.current = user._id;
      prevUserThemeRef.current = user.theme;

      if (user.theme === 'dark' || user.theme === 'light') {
        setThemeState(user.theme);
        applyThemeToDom(user.theme);
        try {
          localStorage.setItem('jobflow_theme', user.theme);
        } catch (err) {
          console.warn('Error al sincronizar tema de perfil en localStorage:', err);
        }
      }
    }
  }, [user]);

  // Cambiar tema explícitamente o mediante función de actualización
  const setTheme = useCallback(
    (themeOrUpdater) => {
      setThemeState((currentTheme) => {
        const nextTheme =
          typeof themeOrUpdater === 'function' ? themeOrUpdater(currentTheme) : themeOrUpdater;

        if (nextTheme !== 'dark' && nextTheme !== 'light') {
          return currentTheme;
        }

        // Mantener ref sincronizado para que el effect de sesión no lo confunda con un cambio externo
        prevUserThemeRef.current = nextTheme;

        // Actualizar DOM de forma inmediata
        applyThemeToDom(nextTheme);

        try {
          localStorage.setItem('jobflow_theme', nextTheme);
        } catch (err) {
          console.warn('Error al persistir tema en localStorage:', err);
        }

        // Sincronizar AuthContext y backend si el usuario está conectado
        if (isAuthenticated) {
          if (updateUser) {
            updateUser({ theme: nextTheme });
          }
          updateUserTheme(nextTheme).catch((err) => {
            console.warn('No se pudo sincronizar el tema con el servidor:', err.message);
          });
        }

        return nextTheme;
      });
    },
    [isAuthenticated, updateUser]
  );

  // Conmutador toggle rápido Sol / Luna
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser utilizado dentro de un ThemeProvider');
  }
  return context;
};

export default ThemeContext;
