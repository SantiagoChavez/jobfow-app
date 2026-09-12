import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext.jsx';
import { updateUserTheme } from '../services/api.js';

const ThemeContext = createContext(null);

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
  const { user, isAuthenticated } = useAuth();

  // Sincronizar con el perfil del usuario autenticado respetando preferencia local activa
  useEffect(() => {
    if (user?.theme && (user.theme === 'dark' || user.theme === 'light')) {
      try {
        const localTheme = localStorage.getItem('jobflow_theme');
        if (localTheme && (localTheme === 'dark' || localTheme === 'light') && localTheme !== user.theme) {
          updateUserTheme(localTheme).catch((err) => {
            console.warn('Error al sincronizar tema local con perfil:', err.message);
          });
          setThemeState(localTheme);
          return;
        }
      } catch (err) {
        console.warn('Error al leer tema local para sincronización:', err);
      }
      setThemeState(user.theme);
    }
  }, [user?.theme]);

  // Aplicar o remover clase 'dark' en el elemento <html> y persistir en localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    try {
      localStorage.setItem('jobflow_theme', theme);
    } catch (err) {
      console.warn('Error al persistir tema en localStorage:', err);
    }
  }, [theme]);

  // Cambiar tema explícitamente y sincronizar con backend si está autenticado
  const setTheme = useCallback(
    (newTheme) => {
      if (newTheme !== 'dark' && newTheme !== 'light') return;
      setThemeState(newTheme);

      if (isAuthenticated) {
        updateUserTheme(newTheme).catch((err) => {
          console.warn('No se pudo sincronizar el tema con el servidor:', err.message);
        });
      }
    },
    [isAuthenticated]
  );

  // Conmutador toggle rápido Sol / Luna
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

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
