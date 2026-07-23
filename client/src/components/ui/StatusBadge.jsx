import { clsx } from 'clsx';

const StatusBadge = ({
  variant = 'default',
  children,
  className = '',
  dot = false,
  size = 'md',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  const variantStyles = {
    default: 'bg-surface-tertiary text-foreground-muted',
    accent: 'bg-accent-subtle text-accent',
    medical: 'bg-medical-subtle text-medical',
    success: 'bg-[rgba(16,185,129,0.12)] text-success',
    warning: 'bg-[rgba(245,158,11,0.12)] text-warning',
    error: 'bg-[rgba(239,68,68,0.12)] text-error',
    info: 'bg-[rgba(59,130,246,0.12)] text-info',
    verified: 'bg-[rgba(16,185,129,0.12)] text-success border border-success/20',
    pending: 'bg-[rgba(245,158,11,0.12)] text-warning border border-warning/20',
    rejected: 'bg-[rgba(239,68,68,0.12)] text-error border border-error/20',
    approved: 'bg-[rgba(16,185,129,0.12)] text-success border border-success/20',
    active: 'bg-accent-subtle text-accent border border-accent/20',
    inactive: 'bg-surface-tertiary text-foreground-subtle border border-white/[0.06]',
  };

  return (
    <span
      className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {dot && (
        <span
          className={clsx(
            'rounded-full',
            size === 'sm' && 'w-1.5 h-1.5',
            size === 'md' && 'w-2 h-2',
            size === 'lg' && 'w-2.5 h-2.5'
          )}
        />
      )}
      {children}
    </span>
  );
};

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;