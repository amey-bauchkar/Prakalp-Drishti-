import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, RefreshCw, Filter, Info, Loader2,
  ShieldAlert, TrendingUp, Clock, Building2, ChevronDown, Lock,
  ArrowUpDown,
} from 'lucide-react';
import { apiFetch, getSession } from './authClient';
import DataUnavailable from '../src/components/DataUnavailable';
import { formatCount, formatCr, sectorName } from '../src/lib/projectStatus';
import { getStoredLanguage, translateProjectName, translateState, translateAgency } from '../src/lib/i18n';

/**
 * The Decision Hub's landing panel.
 *
 * WHAT IT REPLACED
 * Signing in as a Ministry Officer previously landed on the Unified Cockpit's empty
 * state — "Ready to Simulate Live Decision Intelligence. Enter a project ID in the
 * search bar above." Measured on the running app, that screen carried 14 numbers and
 * zero findings. The console required the officer to already know which project
 * mattered before it would tell them anything, which is the exact inverse of decision
 * support: it answers "tell me about X" but never "what needs me today?"
 *
 * WHERE THE DATA COMES FROM
 * Nothing here is new analysis. /api/amey/early-warning already returned a ranked,
 * weighted alert queue over all 2,207 projects — it was simply buried three clicks
 * deep behind the "Empirical Model Validation" engine and a "RUN BENCHMARK" button,
 * so in practice nobody arriving at the console ever saw it. This surfaces it as the
 * first thing an officer reads.
 *
 * The endpoint declares its own scoring weights as POLICY rather than fitted
 * parameters, because no ground-truth risk label exists to fit against. That
 * disclosure is reproduced on screen rather than hidden: an officer acting on a
 * ranking is entitled to know the ranking encodes a choice someone made.
 */

const BANDS = {
  CRITICAL: { label: 'Critical', labelHi: 'गंभीर', badge: 'bg-rose-50 text-rose-900 border-rose-300', bar: 'bg-rose-700', rank: 0 },
  HIGH:     { label: 'High',     labelHi: 'उच्च', badge: 'bg-amber-50 text-amber-900 border-amber-300', bar: 'bg-amber-700', rank: 1 },
  MODERATE: { label: 'Moderate', labelHi: 'मध्यम', badge: 'bg-gold-wash text-[#6b5210] border-amber-200', bar: 'bg-[#8A6A18]', rank: 2 },
  LOW:      { label: 'Low',      labelHi: 'अल्प', badge: 'bg-emerald-50 text-emerald-900 border-emerald-300', bar: 'bg-emerald-700', rank: 3 },
};

const COMPONENT_LABEL = {
  schedule_risk: { en: 'Schedule', hi: 'समय सीमा विचलन' },
  cost_overrun_risk: { en: 'Cost overrun', hi: 'लागत वृद्धि' },
  ground_truth_risk: { en: 'Site evidence', hi: 'स्थल उपग्रह साक्ष्य' },
  contagion_risk: { en: 'Knock-on effect', hi: 'संक्रामकता प्रभाव' },
  governance_risk: { en: 'Governance', hi: 'शासन प्रणाली' },
};

const getComponentLabel = (k, lang) => {
  if (COMPONENT_LABEL[k]) {
    return lang === 'hi' ? COMPONENT_LABEL[k].hi : COMPONENT_LABEL[k].en;
  }
  return k.replace(/_/g, ' ');
};

// Sector names live in projectStatus.js so the citizen register, the map popups
// and this queue cannot drift apart on the same sector.
const getSectorName = (s, lang) => sectorName(s, lang);

function formatWhyFlagged(alert, lang) {
  if (lang !== 'hi') return alert.why_flagged;
  if (alert.contributions && Object.keys(alert.contributions).length > 0) {
    const drivers = Object.entries(alert.contributions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
    const hindiDriverNames = {
      schedule_risk: 'समय सीमा जोखिम',
      cost_overrun_risk: 'लागत वृद्धि जोखिम',
      ground_truth_risk: 'स्थल साक्ष्य जोखिम',
      contagion_risk: 'संक्रामकता जोखिम',
      governance_risk: 'शासन जोखिम',
    };
    return drivers
      .map(([k, v]) => `${hindiDriverNames[k] || k} का योगदान ${Number(v).toFixed(1)} अंक`)
      .join(', ');
  }
  if (typeof alert.why_flagged === 'string') {
    return alert.why_flagged
      .replace(/schedule risk contributes ([\d.]+) pts/gi, 'समय सीमा जोखिम का योगदान $1 अंक')
      .replace(/cost overrun risk contributes ([\d.]+) pts/gi, 'लागत वृद्धि जोखिम का योगदान $1 अंक')
      .replace(/contagion risk contributes ([\d.]+) pts/gi, 'संक्रामकता जोखिम का योगदान $1 अंक')
      .replace(/ground truth risk contributes ([\d.]+) pts/gi, 'स्थल साक्ष्य जोखिम का योगदान $1 अंक')
      .replace(/governance risk contributes ([\d.]+) pts/gi, 'शासन जोखिम का योगदान $1 अंक');
  }
  return alert.why_flagged;
}

export default function WatchlistView({ onOpenProject }) {
  const session = getSession();
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');   // loading | ready | error | forbidden
  const [error, setError] = useState(null);
  const [band, setBand] = useState('All');
  const [sector, setSector] = useState('All');
  const [expanded, setExpanded] = useState(null);
  const [showMethod, setShowMethod] = useState(false);
  // The queue is fetched deep but shown shallow. A landing panel that runs to twelve
  // screens is not a landing panel; the first twenty are the ones that get acted on.
  const [shown, setShown] = useState(20);
  const [queueLoading, setQueueLoading] = useState(false);
  const [allSectors, setAllSectors] = useState([]);
  const [lang, setLang] = useState(() => getStoredLanguage());
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    if (!sortOpen) return;
    const onDocDown = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [sortOpen]);

  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);

  const load = useCallback(async (targetBand = band, targetSector = sector, isInitial = false) => {
    if (isInitial) {
      setState('loading');
    } else {
      setQueueLoading(true);
    }
    setError(null);

    const params = new URLSearchParams();
    params.set('limit', '100');
    if (targetBand && targetBand !== 'All') {
      params.set('band', targetBand);
    }
    if (targetSector && targetSector !== 'All') {
      params.set('sector', targetSector);
    }

    const r = await apiFetch(`/api/amey/early-warning?${params.toString()}`);
    setQueueLoading(false);
    if (r.forbidden) { setState('forbidden'); setError(r.error); return; }
    if (!r.ok) { setState('error'); setError(r.error); return; }
    setData(r.data);
    if (Array.isArray(r.data?.coverage?.sectors) && r.data.coverage.sectors.length > 0) {
      setAllSectors(r.data.coverage.sectors);
    }
    setState('ready');
  }, [band, sector]);

  useEffect(() => {
    load(band, sector, !data);
  }, [band, sector]);

  const alerts = data?.alerts || [];

  const sectors = useMemo(() => {
    if (allSectors.length > 0) return ['All', ...allSectors];
    return ['All', ...Array.from(new Set(alerts.map((a) => a.sector).filter(Boolean))).sort()];
  }, [allSectors, alerts]);

  const matching = useMemo(() => {
    const BAND_ORDER = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3 };
    return [...alerts].sort((a, b) => {
      const bandA = String(a.risk_band || '').toUpperCase();
      const bandB = String(b.risk_band || '').toUpperCase();
      const rankA = BAND_ORDER[bandA] ?? 99;
      const rankB = BAND_ORDER[bandB] ?? 99;
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      const scoreA = Number(a.risk_score) || 0;
      const scoreB = Number(b.risk_score) || 0;
      return scoreB - scoreA;
    });
  }, [alerts]);
  const visible = useMemo(() => matching.slice(0, shown), [matching, shown]);

  useEffect(() => { setShown(20); }, [band, sector]);

  const dist = data?.coverage?.band_distribution || {};
  const weights = data?.coverage?.weights || {};

  /* ── States ────────────────────────────────────────────────────────────── */

  if (state === 'forbidden') {
    return (
      <div className="panel p-8 text-center">
        <Lock className="w-7 h-7 mx-auto mb-3 text-gov-muted" aria-hidden="true" />
        <h2 className="text-[15px] font-heading font-black text-gov-navy">
          {lang === 'hi' ? 'आपकी भूमिका प्रारंभिक चेतावनी कतार नहीं खोल सकती' : 'Your role cannot open the early-warning queue'}
        </h2>
        <p className="text-[12.5px] text-gov-soft mt-1.5 max-w-md mx-auto leading-relaxed">
          {lang === 'hi' ? (
            <>
              {error} आप <strong>{session?.username}</strong> ({String(session?.role || '').replace(/_/g, ' ')}) के रूप में साइन इन हैं।
              निगरानी अधिकारी या मंत्रालय अधिकारी खाता इसे देख सकता है — इस कंसोल के अन्य सभी इंजन आपके लिए उपलब्ध हैं।
            </>
          ) : (
            <>
              {error} Signed in as <strong>{session?.username}</strong> ({String(session?.role || '').replace(/_/g, ' ')}).
              A monitoring officer or ministry officer account can see it — every other
              engine in this console remains available to you.
            </>
          )}
        </p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <DataUnavailable
        variant="error"
        title={lang === 'hi' ? 'निगरानी सूची लोड नहीं की जा सकी' : 'The watchlist could not be loaded'}
        detail={error}
        onRetry={load}
      />
    );
  }

  if (state === 'loading') {
    return (
      <div className="panel p-10 flex flex-col items-center justify-center gap-3 min-h-[320px]" role="status">
        <Loader2 className="w-6 h-6 animate-spin text-gov-accent" aria-hidden="true" />
        <p className="text-[12.5px] text-gov-soft">
          {lang === 'hi'
            ? 'प्रारंभिक चेतावनी भारों के विरुद्ध सभी २,२०७ परियोजनाओं का मूल्यांकन जारी…'
            : 'Scoring all 2,207 projects against the early-warning weights…'}
        </p>
      </div>
    );
  }

  /* ── Ready ─────────────────────────────────────────────────────────────── */

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }} className="space-y-5"
    >
      {/* ── Headline: the question the console exists to answer ── */}
      <div className="rounded-2xl border border-slate-700 shadow-xl overflow-hidden bg-surface">
        <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <ShieldAlert className="w-48 h-48 text-amber-500" />
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 relative z-10">
            <div className="space-y-1.5 min-w-0">
              <p className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-sm bg-white/10 border-l-2 border-amber-400 text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                {lang === 'hi' ? 'प्रारंभिक चेतावनी समीक्षा' : 'Early-warning review'}
              </p>
              <h1 className="text-2xl sm:text-[28px] font-heading font-extrabold tracking-tight text-white">
                {lang === 'hi' ? 'शीघ्र ध्यान देने योग्य परियोजनाएं' : 'What needs your attention'}
              </h1>
              <p className="text-[13px] text-slate-200 leading-relaxed max-w-2xl">
                {band === 'All' && sector === 'All' ? (
                  lang === 'hi' ? (
                    <>
                      संयुक्त समय-सारिणी, लागत, स्थल साक्ष्य, संक्रामकता एवं शासन जोखिम के आधार पर{' '}
                      {formatCount(data.queue_size)} परियोजनाएं अन्य{' '}
                      {formatCount(Math.max(0, (data.total_matching || 0) - (data.queue_size || 0)))} परियोजनाओं से आगे प्राथमिकता क्रम में सूचीबद्ध हैं।
                    </>
                  ) : (
                    <>
                      {formatCount(data.queue_size)} projects are ranked ahead of the other{' '}
                      {formatCount(Math.max(0, (data.total_matching || 0) - (data.queue_size || 0)))} by combined
                      schedule, cost, site-evidence, knock-on and governance risk.
                    </>
                  )
                ) : (
                  lang === 'hi' ? (
                    <>
                      {formatCount(data.total_matching || data.queue_size)} में से शीर्ष {formatCount(data.queue_size)} परियोजनाएं प्रदर्शित
                      {band !== 'All' ? ` (${BANDS[band]?.labelHi || band} जोखिम श्रेणी)` : ''}
                      {sector !== 'All' ? ` (${getSectorName(sector, lang)} क्षेत्र)` : ''}, जोखिम वरीयता अनुसार क्रमबद्ध।
                    </>
                  ) : (
                    <>
                      Showing top {formatCount(data.queue_size)} of {formatCount(data.total_matching || data.queue_size)} projects
                      {band !== 'All' ? ` in ${BANDS[band]?.label || band} risk` : ''}
                      {sector !== 'All' ? ` under ${sector}` : ''}, ranked by exposure priority.
                    </>
                  )
                )}
              </p>
            </div>

            <div className="shrink-0 text-right rounded-xl bg-black/40 border border-white/20 p-4 min-w-[200px]">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-300 font-bold">
                {lang === 'hi' ? 'कतार में अवरुद्ध पूंजी' : 'Capital in the queue'}
              </div>
              <div className="text-2xl font-black font-mono mt-0.5">
                {formatCr(data.capex_at_risk_cr, { lakhCrore: true, lang })}
              </div>
              <div className="text-[11px] text-slate-200 mt-1 font-mono">
                {lang === 'hi' ? (
                  <>
                    {formatCount(data.queue_size)} {band !== 'All' ? `${BANDS[band]?.labelHi || band} जोखिम` : 'चिह्नित'} परियोजनाओं में
                  </>
                ) : (
                  <>
                    across {formatCount(data.queue_size)} {band !== 'All' ? `${BANDS[band]?.label.toLowerCase()} risk` : 'flagged'} projects
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Band distribution across the whole portfolio ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gov-border border-t border-gov-border">
          {['CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((b) => {
            const meta = BANDS[b];
            const n = dist[b] || 0;
            const pct = data.coverage?.projects_scored ? (n / data.coverage.projects_scored) * 100 : 0;
            const on = band === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => setBand(on ? 'All' : b)}
                aria-pressed={on}
                className={`p-4 text-left transition-colors ${on ? 'bg-surface-3' : 'bg-surface hover:bg-surface-2'}`}
              >
                <span className="text-[10px] uppercase font-mono tracking-widest text-gov-muted font-bold block">
                  {lang === 'hi' ? `${meta.labelHi} जोखिम` : `${meta.label} risk`}
                </span>
                <span className="text-xl font-extrabold font-mono text-gov-navy block mt-0.5">
                  {formatCount(n)}
                </span>
                <span className="block mt-1.5 h-1 rounded-full bg-surface-3 overflow-hidden" aria-hidden="true">
                  <span className={`block h-full ${meta.bar}`} style={{ width: `${Math.max(pct, 1)}%` }} />
                </span>
                <span className="text-[11px] text-gov-soft mt-1 block font-mono">
                  {lang === 'hi' ? `पोर्टफोलियो का ${pct.toFixed(1)}%` : `${pct.toFixed(1)}% of the portfolio`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── How the ranking is built. The endpoint says its weights are declared
             policy, not fitted, and an officer acting on a ranking should be told. ── */}
      <div className="panel">
        <button
          type="button"
          onClick={() => setShowMethod((v) => !v)}
          aria-expanded={showMethod}
          className="w-full flex items-center justify-between gap-3 p-3.5 text-left hover:bg-surface-2 transition-colors"
        >
          <span className="inline-flex items-center gap-2 text-[12.5px] font-bold text-gov-navy">
            <Info className="w-4 h-4 text-gov-accent" aria-hidden="true" />
            {lang === 'hi' ? 'इस रैंकिंग की गणना कैसे की जाती है' : 'How this ranking is calculated'}
          </span>
          <ChevronDown className={`w-4 h-4 text-gov-muted transition-transform ${showMethod ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        {showMethod && (
          <div className="px-4 pb-4 space-y-3 text-[12.5px] text-gov-soft leading-relaxed border-t border-gov-border pt-3.5">
            <p>
              {lang === 'hi'
                ? 'प्रत्येक परियोजना पांच घटकों पर ०–१०० का स्कोर प्राप्त करती है, जिन्हें इन भारांकों के साथ संयोजित किया जाता है:'
                : 'Each project scores 0–100 on five components, combined with these weights:'}
            </p>
            <ul className="flex flex-wrap gap-2">
              {Object.entries(weights).map(([k, v]) => (
                <li key={k} className="px-2.5 py-1 rounded border border-gov-border bg-surface-2 font-mono text-[11.5px]">
                  {getComponentLabel(k, lang)} <strong className="text-gov-navy">{(v * 100).toFixed(0)}%</strong>
                </li>
              ))}
            </ul>
            <p className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-950">
              <strong>{lang === 'hi' ? 'ये भारांक एक नीतिगत विकल्प हैं, न कि कोई फिट किया गया परिणाम।' : 'These weights are a policy choice, not a fitted result.'}</strong>{' '}
              {lang === 'hi'
                ? 'जोखिम प्राथमिकता नीतिगत प्राथमिकताओं को दर्शाती है ताकि निर्णयकर्ता सक्रिय हस्तक्षेप कर सकें।'
                : (data.coverage?.weights_note || '')}
            </p>
            <p>
              {lang === 'hi' ? (
                <>
                  स्थल उपग्रह साक्ष्य {formatCount(data.coverage?.projects_scored)} में से {formatCount(data.coverage?.with_ground_truth_signal)} परियोजनाओं के लिए उपलब्ध है। जहां यह अनुपलब्ध है, स्कोर शेष घटकों से बनाया जाता है, और पंक्ति में इसका उल्लेख है।
                </>
              ) : (
                <>
                  Site evidence is available for {formatCount(data.coverage?.with_ground_truth_signal)} of{' '}
                  {formatCount(data.coverage?.projects_scored)} projects. Where it is missing the
                  score is formed from the remaining components, and the row says so.
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {/* ── Toolbar: Sort & Filter Popover Button + Queue Metrics ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1">
        <span className="text-[12.5px] text-gov-soft font-mono font-medium">
          {lang === 'hi' ? (
            <>
              {formatCount(data?.total_matching ?? matching.length)} में से <strong className="text-gov-navy">{formatCount(visible.length)}</strong> प्रदर्शित
            </>
          ) : (
            <>
              Showing <strong className="text-gov-navy">{formatCount(visible.length)}</strong> of {formatCount(data?.total_matching ?? matching.length)}
            </>
          )}
        </span>

        <div className="flex items-center gap-2.5">
          {/* Sort & Filter Button with Dropdown Popover */}
          <div ref={sortRef} className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              aria-expanded={sortOpen}
              className={`inline-flex items-center gap-2 px-3.5 py-2 min-h-[36px] rounded-lg border text-[12px] font-bold transition-all shadow-xs ${
                (band !== 'All' || sector !== 'All' || sortOpen)
                  ? 'bg-gov-navy text-white border-gov-navy shadow-sm'
                  : 'bg-white border-slate-300 text-gov-navy hover:bg-slate-50'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{lang === 'hi' ? 'क्रम एवं फ़िल्टर' : 'Sort & Filter'}</span>
              {(band !== 'All' || sector !== 'All') && (
                <span className="w-2 h-2 rounded-full bg-amber-400" title="Filters active" />
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {sortOpen && (
              <div
                onWheel={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-4 space-y-3.5 animate-in fade-in-50 duration-100"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    {lang === 'hi' ? 'क्रम एवं फ़िल्टर विकल्प' : 'Filter & Sort Queue'}
                  </span>
                  {(band !== 'All' || sector !== 'All') && (
                    <button
                      type="button"
                      onClick={() => { setBand('All'); setSector('All'); }}
                      className="text-[10.5px] font-semibold text-rose-600 hover:text-rose-700"
                    >
                      {lang === 'hi' ? 'रीसेट' : 'Reset'}
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700">
                    {lang === 'hi' ? 'जोखिम श्रेणी' : 'Risk Band'}
                  </label>
                  <select
                    value={band}
                    onChange={(e) => setBand(e.target.value)}
                    className="w-full text-[12px] py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-gov-navy"
                  >
                    <option value="All">{lang === 'hi' ? 'सभी श्रेणियां' : 'All bands'}</option>
                    {Object.entries(BANDS).map(([k, v]) => (
                      <option key={k} value={k}>{lang === 'hi' ? `${v.labelHi} जोखिम` : `${v.label} Risk`}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700">
                    {lang === 'hi' ? 'क्षेत्र' : 'Sector'}
                  </label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full text-[12px] py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-gov-navy"
                  >
                    {sectors.map((sx) => (
                      <option key={sx} value={sx}>
                        {sx === 'All' ? (lang === 'hi' ? 'सभी क्षेत्र' : 'All sectors') : getSectorName(sx, lang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => load(band, sector)}
            disabled={queueLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[36px] rounded-lg border border-slate-300 bg-white text-gov-navy hover:bg-slate-50 text-[11.5px] font-bold transition-colors disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${queueLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{lang === 'hi' ? 'ताज़ा करें' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ── The queue ── */}
      {queueLoading && (
        <div className="flex items-center justify-center p-6 gap-2 text-xs font-mono text-gov-muted">
          <Loader2 className="w-4 h-4 animate-spin text-gov-accent" />
          <span>{lang === 'hi' ? 'प्रारंभिक चेतावनी कतार अपडेट हो रही है…' : 'Updating early-warning queue…'}</span>
        </div>
      )}

      {matching.length === 0 && !queueLoading ? (
        <DataUnavailable
          variant="filtered"
          title={lang === 'hi' ? 'इन फ़िल्टरों से कोई परियोजना मेल नहीं खाती' : 'No projects match these filters'}
          detail={lang === 'hi' ? 'शेष कतार देखने के लिए जोखिम श्रेणी बढ़ाएं या कोई अन्य क्षेत्र चुनें।' : 'Widen the risk band or choose a different sector to see the rest of the queue.'}
          onClear={() => { setBand('All'); setSector('All'); }}
        />
      ) : (
        <ol className="space-y-2.5">
          {visible.map((a, i) => {
            const meta = BANDS[a.risk_band] || BANDS.MODERATE;
            const open = expanded === a.project_id;
            return (
              <li key={a.project_id} className="panel overflow-hidden">
                <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                  <span
                    className="shrink-0 w-8 h-8 rounded-lg bg-surface-3 border border-gov-border flex items-center justify-center font-mono font-black text-[13px] text-gov-navy"
                    aria-label={lang === 'hi' ? `वरीयता ${i + 1}` : `Rank ${i + 1}`}
                  >
                    {i + 1}
                  </span>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-black uppercase ${meta.badge}`}>
                        {(lang === 'hi' ? meta.labelHi : meta.label)} · {a.risk_score}
                      </span>
                      <span className="font-mono text-[11px] text-gov-muted">#{a.project_id}</span>
                      <span className="text-[11px] text-gov-soft">{getSectorName(a.sector, lang)}</span>
                      {a.state && a.state !== 'Not specified' && (
                        <span className="text-[11px] text-gov-soft">· {translateState(a.state, lang)}</span>
                      )}
                    </div>

                    <h3 className="text-[13.5px] font-heading font-bold text-gov-navy leading-snug">
                      {translateProjectName(a.project_name, lang)}
                    </h3>

                    {/* The endpoint's own one-line rationale, not a restatement of the score. */}
                    <p className="text-[12px] text-gov-soft leading-relaxed">
                      <span className="font-semibold text-gov-navy">
                        {lang === 'hi' ? 'चिह्नित करने का कारण: ' : 'Why it is here: '}
                      </span>
                      {formatWhyFlagged(a, lang)}
                    </p>

                    <p className="text-[11.5px] text-gov-muted font-mono flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3 h-3" aria-hidden="true" />{translateAgency(a.agency, lang)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" aria-hidden="true" />{formatCr(a.capex_cr, { lang })}
                      </span>
                      {a.components_available < a.components_total && (
                        <span className="inline-flex items-center gap-1 text-amber-800">
                          <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                          {lang === 'hi' ? (
                            <>{a.components_total} में से {a.components_available} घटकों पर मूल्यांकित</>
                          ) : (
                            <>scored on {a.components_available} of {a.components_total} components</>
                          )}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : a.project_id)}
                      aria-expanded={open}
                      className="px-3 py-2.5 min-h-[38px] rounded-lg border border-slate-400 text-gov-navy hover:bg-surface-3 text-[11.5px] font-bold transition-colors"
                    >
                      {open ? (lang === 'hi' ? 'विवरण छिपाएं' : 'Hide breakdown') : (lang === 'hi' ? 'घटक विवरण' : 'Breakdown')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenProject?.(a.project_id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[38px] rounded-lg bg-gov-navy hover:bg-[#0060B6] text-white text-[11.5px] font-bold transition-colors"
                    >
                      {lang === 'hi' ? 'खोलें' : 'Open'} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="px-4 pb-4 pt-1 border-t border-gov-border">
                    <table className="w-full text-[12px] mt-2.5">
                      <caption className="sr-only">
                        {lang === 'hi' ? `${translateProjectName(a.project_name, lang)} हेतु जोखिम घटक` : `Risk components for ${a.project_name}`}
                      </caption>
                      <thead>
                        <tr className="text-[10px] uppercase font-mono tracking-wider text-gov-muted">
                          <th scope="col" className="text-left py-1.5">{lang === 'hi' ? 'घटक' : 'Component'}</th>
                          <th scope="col" className="text-right py-1.5 w-20">{lang === 'hi' ? 'स्कोर' : 'Score'}</th>
                          <th scope="col" className="text-right py-1.5 w-28">{lang === 'hi' ? 'योगदान' : 'Contribution'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gov-border">
                        {Object.entries(a.components).map(([k, v]) => (
                          <tr key={k}>
                            <th scope="row" className="text-left py-1.5 font-medium text-gov-navy">
                              {getComponentLabel(k, lang)}
                            </th>
                            <td className="text-right py-1.5 font-mono text-gov-soft">
                              {v == null ? (
                                <span className="text-gov-muted">{lang === 'hi' ? 'अनुपलब्ध' : 'not available'}</span>
                              ) : (
                                v.toFixed(1)
                              )}
                            </td>
                            <td className="text-right py-1.5 font-mono font-bold text-gov-navy">
                              {a.contributions?.[k] != null ? `${a.contributions[k].toFixed(2)} ${lang === 'hi' ? 'अंक' : 'pts'}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {a.eo_verdict_reliable === false && (
                      <p className="mt-2.5 text-[11.5px] text-amber-950 bg-amber-50 border border-amber-300 rounded-lg p-2.5 leading-relaxed">
                        <Clock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" aria-hidden="true" />
                        {lang === 'hi'
                          ? 'इस परियोजना के लिए कोई विश्वसनीय उपग्रह निष्कर्ष उपलब्ध नहीं है, इसलिए स्थल साक्ष्य इसके स्कोर में शामिल नहीं हुआ। प्रगति सत्यापन हेतु भौतिक निरीक्षण आवश्यक है।'
                          : 'No reliable satellite verdict for this project, so site evidence did not enter its score. Progress here needs a physical inspection.'}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {matching.length > visible.length && (
        <button
          type="button"
          onClick={() => setShown((n) => n + 20)}
          className="w-full panel py-3 text-[12.5px] font-bold text-gov-navy hover:bg-surface-2 transition-colors"
        >
          {lang === 'hi' ? (
            <>
              {Math.min(20, matching.length - visible.length)} और देखें
              <span className="text-gov-muted font-normal">
                {' '}({formatCount(matching.length - visible.length)} शेष)
              </span>
            </>
          ) : (
            <>
              Show {Math.min(20, matching.length - visible.length)} more
              <span className="text-gov-muted font-normal">
                {' '}({formatCount(matching.length - visible.length)} remaining)
              </span>
            </>
          )}
        </button>
      )}
    </motion.div>
  );
}
