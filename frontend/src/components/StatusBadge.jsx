import React, { useState, useEffect } from 'react';
import { getProjectStatus, describeStatus, STATUS_ORDER } from '../lib/projectStatus';
import { getStoredLanguage } from '../lib/i18n';

/**
 * Status, rendered so it survives the loss of colour.
 *
 * WCAG 1.4.1 forbids colour as the only carrier of meaning. The map previously
 * plotted green / amber / rose circles with a colour-only legend, which is
 * unreadable for roughly 8% of Indian men. Every status now carries a distinct
 * SHAPE as well as its colour and its text label, and the same glyph is used on
 * the map, in the legend, in tables and on cards so the association is learnable.
 *
 *   ▲ Critical    ■ Delayed    ◆ Slipping    ● On track    ✓ Completed
 */

export function StatusGlyph({ status, className = '', size = 10 }) {
  const s = status;
  const common = { fill: s.color, stroke: s.color, strokeWidth: 1 };
  const box = 12;
  let shape;
  switch (s.shape) {
    case 'triangle':
      shape = <polygon points="6,1 11.5,11 0.5,11" {...common} />; break;
    case 'square':
      shape = <rect x="1.5" y="1.5" width="9" height="9" {...common} />; break;
    case 'diamond':
      shape = <polygon points="6,0.5 11.5,6 6,11.5 0.5,6" {...common} />; break;
    case 'check':
      shape = (
        <>
          <circle cx="6" cy="6" r="5.2" fill="none" stroke={s.color} strokeWidth="1.6" />
          <polyline points="3.4,6.2 5.3,8.1 8.7,4" fill="none" stroke={s.color}
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ); break;
    default:
      shape = <circle cx="6" cy="6" r="4.6" {...common} />;
  }
  return (
    <svg
      width={size} height={size} viewBox={`0 0 ${box} ${box}`}
      className={`shrink-0 ${className}`} role="img" aria-label={s.label}
    >
      {shape}
    </svg>
  );
}

export default function StatusBadge({ project, status, size = 'md', showGlyph = true, className = '' }) {
  const s = status || getProjectStatus(project);
  const [lang, setLang] = useState(() => getStoredLanguage());

  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);

  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]';
  const label = lang === 'hi' ? (s.hiLabel || s.label) : s.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-bold font-mono ${pad} ${s.badgeClass} ${className}`}
      title={project ? describeStatus(project, lang) : (lang === 'hi' ? (s.hiLabel || s.label) : s.label)}
    >
      {showGlyph && <StatusGlyph status={s} size={size === 'sm' ? 9 : 10} />}
      <span>{label}</span>
    </span>
  );
}

/** Shared legend. Shape first, so it reads without colour. */
export function StatusLegend({ counts, className = '', compact = false, only }) {
  const items = STATUS_ORDER.filter((s) => (only ? only.includes(s.id) : true));
  const [lang, setLang] = useState(() => getStoredLanguage());

  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);

  return (
    <ul className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${className}`}>
      {items.map((s) => {
        const label = lang === 'hi' ? (s.hiLabel || s.label) : s.label;
        return (
          <li key={s.id} className={`inline-flex items-center gap-1.5 font-semibold ${s.textClass} ${compact ? 'text-[10.5px]' : 'text-[11px]'}`}>
            <StatusGlyph status={s} size={compact ? 9 : 11} />
            <span>{label}</span>
            {counts && <span className="font-mono text-gov-muted">({counts[s.id] ?? 0})</span>}
          </li>
        );
      })}
    </ul>
  );
}
