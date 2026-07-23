import { clsx } from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';

const SurfaceCard = ({
  children,
  className = '',
  hover = true,
  elevated = false,
  highlighted = false,
  onClick,
  ...props
}) => {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={clsx(
        'rounded-xl border border-white/[0.06] bg-surface-secondary p-6 md:p-8 transition-all duration-300',
        hover && !reduce && 'hover:-translate-y-0.5 hover:shadow-card-hover',
        hover && reduce && 'hover:shadow-card-hover',
        elevated && 'bg-surface shadow-card',
        highlighted && 'border-l-2 border-accent',
        className
      )}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

SurfaceCard.displayName = 'SurfaceCard';

export default SurfaceCard;