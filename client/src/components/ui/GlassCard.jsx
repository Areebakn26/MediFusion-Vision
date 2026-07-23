import { motion, useReducedMotion } from 'framer-motion';
import { clsx } from 'clsx';

const LiquidGlass = ({
  children,
  className = '',
  hover = true,
  onClick,
  as: Component = 'div',
  ...props
}) => {
  const reduce = useReducedMotion();

  const baseClasses = clsx(
    'relative overflow-hidden rounded-2xl',
    'transition-all duration-300',
    hover && !reduce && 'hover:-translate-y-0.5 hover:shadow-glow-accent',
    onClick && 'cursor-pointer',
    className
  );

  if (reduce) {
    return (
      <Component
        className={clsx(baseClasses, 'bg-surface-secondary border border-white/[0.06]')}
        onClick={onClick}
        {...props}
      >
        {children}
      </Component>
    );
  }

  return (
    <motion.div
      className={baseClasses}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-white/15 to-white/45 pointer-events-none" />
      <div className="relative m-[1px] bg-white/[0.01] backdrop-blur-[4px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] p-6 md:p-8">
        {children}
      </div>
    </motion.div>
  );
};

export default LiquidGlass;