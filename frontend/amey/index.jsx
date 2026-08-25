import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, GitBranch, DollarSign, FileText, Building2, ArrowRight,
  ShieldAlert, TrendingUp, CloudRain, MapPin, Satellite, ChevronRight,
  Sparkles, FlaskConical
} from 'lucide-react';
import KaalChakraView from './KaalChakraView';
import SetuGraphView from './SetuGraphView';
import VittaVyuhaView from './VittaVyuhaView';
import PragatiSaarthiView from './PragatiSaarthiView';
import UnifiedCockpitView from './UnifiedCockpitView';
import AgencyIndexView from './AgencyIndexView';
import GeocodePrecisionPanel from './GeocodePrecisionPanel';
import ModelBenchmarkView from './ModelBenchmarkView';

export default function AmeyMasterView() {
  const [activeEngine, setActiveEngine] = useState('unified_cockpit');
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    return localStorage.getItem('prakalp:selectedProjectId') || '400301';
  });
  const [showWorkspace, setShowWorkspace] = useState(false);

  useEffect(() => {
    const handleProjectSelect = (e) => {
      if (e.detail) {
        setSelectedProjectId(String(e.detail));
        localStorage.setItem('prakalp:selectedProjectId', String(e.detail));
      }
    };
    window.addEventListener('prakalp:selectProject', handleProjectSelect);
    return () => window.removeEventListener('prakalp:selectProject', handleProjectSelect);
  }, []);

  const engines = [
    { id: 'unified_cockpit', label: 'Unified Cockpit', desc: 'Live project risk & impact simulator', icon: Sparkles },
    { id: 'kaal_chakra', label: 'Kaal-Chakra', desc: 'Realistic timeline & delay forecast', icon: Clock },
    { id: 'setu_graph', label: 'Setu-Graph', desc: 'Connected projects & delay ripple effect', icon: GitBranch },
    { id: 'vitta_vyuha', label: 'Vitta-Vyuha', desc: 'Smart budget allocation & rebalancing', icon: DollarSign },
    { id: 'pragati_saarthi', label: 'Pragati-Saarthi', desc: 'Executive briefing & audit trail', icon: FileText },
    { id: 'agency_index', label: 'Agency Index', desc: 'Agency track record & speed ranking', icon: Building2 },
    { id: 'benchmark', label: 'Model Evidence', desc: 'AI vs Statistics, Drivers & Early Warning', icon: FlaskConical },
  ];

  const modules = [
    {
      to: '/tanmay', name: 'SATYA-KAVACH', subtitle: 'Contract & Compliance Analytics',
      desc: 'McCrary density test detecting artificial cost clustering at the 20% CCEA cabinet threshold. Enforces CPWD Clause 10CC statutory escalation caps.',
      finding: '1.65× density discontinuity', findingLabel: 'McCrary bunching signal',
      icon: ShieldAlert, accent: 'bg-amber-50 border-amber-200 text-amber-900',
    },
    {
      to: '/parth', name: 'ARTHA-NETRA', subtitle: 'PSU Financial Solvency',
      desc: 'Correlates executing PSU debt leverage ratios, Altman Z-scores, and equity market drawdowns to predict contractor distress 4–6 quarters ahead.',
      finding: 'Granger-causal', findingLabel: 'Equity-delay coupling confirmed',
      icon: TrendingUp, accent: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    },
    {
      to: '/janhavi', name: 'VARSHA-SPEED', subtitle: 'Monsoon Weather Impact',
      desc: 'IMD rainfall anomaly regression model estimating construction slowdown across 36 states. 20-year historical profiling with scenario simulation.',
      finding: '±15% anomaly', findingLabel: 'Predicts 2–8 month delays',
      icon: CloudRain, accent: 'bg-blue-50 border-blue-200 text-blue-900',
    },
    {
      to: '/soham', name: 'DPR-SCORER', subtitle: 'Proposal Quality Forensics',
      desc: 'Audits project approval timestamps against national & state election cycles to detect rushed foundation approvals lacking 80% Right-of-Way acquisition.',
      finding: '23% of portfolio', findingLabel: 'Pre-election rush sanctions',
      icon: FileText, accent: 'bg-violet-50 border-violet-200 text-violet-900',
    },
    {
      to: '/aditya', name: 'EO-AUDITOR', subtitle: 'Satellite Ground-Truth Verification',
      desc: 'Cross-references reported physical progress against sub-meter dual-epoch satellite imagery via computer vision change detection algorithms.',
      finding: '2,207 georeferenced', findingLabel: '100% catalog coverage',
      icon: Satellite, accent: 'bg-teal-50 border-teal-200 text-teal-900',
    },
  ];

  return (
    <div className="space-y-0">

      {/* ═══════ EDITORIAL HERO ═══════ */}
      <section className="pb-16 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Text column */}
          <div className="lg:col-span-7 space-y-5">
            <div className="text-[12px] font-semibold uppercase tracking-widest text-gov-saffron">
              National Infrastructure Analytics
            </div>
            <h1 className="text-[40px] leading-[1.1] font-semibold text-gov-navy tracking-tight">
              Monitoring India's Central Sector<br />
              Mega-Projects
            </h1>
            <p className="text-text-secondary text-[16px] leading-relaxed max-w-xl">
              Decision intelligence platform overseeing 2,207 public infrastructure projects 
              with ₹31.4 lakh crore in capital expenditure. Five analytical engines provide 
              empirical oversight across cost compliance, financial solvency, weather impact, 
              proposal quality, and satellite ground-truth verification.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => { setShowWorkspace(true); document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="btn-primary"
              >
                Explore Analytics <ArrowRight className="w-4 h-4" />
              </button>
              <a href="#methodology" className="text-[14px] font-medium text-gov-navy hover:text-gov-saffron transition-colors flex items-center gap-1">
                View methodology <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Visual column — key finding card */}
          <div className="lg:col-span-5 bg-white border border-border-default rounded-lg p-6 shadow-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gov-saffron/5 rounded-bl-full" />
            <div className="relative">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-6">Platform Overview</div>
              <div className="space-y-5">
                <div>
                  <div className="text-[42px] font-semibold text-gov-navy leading-none tracking-tight">2,207</div>
                  <div className="text-[13px] text-text-muted mt-1">Central sector mega-projects monitored</div>
                </div>
                <div className="h-px bg-border-default" />
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <div className="text-[22px] font-semibold text-gov-navy">₹31.4L Cr</div>
                    <div className="text-[12px] text-text-muted mt-0.5">Total capital expenditure</div>
                  </div>
                  <div>
                    <div className="text-[22px] font-semibold text-gov-navy">12</div>
                    <div className="text-[12px] text-text-muted mt-0.5">Infrastructure sectors</div>
                  </div>
                </div>
                <div className="h-px bg-border-default" />
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-text-muted">Data coverage: 2005–2026</span>
                  <span className="text-gov-success font-medium">Air-gapped deployment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ STAT STRIP ═══════ */}
      <div className="stat-strip -mx-6 sm:mx-0 sm:rounded-lg overflow-hidden">
        <div className="stat-strip-item">
          <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider">Projects Monitored</div>
          <div className="text-[28px] font-semibold text-gov-navy mt-1 tracking-tight">2,207</div>
          <div className="text-[12px] text-text-muted mt-0.5">Central sector portfolio</div>
        </div>
        <div className="stat-strip-item">
          <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider">At-Risk Projects</div>
          <div className="text-[28px] font-semibold text-gov-danger mt-1 tracking-tight">307</div>
          <div className="text-[12px] text-text-muted mt-0.5">Cost overrun ≥20%</div>
        </div>
        <div className="stat-strip-item">
          <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider">Total Capex</div>
          <div className="text-[28px] font-semibold text-gov-navy mt-1 tracking-tight">₹31.4L Cr</div>
          <div className="text-[12px] text-text-muted mt-0.5">Public capital expenditure</div>
        </div>
        <div className="stat-strip-item">
          <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider">Analytical Engines</div>
          <div className="text-[28px] font-semibold text-gov-navy mt-1 tracking-tight">7</div>
          <div className="text-[12px] text-text-muted mt-0.5">Independent oversight modules</div>
        </div>
      </div>

      {/* ═══════ ANALYTICAL MODULES — EDITORIAL GRID ═══════ */}
      <section className="py-16">
        <div className="mb-10">
          <div className="text-[12px] font-semibold uppercase tracking-widest text-gov-saffron mb-2">Analytical Intelligence</div>
          <h2 className="text-[28px] font-semibold text-gov-navy tracking-tight">Oversight Modules</h2>
          <p className="text-text-secondary text-[15px] mt-2 max-w-2xl">
            Five independent analytical engines providing empirical, data-driven oversight 
            across compliance, finance, weather, governance, and physical verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.to}
                to={mod.to}
                className="group bg-white border border-border-default rounded-lg p-6 hover:shadow-elevated hover:border-border-strong transition-all flex flex-col"
              >
                <div className={`w-10 h-10 rounded-md flex items-center justify-center border ${mod.accent} mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">{mod.name}</div>
                <h3 className="text-[16px] font-semibold text-gov-navy mb-2 group-hover:text-gov-saffron transition-colors">{mod.subtitle}</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed flex-1">{mod.desc}</p>
                <div className="mt-4 pt-4 border-t border-border-default flex items-center justify-between">
                  <div>
                    <div className="text-[18px] font-semibold text-gov-navy">{mod.finding}</div>
                    <div className="text-[11px] text-text-muted">{mod.findingLabel}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-gov-saffron transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ═══════ FEATURED INSIGHT — WIDE BANNER ═══════ */}
      <section className="bg-gov-navy rounded-lg p-10 lg:p-14 text-white relative overflow-hidden mb-16">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-widest text-gov-saffron mb-3">Featured Finding</div>
            <h2 className="text-[28px] font-semibold leading-snug tracking-tight text-white">
              Statistically significant bunching detected at the 20% CCEA threshold
            </h2>
            <p className="text-gray-300 text-[15px] leading-relaxed mt-4 max-w-lg">
              The McCrary density discontinuity test reveals a 1.65× artificial spike in cost revisions 
              at 18.0%–19.9%, just below the mandatory Cabinet Committee approval boundary. 
              28 mega-projects with ₹95,217 crore in capital exposure exhibit this evasion pattern.
            </p>
            <Link to="/tanmay" className="inline-flex items-center gap-2 mt-6 text-[14px] font-semibold text-gov-saffron hover:text-white transition-colors">
              Explore SATYA-KAVACH analysis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg p-8 max-w-xs text-center">
              <div className="text-[56px] font-semibold text-white leading-none tracking-tight">1.65×</div>
              <div className="text-[14px] text-gray-300 mt-2">McCrary density discontinuity ratio</div>
              <div className="text-[12px] text-gray-400 mt-1">p &lt; 0.001 · Statistically significant</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ DECISION INTELLIGENCE WORKSPACE ═══════ */}
      <section id="workspace" className="pb-16">
        <div className="mb-8">
          <div className="text-[12px] font-semibold uppercase tracking-widest text-gov-saffron mb-2">Decision Intelligence Hub</div>
          <h2 className="text-[28px] font-semibold text-gov-navy tracking-tight">Analytical Workspace</h2>
          <p className="text-text-secondary text-[15px] mt-2 max-w-2xl">
            Seven core decision engines for project-level analysis. Select a project from the global search 
            to simulate scenarios, forecast delays, trace dependencies, rebalance budgets, inspect AI model benchmarks, and verify 
            physical progress.
          </p>
        </div>

        {/* Engine tabs */}
        <div className="module-tabs overflow-x-auto">
          {engines.map((eng) => (
            <button
              key={eng.id}
              onClick={() => { setActiveEngine(eng.id); setShowWorkspace(true); }}
              className={`module-tab ${activeEngine === eng.id ? 'active' : ''}`}
            >
              {eng.label}
            </button>
          ))}
        </div>

        {/* Active engine content */}
        <div className="mt-8">
          {activeEngine === 'unified_cockpit' && (
            <UnifiedCockpitView selectedProjectId={selectedProjectId} onSelectProject={(id) => setSelectedProjectId(id)} />
          )}
          {activeEngine === 'kaal_chakra' && (
            <KaalChakraView selectedProjectId={selectedProjectId} onSelectProject={(id) => setSelectedProjectId(id)} />
          )}
          {activeEngine === 'setu_graph' && (
            <SetuGraphView selectedProjectId={selectedProjectId} />
          )}
          {activeEngine === 'vitta_vyuha' && <VittaVyuhaView />}
          {activeEngine === 'pragati_saarthi' && <PragatiSaarthiView selectedProjectId={selectedProjectId} />}
          {activeEngine === 'benchmark' && <ModelBenchmarkView />}
          {activeEngine === 'agency_index' && (
            <div className="space-y-6">
              <GeocodePrecisionPanel />
              <AgencyIndexView />
            </div>
          )}
        </div>
      </section>

      {/* ═══════ METHODOLOGY / ABOUT ═══════ */}
      <section id="methodology" className="bg-white border border-border-default rounded-lg overflow-hidden mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-border-default">
            <h3 className="text-[16px] font-semibold text-gov-navy mb-3">Data Sources</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              MoSPI Flash Reports on Central Sector Projects (2005–2026). 
              All 2,207 projects with ₹150 crore+ sanctioned cost under 
              Union Government implementation agencies.
            </p>
          </div>
          <div className="p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-border-default">
            <h3 className="text-[16px] font-semibold text-gov-navy mb-3">Methodology</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Econometric techniques including McCrary density discontinuity, 
              Granger causality testing, Weibull survival regression, and 
              WPI-pegged statutory price escalation computation.
            </p>
          </div>
          <div className="p-8 lg:p-10">
            <h3 className="text-[16px] font-semibold text-gov-navy mb-3">Coverage &amp; Limitations</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Analysis covers all central sector mega-projects under direct 
              Union Government implementation. State-sector and PPP projects 
              are excluded from the current dataset.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
