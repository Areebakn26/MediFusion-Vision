import { clsx } from 'clsx';

const GradientText = ({
  children,
  className = '',
  variant = 'hero',
  as: Component = 'span',
}) => {
  const variants = {
    hero: 'bg-gradient-to-r from-accent to-cyan-400 bg-clip-text text-transparent',
    medical: 'bg-gradient-to-r from-medical to-emerald-400 bg-clip-text text-transparent',
    accent: 'bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent',
    subtle: 'bg-gradient-to-r from-foreground to-foreground-muted bg-clip-text text-transparent',
  };

  return (
    <Component className={clsx(variants[variant], 'font-light', className)}>
      {children}
    </Component>
  );
};

GradientText.displayName = 'GradientText';

export default GradientText;