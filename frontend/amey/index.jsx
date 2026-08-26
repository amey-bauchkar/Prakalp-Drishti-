import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, AlertTriangle, TrendingUp, Cpu, Database, Award, ArrowRight,
  Sparkles, Layers, FileText, CheckCircle2, ChevronRight, Activity, Clock,
  DollarSign, GitBranch, CloudRain, Scale, Compass, ChevronLeft
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
      to: '/tanmay',
      title: 'Contract Compliance Forensics',
      desc: 'McCrary density test detecting artificial cost clustering at the 20% CCEA boundary. Enforces CPWD Clause 10CC statutory escalation caps.',
      finding: '1.65× density spike',
      findingLabel: 'CCEA Threshold Discontinuity',
      icon: ShieldCheck,
      accent: 'panel-accent',
    },
    {
      name: 'ARTHA-NETRA',
      to: '/parth',
      title: 'PSU Financial Solvency',
      desc: 'Correlates executing PSU debt leverage ratios, Altman Z-scores, and equity market drawdowns to predict contractor distress 4–6 quarters ahead.',
      finding: 'Granger-causal',
      findingLabel: 'Equity-Delay Coupling',
      icon: TrendingUp,
      accent: 'panel-authority',
    },
    {
      name: 'VARSHA-SPEED',
      to: '/janhavi',
      title: 'Monsoon Weather Impact',
      desc: 'IMD rainfall anomaly regression model estimating construction slowdown across 36 states. 20-year historical profiling with scenario simulation.',
      finding: '±15% anomaly',
      findingLabel: 'Predicts 2–8 Month Delays',
      icon: CloudRain,
      accent: 'panel-accent',
    },
    {
      name: 'DPR-SCORER',
      to: '/soham',
      title: 'Proposal Quality Forensics',
      desc: 'Audits project approval timestamps against national & state election cycles to detect rushed foundation approvals lacking 80% Right-of-Way acquisition.',
      finding: '23% of portfolio',
      findingLabel: 'Pre-Election Rush Approvals',
      icon: FileText,
      accent: 'panel-accent',
    },
  ];

  const circularPartners = [
    { name: 'PM GatiShakti', sub: 'National Master Plan', symbol: 'NMP' },
    { name: 'Make in India', sub: 'National Initiative', symbol: 'MII' },
    { name: 'Digital India', sub: 'Power to Empower', symbol: 'DI' },
    { name: 'MoSPI', sub: 'Govt. of India', symbol: 'MoSPI' },
    { name: 'NITI Aayog', sub: 'Think Tank', symbol: 'NITI' },
    { name: 'NIC MeghRaj', sub: 'Cloud Infrastructure', symbol: 'NIC' },
    { name: 'Open Data', sub: 'data.gov.in', symbol: 'OGD' },
  ];

  return (
    <LoginGate>
      <div className="font-sans snap-slide-container space-y-16 lg:space-y-24 pb-24">
        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 1: CENTERED SAFFRON LANDING SECTION
            ═══════════════════════════════════════════════════════════════ */}
        <section id="slide-1" className="snap-slide-section flex flex-col justify-center">
          <div className="hero-saffron-banner text-white relative overflow-hidden py-12 px-6 sm:px-12 lg:px-16">
            {/* Subtle India Gate Vector Silhouette Watermark */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 top-0 w-3/4 max-w-2xl pointer-events-none opacity-10 flex items-end justify-center">
              <svg viewBox="0 0 500 400" className="w-full h-full fill-current text-white">
                <path d="M100,380 L100,180 L140,160 L140,120 L360,120 L360,160 L400,180 L400,380 L320,380 L320,240 C320,200 180,200 180,240 L180,380 Z" />
              </svg>
            </div>

            {/* Centered Main Narrative */}
            <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
              <div className="inline-flex items-center gap-2.5 bg-white/[0.06] pl-2.5 pr-3.5 py-1 rounded-sm text-[10px] font-extrabold tracking-institutional uppercase text-gov-accent border-l-2 border-gov-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ministry of Statistics &amp; Programme Implementation</span>
              </div>

              <h1 className="font-heading font-extrabold text-[30px] sm:text-[40px] lg:text-[46px] leading-[1.08] text-white tracking-[-0.03em]">
                National Decision Intelligence for India's 2,207 Mega-Projects
              </h1>

              <p className="text-ink-200 text-[14px] sm:text-[15px] leading-relaxed max-w-2xl mx-auto font-sans">
                Real-time oversight platform monitoring ₹31.4 Lakh Crore in sovereign capital investments. 
                Equipped with mathematical de-biasing, financial stress testing, and delay contagion modeling.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link to="/decision-hub" className="btn-saffron-pill text-[12px] py-2.5 px-6 group">
                  <span>Enter Decision Hub</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <button
                  onClick={() => scrollToSection('slide-3')}
                  className="inline-flex items-center gap-1.5 text-white text-[12px] font-extrabold uppercase tracking-institutional py-2.5 px-5 rounded-sm bg-transparent hover:bg-white/10 border border-white/30 transition-colors"
                >
                  <span>View Four Engines</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Centered Metric Pill Strip */}
              <div className="pt-7 mt-1 border-t border-white/15 max-w-2xl mx-auto grid grid-cols-3 divide-x divide-white/12">
                {[
                  { v: '2,207', k: 'Monitored Works' },
                  { v: '₹31.4L Cr', k: 'Capital Portfolio' },
                  { v: '100%', k: 'Air-Gapped Sovereign' },
                ].map((m) => (
                  <div key={m.k} className="px-3 text-center">
                    <div className="font-mono text-[21px] sm:text-[25px] font-semibold text-white leading-none tracking-[-0.02em]">
                      {m.v}
                    </div>
                    <div className="text-[9.5px] uppercase tracking-institutional text-ink-200 mt-2 font-bold">
                      {m.k}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 2: NATIONAL MANDATE & STATUTORY GOVERNANCE DIRECTIVES (EXPANDED)
            ═══════════════════════════════════════════════════════════════ */}
        <section id="slide-2" className="snap-slide-section flex flex-col justify-center space-y-8">
          {/* Top Parchment Ribbon */}
          <div className="card-parchment-gold p-7 sm:p-8 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-4 flex items-center justify-center lg:justify-start gap-5">
                <div className="w-20 h-24 text-gov-green-map flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 100 120" className="w-full h-full fill-current">
                    <path d="M45,5 C55,10 65,15 70,25 C75,35 80,45 85,55 C80,65 75,75 70,85 C60,95 50,105 45,115 C40,105 35,95 30,85 C25,75 20,65 15,55 C20,45 25,35 30,25 Z" opacity="0.9" />
                  </svg>
                </div>
                <div>
                  <div className="font-devanagari font-extrabold text-[20px] sm:text-[22px] text-gov-navy leading-tight">
                    आज़ादी का अमृत महोत्सव
                  </div>
                  <div className="text-[13px] font-semibold text-text-secondary mt-1">
                    PM GatiShakti National Master Plan Integration
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 border-y lg:border-y-0 lg:border-x border-gov-gold-border/90 py-4 lg:py-0 lg:px-8">
                <p className="text-[14.5px] sm:text-[15px] text-text-secondary leading-relaxed font-sans">
                  Empirical oversight across all 2,207 central sector infrastructure projects. 
                  Automated statutory auditing prevents budget inflation, enforces 80% Right-of-Way pre-requisites, 
                  and establishes transparent accountability across union ministries.
                </p>
              </div>

              <div className="lg:col-span-3 flex flex-col items-center lg:items-end justify-center text-center lg:text-right">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm bg-gov-green-light text-gov-green-map border border-gov-green-map/40 text-[12px] font-bold mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>100% Verified Catalog</span>
                </div>
                <div className="text-[12px] text-text-muted font-mono font-semibold">PAIMANA Master DB (2005–2026)</div>
              </div>
            </div>
          </div>

          {/* 2-Column Statutory Directives */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left: General Information */}
            <div className="lg:col-span-5 panel p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <h3 className="font-heading font-extrabold text-[19px] sm:text-[21px] text-gov-navy border-b border-border-default pb-4 mb-5 flex items-center gap-2.5">
                  <Layers className="w-5 h-5 text-gov-saffron" />
                  <span>Statutory Directives &amp; Rules</span>
                </h3>
                <ul className="space-y-4 text-[14px] sm:text-[14.5px] text-text-secondary">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gov-success shrink-0 mt-0.5" />
                    <span><strong>CCEA 20% Rule:</strong> Mandatory Cabinet Committee approval for cost overruns ≥ 20%.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gov-success shrink-0 mt-0.5" />
                    <span><strong>CPWD Clause 10CC:</strong> Formula-driven statutory material and labor escalation caps.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gov-success shrink-0 mt-0.5" />
                    <span><strong>PIB Clearances:</strong> Public Investment Board revised cost estimate guidelines.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gov-success shrink-0 mt-0.5" />
                    <span><strong>Pre-Sanction RoW:</strong> Minimum 80% Right-of-Way acquisition prior to project sanction.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 mt-6 border-t border-border-default text-[13px] text-text-muted flex items-center justify-between font-medium">
                <span>Standard: MoSPI Flash Guidelines</span>
                <span className="text-gov-navy font-bold">New Delhi</span>
              </div>
            </div>

            {/* Right: Feature Focus Card */}
            <div className="lg:col-span-7 panel p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gov-saffron-dark bg-gov-saffron-light px-3 py-1 rounded border border-gov-gold-border">
                    Autonomous Oversight
                  </span>
                  <span className="text-[12px] text-text-muted font-mono font-semibold">Air-Gapped Sovereign Engine</span>
                </div>

                <h3 className="font-heading font-extrabold text-[22px] sm:text-[26px] text-gov-navy leading-snug">
                  Transforming Infrastructure Delivery Through Mathematical Rigor &amp; Causal Analytics
                </h3>

                <p className="text-[15px] sm:text-[15.5px] text-text-secondary leading-relaxed font-sans">
                  PRAKALP-DRISHTI bridges the critical gap between raw administrative project reports and actionable 
                  executive policy. By continuously auditing financial distress, weather risk, and structural dependencies, 
                  it delivers early-warning lead time 106 months ahead of project completion.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-border-default flex items-center justify-between">
                <Link
                  to="/decision-hub"
                  className="text-[14.5px] font-bold text-gov-navy hover:text-gov-saffron transition-colors flex items-center gap-2"
                >
                  <span>Explore Core Mathematical Models</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-[12px] font-mono text-slate-500 font-bold">7 Connected Engines</span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 3: FOUR ANALYTICAL PROGRAMMES (EXPANDED CARDS)
            ═══════════════════════════════════════════════════════════════ */}
        <section id="slide-3" className="snap-slide-section flex flex-col justify-center space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="text-[12px] font-bold uppercase tracking-widest text-gov-saffron">
              Independent Analytical Engines
            </div>
            <h2 className="font-cinzel text-[28px] sm:text-[36px] font-bold text-gov-navy tracking-tight">
              OVERSIGHT PROGRAMMES
            </h2>
            <p className="text-text-secondary text-[15px] sm:text-[16px]">
              Four empirical oversight engines built on econometric and statistical foundations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.to}
                  to={mod.to}
                  className={`panel ${mod.accent} p-6 flex flex-col justify-between group`}
                >
                  <div className="space-y-4">
                    <div className="w-9 h-9 rounded-sm bg-gov-surface border border-gov-border flex items-center justify-center group-hover:border-gov-saffron transition-colors">
                      <Icon className="w-4 h-4 text-gov-navy" strokeWidth={2} />
                    </div>

                    <div>
                      <div className="text-[11.5px] font-bold uppercase tracking-wider text-text-muted mb-1 font-mono">
                        {mod.name}
                      </div>
                      <h3 className="font-heading font-extrabold text-[18px] sm:text-[19px] text-gov-navy group-hover:text-gov-saffron transition-colors leading-snug">
                        {mod.title}
                      </h3>
                    </div>

                    <p className="text-[13.5px] sm:text-[14px] text-text-secondary leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="text-[15px] font-mono font-black text-gov-navy">{mod.finding}</div>
                      <div className="text-[10.5px] text-text-muted font-medium">{mod.findingLabel}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-gov-saffron group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 4: EMPIRICAL FINDINGS & OFFICIAL BULLETINS (EXPANDED)
            ═══════════════════════════════════════════════════════════════ */}
        <section id="slide-4" className="snap-slide-section flex flex-col justify-center space-y-8">
          {/* McCrary Density Card */}
          <div className="command-header p-7 sm:p-10 text-white relative overflow-hidden">
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-gov-saffron text-white text-[11px] font-bold uppercase tracking-widest">
                  <span>Featured Empirical Finding</span>
                </div>
                <h2 className="font-heading font-extrabold text-[26px] sm:text-[32px] leading-tight text-white">
                  Statistically Significant Bunching Detected at the 20% CCEA Boundary
                </h2>
                <p className="text-slate-300 text-[14.5px] sm:text-[15.5px] leading-relaxed max-w-2xl font-sans">
                  The McCrary density discontinuity test reveals a 1.65× artificial concentration in cost revisions 
                  at 18.0%–19.9%, just below the threshold that triggers mandatory Cabinet Committee review. 
                  28 mega-projects with ₹95,217 Crore in capital exposure exhibit this avoidance signal.
                </p>
                <div className="pt-2">
                  <Link
                    to="/tanmay"
                    className="inline-flex items-center gap-2 text-[14px] font-bold text-gov-saffron-light hover:text-white transition-colors"
                  >
                    <span>Inspect Full SATYA-KAVACH Compliance Report</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-4 flex justify-center lg:justify-end">
                <div className="border border-white/15 bg-white/[0.04] rounded-sm p-6 text-center w-full max-w-sm">
                  <div className="text-[52px] sm:text-[58px] font-black text-white font-heading leading-none font-mono">1.65×</div>
                  <div className="text-[14px] font-bold text-slate-200 mt-2">McCrary Discontinuity Ratio</div>
                  <div className="text-[12px] text-gov-saffron-light mt-1 font-mono">p &lt; 0.001 · Highly Significant</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Executive Bulletins */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
            {/* Notice 1 */}
            <div className="bulletin-paper-card p-6 pt-7 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-text-muted font-bold font-mono">
                  <span className="text-gov-saffron uppercase">Cabinet Flash</span>
                  <span>August 2026</span>
                </div>
                <h3 className="font-heading font-bold text-[16px] text-gov-navy leading-snug">
                  Quarterly CCEA Cost Overrun Threshold Audit Published
                </h3>
                <p className="text-[13.5px] text-text-secondary leading-relaxed">
                  2,207 central projects evaluated. 307 projects identified with cumulative cost escalation exceeding 20%, 
                  mandating revised administrative approval submission.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 text-[13px] font-bold text-gov-navy hover:text-gov-saffron cursor-pointer flex items-center gap-1">
                <span>Read Dispatch</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Notice 2 */}
            <div className="bulletin-paper-card p-6 pt-7 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-text-muted font-bold font-mono">
                  <span className="text-emerald-700 uppercase">Solvency Alert</span>
                  <span>August 2026</span>
                </div>
                <h3 className="font-heading font-bold text-[16px] text-gov-navy leading-snug">
                  PSU Financial Leverage &amp; Altman Z-Score Advisory
                </h3>
                <p className="text-[13.5px] text-text-secondary leading-relaxed">
                  Artha-Netra model flags 4 executing public sector enterprises experiencing interest coverage ratio 
                  compression below 1.5x, signalling potential execution slowdowns.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 text-[13px] font-bold text-gov-navy hover:text-gov-saffron cursor-pointer flex items-center gap-1">
                <span>Read Dispatch</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Notice 3 */}
            <div className="bulletin-paper-card p-6 pt-7 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-text-muted font-bold font-mono">
                  <span className="text-blue-700 uppercase">Weather Advisory</span>
                  <span>August 2026</span>
                </div>
                <h3 className="font-heading font-bold text-[16px] text-gov-navy leading-snug">
                  IMD Monsoon Anomaly Stretch Projections for Linear Projects
                </h3>
                <p className="text-[13.5px] text-text-secondary leading-relaxed">
                  Varsha-Speed regression estimates 2 to 5 months additional slippage for coastal highway and railway packages 
                  impacted by +22% monsoon precipitation anomaly.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 text-[13px] font-bold text-gov-navy hover:text-gov-saffron cursor-pointer flex items-center gap-1">
                <span>Read Dispatch</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SLIDE 5: DEDICATED DECISION HUB ENTRY & SOVEREIGN PARTNERS (EXPANDED)
            ═══════════════════════════════════════════════════════════════ */}
        <section id="slide-5" className="snap-slide-section flex flex-col justify-center space-y-8">
          {/* Decision Hub Action Banner */}
          <div className="command-header p-7 sm:p-10 lg:p-12 text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-gov-saffron/30 text-gov-saffron-light border border-gov-saffron/40 text-[11px] font-bold uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-gov-saffron" />
                  <span>Interactive Simulation Hub</span>
                </div>
                <h2 className="font-heading font-extrabold text-[28px] sm:text-[36px] text-white leading-tight">
                  Enter the Sovereign Decision Intelligence Hub
                </h2>
                <p className="text-slate-300 text-[14.5px] sm:text-[15.5px] leading-relaxed font-sans">
                  Run Monte Carlo timeline forecasts, calculate capital lockup graphs, rebalance budgets with linear programming, and inspect empirical model benchmarks across all 2,207 projects.
                </p>
              </div>

              <Link
                to="/decision-hub"
                className="btn-saffron-pill text-[15px] py-4 px-9 shrink-0 group shadow-lg"
              >
                <span>Launch Interactive Hub</span>
                <ArrowRight className="w-4 h-4 text-gov-saffron-dark group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* National Infrastructure Partners */}
          <div className="space-y-6 pt-4">
            <div className="text-center">
              <h3 className="font-heading font-bold text-[14px] sm:text-[15px] text-text-muted uppercase tracking-widest">
                National Infrastructure &amp; Government Partners
              </h3>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-10 py-3">
              {circularPartners.map((partner) => (
                <div key={partner.name} className="flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="circular-partner-badge w-14 h-14 sm:w-16 sm:h-16">
                    <span className="font-heading font-extrabold text-[11px] sm:text-[12px] tracking-tight text-gov-navy">
                      {partner.symbol}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="text-[11.5px] font-bold text-gov-navy group-hover:text-gov-saffron transition-colors leading-tight">
                      {partner.name}
                    </div>
                    <div className="text-[9.5px] text-gov-muted font-mono">{partner.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </LoginGate>
  );
}
