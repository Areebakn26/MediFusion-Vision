import { motion, useReducedMotion } from 'framer-motion';
import { clsx } from 'clsx';
import { forwardRef } from 'react';

const Button = forwardRef((
  {
    children,
    variant = 'primary',
    size = 'md',
    onClick,
    className = '',
    disabled = false,
    loading = false,
    type = 'button',
    leftIcon,
    rightIcon,
    fullWidth = false,
    ...props
  },
  ref
) => {
  const reduce = useReducedMotion();

  const variants = {
    primary: 'bg-accent text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] hover:bg-accent-hover',
    secondary: 'rounded-full bg-surface-secondary/60 backdrop-blur-[8px] border border-white/[0.06] text-foreground-muted hover:bg-surface-tertiary hover:text-foreground',
    ghost: 'rounded-[6px] bg-transparent text-foreground-muted hover:bg-surface-tertiary hover:text-foreground',
    danger: 'rounded-[6px] bg-error text-white hover:bg-red-600',
    outline: 'rounded-[6px] border border-white/[0.14] bg-transparent text-foreground hover:bg-surface-tertiary',
    medical: 'rounded-[6px] bg-medical text-white hover:bg-emerald-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs min-h-[36px]',
    md: 'px-5 py-2.5 text-sm min-h-[40px]',
    lg: 'px-7 py-3.5 text-sm min-h-[48px]',
  };

  const springTransition = {
    type: 'spring',
    stiffness: 300,
    damping: 25,
    mass: 0.8,
  };

  const hoverScale = reduce ? 1 : 1.02;
  const tapScale = reduce ? 1 : 0.97;

  return (
    <motion.button
      ref={ref}
      className={clsx(
        variants[variant],
        sizes[size],
        'rounded-[6px] font-medium',
        'transition-colors duration-200',
        'focus-visible:ring-2 focus-visible:ring-accent/35 focus-visible:outline-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        fullWidth && 'w-full',
        className
      )}
      whileHover={!disabled && !loading && !reduce ? { scale: hoverScale, transition: springTransition } : {}}
      whileTap={!disabled && !loading && !reduce ? { scale: tapScale, transition: springTransition } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      aria-busy={loading}
      aria-disabled={disabled}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>{children}</span>
        </span>
      ) : (
        <>
          {leftIcon && <span className="flex items-center" aria-hidden="true">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex items-center" aria-hidden="true">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;