import { clsx } from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';

const DataCard = ({
  icon,
  label,
  value,
  trend,
  trendLabel,
  accentColor = 'accent',
  className = '',
  children,
  ...props
}) => {
  const reduce = useReducedMotion();

  const accentStyles = {
    accent: 'border-l-accent',
    medical: 'border-l-medical',
    warning: 'border-l-warning',
    error: 'border-l-error',
    info: 'border-l-info',
    success: 'border-l-success',
  };

  const trendColor = trend && trend > 0 ? 'text-success' : trend && trend < 0 ? 'text-error' : 'text-foreground-subtle';
  const trendIcon = trend && trend > 0 ? '↑' : trend && trend < 0 ? '↓' : '→';

  return (
    <motion.div
      className={clsx(
        'relative overflow-hidden group rounded-xl border border-white/[0.06] bg-surface-secondary p-6 transition-all duration-300 hover:shadow-card-hover',
        accentStyles[accentColor],
        'border-l-4',
        className
      )}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        {icon && (
          <span className="text-6xl" style={{ fontFamily: 'inherit' }}>
            {typeof icon === 'string' ? icon : null}
          </span>
        )}
        {icon && typeof icon !== 'string' && (
          <div className="w-24 h-24 text-foreground-muted/20">
            {icon}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-foreground-muted text-sm font-medium uppercase tracking-wider mb-3">
          {label}
        </p>
        <p className="text-4xl font-bold text-foreground mb-2">
          {value}
        </p>
        {trend !== undefined && (
          <div className={clsx('mt-3 flex items-center text-sm font-medium', trendColor)}>
            <span className="mr-1">{trendIcon}</span>
            <span>{Math.abs(trend)}%</span>
            {trendLabel && <span className="text-foreground-subtle ml-1">{trendLabel}</span>}
          </div>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </motion.div>
  );
};

DataCard.displayName = 'DataCard';

export default DataCard;