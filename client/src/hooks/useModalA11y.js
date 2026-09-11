import { useEffect } from 'react';

// Contador global de modales activos para preservar el bloqueo de scroll al apilar modales y drawers
let openModalsCount = 0;

/**
 * Hook de accesibilidad para ventanas modales y drawers:
 * - Cierra el modal al pulsar la tecla Escape
 * - Bloquea el scroll del fondo (document.body.style.overflow = 'hidden') mediante stack de modales
 * - Restaura el scroll únicamente cuando no quedan modales abiertos
 *
 * @param {boolean} isOpen - Estado de visibilidad del modal
 * @param {Function} onClose - Callback para invocar al solicitar cierre
 */
export const useModalA11y = (isOpen, onClose) => {
  useEffect(() => {
    if (!isOpen) return;

    openModalsCount++;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      openModalsCount = Math.max(0, openModalsCount - 1);
      if (openModalsCount === 0) {
        document.body.style.overflow = '';
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
};

export default useModalA11y;
