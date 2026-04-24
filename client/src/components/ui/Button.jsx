import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    onClick,
    className = '',
    disabled = false,
    type = 'button',
    ...props
}) => {
    const variants = {
        primary: 'bg-gradient-to-r from-secondary-600 to-primary-500 text-white shadow-md hover:shadow-lg',
        secondary: 'bg-white/80 text-secondary-600 border-2 border-secondary-600/20 hover:bg-white',
        ghost: 'bg-transparent text-secondary-600 hover:bg-secondary-600/10',
        danger: 'bg-red-500 text-white hover:bg-red-600',
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    return (
        <motion.button
            className={clsx(
                variants[variant],
                sizes[size],
                'rounded-xl font-medium',
                'transition-all duration-200',
                'active:scale-95',
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            onClick={onClick}
            disabled={disabled}
            type={type}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export default Button;
