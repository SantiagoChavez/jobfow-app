import React, { useState, useEffect, useRef } from 'react';
import { useModalA11y } from '../hooks/useModalA11y.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  RadarIcon,
  CloseIcon,
  MailIcon,
  LockIcon,
  UserIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  AlertCircleIcon,
} from './Icons.jsx';

export const AuthModal = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    login,
    register,
    loginWithGoogle,
  } = useAuth();

  const { showToast } = useToast();

  // Accesibilidad con Escape y bloqueo de scroll
  useModalA11y(isAuthModalOpen, closeAuthModal);

  // Estados locales de los formularios
  const [activeTab, setActiveTab] = useState(authModalTab || 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Campos de login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Campos de registro
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  // Contenedor para el botón nativo de Google Identity Services
  const googleBtnContainerRef = useRef(null);

  // Sincronizar pestaña si cambia desde el contexto
  useEffect(() => {
    setActiveTab(authModalTab);
    setErrorMessage('');
  }, [authModalTab]);

  // Limpiar campos y errores al abrir/cerrar modal
  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMessage('');
      setShowPassword(false);
    }
  }, [isAuthModalOpen]);

  // Carga e inicialización de Google Identity Services (GIS)
  useEffect(() => {
    if (!isAuthModalOpen) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !clientId.trim()) return;

    const handleCredentialResponse = async (response) => {
      try {
        setSubmitting(true);
        setErrorMessage('');
        await loginWithGoogle(response.credential);
      } catch (err) {
        console.error('Error al procesar login de Google:', err);
        setErrorMessage(err.message || 'Error al autenticar con Google');
      } finally {
        setSubmitting(false);
      }
    };

    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id && googleBtnContainerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId.trim(),
            callback: handleCredentialResponse,
            auto_select: false,
          });

          // Renderizar botón oficial de Google estilizado
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: googleBtnContainerRef.current.offsetWidth || 340,
            logo_alignment: 'left',
          });
        } catch (err) {
          console.warn('No se pudo inicializar botón de Google:', err);
        }
      }
    };

    // Si el script de Google ya está en el DOM
    if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
    } else {
      // Inyectar script dinámicamente si no existe
      const scriptId = 'google-gsi-client';
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogleSignIn;
        document.body.appendChild(script);
      } else {
        script.addEventListener('load', initializeGoogleSignIn);
      }
    }
  }, [isAuthModalOpen, loginWithGoogle]);

  if (!isAuthModalOpen) return null;

  // Manejador de Login tradicional
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Por favor ingresa tu correo y contraseña.');
      return;
    }

    try {
      setSubmitting(true);
      await login(loginEmail.trim(), loginPassword);
    } catch (err) {
      setErrorMessage(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setSubmitting(false);
    }
  };

  // Manejador de Registro tradicional
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!registerName.trim()) {
      setErrorMessage('Por favor ingresa tu nombre completo.');
      return;
    }

    if (!registerEmail.trim()) {
      setErrorMessage('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!registerPassword || registerPassword.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    try {
      setSubmitting(true);
      await register(registerName.trim(), registerEmail.trim(), registerPassword);
    } catch (err) {
      setErrorMessage(err.message || 'Error al registrar tu cuenta. Intenta con otro correo.');
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger manual de Google si no está configurado Client ID
  const handleManualGoogleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !clientId.trim()) {
      showToast(
        'Configura VITE_GOOGLE_CLIENT_ID en tu archivo .env para habilitar Google OAuth',
        'info'
      );
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="relative w-full max-w-md bg-navy-base border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra decorativa superior */}
        <div className="h-1.5 w-full bg-gradient-to-r from-sky-tech via-gold-primary to-amber-500" />

        {/* Header con botón cerrar */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-surface border border-slate-700/80 flex items-center justify-center text-gold-primary">
              <RadarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-lg font-black text-white tracking-tight">
                Job<span className="text-gold-primary">Flow</span>{' '}
                <span className="text-xs font-normal text-slate-400">Auth</span>
              </h2>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            aria-label="Cerrar modal"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas: Iniciar Sesión / Registrarse */}
        <div className="flex border-b border-slate-800 bg-navy-surface/50 p-1.5 mx-6 mt-4 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setAuthModalTab('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-navy-highlight text-gold-primary shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setAuthModalTab('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-navy-highlight text-gold-primary shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="p-6">
          {/* Mensaje de Error si ocurre */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircleIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="flex-1">{errorMessage}</p>
            </div>
          )}

          {/* Botón oficial de Google OAuth */}
          <div className="mb-4">
            <div
              ref={googleBtnContainerRef}
              className="w-full flex justify-center overflow-hidden rounded-xl"
            />

            {/* Botón de respaldo visible si no se ha renderizado el iframe de Google */}
            {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <button
                type="button"
                onClick={handleManualGoogleClick}
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 hover:bg-slate-800 hover:border-slate-600 transition-all shadow-sm group"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>Continuar con Google</span>
              </button>
            )}
          </div>

          {/* Separador Visual */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-navy-base px-3 text-slate-500 font-medium">
                {activeTab === 'login' ? 'o ingresa con tu correo' : 'o regístrate con email'}
              </span>
            </div>
          </div>

          {/* Formulario 1: Iniciar Sesión */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <MailIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    disabled={submitting}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <LockIcon className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={submitting}
                    className="w-full pl-9 pr-10 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gold-primary hover:bg-gold-light text-navy-base transition-all duration-200 shadow-md shadow-gold-primary/20 hover:shadow-gold-primary/30 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-navy-base border-t-transparent rounded-full animate-spin" />
                    <span>Iniciando Sesión...</span>
                  </>
                ) : (
                  <span>Iniciar Sesión</span>
                )}
              </button>
            </form>
          ) : (
            /* Formulario 2: Crear Cuenta */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Tu nombre y apellido"
                    disabled={submitting}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <MailIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    disabled={submitting}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Mín. 6 caracteres"
                      disabled={submitting}
                      className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirmar
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      placeholder="Repite la clave"
                      disabled={submitting}
                      className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-sky-tech hover:text-sky-300 flex items-center gap-1.5 transition-colors"
                >
                  {showPassword ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Ocultar contraseñas' : 'Ver contraseñas'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gold-primary hover:bg-gold-light text-navy-base transition-all duration-200 shadow-md shadow-gold-primary/20 hover:shadow-gold-primary/30 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-navy-base border-t-transparent rounded-full animate-spin" />
                    <span>Creando Cuenta...</span>
                  </>
                ) : (
                  <span>Registrarse en Jobflow</span>
                )}
              </button>
            </form>
          )}

          {/* Footer del Modal */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-center text-xs text-slate-400">
            {activeTab === 'login' ? (
              <p>
                ¿No tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setAuthModalTab('register');
                    setErrorMessage('');
                  }}
                  className="text-gold-primary font-bold hover:underline"
                >
                  Regístrate gratis
                </button>
              </p>
            ) : (
              <p>
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setAuthModalTab('login');
                    setErrorMessage('');
                  }}
                  className="text-gold-primary font-bold hover:underline"
                >
                  Inicia sesión aquí
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
