import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudRain, GitBranch, Info, Satellite, TrendingDown, Waves, Layers,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

import SatelliteViewer from '../../amey/SatelliteViewer.jsx';
import VarshaStateProfiles from '../../janhavi/index.jsx';
import LoginGate from '../../amey/LoginGate.jsx';
import { getStoredLanguage } from '../lib/i18n';

const API = '';

/**
 * Pillar 4 — SETU-VARSHA: climate shock and systemic contagion war room.
 */

export default function SetuVarshaView({ selectedProjectId = '619092', lang: propLang }) {
  const [lang, setLang] = useState(() => propLang || getStoredLanguage());
  useEffect(() => { if (propLang) setLang(propLang); }, [propLang]);
  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);
  const isHi = lang === 'hi';

  const cr = (v) => {
    if (v == null) return '—';
    if (v >= 100000) {
      return isHi ? `₹${(v / 100000).toFixed(2)} लाख करोड़` : `₹${(v / 100000).toFixed(2)}L Cr`;
    }
    return isHi 
      ? `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })} करोड़`
      : `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`;
  };

  const TABS = [
    { 
      id: 'warroom', 
      label: isHi ? 'संक्रामकता वार रूम' : 'Contagion War Room',
      desc: isHi ? 'वर्षा स्लाइडर द्वारा निर्देशित डीएजी सोपानक एवं अवरुद्ध पूंजी' : 'Rainfall slider driving DAG cascade and locked capex', 
      icon: Waves 
    },
    { 
      id: 'profiles', 
      label: isHi ? 'आईएमडी राज्य प्रोफ़ाइल' : 'IMD State Profiles',
      desc: isHi ? '२०-वर्षीय विचलन इतिहास एवं भू-भाग लोच' : '20-year departure history and terrain elasticities', 
      icon: Layers 
    },
  ];

  const [focusId, setFocusId] = useState(selectedProjectId);
  const [tab, setTab] = useState('warroom');
  const [anomaly, setAnomaly] = useState(15);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [nodePage, setNodePage] = useState(1);
  const NODE_PAGE_SIZE = 10;
  const timer = useRef(null);

  useEffect(() => {
    setNodePage(1);
  }, [data]);

  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== focusId) {
      setFocusId(selectedProjectId);
    }
  }, [selectedProjectId]);

  const run = useCallback((pct) => {
    setBusy(true);
    setHasRun(true);
    fetch(`${API}/api/janhavi/setu-varsha/cascade?rainfall_anomaly_pct=${pct}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setBusy(false); })
      .catch(() => setBusy(false));
  }, []);

  // Debounced: dragging the slider only re-calculates if user has executed at least once
  const onSlide = (v) => {
    setAnomaly(v);
    if (!hasRun) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => run(v), 260);
  };

  const scenario = anomaly >= 30 ? (isHi ? 'अत्यधिक मानसून व्यवस्था' : 'Extreme monsoon regime')
    : anomaly > 0 ? (isHi ? 'अधिशेष विचलन' : 'Excess departure')
    : anomaly === 0 ? (isHi ? 'सामान्य आईएमडी दीर्घकालिक औसत' : 'Normal IMD long-period average')
    : (isHi ? 'न्यून मानसून' : 'Deficient monsoon');

  return (
    <LoginGate>
      <div className="space-y-5 font-sans">
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl border border-slate-700 relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <CloudRain className="w-48 h-48 text-amber-500" />
          </div>

          <div className="space-y-3 max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-extrabold tracking-institutional uppercase text-amber-400 border-l-2 border-amber-400">
              <CloudRain className="w-3.5 h-3.5 text-white" />
              <span>{isHi ? 'जलवायु संक्रामकता वार रूम' : 'CLIMATE CONTAGION WAR ROOM'}</span>
            </div>
            <h2 className="font-heading font-extrabold text-[22px] sm:text-[28px] tracking-tight text-white leading-tight">
              {isHi ? 'सेतु-वर्षा: निर्भरता नेटवर्क में मानसून आघात' : 'SETU-VARSHA: MONSOON SHOCK ACROSS THE DEPENDENCY NETWORK'}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              {isHi
                ? 'वर्षा विचलन को समायोजित करें और इसका प्रसार देखें: राज्यों के अनुसार कार्य अवधि संकुचित होती है, परियोजना समयसीमा बढ़ती है, फ्लोट जितना संभव हो अवशोषित करता है, और शेष राशि डाउनस्ट्रीम पूंजी को अवरुद्ध करती है।'
                : 'Move the rainfall departure and watch it propagate: working windows contract by state, project schedules stretch, float absorbs what it can, and the remainder locks capital downstream.'}
            </p>
          </div>
        </div>

        <nav className="engine-rail" role="tablist" aria-label="Setu-Varsha views">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} role="tab" aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`engine-tab ${active ? 'active' : ''}`}>
                <span className="engine-tab-icon"><Icon className="w-3.5 h-3.5" strokeWidth={2} /></span>
                <span className="min-w-0 flex-1">
                  <span className="engine-tab-name">{t.label}</span>
                  <span className="engine-tab-desc">{t.desc}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <AnimatePresence mode="wait">
          {tab === 'profiles' && (
            <motion.div
              key="profiles"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <VarshaStateProfiles lang={lang} />
            </motion.div>
          )}

          {tab === 'warroom' && (
            <motion.div
              key="warroom"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="space-y-5"
            >
              {/* ── The slider — Revealed post-simulation ────────────────── */}
              {hasRun && data && (
                <div className="panel bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Waves className="w-4 h-4 text-sky-600" />
                      {isHi ? 'आईएमडी वर्षा विचलन सिमुलेशन' : 'IMD Rainfall Departure Simulation'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {scenario}{busy ? (isHi ? ' · पुनर्गणना जारी…' : ' · recomputing…') : ''}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 font-mono">{isHi ? 'न्यून −50%' : 'Deficient −50%'}</span>
                      <span className="px-3 py-1 rounded-md text-xs font-black font-mono bg-sky-50 text-sky-800 border border-sky-200">
                        {anomaly > 0 ? '+' : ''}{anomaly}% {isHi ? 'एलपीए से विचलन' : 'departure from LPA'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 font-mono">{isHi ? 'अधिशेष +50%' : 'Excess +50%'}</span>
                    </div>
                    <input
                      type="range"
                      aria-label="Rainfall departure from the long period average"
                      aria-valuetext={`${anomaly > 0 ? 'Excess ' : anomaly < 0 ? 'Deficit ' : 'Normal, '}${anomaly}% departure from the long period average`}
                      min="-50" max="50" step="5"
                      value={anomaly}
                      onChange={(e) => onSlide(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                    />
                    {data?.scenario_interpretation && (
                      <p className="text-xs text-slate-500 leading-snug">
                        {data.scenario_interpretation}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {busy && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[360px]">
                  <div className="w-12 h-12 rounded-full border-4 border-sky-500/20 border-t-sky-600 animate-spin" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
                      {isHi ? 'मैक्स-प्लस निर्भरता डीएजी का विश्लेषण जारी…' : 'Walking Max-Plus Dependency DAG…'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {isHi ? 'वर्षा विचलन, राज्य कार्य अवधियों और डाउनस्ट्रीम फ्लोट अवशोषण का मूल्यांकन' : 'Evaluating rainfall departures, state working windows, and downstream float absorption'}
                    </p>
                  </div>
                </div>
              )}

              {/* Empty State Hero */}
              {!data && !busy && (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[440px]">
                  <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-xs">
                    <CloudRain className="w-8 h-8" />
                  </div>
                  <div className="max-w-md space-y-3">
                    <h3 className="text-xl font-bold text-slate-800">
                      {isHi ? 'जलवायु संक्रामकता सिमुलेशन हेतु तैयार' : 'Ready to Simulate Climate Contagion'}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {isHi
                        ? <>2,207 परियोजना निर्भरता ग्राफ का विश्लेषण करने, राज्यों में मानसून आघात का प्रसार देखने और डाउनस्ट्रीम अवरुद्ध पूंजी की गणना करने के लिए <strong className="text-slate-700">"जलवायु संक्रामकता का सिमुलेट करें"</strong> पर क्लिक करें।</>
                        : <>Click <strong className="text-slate-700">"SIMULATE CLIMATE CONTAGION"</strong> above or below to walk the 2,207 project dependency graph and compute downstream locked capex under empirical IMD rainfall regimes.</>}
                    </p>
                    <div className="pt-2 flex justify-center">
                      <button
                        onClick={() => run(anomaly)}
                        disabled={busy}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-3 px-6 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <CloudRain className="w-4 h-4 text-white" />
                        <span>{isHi ? 'जलवायु संक्रामकता का सिमुलेट करें' : 'Simulate Climate Contagion'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-2">
                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-sky-100/60 text-sky-700 flex items-center justify-center">
                        <Waves className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-700">{isHi ? 'आईएमडी विचलन मॉडलिंग' : 'IMD Departure Modeling'}</h4>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {isHi ? '50-वर्षीय दीर्घकालिक औसतों से वर्षा विचलन का परिमाण निर्धारित करता है' : 'Quantifies rainfall deviation from 50-year long-period averages'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100/60 text-indigo-700 flex items-center justify-center">
                        <GitBranch className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-700">{isHi ? 'मैक्स-प्लस डीएजी सोपानक' : 'Max-Plus DAG Cascade'}</h4>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {isHi ? 'अंतर-परियोजना महत्वपूर्ण पथों पर बफ़र अवशोषण को ट्रैक करता है' : 'Tracks buffer absorption across inter-project critical paths'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100/60 text-amber-700 flex items-center justify-center">
                        <TrendingDown className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-700">{isHi ? 'अवरुद्ध पूंजी जोखिम' : 'Locked Capex Exposure'}</h4>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {isHi ? 'अलग-थलग विलंब को वास्तविक प्रणालीगत डोमिनो जोखिम से अलग करता है' : 'Separates isolated delay from true systemic domino risk'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {data && !busy && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="space-y-5"
                >
                  {/* ── Cascade read-out ─────────────────────────────────────── */}
                  <div className="hairgrid hairgrid-4">
                    <div className="metric-cell panel-critical">
                      <span className="metric-label">{isHi ? 'डाउनस्ट्रीम अवरुद्ध पूंजी' : 'Downstream Locked Capex'}</span>
                      <span className="metric-value metric-neg">{cr(data?.downstream_locked_capex_cr)}</span>
                      <span className="metric-sub">
                        {isHi 
                          ? `कुल फ्लोट का उल्लंघन करने वाली ${data?.nodes_breaching_total_float ?? 0} परियोजनाओं के कारण`
                          : `behind ${data?.nodes_breaching_total_float ?? 0} projects that breach total float`}
                      </span>
                    </div>
                    <div className="metric-cell">
                      <span className="metric-label">{isHi ? 'प्रत्यक्ष जोखिम (कोई डाउनस्ट्रीम नहीं)' : 'Direct Exposure (No Downstream)'}</span>
                      <span className="metric-value metric-warn">{cr(data?.isolated_direct_exposure_cr)}</span>
                      <span className="metric-sub">
                        {isHi
                          ? `बिना किसी आश्रित के प्रभावित ${data?.isolated_projects_hit ?? 0} परियोजनाएं`
                          : `${data?.isolated_projects_hit ?? 0} projects hit with no dependants`}
                      </span>
                    </div>
                    <div className="metric-cell">
                      <span className="metric-label">{isHi ? 'सोपानक में परियोजनाएं' : 'Projects in Cascade'}</span>
                      <span className="metric-value">{data?.nodes_in_cascade ?? 0}</span>
                      <span className="metric-sub">
                        {isHi 
                          ? `${data?.nodes_directly_hit ?? 0} प्रत्यक्ष मौसम प्रभावित`
                          : `${data?.nodes_directly_hit ?? 0} directly weather-hit`}
                      </span>
                    </div>
                    <div className="metric-cell">
                      <span className="metric-label">{isHi ? 'औसत जलवायु विलंब' : 'Mean Climate Delay'}</span>
                      <span className="metric-value">{(data?.mean_climate_delay_months ?? 0).toFixed(1)}</span>
                      <span className="metric-sub">{isHi ? 'माह अतिरिक्त विचलन' : 'months of added slippage'}</span>
                    </div>
                  </div>

                  <div className="note note-warn">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
                    <span>
                      <strong>{isHi ? 'परिदृश्य प्रक्षेपण, कोई पूर्वानुमान नहीं।' : 'Scenario projection, not a forecast.'}</strong> {data?.caveat}{' '}
                      {data?.network_coverage_note}
                    </span>
                  </div>

                  {/* ── Most exposed corridors ───────────────────────────────── */}
                  <div className="panel">
                    <div className="panel-head">
                      <span className="panel-title">
                        <GitBranch className="w-3.5 h-3.5" />
                        {isHi ? 'सर्वाधिक जोखिम वाले नेटवर्क नोड्स' : 'Most Exposed Network Nodes'}
                      </span>
                      <span className="panel-meta">
                        {isHi ? 'विलंब के पीछे पूंजी द्वारा क्रमित' : 'ranked by capital behind the delay'}
                      </span>
                    </div>
                    {(() => {
                      const affectedNodes = data?.affected || [];
                      const totalNodePages = Math.ceil(affectedNodes.length / NODE_PAGE_SIZE) || 1;
                      const paginatedNodes = affectedNodes.slice((nodePage - 1) * NODE_PAGE_SIZE, nodePage * NODE_PAGE_SIZE);

                      return (
                        <>
                          <div className="panel-flush overflow-x-auto">
                            <table className="ledger">
                              <thead>
                                <tr>
                                  <th>{isHi ? 'परियोजना' : 'Project'}</th>
                                  <th>{isHi ? 'राज्य' : 'State'}</th>
                                  <th>{isHi ? 'क्षेत्र' : 'Sector'}</th>
                                  <th className="num">{isHi ? 'जलवायु विलंब' : 'Climate Delay'}</th>
                                  <th className="num">{isHi ? 'कुल फ्लोट' : 'Total Float'}</th>
                                  <th className="num">{isHi ? 'पूंजी (Capex)' : 'Capex'}</th>
                                  <th>{isHi ? 'उत्पत्ति' : 'Origin'}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedNodes.map((n) => (
                                  <tr
                                    key={n.project_id}
                                    tabIndex={0}
                                    aria-selected={String(n.project_id) === String(focusId)}
                                    onClick={() => setFocusId(String(n.project_id))}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFocusId(String(n.project_id)); } }}
                                    className={`cursor-pointer transition-colors ${
                                      String(n.project_id) === String(focusId)
                                        ? 'bg-gov-accent/10'
                                        : 'hover:bg-gov-muted-surface'
                                    }`}
                                    title={isHi ? 'इस परियोजना के लिए ज़मीनी सत्य छवि दिखाएं' : 'Show ground-truth imagery for this project'}
                                  >
                                    <td>
                                      <span className="font-semibold text-gov-navy">
                                        {String(n.project_name || '').slice(0, 54)}
                                      </span>
                                      <span className="block text-[9.5px] font-mono text-gov-muted">#{n.project_id}</span>
                                    </td>
                                    <td className="text-[10.5px]">{n.state}</td>
                                    <td className="text-[10.5px]">{n.sector}</td>
                                    <td className="num font-semibold text-amber-700">
                                      {n.climate_delay_months} {isHi ? 'माह' : 'mo'}
                                    </td>
                                    <td className="num text-gov-muted">
                                      {n.total_float_months} {isHi ? 'माह' : 'mo'}
                                    </td>
                                    <td className="num">{cr(n.capex_cr)}</td>
                                    <td>
                                      {n.directly_hit
                                        ? <span className="tag tag-warn"><CloudRain className="w-2.5 h-2.5" />{isHi ? 'मौसम' : 'Weather'}</span>
                                        : <span className="tag tag-info"><GitBranch className="w-2.5 h-2.5" />{isHi ? 'सोपानित' : 'Cascaded'}</span>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {affectedNodes.length > NODE_PAGE_SIZE && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-2.5 border-t border-gov-border bg-slate-50/50">
                              <span className="text-[11px] font-mono text-gov-muted font-bold">
                                {isHi
                                  ? `कुल ${affectedNodes.length} नोड्स में से ${((nodePage - 1) * NODE_PAGE_SIZE) + 1}–${Math.min(nodePage * NODE_PAGE_SIZE, affectedNodes.length)} (पृष्ठ ${nodePage}/${totalNodePages})`
                                  : `Showing ${((nodePage - 1) * NODE_PAGE_SIZE) + 1}–${Math.min(nodePage * NODE_PAGE_SIZE, affectedNodes.length)} of ${affectedNodes.length} Nodes (Page ${nodePage} of ${totalNodePages})`
                                }
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setNodePage((p) => Math.max(1, p - 1))}
                                  disabled={nodePage === 1}
                                  className="px-2.5 py-1 rounded-md border border-gov-border bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-xs transition"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" /> {isHi ? 'पिछला' : 'Prev'}
                                </button>
                                {Array.from({ length: totalNodePages }, (_, i) => i + 1).map((pg) => (
                                  <button
                                    key={pg}
                                    onClick={() => setNodePage(pg)}
                                    className={`w-7 h-7 rounded-md text-xs font-mono font-bold transition ${
                                      nodePage === pg
                                        ? 'bg-gov-navy text-white shadow-xs'
                                        : 'bg-white border border-gov-border text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    {pg}
                                  </button>
                                ))}
                                <button
                                  onClick={() => setNodePage((p) => Math.min(totalNodePages, p + 1))}
                                  disabled={nodePage === totalNodePages}
                                  className="px-2.5 py-1 rounded-md border border-gov-border bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-xs transition"
                                >
                                  {isHi ? 'अगला' : 'Next'} <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <div className="px-3 py-2 border-t border-gov-border">
                      <p className="text-[10px] text-gov-muted leading-snug">{data?.methodology}</p>
                    </div>
                  </div>

                  {/* ── Ground truth alongside the model ─────────────────────── */}
                  <div className="panel">
                    <div className="panel-head">
                      <span className="panel-title">
                        <Satellite className="w-3.5 h-3.5" />
                        {isHi ? 'पिनपॉइंट ज़मीनी-सत्य (Ground-Truth) सत्यापन' : 'Pinpoint Ground-Truth Verification'}
                      </span>
                      <span className="panel-meta">
                        {isHi 
                          ? `परियोजना #${focusId} · बदलने के लिए ऊपर किसी पंक्ति का चयन करें` 
                          : `project #${focusId} · select a row above to change`}
                      </span>
                    </div>
                    <div className="panel-flush">
                      <SatelliteViewer projectId={focusId} />
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LoginGate>
  );
}
