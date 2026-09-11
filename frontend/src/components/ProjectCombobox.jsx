import React, { useState, useRef, useEffect, useMemo, useCallback, useId } from 'react';
import { Search } from 'lucide-react';

/**
 * Accessible project picker — the single entry point to every engine in the console.
 *
 * It replaces three byte-identical copies (UnifiedCockpitView, KaalChakraView,
 * PragatiSaarthiView) that shared the same defects:
 *
 *   · the input had no accessible name, only a placeholder, which assistive tech
 *     does not treat as a label and which vanishes the moment you type;
 *   · results were <div tabIndex={-1}> with an onClick — not focusable, not
 *     announced, not selectable by keyboard;
 *   · no combobox ARIA at all, so a screen reader described an inert text box;
 *   · ArrowDown did nothing, and Enter silently took filteredProjects[0], so
 *     result #1 was the only one a keyboard could ever reach.
 *
 * This implements the WAI-ARIA 1.2 combobox-with-listbox pattern:
 * ArrowDown/Up (wrapping), Home/End, Enter, Escape, Tab-to-close, with
 * aria-activedescendant tracking so focus never leaves the input — which is what
 * lets a screen-reader user type and browse results in one motion.
 *
 * The search ranking is preserved exactly from the original views: exact ID prefix,
 * then name prefix, then alphabetical.
 */

import { getStoredLanguage, toHindiDigits } from '../lib/i18n';

const MAX_RESULTS = 100;

export default function ProjectCombobox({
  projects = [],
  value,
  onChange,
  onSelect,
  onSubmitRaw,
  loading = false,
  submitLabel = 'Search',
  busyLabel = 'Working…',
  label = 'Find a project',
  hint = 'Type a project name or MoSPI code, then use the arrow keys to choose.',
  placeholder,
  isHi = false,
  tone = 'dark',
  className = '',
}) {
  const uid = useId().replace(/:/g, '');
  const inputId = `pc-input-${uid}`;
  const listId = `pc-list-${uid}`;
  const hintId = `pc-hint-${uid}`;
  const optId = (i) => `pc-opt-${uid}-${i}`;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listRef = useRef(null);
  const rootRef = useRef(null);

  const results = useMemo(() => {
    const q = (value || '').trim().toLowerCase();
    if (!q) {
      return [...projects]
        .sort((a, b) => (a.project_name || '').localeCompare(b.project_name || '', undefined, { sensitivity: 'base' }))
        .slice(0, MAX_RESULTS);
    }
    return projects
      .filter((p) => {
        const id = p.project_id ? String(p.project_id) : '';
        const nm = p.project_name ? String(p.project_name).toLowerCase() : '';
        return id.includes(q) || nm.includes(q);
      })
      .sort((a, b) => {
        const nA = (a.project_name || '').toLowerCase();
        const nB = (b.project_name || '').toLowerCase();
        const iA = a.project_id ? String(a.project_id) : '';
        const iB = b.project_id ? String(b.project_id) : '';
        const aId = iA.startsWith(q), bId = iB.startsWith(q);
        if (aId !== bId) return aId ? -1 : 1;
        const aNm = nA.startsWith(q), bNm = nB.startsWith(q);
        if (aNm !== bNm) return aNm ? -1 : 1;
        return (a.project_name || '').localeCompare(b.project_name || '', undefined, { sensitivity: 'base' });
      })
      .slice(0, MAX_RESULTS);
  }, [projects, value]);

  const isOpen = open && results.length > 0;

  // Reset the highlight whenever the result set changes underneath it.
  useEffect(() => { setActive(-1); }, [value]);

  // Keep the highlighted option inside the scroll viewport.
  useEffect(() => {
    if (active < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`#${CSS.escape(optId(active))}`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [active]);

  // Close on an outside click. A blur timeout was used before, which raced with
  // the option's own click handler and needed a matching onMouseDown preventDefault.
  useEffect(() => {
    if (!open) return;
    const onDocDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [open]);

  const choose = useCallback((p) => {
    if (!p) return;
    onChange(p.project_name || String(p.project_id));
    setOpen(false);
    setActive(-1);
    onSelect(p);
  }, [onChange, onSelect]);

  const onKeyDown = useCallback((e) => {
    // ArrowDown opens a closed list rather than doing nothing — the behaviour a
    // keyboard user expects, and the one whose absence made this unusable.
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      if (results.length) { e.preventDefault(); setOpen(true); setActive(0); }
      return;
    }
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((i) => (i + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
        break;
      case 'Home':
        e.preventDefault(); setActive(0); break;
      case 'End':
        e.preventDefault(); setActive(results.length - 1); break;
      case 'Enter':
        if (active >= 0) { e.preventDefault(); choose(results[active]); }
        break;
      case 'Escape':
        e.preventDefault(); setOpen(false); setActive(-1); break;
      case 'Tab':
        setOpen(false); setActive(-1); break;
      default:
        break;
    }
  }, [isOpen, results, active, choose]);

  const submit = (e) => {
    e.preventDefault();
    if (active >= 0 && results[active]) return choose(results[active]);
    const q = (value || '').trim();
    if (!q) return;
    const exact = projects.find(
      (p) => String(p.project_id) === q ||
             (p.project_name && p.project_name.toLowerCase() === q.toLowerCase())
    );
    if (exact) return choose(exact);
    if (results.length) return choose(results[0]);
    if (onSubmitRaw) onSubmitRaw(q);
  };

  const dark = tone === 'dark';

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* A real label. It is visually subdued on the dark command headers but it is
          in the accessibility tree, which the placeholder never was. */}
      <label
        htmlFor={inputId}
        className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
          dark ? 'text-slate-300' : 'text-gov-muted'
        }`}
      >
        {label}
      </label>

      <form
        onSubmit={submit}
        role="search"
        className={`flex w-full items-center gap-2 p-2 rounded-xl shadow-sm transition-all ${
          dark ? 'bg-black/40 border border-white/20 backdrop-blur-md' : 'bg-white border border-gov-border'
        }`}
      >
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={isOpen && active >= 0 ? optId(active) : undefined}
          aria-describedby={hintId}
          autoComplete="off"
          placeholder={placeholder || (isHi ? "परियोजना नाम या एमओएसपीआई कोड" : "Project name or MoSPI code")}
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={`flex h-11 w-full rounded-lg border-none bg-transparent px-3 py-2 text-sm font-medium tracking-tight focus-visible:outline-none ${
            dark ? 'text-white placeholder:text-slate-300' : 'text-gov-navy placeholder:text-gov-muted'
          }`}
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all h-11 px-4 py-2 bg-slate-100 hover:bg-amber-500 text-slate-800 hover:text-slate-950 border border-slate-300 hover:border-amber-500 gap-1.5 shrink-0 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{loading ? busyLabel : submitLabel}</span>
        </button>
      </form>

      <p id={hintId} className="sr-only">{hint}</p>

      {/* Result count, announced without stealing focus. */}
      <div role="status" aria-live="polite" className="sr-only">
        {open && value
          ? results.length
            ? isHi 
              ? `${toHindiDigits(results.length)} परियोजनाएं मिलीं। समीक्षा के लिए तीर कुंजियों का उपयोग करें।`
              : `${results.length} project${results.length === 1 ? '' : 's'} found. Use the arrow keys to review them.`
            : isHi ? 'कोई मेल खाती परियोजना नहीं मिली।' : 'No projects match that search.'
          : ''}
      </div>

      {isOpen && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          aria-label={isHi ? "मेल खाती परियोजनाएं" : "Matching projects"}
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-y-auto overscroll-contain z-50 max-h-80 divide-y divide-slate-800/80 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {results.map((p, i) => (
            <li
              key={p.project_id}
              id={optId(i)}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(p)}
              className={`px-3.5 py-3 cursor-pointer transition-colors flex flex-col gap-1 text-left ${
                i === active ? 'bg-slate-700' : 'hover:bg-slate-800/90'
              }`}
            >
              <span className="text-sm font-bold text-slate-100">{p.project_name}</span>
              <span className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-amber-400 font-bold">
                  {isHi ? `आईडी: ${toHindiDigits(p.project_id)}` : `ID: ${p.project_id}`}
                </span>
                <span className="text-slate-400" aria-hidden="true">·</span>
                <span className="text-slate-300 font-medium truncate">{p.sector}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* An empty result set must say so. Previously the panel simply did not render,
          leaving the user to guess whether the search had run. */}
      {open && value && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 px-3.5 py-3">
          <p className="text-xs text-slate-200">
            {isHi ? (
              <>कोई परियोजना <span className="font-mono font-bold text-amber-400">{value}</span> से मेल नहीं खाती।</>
            ) : (
              <>No project matches <span className="font-mono font-bold text-amber-400">{value}</span>.</>
            )}
          </p>
          <p className="text-[11px] text-slate-300 mt-1">
            {isHi ? "परियोजना नाम का भाग या सांख्यिकी मंत्रालय कोड दर्ज करें।" : "Try part of the project name, or the numeric MoSPI code."}
          </p>
        </div>
      )}
    </div>
  );
}
