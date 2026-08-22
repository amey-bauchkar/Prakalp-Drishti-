import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Corporate Government Button Component
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer select-none rounded-lg';

  const variants = {
    primary: 'bg-gov-navy hover:bg-gov-navy-light text-white focus:ring-gov-navy shadow-soft',
    accent: 'bg-gov-accent hover:bg-gov-accent-hover text-gov-navy focus:ring-gov-accent font-extrabold shadow-soft',
    secondary: 'bg-gov-muted hover:bg-gov-muted-dark text-white focus:ring-gov-muted shadow-soft',
    outline: 'bg-transparent border border-gov-navy text-gov-navy hover:bg-gov-navy hover:text-white focus:ring-gov-navy',
    outlineMuted: 'bg-transparent border border-gov-border text-gov-muted hover:border-gov-navy hover:text-gov-navy',
    ghost: 'bg-transparent text-gov-navy hover:bg-gov-surface hover:text-gov-navy-dark',
    danger: 'bg-rose-700 hover:bg-rose-800 text-white focus:ring-rose-600',
    white: 'bg-white hover:bg-slate-100 text-gov-navy focus:ring-white shadow-soft',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 flex-shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;
