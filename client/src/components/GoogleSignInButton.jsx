import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { GoogleIcon } from './Icons.jsx';

/**
 * Botón oficial de Google Identity Services (GIS) en 1 solo clic.
 * Se adapta automáticamente al tema activo (dark/light) y ejecuta el inicio de sesión directo sin intermediarios.
 */
export const GoogleSignInButton = ({
  text = 'continue_with', // 'signin_with' | 'signup_with' | 'continue_with'
  className = '',
  buttonWidth = 240,
  fallbackLabel = 'Continuar con Google',
  onFallbackClick,
}) => {
  const containerRef = useRef(null);
  const { loginWithGoogle } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !clientId.trim()) return;

    const handleCredential = async (response) => {
      if (response?.credential) {
        try {
          await loginWithGoogle(response.credential);
        } catch (err) {
          console.error('Error al iniciar sesión con Google:', err);
        }
      }
    };

    const renderGisButton = () => {
      if (window.google?.accounts?.id && containerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId.trim(),
            callback: handleCredential,
            auto_select: false,
          });

          containerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(containerRef.current, {
            theme: isDark ? 'filled_black' : 'outline',
            size: 'large',
            text,
            shape: 'rectangular',
            width: buttonWidth,
            logo_alignment: 'left',
          });
        } catch (err) {
          console.warn('Error al renderizar botón nativo de Google GIS:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      renderGisButton();
    } else {
      const scriptId = 'google-gsi-client';
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = renderGisButton;
        document.body.appendChild(script);
      } else {
        script.addEventListener('load', renderGisButton);
      }
    }
  }, [isDark, loginWithGoogle, text, buttonWidth]);

  return (
    <div className={`inline-flex items-center justify-center min-h-[44px] ${className}`}>
      <div ref={containerRef} className="flex items-center justify-center">
        {/* Fallback mientras carga el script de Google */}
        <button
          type="button"
          onClick={onFallbackClick}
          className="px-5 py-2.5 rounded-xl font-bold text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white shadow-sm flex items-center justify-center gap-2.5"
        >
          <GoogleIcon className="w-4 h-4" />
          <span>{fallbackLabel}</span>
        </button>
      </div>
    </div>
  );
};

export default GoogleSignInButton;
