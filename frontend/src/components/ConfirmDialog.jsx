import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Confirmation for an irreversible write.
 *
 * Corpus ingest appends to a sealed, Merkle-anchored ledger and rebuilds the
 * snapshot. It had no confirmation step at all: one click on "Onboard Project"
 * committed the write. WCAG 3.3.4 requires that submissions modifying controlled
 * data are reversible, checked, or confirmed — this is the third.
 *
 * `typeToConfirm` raises the bar past a reflexive OK: the operator has to
 * reproduce the identifier being written, which forces them to look at it.
 *
 * Modal mechanics done properly, since this is the one dialog in the product that
 * gates real data: focus moves in on open, is trapped while open, Escape closes,
 * and focus returns to whatever opened it.
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  typeToConfirm = null,
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  const panelRef = useRef(null);
  const firstRef = useRef(null);
  const openerRef = useRef(null);
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    setTyped('');
    // Focus the least destructive control, not the confirm button.
    const t = setTimeout(() => firstRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = panelRef.current.querySelectorAll(
        'button:not([disabled]), input, [href], select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const satisfied = !typeToConfirm || typed.trim() === String(typeToConfirm).trim();
  const danger = tone === 'danger';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        className="w-full max-w-lg bg-white rounded-xl border border-gov-border shadow-2xl overflow-hidden"
      >
        <div className={`flex items-start gap-3 p-5 border-b ${danger ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-gov-border'}`}>
          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${danger ? 'text-rose-700' : 'text-amber-700'}`} aria-hidden="true" />
          <h2 id="confirm-title" className="text-sm font-heading font-black text-gov-navy leading-snug flex-1">
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close without submitting"
            className="p-1 rounded text-gov-muted hover:bg-slate-200 hover:text-gov-navy transition-colors shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div id="confirm-body" className="p-5 space-y-3 text-[13px] leading-relaxed text-gov-navy">
          {children}

          {typeToConfirm && (
            <label className="block pt-1">
              <span className="block text-[11px] font-bold uppercase tracking-wide text-gov-muted mb-1.5">
                Type <span className="font-mono text-gov-navy">{typeToConfirm}</span> to confirm
              </span>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                className="w-full px-3 py-2 text-sm font-mono bg-white border-2 border-[--line-field] rounded-lg text-gov-navy focus:border-gov-navy outline-none"
              />
            </label>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-gov-border flex items-center justify-end gap-2.5">
          <button
            ref={firstRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 min-h-[40px] rounded-lg border border-slate-400 text-gov-navy hover:bg-slate-200 font-bold text-xs transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={!satisfied}
            onClick={onConfirm}
            className={`px-5 py-2.5 min-h-[40px] rounded-lg text-white font-bold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              danger ? 'bg-rose-800 hover:bg-rose-900' : 'bg-gov-navy hover:bg-[#0060B6]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
