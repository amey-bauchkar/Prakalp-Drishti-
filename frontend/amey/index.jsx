import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, AlertTriangle, TrendingUp, Cpu, Database, Award, ArrowRight,
  Sparkles, Layers, FileText, CheckCircle2, ChevronRight, Activity, Clock,
  DollarSign, GitBranch, CloudRain, Scale, Compass, ChevronLeft, Lock
} from 'lucide-react';
import LoginGate from './LoginGate';

export default function AmeyMasterView() {
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
      desc: 'McCrary density test detecting artificial cost clustering at the 20% CCEA boundary. Enforces CPWD Clause 10CC statutory escalation caps.',
      finding: '1.65× density spike',
      findingLabel: 'CCEA Threshold Discontinuity',
      icon: ShieldCheck,
      accent: 'panel-accent',
    },
    {
      name: 'ARTHA-NETRA',
      to: '/decision-hub?engine=artha_nivaran',
      title: 'PSU Financial Solvency',
      desc: 'Correlates executing PSU debt leverage ratios, Altman Z-scores, and equity market drawdowns to predict contractor distress 4–6 quarters ahead.',
      finding: 'Granger-causal',
      findingLabel: 'Equity-Delay Coupling',
      icon: TrendingUp,
      accent: 'panel-accent',
    },
    {
      name: 'VARSHA-SPEED',
      to: '/decision-hub?engine=setu_varsha',
      title: 'Monsoon Weather Impact',
      desc: 'IMD rainfall anomaly regression model estimating construction slowdown across 36 states. 20-year historical profiling with scenario simulation.',
      finding: '±15% anomaly',
      findingLabel: 'Predicts 2–8 Month Delays',
      icon: CloudRain,
      accent: 'panel-accent',
    },
    {
      name: 'NIVARAN',
      to: '/decision-hub?engine=artha_nivaran',
      title: 'Contract & Legal Risk',
      desc: 'NLP scrutiny of CPWD GCC clauses, contractor litigation track records, and predictive arbitration modeling to preempt contractor site abandonment.',
      finding: '78.5 Exposure',
      findingLabel: 'Litigation Index',
      icon: Scale,
      accent: 'panel-accent',
    },
    {
      name: 'ANUMATI',
      to: '/decision-hub?engine=satya_kavach',
      title: 'Statutory Clearances (PARIVESH)',
      desc: '5-stage clearance pipeline tracking, Regulatory Stagnation Index (RSI), and central-state paperwork loopback anomaly detection.',
      finding: '1.72× RSI',
      findingLabel: 'Regulatory Stagnation',
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
    <div className="font-sans space-y-8 sm:space-y-12">
        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 1: FRAMED SOVEREIGN BLUE HERO BOX (PAGE 1)
            ═══════════════════════════════════════════════════════════════ */}
        <section id="slide-1" className="py-2 sm:py-4 flex flex-col justify-center">
          <div className="hero-saffron-banner text-white relative overflow-hidden w-full mx-auto py-8 sm:py-12 px-6 sm:px-16 lg:px-20 rounded-2xl shadow-xl border border-[#163B5D]">
            {/* High-Fidelity Transparent 3D Isometric Extruded Model of India (Right-Aligned) */}
            <div className="absolute -right-16 sm:-right-10 lg:-right-4 xl:right-2 top-1/2 -translate-y-1/2 w-[420px] sm:w-[560px] lg:w-[700px] xl:w-[760px] h-[130%] sm:h-[145%] lg:h-[155%] pointer-events-none flex items-center justify-end overflow-hidden z-0 select-none">
              <img
                src="/india_3d_graphic_v2.png"
                alt="3D Sovereign Model of India"
                className="w-full h-full object-contain object-right opacity-35 sm:opacity-45 lg:opacity-50 brightness-115 contrast-110 drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)]"
              />
            </div>

            {/* Top Emblem & Sovereign Institutional Masthead */}
            <div className="relative z-10 text-center space-y-3 pt-1">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 sm:w-18 sm:h-18 bg-white rounded-2xl p-1.5 shadow-lg border border-white/80 flex items-center justify-center">
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
              <h1 className="font-heading font-extrabold text-[28px] sm:text-[36px] lg:text-[42px] leading-[1.12] text-white tracking-[-0.025em]">
                National Decision Intelligence for India's 2,207 Mega-Projects
              </h1>

              <p className="text-ink-200 text-[13.5px] sm:text-[15px] leading-relaxed max-w-3xl mx-auto font-sans">
                Real-time oversight platform monitoring ₹31.4 Lakh Crore in sovereign capital investments. 
                Equipped with mathematical de-biasing, financial stress testing, and delay contagion modeling.
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

            {/* Bottom Centered Metric Strip */}
            <div className="relative z-10 pt-5 mt-2 border-t border-white/15 max-w-2xl w-full mx-auto grid grid-cols-3 divide-x divide-white/12 pb-1">
              {[
                { v: '2,207', k: 'Central Sector Works' },
                { v: '₹41.8L Cr', k: 'Revised Capital Outlay' },
                { v: '22 Sectors', k: 'Union Line Ministries' },
              ].map((m) => (
                <div key={m.k} className="px-4 text-center">
                  <div className="font-heading text-[22px] sm:text-[25px] font-extrabold text-white leading-none tracking-tight">
                    {m.v}
                  </div>
                  <div className="text-[9.5px] sm:text-[10.5px] uppercase tracking-institutional text-ink-200 mt-1.5 font-bold">
                    {m.k}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 2: NATIONAL MANDATE & STATUTORY GOVERNANCE (PAGE 2)
            ═══════════════════════════════════════════════════════════════ */}
        <section id="slide-2" className="py-6 sm:py-10 space-y-6">
          {/* Top Parchment Ribbon */}
          <div className="card-parchment-gold p-6 sm:p-7 relative overflow-hidden rounded-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-4 flex items-center justify-center lg:justify-start gap-5">
                <div className="w-16 h-20 flex items-center justify-center shrink-0">
                  <img
                    src="/logos/india_map.png"
                    alt="Republic of India Map"
                    className="max-h-full max-w-full object-contain mix-blend-multiply"
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
                  Empirical oversight across all 2,207 central sector infrastructure projects. 
                  Automated statutory auditing prevents budget inflation, enforces 80% Right-of-Way pre-requisites, 
                  and establishes transparent accountability across union ministries.
                </p>
              </div>

              <div className="lg:col-span-3 flex flex-col items-center lg:items-end justify-center text-center lg:text-right">
                <div className="text-[12.5px] font-bold text-gov-navy uppercase tracking-wider font-heading">
                  Statutory PAIMANA Repository
                </div>
                <div className="text-[11.5px] text-text-secondary mt-1 font-sans">
                  Central Sector Projects (&ge; ₹150 Cr) · 2005–2026
                </div>
                <div className="text-[10px] text-gov-saffron-dark font-bold uppercase tracking-widest mt-1">
                  DIID / IPMD Division · MoSPI
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Statutory Directives */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: General Information */}
            <div className="lg:col-span-5 panel p-6 sm:p-7 flex flex-col justify-between rounded-2xl">
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
                    <span><strong>Pre-Sanction RoW:</strong> Minimum 80% Right-of-Way acquisition prior to project sanction.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3.5 mt-4 border-t border-border-default text-[12px] text-text-muted flex items-center justify-between font-medium">
                <span>Standard: MoSPI Flash Guidelines</span>
                <span className="text-gov-navy font-bold">New Delhi</span>
              </div>
            </div>

            {/* Right: Feature Focus Card */}
            <div className="lg:col-span-7 panel p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden rounded-2xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-gov-saffron-dark bg-gov-saffron-light px-3 py-1 rounded border border-gov-gold-border">
                    Autonomous Oversight
                  </span>
                  <span className="text-[11px] text-text-muted font-mono font-semibold">Air-Gapped Sovereign Engine</span>
                </div>

                <h3 className="font-heading font-extrabold text-[19px] sm:text-[22px] text-gov-navy leading-snug">
                  Transforming Infrastructure Delivery Through Mathematical Rigor &amp; Causal Analytics
                </h3>

                <p className="text-[13.5px] sm:text-[14px] text-text-secondary leading-relaxed font-sans">
                  PRAKALP-DRISHTI bridges the critical gap between raw administrative project reports and actionable 
                  executive policy. By continuously auditing financial distress, weather risk, and structural dependencies, 
                  it delivers early-warning lead time 106 months ahead of project completion.
                </p>
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
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 3: FIVE ANALYTICAL PROGRAMMES (PAGE 3)
            ═══════════════════════════════════════════════════════════════ */}
        <section id="slide-3" className="py-6 sm:py-10 space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-widest text-gov-saffron">
              Independent Analytical Engines
            </div>
            <h2 className="font-cinzel text-[26px] sm:text-[30px] font-bold text-gov-navy tracking-tight leading-none">
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
                  key={mod.to}
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
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 4: EMPIRICAL FINDINGS & OFFICIAL BULLETINS (PAGE 4)
            ═══════════════════════════════════════════════════════════════ */}
        <section id="slide-4" className="py-6 sm:py-10 space-y-6">
          {/* McCrary Density Card */}
          <div className="command-header p-6 sm:p-8 text-white relative overflow-hidden rounded-2xl shadow-lg">
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-gov-saffron text-white text-[10.5px] font-bold uppercase tracking-widest">
                  <span>Featured Empirical Finding</span>
                </div>
                <h2 className="font-heading font-extrabold text-[22px] sm:text-[26px] leading-tight text-white">
                  Statistically Significant Bunching Detected at the 20% CCEA Boundary
                </h2>
                <p className="text-slate-300 text-[13.5px] sm:text-[14px] leading-relaxed max-w-2xl font-sans">
                  The McCrary density discontinuity test reveals a 1.65× artificial concentration in cost revisions 
                  at 18.0%–19.9%, just below the threshold that triggers mandatory Cabinet Committee review. 
                  28 mega-projects with ₹95,217 Crore in capital exposure exhibit this avoidance signal.
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
                  <div className="text-[13px] font-bold text-slate-200 mt-1.5 font-sans">McCrary Discontinuity Ratio</div>
                  <div className="text-[11.5px] text-amber-300 mt-1 font-sans font-medium">p &lt; 0.001 · Statistically Significant</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Executive Bulletins */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {/* Notice 1 */}
            <div className="bulletin-paper-card p-5 sm:p-6 flex flex-col justify-between rounded-2xl min-h-[190px]">
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
              <div className="pt-3 mt-3 border-t border-slate-100 text-[12.5px] font-bold text-gov-navy hover:text-gov-saffron cursor-pointer flex items-center gap-1">
                <span>Read Dispatch</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Notice 2 */}
            <div className="bulletin-paper-card p-5 sm:p-6 flex flex-col justify-between rounded-2xl min-h-[190px]">
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
              <div className="pt-3 mt-3 border-t border-slate-100 text-[12.5px] font-bold text-gov-navy hover:text-gov-saffron cursor-pointer flex items-center gap-1">
                <span>Read Dispatch</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Notice 3 */}
            <div className="bulletin-paper-card p-5 sm:p-6 flex flex-col justify-between rounded-2xl min-h-[190px]">
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
              <div className="pt-3 mt-3 border-t border-slate-100 text-[12.5px] font-bold text-gov-navy hover:text-gov-saffron cursor-pointer flex items-center gap-1">
                <span>Read Dispatch</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 5: DECISION HUB ENTRY & SOVEREIGN PARTNERS (PAGE 5)
            ═══════════════════════════════════════════════════════════════ */}
        <section id="slide-5" className="py-6 sm:py-10 space-y-6">
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
        </section>
      </div>
  );
}
