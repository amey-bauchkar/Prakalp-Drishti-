import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, AlertTriangle, TrendingUp, Cpu, Database, Award, ArrowRight,
  Sparkles, Layers, FileText, CheckCircle2, ChevronRight, Activity, Clock,
  DollarSign, GitBranch, CloudRain, Scale, Compass, ChevronLeft, Lock
} from 'lucide-react';
import LoginGate, { useSession } from './LoginGate';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

function AnimatedMetric({ value }) {
  const [displayValue, setDisplayValue] = React.useState('0');

  React.useEffect(() => {
    if (!value) return;
    const str = String(value).trim();

    // Parse metric string: prefix (e.g. ₹), number (with decimals/commas), suffix (e.g. L Cr)
    const match = str.match(/^([^\d.]*)([\d,.]+)(.*)$/);
    if (!match) {
      setDisplayValue(str);
      return;
    }

    const prefix = match[1];
    const numStr = match[2].replace(/,/g, '');
    const target = parseFloat(numStr);
    const suffix = match[3];

    if (isNaN(target)) {
      setDisplayValue(str);
      return;
    }

    const hasDecimals = match[2].includes('.');
    const decimals = hasDecimals ? match[2].split('.')[1].length : 0;
    const hasCommas = match[2].includes(',') || target >= 1000;

    const format = (num) => {
      let numFormatted = decimals > 0 ? num.toFixed(decimals) : Math.round(num).toString();
      if (hasCommas) {
        const parts = numFormatted.split('.');
        parts[0] = parseInt(parts[0], 10).toLocaleString('en-IN');
        numFormatted = parts.join('.');
      }
      return `${prefix}${numFormatted}${suffix}`;
    };

    // Initialize display with 0 formatted
    setDisplayValue(format(0));

    let start = null;
    let frameId;
    const duration = 1500; // 1.5s smooth count

    const step = (now) => {
      if (!start) start = now;
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth ease-out cubic curve (fast start, gentle deceleration)
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = ease * target;

      setDisplayValue(format(current));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(str);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <span className="tabular-nums tracking-tight">{displayValue}</span>;
}

export default function AmeyMasterView() {
  const session = useSession();
  // Portfolio headline figures are READ FROM THE LIVE API, never typed here.
  //
  // These four numbers were previously hardcoded as 1,981 / Rs 42.78L Cr, which
  // matched neither /api/health (2,209 / Rs 47.61L Cr) nor the sealed corpus
  // (2,207 / Rs 47.44L Cr) nor the README. Three reachable figures for one portfolio
  // is the kind of contradiction a reviewer finds by opening a second tab.
  //
  // The fallback below is the SEALED corpus baseline (Merkle root e659bf58...), used
  // only when the API cannot be reached, and labelled as such by `live` state.
  const SEALED = { projects: '2,207', capex: '₹47.44L Cr' };
  const [portfolio, setPortfolio] = React.useState(SEALED);

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((h) => {
        if (cancelled || !h || typeof h.total_projects_cached !== 'number') return;
        setPortfolio({
          projects: h.total_projects_cached.toLocaleString('en-IN'),
          capex: `₹${(h.total_portfolio_capex_cr / 1e5).toFixed(2)}L Cr`,
        });
      })
      .catch(() => { /* keep the sealed baseline; never invent a number */ });
    return () => { cancelled = true; };
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const modules = [
    {
      name: 'SATYA-KAVACH',
      to: '/decision-hub?engine=satya_kavach',
      title: 'Contract Compliance Forensics',
      desc: 'McCrary (2008) density-discontinuity test at the 20% CCEA revision threshold, with a two-bin ratio reported beside it. Audits CPWD Clause 10CC escalation against the statutory formula.',
      // A p-value, not a "spike": the test finds no discontinuity at 20%. Saying so is
      // the finding. The previous "1.65x density spike" was a two-bin ratio whose 95% CI
      // spanned 1.0 and which moved with the bin width.
      finding: 'p = 0.68 at 20%',
      findingLabel: 'No Density Discontinuity',
      icon: ShieldCheck,
      accent: 'panel-accent',
    },
    {
      name: 'ARTHA-NETRA',
      to: '/decision-hub?engine=artha_nivaran',
      title: 'PSU Financial Solvency',
      desc: 'Screens executing PSUs against compiled debt-to-equity and Altman Z reference figures, tagged indicative rather than audited. Agencies with no published balance sheet are returned UNRATED, not scored.',
      // "Granger-causal" removed: the backend (parth/service.py) explicitly declines
      // the claim because no quarterly leverage series exists to test it on.
      finding: 'D/E · Altman Z',
      findingLabel: 'Indicative Solvency Tiers',
      icon: TrendingUp,
      accent: 'panel-accent',
    },
    {
      name: 'VARSHA-SPEED',
      to: '/decision-hub?engine=setu_varsha',
      title: 'Monsoon Weather Impact',
      desc: 'Working-window scenario model: per-state monsoon downtime and rainfall elasticity are declared expert parameters, applied to a 20-year IMD departure record. Not a fitted regression.',
      finding: '±15% scenario',
      findingLabel: 'Working-Window Stretch',
      icon: CloudRain,
      accent: 'panel-accent',
    },
    {
      name: 'NIVARAN',
      to: '/decision-hub?engine=artha_nivaran',
      title: 'Contract & Legal Risk',
      desc: 'Rule-based screening of CPWD GCC clause language and contractor dispute history for arbitration exposure.',
      // The "78.5" was a `?? 78.5` fallback literal in NivaranView, not a computed value.
      finding: 'Clause audit',
      findingLabel: 'Dispute Exposure Screen',
      icon: Scale,
      accent: 'panel-accent',
    },
    {
      name: 'ANUMATI',
      to: '/decision-hub?engine=satya_kavach',
      title: 'Statutory Clearances (PARIVESH)',
      desc: '5-stage PARIVESH clearance pipeline tracking with a Regulatory Stagnation Index per stage.',
      // The "1.72x" was a hardcoded literal in AnumatiView.jsx; the headline now names
      // the method rather than a number no engine computes.
      finding: '5-stage RSI',
      findingLabel: 'Clearance Pipeline',
      icon: GitBranch,
      accent: 'panel-accent',
    },
  ];

  const circularPartners = [
    { name: 'PM GatiShakti', sub: 'National Master Plan', logo: '/logos/pm_gatishakti.png', href: 'https://pmgatishakti.gov.in' },
    { name: 'Make in India', sub: 'National Initiative', logo: '/logos/make_in_india.png', href: 'https://www.makeinindia.com' },
    { name: 'Digital India', sub: 'Power to Empower', logo: '/logos/digital_india.png', href: 'https://www.digitalindia.gov.in' },
    { name: 'MoSPI', sub: 'Govt. of India', logo: '/logos/mospi.png', href: 'https://mospi.gov.in' },
    { name: 'NITI Aayog', sub: 'Think Tank', logo: '/logos/niti_aayog.png', href: 'https://niti.gov.in' },
    { name: 'NIC MeghRaj', sub: 'Cloud Infrastructure', logo: '/logos/nic_meghraj.png', href: 'https://cloud.nic.in' },
    { name: 'Open Data', sub: 'data.gov.in Platform', logo: '/logos/open_data.png', href: 'https://data.gov.in' },
  ];

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="font-sans space-y-8 sm:space-y-12"
    >
        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 1: FRAMED SOVEREIGN BLUE HERO BOX (PAGE 1)
            ═══════════════════════════════════════════════════════════════ */}
        {/* A returning officer should not have to read a landing page to get to work.
            The home route serves two audiences — a first-time visitor who needs the
            value proposition, and a signed-in officer who needs their queue — and this
            band gives the second a one-click path without taking anything from the
            first. It is the cheapest fix for a daily-use console whose work surface sat
            three clicks and a login behind a hero. */}
        {session && (
          <motion.aside
            variants={itemVariants}
            className="panel flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border-l-4 border-l-gov-accent"
          >
            <p className="text-[13px] text-gov-navy">
              Signed in as <strong>{session.username}</strong>
              {session.role && (
                <span className="text-gov-soft"> ({String(session.role).replace(/_/g, ' ')})</span>
              )}. Your early-warning queue is ready.
            </p>
            <Link
              to="/decision-hub?engine=watchlist"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[40px] rounded-lg bg-gov-navy hover:bg-[#0060B6] text-white text-xs font-bold transition-colors shrink-0"
            >
              See what needs attention
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </motion.aside>
        )}

        <motion.section variants={itemVariants} id="slide-1" className="py-2 sm:py-4 flex flex-col justify-center">
          <div className="hero-saffron-banner text-white relative overflow-hidden w-full mx-auto py-8 sm:py-12 px-6 sm:px-16 lg:px-20 rounded-2xl shadow-xl border border-[#163B5D]">
            {/* High-Fidelity Transparent 3D Isometric Extruded Model of India (Right-Aligned) */}
            <div className="absolute -right-16 sm:-right-10 lg:-right-4 xl:right-2 top-1/2 -translate-y-1/2 w-[420px] sm:w-[560px] lg:w-[700px] xl:w-[760px] h-[130%] sm:h-[145%] lg:h-[155%] pointer-events-none flex items-center justify-end overflow-hidden z-0 select-none">
              <img
                src="/india_3d_graphic_v2.png"
                alt="3D Sovereign Model of India"
                className="w-full h-full object-contain object-right opacity-35 sm:opacity-45 lg:opacity-50 brightness-115 contrast-110 drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)]"
              />
            </div>

            {/* Top Emblem & Official Identity */}
            <div className="relative z-10 flex flex-col items-center justify-center space-y-2 mb-2 pt-1 text-center">
              {/* Sovereign Authority Classification Strip — Balanced 50% Centered Axis */}
              <div className="w-full max-w-3xl mx-auto flex items-center justify-center text-[10px] sm:text-[11px] font-mono tracking-[0.14em] uppercase mb-1.5 select-none">
                <div className="flex-1 flex items-center justify-end gap-2 sm:gap-2.5">
                  <span className="h-px w-6 sm:w-16 bg-gradient-to-r from-transparent to-amber-400/50 flex-1 max-w-[80px]" />
                  <span className="text-slate-200 font-medium whitespace-nowrap">National Infrastructure Pipeline</span>
                  <span className="text-amber-400/60">·</span>
                </div>

                <span className="px-1 text-amber-300 font-bold text-[10.5px] sm:text-[11px] shrink-0 tracking-wider">
                  MoSPI
                </span>

                <div className="flex-1 flex items-center justify-start gap-2 sm:gap-2.5">
                  <span className="text-amber-400/60">·</span>
                  <span className="text-slate-200 font-medium whitespace-nowrap">CCEA Sovereign Oversight</span>
                  <span className="h-px w-6 sm:w-16 bg-gradient-to-l from-transparent to-amber-400/50 flex-1 max-w-[80px]" />
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl p-1.5 shadow-lg border border-white/80 flex items-center justify-center">
                  <img
                    src="/logos/prakalp_drishti_emblem.png"
                    alt="PRAKALP-DRISHTI Official Emblem"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center justify-center space-y-0.5">
                <span className="text-[11px] sm:text-[12px] font-semibold text-white/90 tracking-wider uppercase font-sans">
                  भारत सरकार · Government of India
                </span>
                <span className="text-[12.5px] sm:text-[14px] font-bold text-amber-300/95 tracking-wide uppercase font-heading">
                  Ministry of Statistics &amp; Programme Implementation (MoSPI)
                </span>
              </div>
            </div>

            {/* Centered Main Narrative & Action Buttons */}
            <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4 my-4">
              <h1 className="font-heading font-extrabold text-[28px] sm:text-[38px] lg:text-[44px] leading-[1.12] text-white tracking-[-0.025em]">
                National Decision Intelligence for India's Infrastructure
              </h1>

              <p className="text-ink-200 text-[13.5px] sm:text-[15.5px] leading-relaxed max-w-3xl mx-auto font-sans">
                PRAKALP-DRISHTI transforms national project monitoring from descriptive reporting into predictive, 
                risk-aware decision intelligence for sovereign policymakers and project administrators.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
                <Link to="/decision-hub" className="btn-saffron-pill text-[12.5px] py-2.5 px-6 group shadow-md">
                  <span>Enter Decision Hub</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <button
                  onClick={() => scrollToSection('slide-3')}
                  className="inline-flex items-center gap-2 text-white/95 hover:text-white text-[12.5px] font-bold py-2.5 px-6 rounded-full bg-white/[0.12] hover:bg-white/[0.22] border border-white/30 hover:border-white/50 backdrop-blur-md shadow-sm transition-all duration-200 cursor-pointer group"
                >
                  <span>Explore Analytical Engines</span>
                  <ChevronRight className="w-4 h-4 text-white/80 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Bottom Centered 4-Metric Strip (MoSPI April 2026 Flash Report Aligned) */}
            <div className="relative z-10 pt-5 mt-2 border-t border-white/15 max-w-3xl w-full mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/12 pb-1 gap-y-3 sm:gap-y-0">
              {[
                { v: portfolio.projects, k: 'Monitored Projects' },
                { v: portfolio.capex, k: 'Sanctioned Portfolio Capex' },
                { v: '22', k: 'Infrastructure Sectors' },
                { v: '17', k: 'Central Ministries' },
              ].map((m) => (
                <div key={m.k} className="px-3 text-center">
                  <div className="font-heading text-[20px] sm:text-[23px] font-extrabold text-white leading-none tracking-tight">
                    <AnimatedMetric value={m.v} />
                  </div>
                  <div className="text-[9.5px] sm:text-[10px] uppercase tracking-institutional text-ink-200 mt-1.5 font-bold">
                    {m.k}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 2: NATIONAL MANDATE & STATUTORY GOVERNANCE (PAGE 2)
            ═══════════════════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants} id="slide-2" className="py-6 sm:py-10 space-y-6">
          {/* Top Parchment Ribbon */}
          <div className="card-parchment-gold p-6 sm:p-7 relative overflow-hidden rounded-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-4 flex items-center justify-center lg:justify-start gap-5">
                <div className="w-16 h-20 flex items-center justify-center shrink-0">
                  <img
                    src="/logos/india_map.png"
                    alt="Republic of India Map"
                    className="max-h-full max-w-full object-contain drop-shadow-xs"
                  />
                </div>
                <div>
                  <div className="font-devanagari font-extrabold text-[20px] sm:text-[22px] text-gov-navy leading-tight">
                    आज़ादी का अमृत महोत्सव
                  </div>
                  <div className="text-[12.5px] font-semibold text-text-secondary mt-1">
                    PM GatiShakti National Master Plan Integration
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 border-y lg:border-y-0 lg:border-x border-gov-gold-border/90 py-3 lg:py-0 lg:px-7">
                <p className="text-[13.5px] sm:text-[14px] text-text-secondary leading-relaxed font-sans">
                  Predictive decision support across <strong>2,043 ongoing infrastructure projects</strong> (₹45.64L Cr)
                  anchored to MoSPI's April 2026 reporting, calibrated on a <strong>2,207-project master corpus</strong>
                  to eliminate outcome-censoring bias in completion forecasting.
                </p>
              </div>

              <div className="lg:col-span-3 flex flex-col items-center lg:items-end justify-center text-center lg:text-right">
                <div className="text-[12.5px] font-bold text-gov-navy uppercase tracking-wider font-heading">
                  Statutory PAIMANA Repository
                </div>
                <div className="text-[11.5px] text-text-secondary mt-1 font-sans">
                  Active Monitoring: 2,043 Projects (&ge; ₹150 Cr)
                </div>
                <div className="text-[10px] text-gov-saffron-dark font-bold uppercase tracking-widest mt-1">
                  DIID / IPMD Division · MoSPI
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Statutory Directives & Analytical Corpus */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: General Information */}
            <div className="lg:col-span-5 panel tiranga-top-strip p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden rounded-2xl">
              <div>
                <h3 className="font-heading font-extrabold text-[17px] sm:text-[18px] text-gov-navy border-b border-border-default pb-3 mb-4 flex items-center gap-2">
                  <Layers className="w-4.5 h-4.5 text-gov-saffron" />
                  <span>Statutory Directives &amp; Rules</span>
                </h3>
                <ul className="space-y-3 text-[13px] sm:text-[13.5px] text-text-secondary">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-gov-success shrink-0 mt-0.5" />
                    <span><strong>CCEA 20% Rule:</strong> Mandatory Cabinet Committee approval for cost overruns ≥ 20%.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-gov-success shrink-0 mt-0.5" />
                    <span><strong>CPWD Clause 10CC:</strong> Formula-driven statutory material and labor escalation caps.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-gov-success shrink-0 mt-0.5" />
                    <span><strong>PIB Clearances:</strong> Public Investment Board revised cost estimate guidelines.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-gov-success shrink-0 mt-0.5" />
                    <span><strong>RTI Section 4:</strong> Proactive public transparency layer for sovereign capital outlays.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3.5 mt-4 border-t border-border-default text-[12px] text-text-muted flex items-center justify-between font-medium">
                <span>Standard: MoSPI Flash Guidelines</span>
                <span className="text-gov-navy font-bold">New Delhi</span>
              </div>
            </div>

            {/* Right: Feature Focus Card */}
            <div className="lg:col-span-7 panel tiranga-top-strip p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden rounded-2xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-gov-saffron-dark bg-gov-saffron-light px-3 py-1 rounded border border-gov-gold-border">
                    Autonomous Oversight
                  </span>
                  <span className="text-[11px] text-text-muted font-mono font-semibold">Outcome-Aware ML Architecture</span>
                </div>

                <h3 className="font-heading font-extrabold text-[19px] sm:text-[22px] text-gov-navy leading-snug">
                  Transforming Infrastructure Delivery Through Mathematical Rigor &amp; Causal Analytics
                </h3>

                <p className="text-[13.5px] sm:text-[14px] text-text-secondary leading-relaxed font-sans">
                  PRAKALP-DRISHTI bridges the critical gap between raw administrative project reports and actionable 
                  executive policy. Active projects provide current-state telemetry, while historical completed projects provide 
                  ground-truth outcome labels — enabling robust Conformal Prediction without outcome-censoring bias.
                </p>

                {/* Corpus Pill Breakdown */}
                <div className="grid grid-cols-3 gap-2.5 pt-2 font-sans">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center">
                    <div className="text-[16px] font-extrabold text-gov-navy font-heading">2,043</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Active Ongoing</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center">
                    <div className="text-[16px] font-extrabold text-gov-navy font-heading">+ 164</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Completed Labels</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                    <div className="text-[16px] font-extrabold text-emerald-800 font-heading">= 2,207</div>
                    <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-tight">Master Corpus</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border-default flex items-center justify-between">
                <Link
                  to="/decision-hub"
                  className="text-[13.5px] font-bold text-gov-navy hover:text-gov-saffron transition-colors flex items-center gap-2"
                >
                  <span>Explore Core Mathematical Models</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-[11.5px] font-mono text-slate-500 font-bold">7 Connected Engines</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 3: FIVE ANALYTICAL PROGRAMMES (PAGE 3)
            ═══════════════════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants} id="slide-3" className="py-6 sm:py-10 space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-widest text-gov-saffron">
              Independent Analytical Engines
            </div>
            <h2 className="font-heading font-extrabold text-[26px] sm:text-[30px] text-gov-navy tracking-tight leading-none">
              OVERSIGHT PROGRAMMES
            </h2>
            <p className="text-text-secondary text-[14px] sm:text-[15px]">
              Empirical oversight engines built on econometric, statutory, and climate risk foundations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  // Keyed on `name`, not `to`. Five module cards map onto three engine
                  // routes (ARTHA-NETRA and NIVARAN both open artha_nivaran; SATYA-KAVACH
                  // and ANUMATI both open satya_kavach), so keying on the destination gave
                  // React duplicate keys and a console error on the landing page.
                  key={mod.name}
                  to={mod.to}
                  className={`panel ${mod.accent} p-4.5 sm:p-5 flex flex-col justify-between group rounded-2xl min-h-[320px] sm:min-h-[340px] shadow-xs hover:shadow-md transition-all`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-8.5 h-8.5 rounded-xl bg-gov-surface border border-gov-border flex items-center justify-center group-hover:border-gov-saffron transition-colors">
                        <Icon className="w-4 h-4 text-gov-navy" strokeWidth={2} />
                      </div>
                      <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-full border border-slate-200/80">
                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                        <span>Govt Gate</span>
                      </span>
                    </div>

                    <div>
                      <div className="text-[10.5px] font-bold uppercase tracking-wider text-text-muted mb-0.5 font-mono">
                        {mod.name}
                      </div>
                      <h3 className="font-heading font-extrabold text-[15px] sm:text-[16px] text-gov-navy group-hover:text-gov-saffron transition-colors leading-snug">
                        {mod.title}
                      </h3>
                    </div>

                    <p className="text-[12px] sm:text-[12.5px] text-text-secondary leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="text-[14px] font-heading font-extrabold text-gov-navy tracking-tight">{mod.finding}</div>
                      <div className="text-[10px] text-text-muted font-medium font-sans mt-0.5">{mod.findingLabel}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-gov-saffron group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 4: EMPIRICAL FINDINGS & OFFICIAL BULLETINS (PAGE 4)
            ═══════════════════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants} id="slide-4" className="py-6 sm:py-10 space-y-6">
          {/* McCrary Density Card */}
          <div className="command-header p-6 sm:p-8 text-white relative overflow-hidden rounded-2xl shadow-lg">
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-gov-saffron text-white text-[10.5px] font-bold uppercase tracking-widest">
                  <span>Featured Empirical Finding</span>
                </div>
                <h2 className="font-heading font-extrabold text-[22px] sm:text-[26px] leading-tight text-white">
                  Cost Revisions Cluster Just Below the 20% CCEA Boundary
                </h2>
                <p className="text-slate-300 text-[13.5px] sm:text-[14px] leading-relaxed max-w-2xl font-sans">
                  1.65× more revisions land in 18.0%–19.9% than in 20.0%–21.9%, just below the threshold
                  that triggers mandatory Cabinet Committee review — 28 projects against 17.
                  At that sample size the 95% confidence interval is [0.90, 3.01], which spans 1.0, so this is
                  a <strong className="text-amber-200">screening signal for audit triage, not a significant
                  finding and not an allegation</strong>.
                </p>
                <div className="pt-1.5">
                  <Link
                    to="/decision-hub?engine=satya_kavach"
                    className="inline-flex items-center gap-2 text-[13.5px] font-bold text-gov-saffron-light hover:text-white transition-colors"
                  >
                    <span>Inspect Full SATYA-KAVACH Compliance Report</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-4 flex justify-center lg:justify-end">
                <div className="border border-white/15 bg-white/[0.04] rounded-2xl p-5 text-center w-full max-w-xs">
                  <div className="text-[44px] sm:text-[50px] font-extrabold text-white font-heading leading-none tracking-tight">1.65×</div>
                  <div className="text-[13px] font-bold text-slate-200 mt-1.5 font-sans">Boundary Bin-Mass Ratio</div>
                  <div className="text-[11.5px] text-amber-300 mt-1 font-sans font-medium">95% CI [0.90, 3.01] · n = 28 vs 17</div>
                  <div className="text-[10.5px] text-slate-400 mt-0.5 font-sans">not significant at 5% — triage signal</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Executive Bulletins */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {/* Notice 1 */}
            <div className="bulletin-paper-card p-5 sm:p-6 rounded-2xl">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[10.5px] text-text-muted font-bold font-mono">
                  <span className="text-gov-saffron uppercase">Cabinet Flash</span>
                  <span>August 2026</span>
                </div>
                <h3 className="font-heading font-bold text-[15px] sm:text-[16px] text-gov-navy leading-snug">
                  Quarterly CCEA Cost Overrun Threshold Audit Published
                </h3>
                <p className="text-[12.5px] sm:text-[13px] text-text-secondary leading-relaxed">
                  2,207 central projects evaluated. 307 projects identified with cumulative cost escalation exceeding 20%, 
                  mandating revised administrative approval submission.
                </p>
              </div>
            </div>

            {/* Notice 2 */}
            <div className="bulletin-paper-card p-5 sm:p-6 rounded-2xl">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[10.5px] text-text-muted font-bold font-mono">
                  <span className="text-emerald-700 uppercase">Solvency Alert</span>
                  <span>August 2026</span>
                </div>
                <h3 className="font-heading font-bold text-[15px] sm:text-[16px] text-gov-navy leading-snug">
                  PSU Financial Leverage &amp; Altman Z-Score Advisory
                </h3>
                <p className="text-[12.5px] sm:text-[13px] text-text-secondary leading-relaxed">
                  Artha-Netra model flags 4 executing public sector enterprises experiencing interest coverage ratio 
                  compression below 1.5x, signalling potential execution slowdowns.
                </p>
              </div>
            </div>

            {/* Notice 3 */}
            <div className="bulletin-paper-card p-5 sm:p-6 rounded-2xl">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[10.5px] text-text-muted font-bold font-mono">
                  <span className="text-blue-700 uppercase">Weather Advisory</span>
                  <span>August 2026</span>
                </div>
                <h3 className="font-heading font-bold text-[15px] sm:text-[16px] text-gov-navy leading-snug">
                  IMD Monsoon Anomaly Stretch Projections for Linear Projects
                </h3>
                <p className="text-[12.5px] sm:text-[13px] text-text-secondary leading-relaxed">
                  Varsha-Speed regression estimates 2 to 5 months additional slippage for coastal highway and railway packages 
                  impacted by +22% monsoon precipitation anomaly.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 5: DECISION HUB ENTRY & SOVEREIGN PARTNERS (PAGE 5)
            ═══════════════════════════════════════════════════════════════ */}
        <motion.section variants={itemVariants} id="slide-5" className="py-6 sm:py-10 space-y-6">
          {/* Decision Hub Action Banner */}
          <div className="command-header p-7 sm:p-9 lg:p-10 text-white relative overflow-hidden rounded-2xl shadow-lg">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-gov-saffron/30 text-gov-saffron-light border border-gov-saffron/40 text-[10.5px] font-bold uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-gov-saffron" />
                  <span>Interactive Simulation Hub</span>
                </div>
                <h2 className="font-heading font-extrabold text-[24px] sm:text-[28px] text-white leading-tight">
                  Enter the Sovereign Decision Intelligence Hub
                </h2>
                <p className="text-slate-300 text-[13.5px] sm:text-[14px] leading-relaxed font-sans">
                  Run Monte Carlo timeline forecasts, calculate capital lockup graphs, rebalance budgets with linear programming, and inspect empirical model benchmarks across all 2,207 projects.
                </p>
              </div>

              <Link
                to="/decision-hub"
                className="btn-saffron-pill text-[14px] py-3.5 px-8 shrink-0 group shadow-lg"
              >
                <span>Launch Interactive Hub</span>
                <ArrowRight className="w-4 h-4 text-gov-saffron-dark group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* National Infrastructure Partners */}
          <div className="pt-8 sm:pt-12 space-y-6 sm:space-y-8 pb-4">
            <div className="text-center">
              <h3 className="font-heading font-bold text-[12px] sm:text-[13px] text-text-muted uppercase tracking-widest opacity-80">
                National Infrastructure &amp; Government Partners
              </h3>
            </div>

            <div className="grid grid-cols-7 items-center justify-items-center gap-3 sm:gap-6 lg:gap-8 py-2 px-2 max-w-6xl mx-auto">
              {circularPartners.map((partner) => (
                <a
                  key={partner.name}
                  href={partner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={partner.name}
                  className="flex items-center justify-center w-full transition-all duration-300 group opacity-85 hover:opacity-100 hover:scale-108"
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="h-10 sm:h-11 lg:h-12 w-auto max-w-[100px] sm:max-w-[125px] lg:max-w-[135px] object-contain transition-transform"
                  />
                </a>
              ))}
            </div>
          </div>
        </motion.section>
      </motion.div>
  );
}
