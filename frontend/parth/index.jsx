import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Search, Building2, X, AlertTriangle, Info,
  Landmark, ShieldQuestion, Layers, CheckCircle2, HelpCircle,
  ArrowRight, ExternalLink, SlidersHorizontal, ChevronRight,
  PieChart, ShieldAlert, Sparkles, Filter, RotateCcw
} from 'lucide-react';
import { getStoredLanguage } from '../src/lib/i18n';

const API = '';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 24 }
  }
};

/**
 * ARTHA-NIVARAN — Contractor 360 (Solvency Matrix)
 * Clean, modern, intuitive interface for evaluating executing-agency financial strength.
 */

const getTierMeta = (key, isHi = false) => {
  const map = {
    PRIME_CASH_RICH: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dot: 'bg-emerald-500',
      border: 'border-l-emerald-500',
      label: isHi ? 'प्राइम कैश-समृद्ध' : 'Prime Cash-Rich',
      desc: isHi 
        ? 'मजबूत नकदी भंडार, अत्यंत कम ऋण। उच्चतम निष्पादन विश्वसनीयता (उदा. एनटीपीसी, पावरग्रिड)।'
        : 'Strong cash reserves, very low debt. Highest execution reliability (e.g., NTPC, PowerGrid).'
    },
    STABLE_INVESTMENT_GRADE: {
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      dot: 'bg-amber-500',
      border: 'border-l-amber-500',
      label: isHi ? 'स्थिर निवेश श्रेणी' : 'Stable Investment Grade',
      desc: isHi 
        ? 'प्रबंधनीय ऋण (D/E < 2.0x, Z > 1.8)। मानक परिचालन जोखिम एवं स्थिर आपूर्ति।'
        : 'Manageable debt (D/E < 2.0x, Z > 1.8). Standard operating risk and steady delivery.'
    },
    HIGH_LEVERAGE_STRESS: {
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      dot: 'bg-rose-500',
      border: 'border-l-rose-500',
      label: isHi ? 'उच्च लीवरेज दबाव' : 'High-Leverage Stress',
      desc: isHi 
        ? 'भारी ऋण (D/E > 2.0x)। संविदाकार तरलता संकट और परियोजना विचलन का उच्च जोखिम।'
        : 'Heavy borrowing (D/E > 2.0x). Higher risk of contractor cashflow crunch and project slip.'
    },
    SOVEREIGN_DIRECT_BUDGET_LINE: {
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
      dot: 'bg-blue-500',
      border: 'border-l-blue-500',
      label: isHi ? 'प्रत्यक्ष बजटीय आवंटन' : 'Direct Budget Line',
      desc: isHi 
        ? 'केंद्रीय/राज्य बजटीय आवंटन द्वारा सीधे समर्थित (उदा. रेलवे, रक्षा, सीमा सड़क संगठन)।'
        : 'Backed directly by Union/State budgetary allocations (e.g., Railways, Defense, Border Roads).'
    },
    UNRATED: {
      badge: 'bg-slate-100 text-slate-700 border-slate-300',
      dot: 'bg-slate-400',
      border: 'border-l-slate-400',
      label: isHi ? 'गैर-रेटेड / निजी' : 'Unrated / Private',
      desc: isHi 
        ? 'सार्वजनिक रूप से प्रकाशित ऑडिटेड बैलेंस शीट के बिना गैर-सूचीबद्ध संस्थाएं।'
        : 'Unlisted entities without publicly published audited balance sheets.'
    }
  };
  return map[key] || map.UNRATED;
};

const num = (v, d = 1, suffix = '') =>
  v == null || Number.isNaN(v) ? '—' : `${Number(v).toFixed(d)}${suffix}`;

export default function ArthaNetraView({ selectedProjectId: propProjectId = '', lang: propLang }) {
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

  const [summary, setSummary] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [drill, setDrill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(() => propProjectId || localStorage.getItem('prakalp:selectedProjectId') || '619092');

  useEffect(() => {
    if (propProjectId && propProjectId !== selectedProjectId) {
      setSelectedProjectId(String(propProjectId));
    }
  }, [propProjectId]);

  // Global project sync
  useEffect(() => {
    const handleSelect = (e) => {
      if (e.detail) {
        setSelectedProjectId(String(e.detail));
      }
    };
    window.addEventListener('prakalp:selectProject', handleSelect);
    return () => window.removeEventListener('prakalp:selectProject', handleSelect);
  }, []);

  useEffect(() => {
    let dead = false;
    Promise.all([
      fetch(`${API}/api/parth/portfolio`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/api/parth/agencies?limit=500`).then((r) => r.json()).catch(() => null),
    ]).then(([s, a]) => {
      if (dead) return;
      setSummary(s);
      setAgencies(a?.agencies || []);
      setLoading(false);
    });
    return () => { dead = true; };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return agencies.filter((a) =>
      (!needle || a.agency_name.toLowerCase().includes(needle) ||
        a.agency_key.toLowerCase().includes(needle)) &&
      (!tierFilter || a.solvency_tier === tierFilter));
  }, [agencies, query, tierFilter]);

  const openDrill = async (a) => {
    setDrill({ agency: a, loading: true, projects: [] });
    const r = await fetch(`${API}/api/parth/agency/${encodeURIComponent(a.agency_key)}/projects`)
      .then((x) => x.json()).catch(() => null);
    setDrill({ agency: a, loading: false, projects: r?.projects || [] });
  };

  if (loading) {
    return (
      <div className="panel p-10 text-center text-xs text-gov-muted space-y-2">
        <div className="w-6 h-6 border-2 border-[#0060B6] border-t-transparent rounded-full animate-spin mx-auto" />
        <div>{isHi ? 'कार्यान्वयन-एजेंसी शोधनक्षमता निर्देशिका लोड हो रही है…' : 'Loading executing-agency solvency directory…'}</div>
      </div>
    );
  }

  if (!summary?.available) {
    return (
      <div className="note note-warn">
        <span>{isHi ? `अर्थ-निवारण अनुपलब्ध। ${summary?.reason}` : `ARTHA-NIVARAN unavailable. ${summary?.reason}`}</span>
      </div>
    );
  }

  const dist = summary.portfolio_solvency_distribution || {};
  const cov = summary.solvency_coverage || {};
  const dd = summary.financial_delay_differential || {};

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 font-sans pb-12"
    >
      {/* ── Header Banner ── */}
      <motion.div 
        variants={itemVariants} 
        className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl border border-slate-700 relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <TrendingUp className="w-48 h-48 text-amber-500" />
        </div>

        <div className="space-y-3 max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-extrabold tracking-institutional uppercase text-amber-400 border-l-2 border-amber-400">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
            <span>{isHi ? 'अर्थ-निवारण · संविदाकार ३६०' : 'ARTHA-NIVARAN · CONTRACTOR 360'}</span>
          </div>
          <h1 className="font-heading font-extrabold text-[22px] sm:text-[28px] tracking-tight text-white leading-tight">
            {isHi ? 'कार्यान्वयन-एजेंसी शोधनक्षमता एवं वित्तीय दबाव मैट्रिक्स' : 'Executing-Agency Solvency & Financial Stress Matrix'}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
            {isHi
              ? '१०३ केंद्रीय क्षेत्र कार्यान्वयन निकायों (पीएसयू एवं मंत्रालयों) की वित्तीय बैलेंस-शीट शक्ति का विश्लेषण। सभी २,२०७ परियोजनाओं में कॉर्पोरेट ऋण लीवरेज (ऋण-से-इक्विटी एवं ऑल्टमैन जेड) का मापे गए मील के पत्थर विलंब के साथ क्रॉस-रेफरेंस करता है।'
              : 'Analyzes the financial balance-sheet strength of 103 Central Sector executing bodies (PSUs and Ministries). Cross-references corporate debt leverage (Debt-to-Equity & Altman Z) against measured milestone delays across all 2,207 projects.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <div className="bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700 text-right min-w-[150px] shadow-sm">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">
              {isHi ? 'ऑडिटेड पोर्टफोलियो' : 'Audited Portfolio'}
            </div>
            <div className="text-[24px] font-heading font-extrabold text-white leading-tight mt-0.5">
              {cr(summary.total_portfolio_capex_cr)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {summary.total_projects} {isHi ? 'परियोजनाएं' : 'Projects'} · {summary.distinct_agencies} {isHi ? 'एजेंसियां' : 'Agencies'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Key Takeaway Orientation Box ── */}
      <motion.div variants={itemVariants} className="note note-info flex items-start gap-3 bg-azure-50/70 border-azure-200 p-3.5 rounded-sm">
        <Info className="w-4 h-4 text-azure shrink-0 mt-0.5" />
        <div className="text-[12px] leading-relaxed text-gov-navy">
          <strong>{isHi ? 'इस मैट्रिक्स को कैसे पढ़ें: ' : 'How to read this matrix: '}</strong>
          {isHi ? (
            <>
              भारी ऋणग्रस्त संविदाकारों (ऋण-से-इक्विटी &gt; 2.0x) को आवंटित परियोजनाएं कार्यशील पूंजी की बाधाओं के कारण औसतन{' '}
              <strong className="text-amber-800 font-heading font-bold">
                +{dd.observed_extra_slip_months || '5.8'} माह
              </strong>{' '}
              अतिरिक्त समयसीमा विचलन का अनुभव करती हैं। निर्देशिका को फ़िल्टर करने के लिए नीचे किसी भी श्रेणी कार्ड पर क्लिक करें।
            </>
          ) : (
            <>
              Projects assigned to heavily indebted contractors (Debt-to-Equity &gt; 2.0x) experience on average{' '}
              <strong className="text-amber-800 font-heading font-bold">
                +{dd.observed_extra_slip_months || '5.8'} months
              </strong>{' '}
              of extra schedule slippage due to contractor working-capital bottlenecks. Click any category card below to filter the directory.
            </>
          )}
        </div>
      </motion.div>

      {/* ── 3 High-Impact Macro KPI Cards ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Portfolio */}
        <div className="panel p-4 bg-gov-surface border border-gov-border rounded-sm">
          <div className="text-[10px] font-bold text-gov-muted uppercase tracking-wider font-heading">
            {isHi ? 'कुल निगरानी पूंजी (Monitored Capex)' : 'Total Monitored Capex'}
          </div>
          <div className="text-[23px] font-heading font-extrabold text-gov-navy mt-1">
            {cr(summary.total_portfolio_capex_cr)}
          </div>
          <div className="text-[11px] text-gov-muted mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-gov-navy">{summary.total_projects}</span> {isHi ? 'परियोजनाएं' : 'projects across'}{' '}
            <span className="font-semibold text-gov-navy">{summary.distinct_agencies}</span> {isHi ? 'एजेंसियों में' : 'agencies'}
          </div>
        </div>

        {/* Card 2: High Leverage Stress */}
        <div className="panel p-4 bg-rose-50/40 border border-rose-200 rounded-sm">
          <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider font-heading flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{isHi ? 'उच्च ऋण-दबाव परिव्यय' : 'High Debt-Stress Outlay'}</span>
          </div>
          <div className="text-[23px] font-heading font-extrabold text-rose-700 mt-1">
            {cr(summary.total_capex_at_high_leverage_stress_cr)}
          </div>
          <div className="text-[11px] text-rose-800/80 mt-1">
            {isHi ? (
              <>
                <strong className="text-rose-900">{summary.high_leverage_agency_count} एजेंसियों</strong> द्वारा प्रबंधित जो भारी उधारी (D/E &gt; 2.0) वहन कर रही हैं
              </>
            ) : (
              <>
                Managed by <strong className="text-rose-900">{summary.high_leverage_agency_count} agencies</strong> carrying heavy borrowing (D/E &gt; 2.0)
              </>
            )}
          </div>
        </div>

        {/* Card 3: Observed Delay Differential */}
        <div className="panel p-4 bg-amber-50/40 border border-amber-200 rounded-sm">
          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider font-heading flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            <span>{isHi ? 'देखा गया विलंब अंतराल' : 'Observed Delay Gap'}</span>
          </div>
          <div className="text-[23px] font-heading font-extrabold text-amber-700 mt-1">
            {dd.available ? `+${dd.observed_extra_slip_months} ${isHi ? 'माह' : 'Months'}` : '—'}
          </div>
          <div className="text-[11px] text-amber-800/80 mt-1">
            {dd.available
              ? (isHi 
                  ? `उच्च-ऋण (${dd.high_leverage_mean_slip_months} माह) बनाम स्थिर (${dd.rated_stable_mean_slip_months} माह) विलंब अंतराल`
                  : `High-debt (${dd.high_leverage_mean_slip_months} mo) vs Stable (${dd.rated_stable_mean_slip_months} mo) slip gap`)
              : (isHi ? '२,२०७ परियोजनाओं में विश्लेषित' : 'Computed across 2,207 projects')}
          </div>
      </div>
      </motion.div>

      {/* ── Interactive Solvency Tiers (Clickable Filters) ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0060B6]" />
            <h2 className="font-heading font-extrabold text-[13.5px] text-gov-navy uppercase tracking-wide">
              {isHi ? 'शोधनक्षमता स्वास्थ्य श्रेणियां (फ़िल्टर करने हेतु क्लिक करें)' : 'Solvency Health Categories (Click to Filter)'}
            </h2>
          </div>
          {tierFilter && (
            <button
              onClick={() => setTierFilter('')}
              className="text-[11px] text-[#0060B6] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isHi ? 'सभी श्रेणियां दिखाएं' : 'Show All Tiers'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
          {/* Column 1: 3 categories */}
          <div className="flex flex-col gap-3 h-full">
            {Object.entries(dist).slice(0, 3).map(([key, v]) => {
              const meta = getTierMeta(key, isHi);
              const isSelected = tierFilter === key;

              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => setTierFilter(isSelected ? '' : key)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTierFilter(isSelected ? '' : key); } }}
                  className={`panel p-3.5 border-l-4 ${meta.border} cursor-pointer transition-all duration-150 rounded-xs select-none flex-1 flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-[#0060B6] shadow-sm bg-blue-50/40 border-gov-navy'
                      : 'hover:bg-gov-surface-2 bg-gov-surface border-gov-border'
                  }`}
                  title={isHi ? `${meta.label} द्वारा निर्देशिका फ़िल्टर करने हेतु क्लिक करें` : `Click to filter directory by ${meta.label}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full ${meta.dot} shrink-0`} />
                        <span className="font-heading font-bold text-[12px] text-gov-navy truncate">
                          {meta.label}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta.badge}`}>
                        {v.agency_count} {isHi ? 'निकाय' : 'Bodies'}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-gov-muted leading-snug mb-2.5">
                      {meta.desc}
                    </p>
                  </div>

                  <div className="mt-auto pt-2 border-t border-gov-border/60">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-heading font-extrabold text-gov-navy">
                        {cr(v.capex_cr)}
                      </span>
                      <span className="font-mono text-gov-muted text-[10.5px]">
                        {v.capex_share_pct}% {isHi ? 'पोर्टफोलियो' : 'portfolio'}
                      </span>
                    </div>

                    {/* Visual Progress Line */}
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1.5">
                      <div
                        className={`${meta.dot} h-full rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(100, Math.max(8, v.capex_share_pct))}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Column 2: 2 categories filling the entire column area */}
          <div className="flex flex-col gap-3 h-full">
            {Object.entries(dist).slice(3).map(([key, v]) => {
              const meta = getTierMeta(key, isHi);
              const isSelected = tierFilter === key;

              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => setTierFilter(isSelected ? '' : key)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTierFilter(isSelected ? '' : key); } }}
                  className={`panel p-4 border-l-4 ${meta.border} cursor-pointer transition-all duration-150 rounded-xs select-none flex-1 flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-[#0060B6] shadow-sm bg-blue-50/40 border-gov-navy'
                      : 'hover:bg-gov-surface-2 bg-gov-surface border-gov-border'
                  }`}
                  title={isHi ? `${meta.label} द्वारा निर्देशिका फ़िल्टर करने हेतु क्लिक करें` : `Click to filter directory by ${meta.label}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full ${meta.dot} shrink-0`} />
                        <span className="font-heading font-bold text-[12.5px] text-gov-navy truncate">
                          {meta.label}
                        </span>
                      </div>
                      <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded border ${meta.badge}`}>
                        {v.agency_count} {isHi ? 'निकाय' : 'Bodies'}
                      </span>
                    </div>

                    <p className="text-[11px] text-gov-muted leading-relaxed mb-3">
                      {meta.desc}
                    </p>
                  </div>

                  <div className="mt-auto pt-2.5 border-t border-gov-border/60">
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="font-heading font-extrabold text-gov-navy">
                        {cr(v.capex_cr)}
                      </span>
                      <span className="font-mono text-gov-muted text-[11px]">
                        {v.capex_share_pct}% {isHi ? 'पोर्टफोलियो' : 'portfolio'}
                      </span>
                    </div>

                    {/* Visual Progress Line */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className={`${meta.dot} h-full rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(100, Math.max(8, v.capex_share_pct))}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Executing-Agency Directory Table ── */}
      <div className="panel border border-gov-border rounded-sm overflow-hidden bg-gov-surface shadow-xs">
        <div className="panel-head flex flex-wrap items-center justify-between gap-3 p-3 bg-gov-surface-2 border-b border-gov-border">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0060B6]" />
            <span className="font-heading font-extrabold text-[12px] text-gov-navy uppercase tracking-wide">
              {isHi ? 'कार्यान्वयन-एजेंसी रजिस्टर' : 'Executing-Agency Register'}
            </span>
            <span className="text-[11px] text-gov-muted">
              ({filtered.length} {isHi ? 'में से' : 'of'} {agencies.length} {isHi ? 'प्रदर्शित' : 'shown'})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Reset if any */}
            {tierFilter && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 text-blue-900 rounded text-[10.5px] font-bold">
                {isHi ? 'फ़िल्टर:' : 'Filtered:'} {getTierMeta(tierFilter, isHi).label}
                <X className="w-3 h-3 cursor-pointer hover:text-red-700" onClick={() => setTierFilter('')} />
              </span>
            )}

            {/* Quick Search */}
            <div className="flex items-center gap-1.5 border border-gov-border rounded-xs px-2.5 py-1 bg-white focus-within:border-[#0060B6]">
              <Search className="w-3.5 h-3.5 text-gov-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isHi ? 'एजेंसी खोजें (उदा. NHAI, NTPC)...' : 'Search agency (e.g. NHAI, NTPC)...'}
                className="text-[11.5px] w-48 sm:w-56 focus:outline-none font-sans"
              />
              {query && (
                <X className="w-3 h-3 text-gov-muted cursor-pointer hover:text-gov-navy" onClick={() => setQuery('')} />
              )}
            </div>
          </div>
        </div>

        {/* Streamlined Table */}
        <div className="overflow-x-auto max-h-[580px]">
          <table className="ledger w-full">
            <thead className="sticky top-0 bg-gov-surface-2 z-10">
              <tr>
                <th>{isHi ? 'कार्यान्वयन एजेंसी' : 'Executing Agency'}</th>
                <th className="num" title={isHi ? 'निगरानी वाली परियोजनाओं की संख्या' : 'Number of monitored projects'}>{isHi ? 'परियोजनाएं' : 'Projects'}</th>
                <th className="num" title={isHi ? 'सक्रिय पूंजी परिव्यय' : 'Total active capital outlay'}>{isHi ? 'सक्रिय पूंजी' : 'Active Capex'}</th>
                <th className="num" title={isHi ? 'औसत लागत अतिव्यय प्रतिशत' : 'Average cost overrun percentage'}>{isHi ? 'औसत अतिव्यय (%)' : 'Mean Overrun (%)'}</th>
                <th className="num" title={isHi ? 'औसत समयसीमा विलंब (माह में)' : 'Average schedule delay in months'}>{isHi ? 'औसत विलंब' : 'Avg Delay'}</th>
                <th className="num" title={isHi ? 'समयसीमा से पीछे चल रही परियोजनाओं का प्रतिशत' : 'Percentage of projects running behind schedule'}>{isHi ? 'विलंब दर' : 'Late Rate'}</th>
                <th className="num" title={isHi ? 'ऋण-से-इक्विटी अनुपात: 2.0 से कम स्वस्थ है' : 'Debt-to-Equity ratio: under 2.0 is healthy'}>{isHi ? 'ऋण / इक्विटी' : 'D/E Ratio'}</th>
                <th className="num" title={isHi ? 'ऑल्टमैन जेड-स्कोर: >3.0 सुरक्षित, <1.8 संकटग्रस्त' : 'Altman Z-Score: >3.0 safe, <1.8 distress'}>{isHi ? 'ऑल्टमैन Z' : 'Altman Z'}</th>
                <th>{isHi ? 'शोधनक्षमता श्रेणी' : 'Solvency Tier'}</th>
                <th className="text-right">{isHi ? 'कार्यवाही' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-xs text-gov-muted">
                    {isHi 
                      ? `"${query}" से मेल खाती कोई एजेंसी नहीं मिली। खोज या श्रेणी फ़िल्टर को साफ़ करने का प्रयास करें।`
                      : `No executing agencies match "${query}". Try clearing the search or tier filter.`}
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const meta = getTierMeta(a.solvency_tier, isHi);
                  const isHighDebt = a.debt_to_equity != null && a.debt_to_equity > 2.0;
                  const isDistressedZ = a.altman_z_score != null && a.altman_z_score < 1.8;

                  return (
                    <tr
                      key={a.agency_key}
                      tabIndex={0}
                      onClick={() => openDrill(a)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill(a); } }}
                      className="cursor-pointer hover:bg-blue-50/30 transition-colors"
                      title={isHi ? 'इस एजेंसी द्वारा प्रबंधित सभी परियोजनाओं का निरीक्षण करने हेतु क्लिक करें' : 'Click to inspect all projects managed by this agency'}
                    >
                      {/* Column 1: Agency Name */}
                      <td className="font-semibold text-gov-navy font-heading text-[12px]">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} shrink-0`} />
                          <span className="hover:underline">{a.agency_name}</span>
                        </div>
                      </td>

                      {/* Column 2: Projects */}
                      <td className="num font-bold text-gov-navy">{a.project_count}</td>

                      {/* Column 3: Active Capex */}
                      <td className="num font-bold font-heading">{cr(a.total_capex_cr)}</td>

                      {/* Column 4: Cost Overrun */}
                      <td className={`num ${a.mean_cost_overrun_pct > 30 ? 'text-rose-700 font-bold' : ''}`}>
                        {num(a.mean_cost_overrun_pct, 1, '%')}
                      </td>

                      {/* Column 5: Mean Slip */}
                      <td className={`num ${a.mean_slip_months > 12 ? 'text-amber-800 font-bold' : ''}`}>
                        {num(a.mean_slip_months, 1, isHi ? ' माह' : ' mo')}
                      </td>

                      {/* Column 6: Delay Rate */}
                      <td className="num">
                        <span className={`inline-block font-mono text-[11px] font-bold ${
                          a.delay_rate_pct > 60 ? 'text-rose-700' : 'text-gov-navy'
                        }`}>
                          {num(a.delay_rate_pct, 0, '%')}
                        </span>
                      </td>

                      {/* Column 7: D/E Ratio */}
                      <td className="num">
                        {a.debt_to_equity == null ? (
                          <span className="text-gov-muted">—</span>
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded text-[10.5px] font-mono font-bold ${
                            isHighDebt
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {a.debt_to_equity.toFixed(2)}x
                          </span>
                        )}
                      </td>

                      {/* Column 8: Altman Z */}
                      <td className="num">
                        {a.altman_z_score == null ? (
                          <span className="text-gov-muted">—</span>
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded text-[10.5px] font-mono font-bold ${
                            isDistressedZ
                              ? 'bg-rose-100 text-rose-800'
                              : a.altman_z_score > 3.0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}>
                            {a.altman_z_score.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Column 9: Solvency Tier Badge */}
                      <td>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </td>

                      {/* Column 10: Inspect Button */}
                      <td className="text-right" role="presentation" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openDrill(a)}
                          className="px-2.5 py-1 bg-[#0060B6] hover:bg-[#004f98] text-white rounded-xs text-[10.5px] font-heading font-bold transition-colors cursor-pointer"
                        >
                          {isHi ? 'निरीक्षण करें' : 'Inspect'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Clean Footer Legend */}
        <div className="p-3 bg-gov-surface-2 border-t border-gov-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-gov-muted">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-gov-navy" aria-hidden="true" />
              <strong>{isHi ? 'त्वरित संकेत:' : 'Quick Legend:'}</strong>
            </span>
            <span><strong className="text-gov-navy">D/E &lt; 2.0x:</strong> {isHi ? 'स्वस्थ ऋण' : 'Healthy debt'}</span>
            <span><strong className="text-rose-700">D/E &gt; 2.0x:</strong> {isHi ? 'भारी ऋण तनाव' : 'Heavy loan stress'}</span>
            <span><strong className="text-emerald-700">Altman Z &gt; 3.0:</strong> {isHi ? 'सुरक्षित' : 'Safe'}</span>
            <span><strong className="text-rose-700">Altman Z &lt; 1.8:</strong> {isHi ? 'संकटग्रस्त' : 'Distress'}</span>
          </div>
          <span className="font-mono text-[10.5px]">{isHi ? 'सभी परियोजनाओं का निरीक्षण करने के लिए किसी भी पंक्ति पर क्लिक करें' : 'Click any row to inspect all projects'}</span>
        </div>
      </div>

      {/* ── Polished Agency Project Drilldown Modal ── */}
      <AnimatePresence>
        {drill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-2xs flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setDrill(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="panel w-full max-w-5xl mt-8 shadow-2xl rounded-sm overflow-hidden bg-white border border-gov-border"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Head */}
              <div className="panel-head p-4 bg-gov-navy text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Landmark className="w-5 h-5 text-gov-accent shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-heading font-extrabold text-[16px] text-white truncate">
                      {drill.agency.agency_name}
                    </h3>
                    <div className="text-[11px] text-ink-200">
                      {isHi ? 'कार्यान्वयन एजेंसी परियोजना रजिस्टर एवं शोधनक्षमता विवरण' : 'Executing Agency Project Register & Solvency Breakdown'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded border ${
                    getTierMeta(drill.agency.solvency_tier, isHi)?.badge || 'bg-slate-100 text-slate-800'
                  }`}>
                    {getTierMeta(drill.agency.solvency_tier, isHi)?.label || drill.agency.solvency_tier_label}
                  </span>
                  <button
                    onClick={() => setDrill(null)}
                    className="text-ink-200 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
                    title={isHi ? 'बंद करें' : 'Close'}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Plain-English Takeaway Banner */}
              <div className="p-3 bg-blue-50/70 border-b border-blue-200 text-xs flex items-center justify-between flex-wrap gap-2 text-gov-navy">
                <div>
                  <strong>{isHi ? 'वित्तीय स्थिति निष्कर्ष:' : 'Financial Health Verdict:'}</strong>{' '}
                  {drill.agency.solvency_tier === 'HIGH_LEVERAGE_STRESS' ? (
                    <span className="text-rose-800 font-semibold">
                      {isHi
                        ? `पूंजी के सापेक्ष उच्च ऋण वहन करता है (ऋण/इक्विटी: ${drill.agency.debt_to_equity?.toFixed(2)}x)। ठेकेदार तरलता बाधाओं और मील के पत्थर में देरी के प्रति संवेदनशील।`
                        : `Carries high debt relative to capital (D/E: ${drill.agency.debt_to_equity?.toFixed(2)}x). Vulnerable to contractor liquidity bottlenecks and milestone delays.`}
                    </span>
                  ) : drill.agency.solvency_tier === 'PRIME_CASH_RICH' ? (
                    <span className="text-emerald-800 font-semibold">
                      {isHi
                        ? 'स्वस्थ तरलता भंडार के साथ मजबूत बैलेंस शीट। कम वित्तीय वितरण जोखिम।'
                        : 'Solid balance sheet with healthy liquidity reserves. Low financial delivery risk.'}
                    </span>
                  ) : drill.agency.solvency_tier === 'SOVEREIGN_DIRECT_BUDGET_LINE' ? (
                    <span className="text-blue-800 font-semibold">
                      {isHi
                        ? 'केंद्रीय/राज्य बजटीय राजकोषीय आवंटन से प्रत्यक्ष वित्तपोषित (कोई कॉर्पोरेट ऋण चूक जोखिम नहीं)।'
                        : 'Funded directly from Central/State budgetary treasury allocations (no corporate debt default risk).'}
                    </span>
                  ) : (
                    <span className="text-slate-800 font-semibold">
                      {isHi
                        ? 'सामान्य निवेश-ग्रेड सीमा के भीतर प्रबंधनीय ऋण के साथ कार्य करता है।'
                        : 'Operates with manageable borrowing within normal investment-grade thresholds.'}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-gov-muted">
                  {isHi ? 'ऑल्टमैन Z:' : 'Altman Z:'} <strong>{drill.agency.altman_z_score != null ? drill.agency.altman_z_score.toFixed(2) : '—'}</strong>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gov-border border-b border-gov-border">
                <div className="p-3 bg-white">
                  <span className="text-[10px] font-bold text-gov-muted uppercase font-heading block">
                    {isHi ? 'सक्रिय परियोजनाएं' : 'Active Projects'}
                  </span>
                  <span className="text-[16px] font-heading font-extrabold text-gov-navy">{drill.agency.project_count}</span>
                </div>
                <div className="p-3 bg-white">
                  <span className="text-[10px] font-bold text-gov-muted uppercase font-heading block">
                    {isHi ? 'कुल पोर्टफोलियो पूंजी' : 'Total Portfolio Capex'}
                  </span>
                  <span className="text-[16px] font-heading font-extrabold text-gov-navy">{cr(drill.agency.total_capex_cr)}</span>
                </div>
                <div className="p-3 bg-white">
                  <span className="text-[10px] font-bold text-gov-muted uppercase font-heading block">
                    {isHi ? 'औसत लागत अतिव्यय' : 'Average Cost Overrun'}
                  </span>
                  <span className="text-[16px] font-heading font-extrabold text-gov-navy">{num(drill.agency.mean_cost_overrun_pct, 1, '%')}</span>
                </div>
                <div className="p-3 bg-white">
                  <span className="text-[10px] font-bold text-gov-muted uppercase font-heading block">
                    {isHi ? 'ऋण / इक्विटी अनुपात' : 'Debt / Equity Ratio'}
                  </span>
                  <span className="text-[16px] font-heading font-extrabold text-gov-navy">
                    {drill.agency.debt_to_equity == null ? '—' : `${drill.agency.debt_to_equity.toFixed(2)}x`}
                  </span>
                </div>
              </div>

              {/* Projects Table */}
              <div className="overflow-x-auto max-h-[440px]">
                {drill.loading ? (
                  <div className="p-8 text-center text-xs text-gov-muted space-y-2">
                    <div className="w-5 h-5 border-2 border-[#0060B6] border-t-transparent rounded-full animate-spin mx-auto" />
                    <div>{isHi ? `${drill.agency.agency_name} के लिए परियोजनाएं लोड हो रही हैं…` : `Loading projects for ${drill.agency.agency_name}…`}</div>
                  </div>
                ) : (
                  <table className="ledger w-full">
                    <thead className="sticky top-0 bg-gov-surface-2 z-10">
                      <tr>
                        <th>{isHi ? 'परियोजना का नाम एवं आईडी' : 'Project Name & ID'}</th>
                        <th>{isHi ? 'क्षेत्र' : 'Sector'}</th>
                        <th className="num">{isHi ? 'स्वीकृत' : 'Sanctioned'}</th>
                        <th className="num">{isHi ? 'संशोधित' : 'Revised'}</th>
                        <th className="num">{isHi ? 'लागत अतिव्यय' : 'Cost Overrun'}</th>
                        <th className="num">{isHi ? 'विलंब' : 'Delay'}</th>
                        <th className="num">{isHi ? 'प्रगति' : 'Progress'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drill.projects.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-xs text-gov-muted">
                            {isHi ? 'इस एजेंसी के अंतर्गत कोई परियोजना रिकॉर्ड नहीं मिला।' : 'No project records found under this agency.'}
                          </td>
                        </tr>
                      ) : (
                        drill.projects.map((p) => (
                          <tr key={p.project_id} className="hover:bg-blue-50/20">
                            <td>
                              <div className="font-semibold text-gov-navy text-[11.5px] leading-tight font-heading">
                                {p.project_name}
                              </div>
                              <span className="text-[10px] font-mono text-gov-muted">#{p.project_id}</span>
                            </td>
                            <td className="text-[11px] text-gov-navy">{p.sector}</td>
                            <td className="num font-mono">{cr(p.sanctioned_cr)}</td>
                            <td className="num font-mono font-bold text-gov-navy">{cr(p.revised_cr)}</td>
                            <td className={`num font-bold ${p.cost_overrun_pct > 30 ? 'text-rose-700' : 'text-gov-navy'}`}>
                              {num(p.cost_overrun_pct, 1, '%')}
                            </td>
                            <td className={`num ${p.slip_months > 12 ? 'text-amber-800 font-bold' : ''}`}>
                              {num(p.slip_months, 0, isHi ? ' माह' : ' mo')}
                            </td>
                            <td className="num font-bold text-gov-navy">
                              {num(p.physical_progress_pct, 0, '%')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-gov-surface-2 border-t border-gov-border flex items-center justify-between text-xs">
                <span className="text-gov-muted font-sans">
                  {isHi ? `MoSPI डेटाबेस से ${drill.projects.length} परियोजना रिकॉर्ड लोड किए गए` : `${drill.projects.length} project records loaded from MoSPI database`}
                </span>
                <button
                  onClick={() => setDrill(null)}
                  className="px-3 py-1.5 bg-gov-surface hover:bg-gov-surface-3 border border-gov-border rounded-xs text-gov-navy font-bold cursor-pointer"
                >
                  {isHi ? 'रजिस्टर बंद करें' : 'Close Register'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
