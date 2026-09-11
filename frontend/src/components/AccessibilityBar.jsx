import React, { useState, useEffect, useCallback } from 'react';
import { Type, Contrast, Info, Languages, Sparkles } from 'lucide-react';
import { getStoredLanguage, setStoredLanguage, t } from '../lib/i18n';

/**
 * Sovereign Institutional Accessibility & Provenance Strip (GIGW 3.0 Standard)
 *
 * Jobs:
 *  1. TEXT SIZE: Non-destructive font scaling (100% / 115% / 130%).
 *  2. HIGHER CONTRAST: Contrast booster for WCAG AAA conformance.
 *  3. BILINGUAL SWITCHER: Mandatory under GIGW 3.0 Section 5.1 (English / हिन्दी).
 *  4. PROVENANCE TELEMETRY: Official MoSPI statutory disclosure.
 */

const SIZES = [
  { id: 'normal', label: 'A',   titleKey: 'a11y_size_normal', scale: '100%' },
  { id: 'large',  label: 'A+',  titleKey: 'a11y_size_large',  scale: '115%' },
  { id: 'larger', label: 'A++', titleKey: 'a11y_size_larger', scale: '130%' },
];

const FONT_KEY = 'prakalp:a11y:fontSize';
const CONTRAST_KEY = 'prakalp:a11y:contrast';

function readStored(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export default function AccessibilityBar() {
  const [fontSize, setFontSize] = useState(() => readStored(FONT_KEY, 'normal'));
  const [contrast, setContrast] = useState(() => readStored(CONTRAST_KEY, 'off') === 'on');
  const [lang, setLang] = useState(() => getStoredLanguage());
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === 'normal') root.removeAttribute('data-font-size');
    else root.setAttribute('data-font-size', fontSize);
    try { localStorage.setItem(FONT_KEY, fontSize); } catch { /* non-fatal */ }
  }, [fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    if (contrast) root.setAttribute('data-theme', 'contrast');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem(CONTRAST_KEY, contrast ? 'on' : 'off'); } catch { /* non-fatal */ }
  }, [contrast]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const pickSize = useCallback((s) => {
    setFontSize(s.id);
    setAnnouncement(lang === 'hi' ? `पाठ का आकार ${s.scale} किया गया` : `Text size set to ${s.scale}`);
  }, [lang]);

  const toggleContrast = useCallback(() => {
    setContrast((c) => {
      const next = !c;
      setAnnouncement(
        lang === 'hi'
          ? (next ? 'उच्च कंट्रास्ट सक्रिय' : 'सामान्य कंट्रास्ट सक्रिय')
          : (next ? 'Higher contrast turned on' : 'Higher contrast turned off')
      );
      return next;
    });
  }, [lang]);

  const toggleLanguage = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'en' ? 'hi' : 'en';
      setStoredLanguage(next);
      setAnnouncement(next === 'hi' ? 'भाषा हिन्दी में बदली गई' : 'Language changed to English');
      return next;
    });
  }, []);

  return (
    <div className="bg-[#050D16] text-slate-300 border-b border-slate-800/90 text-[11px] font-sans print:hidden shadow-xs relative z-40 select-none">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-4 flex-wrap">

        {/* ── Prototype provenance with live operational badge ── */}
        <div className="flex items-center gap-2.5 min-w-0">

          <p className="flex items-center gap-1.5 text-[11px] leading-snug text-slate-300 truncate">
            <span className="text-amber-400 font-bold font-heading">{t('proto_badge', lang)}</span>
            <span className="text-slate-600" aria-hidden="true">|</span>
            <span className="hidden sm:inline text-slate-300 font-medium">
              {t('proto_desc', lang)}
            </span>
            <span className="sm:hidden text-slate-300">
              {t('proto_desc_short', lang)}
            </span>
          </p>
        </div>

        {/* ── Accessibility & Language Controls ── */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* GIGW 3.0 Bilingual Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            title={t('lang_title', lang)}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 min-h-[22px] rounded-md border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-bold text-[10.5px] tracking-wide transition-all font-heading cursor-pointer active:scale-95"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span className={lang === 'hi' ? 'font-devanagari font-bold' : ''}>{t('lang_toggle', lang)}</span>
            <span className="sr-only"> — {t('lang_title', lang)}</span>
          </button>

          <div className="h-3 w-px bg-slate-800" aria-hidden="true" />

          {/* Typography Scaler */}
          <div role="group" aria-label={t('a11y_size_group', lang)} className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-0.5 rounded-md">
            <Type className="w-3 h-3 text-slate-400 ml-1" aria-hidden="true" />
            <div className="flex items-center">
              {SIZES.map((s) => {
                const active = fontSize === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pickSize(s)}
                    aria-pressed={active}
                    title={t(s.titleKey, lang)}
                    className={`px-1.5 py-0.5 min-h-[20px] min-w-[22px] text-[10px] font-extrabold leading-none rounded transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {s.label}
                    <span className="sr-only"> — {t(s.titleKey, lang)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contrast Booster */}
          <button
            type="button"
            onClick={toggleContrast}
            aria-pressed={contrast}
            title="Toggle higher contrast mode"
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 min-h-[22px] rounded-md border text-[10.5px] font-bold transition-all cursor-pointer active:scale-95 ${
              contrast
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Contrast className="w-3 h-3" aria-hidden="true" />
            <span className="hidden md:inline">{t('contrast_btn', lang)}</span>
            <span className="sr-only">
              {contrast ? t('a11y_contrast_on', lang) : t('a11y_contrast_off', lang)}
            </span>
          </button>
        </div>
      </div>

      {/* Screen-reader live announcement */}
      <div role="status" aria-live="polite" className="sr-only">{announcement}</div>
    </div>
  );
}

