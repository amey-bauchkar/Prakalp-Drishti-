import React from 'react';
import { AlertTriangle, RefreshCw, Inbox, FilterX } from 'lucide-react';

/**
 * The three states this product used to render as blank space.
 *
 * Eight of twenty-nine catch blocks across the frontend only called console.error,
 * and only seven of thirty-four view files rendered any error state at all. With the
 * API down, the citizen portal showed an empty register beneath a masthead still
 * asserting the national totals, and said nothing. A user cannot tell a broken
 * system from an empty one, so they conclude the system works and there is no data.
 *
 * Every state here answers the same three questions: what happened, why, and what
 * can I do now — and each offers a way forward rather than a dead end.
 */

export default function DataUnavailable({
  variant = 'error',
  title,
  detail,
  onRetry,
  retryLabel = 'Try again',
  onClear,
  clearLabel = 'Clear all filters',
  className = '',
}) {
  const copy = {
    error: {
      icon: AlertTriangle,
      tone: 'border-rose-300 bg-rose-50',
      iconTone: 'text-rose-800',
      title: title || 'Project data could not be loaded',
      detail: detail || 'The portal cannot reach the project database right now. Figures elsewhere on this page may be incomplete or out of date.',
    },
    empty: {
      icon: Inbox,
      tone: 'border-gov-border bg-surface-2',
      iconTone: 'text-gov-muted',
      title: title || 'Nothing to show yet',
      detail: detail || 'There are no records in this view.',
    },
    filtered: {
      icon: FilterX,
      tone: 'border-gov-border bg-surface-2',
      iconTone: 'text-gov-muted',
      title: title || 'No projects match these filters',
      detail: detail || 'Try a broader search term, or clear the filters to see the full register.',
    },
  }[variant];

  const Icon = copy.icon;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border p-6 sm:p-8 text-center ${copy.tone} ${className}`}
    >
      <Icon className={`w-7 h-7 mx-auto mb-3 ${copy.iconTone}`} aria-hidden="true" />
      <h3 className="text-[15px] font-heading font-black text-gov-navy">{copy.title}</h3>
      <p className="text-[12.5px] text-gov-soft leading-relaxed mt-1.5 max-w-md mx-auto">
        {copy.detail}
      </p>
      {(onRetry || onClear) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-lg bg-gov-navy hover:bg-[#0060B6] text-white text-xs font-bold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              {retryLabel}
            </button>
          )}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-lg border border-slate-400 text-gov-navy hover:bg-slate-200 text-xs font-bold transition-colors"
            >
              <FilterX className="w-3.5 h-3.5" aria-hidden="true" />
              {clearLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
