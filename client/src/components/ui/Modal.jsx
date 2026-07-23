import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  };

  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[9999] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-surface/80 backdrop-blur-sm"
          aria-hidden="true"
        />

        <motion.div
          ref={modalRef}
          tabIndex={-1}
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={clsx(
            'relative bg-surface-secondary rounded-2xl shadow-panel',
            'border border-white/[0.06] w-full z-[10000]',
            sizes[size],
            'mx-4 md:mx-auto',
            'focus:outline-none'
          )}
        >
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              {title && (
                <h3 id="modal-title" className="text-xl font-light text-foreground">
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 bg-surface-tertiary rounded-xl text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-all active:scale-95"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

Modal.displayName = 'Modal';

export default Modal;