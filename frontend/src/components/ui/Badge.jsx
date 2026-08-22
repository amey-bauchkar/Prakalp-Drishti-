import React from 'react';

/**
 * Reusable Corporate Government Badge Component
 */
export const Badge = ({
  children,
  variant = 'surface',
  size = 'sm',
  icon: Icon,
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-md border';

  const variants = {
    navy: 'bg-gov-navy text-white border-gov-navy',
    accent: 'bg-gov-accent text-gov-navy border-gov-accent-dark',
    muted: 'bg-gov-muted text-white border-gov-muted',
    surface: 'bg-slate-100 text-gov-navy border-slate-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span className={`${baseStyles} ${variants[variant] || variants.surface} ${sizes[size] || sizes.sm} ${className}`}>
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
