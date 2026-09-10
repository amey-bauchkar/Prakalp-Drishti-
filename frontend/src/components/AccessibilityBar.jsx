import React, { useState, useEffect, useCallback } from 'react';
import { Type, Contrast, Info, Languages } from 'lucide-react';
import { getStoredLanguage, setStoredLanguage, t } from '../lib/i18n';

/**
 * GIGW-style top utility strip.
 *
 * Jobs:
 *  1. TEXT SIZE. Accessible non-destructive font scaling (100% / 115% / 130%).
 *  2. HIGHER CONTRAST. Contrast booster for WCAG AAA conformance.
 *  3. BILINGUAL SWITCHER. Mandatory under GIGW 3.0 Section 5.1 (English / हिन्दी).
 *  4. PROTOTYPE NOTICE. Non-dismissible disclosure banner.
 */

// Titles are resolved at render time, not here, so they follow the language.
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
    <div className="bg-[#071320] text-slate-200 border-b border-[#16304a] print:hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-4 flex-wrap">

        {/* ── Prototype provenance ── */}
        <p className="flex items-start sm:items-center gap-2 text-[11px] leading-snug text-slate-300 min-w-0">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-px sm:mt-0" aria-hidden="true" />
          <span>
            <strong className="text-amber-400 font-semibold">{t('proto_badge', lang)}</strong>
            <span className="hidden sm:inline">
              {' '}— {t('proto_desc', lang)}
            </span>
            {/* Was t('proto_badge') here, which rendered "Prototype - Prototype."
                on every phone. This is the one string that stops a reader concluding
                the site is an official MoSPI service, so the short form still has to
                carry the claim. */}
            <span className="sm:hidden"> — {t('proto_desc_short', lang)}</span>
          </span>
        </p>

        {/* ── Accessibility & Language controls ── */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* GIGW 3.0 Mandatory Bilingual Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            title={t('lang_title', lang)}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 min-h-[24px] rounded border border-amber-400/80 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-bold text-[11px] tracking-wide transition-colors font-heading"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>{t('lang_toggle', lang)}</span>
            <span className="sr-only"> — {t('lang_title', lang)}</span>
          </button>

          <div role="group" aria-label={t('a11y_size_group', lang)} className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <div className="flex items-center rounded border border-slate-600 overflow-hidden">
              {SIZES.map((s) => {
                const active = fontSize === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pickSize(s)}
                    aria-pressed={active}
                    title={t(s.titleKey, lang)}
                    className={`px-2 min-h-[24px] min-w-[28px] text-[11px] font-bold leading-none transition-colors border-r border-slate-600 last:border-r-0 ${
                      active
                        ? 'bg-amber-400 text-[#071320]'
                        : 'bg-transparent text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {s.label}
                    <span className="sr-only"> — {t(s.titleKey, lang)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={toggleContrast}
            aria-pressed={contrast}
            title="Toggle higher contrast"
            className={`inline-flex items-center gap-1.5 px-2 min-h-[24px] rounded border text-[11px] font-bold transition-colors ${
              contrast
                ? 'bg-amber-400 text-[#071320] border-amber-400'
                : 'bg-transparent text-slate-200 border-slate-600 hover:bg-slate-700'
            }`}
          >
            <Contrast className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t('contrast_btn', lang)}</span>
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
