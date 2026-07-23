import { clsx } from 'clsx';

const Badge = ({
    children,
    variant = 'default',
    className = '',
    ...props
}) => {
    const variants = {
        default: 'bg-surface-tertiary text-foreground-muted',
        success: 'bg-medical-subtle text-medical',
        warning: 'bg-warning/10 text-warning',
        danger: 'bg-error/10 text-error',
        info: 'bg-info/10 text-info',
        accent: 'bg-accent-subtle text-accent',
    };

    return (
        <span
            className={clsx(
                'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
};

export default Badge;
