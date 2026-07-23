import { clsx } from 'clsx';

const PageHeader = ({
  title,
  subtitle,
  action,
  className = '',
  align = 'left',
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <header className={clsx('mb-10 md:mb-12', alignClasses[align], className)}>
      {title && (
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light leading-[1.05] tracking-tight text-foreground mb-3">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="text-base md:text-lg font-light text-foreground-muted max-w-2xl">
          {subtitle}
        </p>
      )}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </header>
  );
};

PageHeader.displayName = 'PageHeader';

export default PageHeader;