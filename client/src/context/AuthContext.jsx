import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, googleAuthUser, getMe } from '../services/api.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('jobflow_token') || null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register'

  const { showToast } = useToast();

  // Verificar sesión persistida al montar la aplicación
  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      const storedToken = localStorage.getItem('jobflow_token');
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await getMe();
        if (isMounted && res?.user) {
          setUser(res.user);
          setToken(storedToken);
        }
      } catch (err) {
        console.warn('Sesión previa inválida o expirada:', err.message);
        localStorage.removeItem('jobflow_token');
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, []);

  // Escuchar desautenticación reactiva disparada por la capa de API (401)
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      showToast('Tu sesión ha expirado o no es válida. Por favor inicia sesión nuevamente.', 'info');
    };

    window.addEventListener('jobflow:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('jobflow:unauthorized', handleUnauthorized);
    };
  }, [showToast]);

  const openAuthModal = useCallback((tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const res = await loginUser({ email, password });
      if (res?.token && res?.user) {
        localStorage.setItem('jobflow_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setIsAuthModalOpen(false);
        showToast(`¡Bienvenido de nuevo, ${res.user.name.split(' ')[0]}!`, 'success');
        return res.user;
      }
      throw new Error('Respuesta inválida del servidor');
    },
    [showToast]
  );

  const register = useCallback(
    async (name, email, password) => {
      const res = await registerUser({ name, email, password });
      if (res?.token && res?.user) {
        localStorage.setItem('jobflow_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setIsAuthModalOpen(false);
        showToast(`¡Cuenta creada con éxito! Bienvenido a Jobflow, ${res.user.name.split(' ')[0]}.`, 'success');
        return res.user;
      }
      throw new Error('Respuesta inválida del servidor');
    },
    [showToast]
  );

  const loginWithGoogle = useCallback(
    async (credential) => {
      const res = await googleAuthUser({ credential });
      if (res?.token && res?.user) {
        localStorage.setItem('jobflow_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setIsAuthModalOpen(false);
        showToast(`Sesión iniciada con Google. ¡Hola, ${res.user.name.split(' ')[0]}!`, 'success');
        return res.user;
      }
      throw new Error('Respuesta inválida de Google OAuth');
    },
    [showToast]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('jobflow_token');
    setToken(null);
    setUser(null);
    showToast('Sesión cerrada correctamente', 'info');
  }, [showToast]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    isAuthModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
    setAuthModalTab,
    login,
    register,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
