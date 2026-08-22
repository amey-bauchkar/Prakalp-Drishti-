import React from 'react';

/**
 * Reusable Corporate Government Card Component
 */
export const Card = ({
  children,
  variant = 'white',
  padding = 'md',
  hoverable = false,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = 'rounded-xl transition-all duration-150 relative border';

  const variants = {
    white: 'bg-white text-gov-text-main border-gov-border shadow-card',
    surface: 'bg-gov-surface text-gov-text-main border-gov-border',
    navy: 'bg-gov-navy text-white border-gov-navy-light shadow-card',
    mutedBlue: 'bg-gov-muted text-white border-gov-muted-light shadow-card',
    accent: 'bg-gov-accent text-gov-navy border-gov-accent-dark shadow-card',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const hoverStyles = hoverable ? 'hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer' : '';

  return (
    <div
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.white}
        ${paddings[padding] || paddings.md}
        ${hoverStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex items-start justify-between pb-4 mb-4 border-b border-gov-border/60 ${className}`}>
    <div>
      {title && <h3 className="text-base sm:text-lg font-bold text-gov-navy tracking-tight">{title}</h3>}
      {subtitle && <p className="text-xs sm:text-sm text-gov-muted mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0 ml-3">{action}</div>}
  </div>
);

export default Card;
