import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable Corporate Government InputField Component
 */
export const InputField = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  helperText = '',
  icon: Icon,
  disabled = false,
  rows = 4,
  maxLength,
  className = '',
  as = 'input', // 'input' | 'textarea' | 'select'
  children,
  ...props
}) => {
  const inputBaseStyles = `
    w-full bg-white border border-gov-border rounded-lg text-sm text-gov-text-main font-medium
    placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gov-navy focus:border-gov-navy
    transition-all duration-150 disabled:bg-gov-surface disabled:opacity-60 disabled:cursor-not-allowed
    ${error ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500' : ''}
    ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5
  `;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-gov-navy">
            {label} {required && <span className="text-rose-600">*</span>}
          </label>
          {maxLength && value && (
            <span className="text-[11px] font-mono text-gov-muted">
              {String(value).length}/{maxLength}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gov-muted">
            <Icon className="w-4 h-4" />
          </div>
        )}

        {as === 'textarea' ? (
          <textarea
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            maxLength={maxLength}
            required={required}
            className={`${inputBaseStyles} resize-none`}
            {...props}
          />
        ) : as === 'select' ? (
          <select
            id={id}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className={`${inputBaseStyles} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%235B6B8C%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px] bg-[right_12px_center] bg-no-repeat`}
            {...props}
          >
            {children}
          </select>
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            required={required}
            className={inputBaseStyles}
            {...props}
          />
        )}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-gov-muted">{helperText}</p>
      ) : null}
    </div>
  );
};

export default InputField;
