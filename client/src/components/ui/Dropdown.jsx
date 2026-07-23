import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const Dropdown = ({
    trigger,
    children,
    align = 'left',
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const alignments = {
        left: 'left-0',
        right: 'right-0',
        center: 'left-1/2 -translate-x-1/2',
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={clsx(
                            'absolute mt-2 z-50',
                            'bg-surface-secondary/90 backdrop-blur-[8px] rounded-xl shadow-panel',
                            'border border-white/[0.06] min-w-[200px]',
                            alignments[align],
                            className
                        )}
                    >
                        <div className="py-1">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const DropdownItem = ({ onClick, children, icon, className = '' }) => {
    return (
        <button
            onClick={onClick}
            className={clsx(
                'w-full px-4 py-2 text-left text-sm',
                'hover:bg-accent-subtle transition-colors',
                'flex items-center gap-3 text-foreground-muted hover:text-foreground',
                className
            )}
        >
            {icon && <span className="text-foreground-subtle">{icon}</span>}
            <span>{children}</span>
        </button>
    );
};

export default Dropdown;
