import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { createPortal } from 'react-dom';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true
}) => {
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    if (!isOpen) return null;

    const modalContent = (
        <AnimatePresence mode="wait">
            <div className="fixed inset-0 z-[9999] overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className={clsx(
                            'relative bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)]',
                            'border border-white/20 w-full z-[10000]',
                            sizes[size]
                        )}
                    >
                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className="flex items-center justify-between p-8 border-b border-slate-100">
                                {title && (
                                    <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">
                                        {title}
                                    </h3>
                                )}
                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-95"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-8">
                            {children}
                        </div>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default Modal;
