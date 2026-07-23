import { clsx } from 'clsx';
import { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      className = '',
      id,
      leftIcon,
      rightIcon,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : props.name || 'input');
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={clsx('w-full', className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
            {required && (
              <span className="text-error ml-1" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full px-4 py-3 rounded-xl',
              'bg-surface-secondary',
              'border border-white/[0.06]',
              'focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none',
              'transition-all duration-200',
              'placeholder:text-foreground-subtle',
              'text-foreground',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',
              error && 'border-error focus:border-error focus:ring-error/20'
            )}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-required={required}
            aria-disabled={disabled}
            {...props}
          />
          {rightIcon && (
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none"
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={errorId}
            className="mt-1 text-xs text-error"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={helperId}
            className="mt-1 text-xs text-foreground-subtle"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;