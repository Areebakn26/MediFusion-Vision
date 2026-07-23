import { clsx } from 'clsx';

const Section = ({
  children,
  className = '',
  id,
  padding = 'default',
  background = 'default',
  container = true,
}) => {
  const paddingStyles = {
    none: '',
    sm: 'py-12 md:py-16',
    default: 'py-20 md:py-28',
    lg: 'py-24 md:py-32',
    xl: 'py-28 md:py-36',
  };

  const backgroundStyles = {
    default: 'bg-surface',
    secondary: 'bg-surface-secondary',
    tertiary: 'bg-surface-tertiary',
    hero: 'bg-gradient-to-br from-surface via-surface-secondary to-surface',
  };

  return (
    <section
      id={id}
      className={clsx(
        'w-full',
        paddingStyles[padding],
        backgroundStyles[background],
        className
      )}
    >
      {container ? (
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
};

Section.displayName = 'Section';

export default Section;