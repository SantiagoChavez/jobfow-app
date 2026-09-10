import { useEffect } from 'react';

/**
 * Hook de accesibilidad para ventanas modales y drawers:
 * - Cierra el modal al pulsar la tecla Escape
 * - Bloquea el scroll del fondo (document.body.style.overflow = 'hidden')
 * - Restaura el estado previo al desmontarse o cerrarse
 *
 * @param {boolean} isOpen - Estado de visibilidad del modal
 * @param {Function} onClose - Callback para invocar al solicitar cierre
 */
export const useModalA11y = (isOpen, onClose) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
};

export default useModalA11y;
