import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertTriangle, Scale, RefreshCw, Search, Filter,
  Calculator, Award, ArrowRight, ChevronRight, BarChart3, FileSearch,
  Layers, CheckCircle2, FileText, Activity, Info, HelpCircle,
  ChevronDown, ChevronUp, BookOpen, TrendingUp, Sparkles, ExternalLink,
  Building2, Landmark, AlertCircle, Eye, Download, Printer, Lock
} from 'lucide-react';

import TracedNumber from './components/TracedNumber';
import ProjectEvidenceTimeline from './components/ProjectEvidenceTimeline';
import LegitimateExplanationPanel from './components/LegitimateExplanationPanel';
import PeerBenchmarkCard from './components/PeerBenchmarkCard';
import FinancialExposureTrace from './components/FinancialExposureTrace';
import AuditPackModal from './components/AuditPackModal';

export default function SatyaKavachView() {
  const [viewMode, setViewMode] = useState('portfolio'); // 'portfolio' | 'inspector'
  const [activeTab, setActiveTab] = useState('bunching'); // 'bunching' | 'clause10cc' | 'agencies'
  const [agencyMode, setAgencyMode] = useState('composite'); // 'composite' | 'proximity_queue' | 'overrun_queue'
  const [minProjectsGate, setMinProjectsGate] = useState(5);
  
  // Data state
  const [summaryData, setSummaryData] = useState(null);
  const [histogramData, setHistogramData] = useState(null);
  const [clauseData, setClauseData] = useState(null);
  const [rankingsData, setRankingsData] = useState(null);
  const [projectDossier, setProjectDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dossierLoading, setDossierLoading] = useState(false);
  
  // Selected project state
  const [selectedProjectId, setSelectedProjectId] = useState(() => localStorage.getItem('prakalp:selectedProjectId') || '619092');
  const [searchQuery, setSearchQuery] = useState('');
  const [auditPackModalOpen, setAuditPackModalOpen] = useState(false);
  const [auditPackData, setAuditPackData] = useState(null);

  // Global project sync
  useEffect(() => {
    const handleSelect = (e) => {
      if (e.detail) {
        setSelectedProjectId(String(e.detail));
        loadProjectDossier(String(e.detail));
      }
    };
    window.addEventListener('prakalp:selectProject', handleSelect);
    return () => window.removeEventListener('prakalp:selectProject', handleSelect);
  }, []);

  // Fetch initial summary & datasets
  useEffect(() => {
    fetchAllData();
  }, [agencyMode, minProjectsGate]);

  // Load project dossier when selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId) {
      loadProjectDossier(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [sumRes, histRes, clauseRes, rankRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/tanmay/pattern-analysis'),
        fetch('http://127.0.0.1:8000/api/tanmay/bunching-histogram'),
        fetch('http://127.0.0.1:8000/api/tanmay/clause-10cc-audit?limit=50'),
        fetch(`http://127.0.0.1:8000/api/tanmay/agency-patterns?mode=${agencyMode}&min_projects=${minProjectsGate}`),
      ]);

      const [sum, hist, clause, rank] = await Promise.all([
        sumRes.ok ? sumRes.json() : null,
        histRes.ok ? histRes.json() : null,
        clauseRes.ok ? clauseRes.json() : null,
        rankRes.ok ? rankRes.json() : null,
      ]);

      setSummaryData(sum);
      setHistogramData(hist);
      setClauseData(clause);
      setRankingsData(rank);
    } catch (e) {
      console.error('Failed to load Satya-Kavach data:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDossier = async (pid) => {
    setDossierLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/tanmay/project-dossier/${pid}`);
      if (res.ok) {
        const data = await res.json();
        setProjectDossier(data);
      }
    } catch (e) {
      console.error('Failed to fetch project dossier:', e);
    } finally {
      setDossierLoading(false);
    }
  };

  const openAuditPack = async (pid) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/tanmay/audit-pack/${pid}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAuditPackData(data);
        setAuditPackModalOpen(true);
      }
    } catch (e) {
      console.error('Failed to generate audit pack:', e);
    }
  };

  const handleInspectProject = (pid) => {
    setSelectedProjectId(String(pid));
    localStorage.setItem('prakalp:selectedProjectId', String(pid));
    loadProjectDossier(String(pid));
    setViewMode('inspector');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && !summaryData) {
    return (
      <div className="panel p-12 text-center text-xs text-slate-500 font-sans space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gov-accent" />
        <p className="font-medium text-slate-600 dark:text-slate-400">
          Loading SATYA-KAVACH Statutory Forensic Engine…
        </p>
      </div>
    );
  }

  const kpi = summaryData?.kpi_metrics || {};
  const signal = summaryData?.mccrary_bunching_signal || {};
  const flagged = summaryData?.flagged_sample_projects || [];
  const agencies = rankingsData?.rankings || [];

  return (
    <div className="space-y-5 font-sans text-slate-900 dark:text-slate-100">
      {/* ── 1. COLLAPSED VIEW HEADER WITH VERBATIM POSITIONING STATEMENT (§4, §8) ── */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-gov-accent/10 text-gov-accent border border-gov-accent/30">
              Deterministic Forensic Layer
            </span>
            <span className="text-xs text-slate-500 font-mono">
              N = 2,207 Central Sector Projects · 1,183 Active Revisions
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('portfolio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'portfolio'
                  ? 'bg-gov-accent text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Portfolio Overview
            </button>
            <button
              onClick={() => setViewMode('inspector')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'inspector'
                  ? 'bg-gov-accent text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Project Dossier Inspector
            </button>
          </div>
        </div>

        {/* Verbatim Statement (§4) */}
        <p className="text-xs text-slate-600 dark:text-slate-300 italic border-l-2 border-gov-accent pl-3 py-0.5 leading-relaxed">
          “A deterministic forensic layer that identifies statistically anomalous cost-reporting and contractual escalation patterns, quantifies the financial exposure, and produces an evidence-backed audit trail for human review.”
        </p>
      </div>

      {/* ── 2. FOUR CONCEPT CARDS: DETECT · VERIFY · QUANTIFY · ACT (§8) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => { setViewMode('portfolio'); setActiveTab('bunching'); }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
            activeTab === 'bunching' && viewMode === 'portfolio'
              ? 'bg-blue-50/50 dark:bg-blue-950/20 border-gov-accent'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono font-extrabold uppercase text-gov-accent tracking-wider">
              1. DETECT
            </span>
            <Scale className="w-4 h-4 text-gov-accent group-hover:scale-110 transition-transform" />
          </div>
          <h4 className="font-heading font-bold text-xs text-gov-navy dark:text-slate-100">
            Boundary Proximity
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Identifies projects bunched in the 18.0%–19.99% band to assess proximity to Cabinet review.
          </p>
        </div>

        <div
          onClick={() => { setViewMode('portfolio'); setActiveTab('agencies'); }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
            activeTab === 'agencies' && viewMode === 'portfolio'
              ? 'bg-blue-50/50 dark:bg-blue-950/20 border-gov-accent'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
              2. VERIFY
            </span>
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <h4 className="font-heading font-bold text-xs text-gov-navy dark:text-slate-100">
            Agency Patterns
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Ranks executing agencies by transparent Audit Priority Score (APS) as a human review queue.
          </p>
        </div>

        <div
          onClick={() => { setViewMode('portfolio'); setActiveTab('clause10cc'); }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
            activeTab === 'clause10cc' && viewMode === 'portfolio'
              ? 'bg-blue-50/50 dark:bg-blue-950/20 border-gov-accent'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono font-extrabold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
              3. QUANTIFY
            </span>
            <Calculator className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <h4 className="font-heading font-bold text-xs text-gov-navy dark:text-slate-100">
            Clause 10CC Cap
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Decomposes statutory 85% escalable base pegged to tender bid date commodity price indices.
          </p>
        </div>

        <div
          onClick={() => setViewMode('inspector')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
            viewMode === 'inspector'
              ? 'bg-blue-50/50 dark:bg-blue-950/20 border-gov-accent'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono font-extrabold uppercase text-sky-600 dark:text-sky-400 tracking-wider">
              4. ACT
            </span>
            <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
          </div>
          <h4 className="font-heading font-bold text-xs text-gov-navy dark:text-slate-100">
            Audit Pack Dossier
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Generates a 7-document checklist and cryptographically signed audit package for case files.
          </p>
        </div>
      </div>

      {/* ── 3. PORTFOLIO METRICS STRIP (§8) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-[10.5px] font-mono text-slate-500 uppercase block">Active Revised Cohort</span>
          <span className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100">
            {kpi.active_revised_projects || 1183}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {kpi.no_revision_on_file_projects || 1024} unrevised excluded
          </span>
        </div>

        <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/40">
          <span className="text-[10.5px] font-mono text-amber-800 dark:text-amber-300 uppercase block font-bold">
            Threshold Proximity (18–20%)
          </span>
          <span className="font-mono font-bold text-lg text-amber-700 dark:text-amber-400">
            {signal.numerator_count || kpi.projects_in_bunching_zone_18_20pct || 28}
          </span>
          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 block mt-0.5">
            ₹{(kpi.bunching_zone_capital_cr || 63892).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr Outlay
          </span>
        </div>

        <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-900/40">
          <span className="text-[10.5px] font-mono text-rose-800 dark:text-rose-300 uppercase block font-bold">
            Escalation Candidates (≥20%)
          </span>
          <span className="font-mono font-bold text-lg text-rose-700 dark:text-rose-400">
            {kpi.projects_above_20pct_cabinet_rule || 307}
          </span>
          <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 block mt-0.5">
            Cabinet Re-sanction Met
          </span>
        </div>

        {/* Boundary Bin-Mass Ratio with Explicit Fraction & Bin Edges (Point 1) */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-[10.5px] font-mono text-slate-500 uppercase block">Boundary Bin-Mass Ratio</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-mono font-bold text-lg text-gov-accent">
              {signal.boundary_bin_mass_ratio || 1.65}x
            </span>
            <span className="font-mono text-xs text-slate-500">
              ({signal.numerator_count || 28} / {signal.denominator_count || 17})
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            [18,20) vs [20,22) Active (N={signal.total_active_population || 1183})
          </span>
        </div>
      </div>

      {/* ── 4. VIEW MODE SWITCH: PORTFOLIO vs INSPECTOR ── */}
      {viewMode === 'portfolio' ? (
        <div className="space-y-6">
          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('bunching')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'bunching'
                  ? 'bg-gov-navy text-white shadow-xs dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              1. Cabinet Rule Boundary Distribution
            </button>
            <button
              onClick={() => setActiveTab('clause10cc')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'clause10cc'
                  ? 'bg-gov-navy text-white shadow-xs dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              2. Clause 10CC Statutory Audit Ledger
            </button>
            <button
              onClick={() => setActiveTab('agencies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'agencies'
                  ? 'bg-gov-navy text-white shadow-xs dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              3. Agency Pattern Overview &amp; Triage Queue
            </button>
          </div>

          {/* TAB 1: BOUNDARY ANALYSIS & BUNCHING HISTOGRAM */}
          {activeTab === 'bunching' && (
            <div className="space-y-5">
              {/* Distribution Histogram & Methodological Note */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-gov-navy dark:text-slate-100">
                      Portfolio Cost Overrun Distribution &amp; Boundary Analysis
                    </h3>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                      Evaluates active cost-revision clustering around the 20.0% CCEA Cabinet Review Threshold
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 font-bold">
                      Active Population: N = {histogramData?.population_metadata?.active_revised_count || 1183}
                    </span>
                  </div>
                </div>

                {/* Exclusion Metadata Pill (Point 2) */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-gov-accent shrink-0" />
                    <span>Active Revised Population Median: +{histogramData?.population_metadata?.median_overrun_pct || 0.04}% · Mean: +{histogramData?.population_metadata?.mean_overrun_pct || 23.0}%</span>
                  </span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {histogramData?.population_metadata?.excluded_no_revision_count || 1024} projects with No Revision on File excluded
                  </span>
                </div>

                {/* Non-Clipped Histogram Visualizer (Point 1, Point 7) */}
                <div className="space-y-2 pt-2">
                  {histogramData?.bins?.map((bin, idx) => {
                    const count = bin.project_count || 0;
                    const maxCount = Math.max(...(histogramData.bins.map((b) => b.project_count) || [1]));
                    const pctWidth = Math.max(2, (count / maxCount) * 100);
                    const isProximity = bin.is_bunching_spike;
                    const isBreached = bin.is_cabinet_breached;

                    return (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <span className="w-64 sm:w-72 shrink-0 text-right font-mono text-[11.5px] text-slate-700 dark:text-slate-300 font-medium">
                          {bin.bin_label}
                        </span>
                        <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex items-center p-0.5">
                          <div
                            style={{ width: `${pctWidth}%` }}
                            className={`h-full rounded transition-all flex items-center justify-end pr-2 ${
                              isProximity
                                ? 'bg-amber-500 text-white font-bold'
                                : isBreached
                                ? 'bg-rose-600 text-white font-bold'
                                : 'bg-gov-accent/80 text-white'
                            }`}
                          >
                            <span className="text-[10px] font-mono">{count}</span>
                          </div>
                        </div>
                        <span className="w-24 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          ₹{bin.total_capex_cr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Methodological Note (Point 1) */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex items-start gap-2">
                  <Info className="w-4 h-4 text-gov-accent shrink-0 mt-0.5" />
                  <p>
                    <strong>Methodological Disclosure:</strong> The Boundary Bin-Mass Ratio compares the [18.0%, 20.0%) band
                    (n={signal.numerator_count || 28}) against the [20.0%, 22.0%) comparison band (n={signal.denominator_count || 17}) = <strong>{signal.boundary_bin_mass_ratio || 1.65}x</strong>.
                    This observational ratio measures localized clustering around the 20% CCEA threshold. Proximity serves as an indicator for audit triage, not causal proof of intent.
                  </p>
                </div>
              </div>

              {/* Flagged Projects Table */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-gov-navy dark:text-slate-100">
                      Projects Positioned in Threshold Proximity Band (18.0%–19.99%)
                    </h3>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                      Sample projects positioned immediately below the Cabinet review threshold ({flagged.length} identified)
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                        <th className="py-2 px-2">Project ID &amp; Name</th>
                        <th className="py-2 px-2">Sector &amp; Agency</th>
                        <th className="py-2 px-2 text-right">Original Cost</th>
                        <th className="py-2 px-2 text-right">Revised Cost</th>
                        <th className="py-2 px-2 text-right">Overrun %</th>
                        <th className="py-2 px-2 text-right">Boundary Gap</th>
                        <th className="py-2 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                      {flagged.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-2 font-medium">
                            <span className="font-mono text-[10px] text-slate-400 block">#{p.project_id}</span>
                            <span className="text-slate-800 dark:text-slate-200 line-clamp-1">{p.project_name}</span>
                          </td>
                          <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400">
                            <span>{p.sector}</span>
                            <span className="block text-[10px] text-slate-400 truncate max-w-[150px]">{p.agency}</span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700 dark:text-slate-300">
                            ₹{p.original_cost_cr.toLocaleString('en-IN')} Cr
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ₹{p.revised_cost_cr.toLocaleString('en-IN')} Cr
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                            +{p.overrun_pct}%
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-500">
                            {p.evasion_margin_pct} pp to 20%
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => handleInspectProject(p.project_id)}
                              className="px-2.5 py-1 rounded bg-gov-accent/10 hover:bg-gov-accent text-gov-accent hover:text-white transition-all text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Inspect Dossier</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLAUSE 10CC STATUTORY AUDIT LEDGER */}
          {activeTab === 'clause10cc' && (
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-gov-navy dark:text-slate-100">
                      CPWD Clause 10CC Statutory Allowable Escalation Ledger
                    </h3>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                      Comparing project outlays against 85% escalable ceiling pegged to bid date indices
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300">
                    Model-Dependent — Contract Schedule F Required
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                        <th className="py-2 px-2">Project ID &amp; Name</th>
                        <th className="py-2 px-2">Sector &amp; Agency</th>
                        <th className="py-2 px-2 text-right">Original Cost</th>
                        <th className="py-2 px-2 text-right">Sanction Year</th>
                        <th className="py-2 px-2 text-right">10CC Allowable Cap</th>
                        <th className="py-2 px-2 text-right">Cap (% Orig)</th>
                        <th className="py-2 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                      {clauseData?.audited_records?.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-2 font-medium">
                            <span className="font-mono text-[10px] text-slate-400 block">#{r.project_id}</span>
                            <span className="text-slate-800 dark:text-slate-200 line-clamp-1">{r.project_name}</span>
                          </td>
                          <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400">
                            <span>{r.sector}</span>
                            <span className="block text-[10px] text-slate-400 truncate max-w-[150px]">{r.agency}</span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700 dark:text-slate-300">
                            ₹{r.original_cost_cr.toLocaleString('en-IN')} Cr
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-400">
                            {r.sanction_year}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{r.statutory_10cc_allowed_cr.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono">
                            <span className={r.cap_pct_of_original_cost > 50 ? 'text-amber-600 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                              {r.cap_pct_of_original_cost}%
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => handleInspectProject(r.project_id)}
                              className="px-2.5 py-1 rounded bg-gov-navy hover:bg-slate-800 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AGENCY PATTERN OVERVIEW WITH DUAL QUEUES (Point 4) */}
          {activeTab === 'agencies' && (
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-gov-navy dark:text-slate-100">
                      Agency Pattern Overview &amp; Triage Queues
                    </h3>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                      Select triage mode to order executing agencies for targeted human audit
                    </p>
                  </div>

                  {/* Dual Queue Mode Switcher & Gate (Point 4) */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-950 text-xs">
                      <button
                        onClick={() => setAgencyMode('composite')}
                        className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                          agencyMode === 'composite' ? 'bg-gov-navy text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Balanced APS
                      </button>
                      <button
                        onClick={() => setAgencyMode('proximity_queue')}
                        className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                          agencyMode === 'proximity_queue' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Proximity Queue
                      </button>
                      <button
                        onClick={() => setAgencyMode('overrun_queue')}
                        className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                          agencyMode === 'overrun_queue' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Overrun Queue
                      </button>
                    </div>

                    <button
                      onClick={() => setMinProjectsGate(minProjectsGate === 5 ? 2 : 5)}
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono hover:bg-slate-200 cursor-pointer"
                    >
                      Gate: N ≥ {minProjectsGate}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                        <th className="py-2 px-2">Executing Agency</th>
                        <th className="py-2 px-2">Entity Type</th>
                        <th className="py-2 px-2 text-right">Projects (N)</th>
                        <th className="py-2 px-2 text-right">Proximity Band (18–20%)</th>
                        <th className="py-2 px-2 text-right">Escalation Rate (≥20%)</th>
                        <th className="py-2 px-2 text-right">Total Overrun</th>
                        <th className="py-2 px-2 text-center">Score / Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                      {agencies.map((ag, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-slate-100">
                            {ag.agency_name}
                          </td>
                          <td className="py-2.5 px-2">
                            <span className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded ${
                              ag.is_state_executing_entity
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {ag.entity_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700 dark:text-slate-300 font-bold">
                            {ag.total_projects}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-amber-600 dark:text-amber-400 font-bold">
                            {ag.bunching_projects_18_20pct} ({ag.bunching_rate_pct}%)
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-rose-600 dark:text-rose-400 font-bold">
                            {ag.cabinet_breached_projects} ({ag.escalation_candidate_rate_pct}%)
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700 dark:text-slate-300">
                            ₹{ag.total_overrun_capex_cr.toLocaleString('en-IN')} Cr
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                              {ag.audit_priority_score}/100
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── 5. EVIDENCE-FIRST PROJECT DOSSIER INSPECTOR (§8) ── */
        <div className="space-y-6">
          {/* Project Selector Bar */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Project ID (e.g. 619092, 400103, 706718)..."
                className="w-full text-xs font-mono bg-transparent border-none focus:outline-hidden text-slate-800 dark:text-slate-200"
              />
              {searchQuery && (
                <button
                  onClick={() => handleInspectProject(searchQuery.trim())}
                  className="px-3 py-1 bg-gov-accent text-white text-xs font-bold rounded"
                >
                  Inspect
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('portfolio')}
                className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 cursor-pointer"
              >
                Back to Portfolio
              </button>
            </div>
          </div>

          {dossierLoading ? (
            <div className="panel p-12 text-center text-xs text-slate-500 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-gov-accent" />
              <p>Reconstructing Forensic Dossier for Project #{selectedProjectId}…</p>
            </div>
          ) : projectDossier ? (
            <div className="space-y-6 animate-fadeIn">
              {/* HEADER */}
              <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        PROJECT #{projectDossier.project_id}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded ${
                          projectDossier.classification === 'THRESHOLD_PROXIMITY'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                            : projectDossier.classification === 'ESCALATION_CANDIDATE'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {projectDossier.classification_label}
                      </span>
                    </div>

                    <h3 className="font-heading font-extrabold text-base sm:text-lg text-gov-navy dark:text-white mt-1.5 leading-snug">
                      {projectDossier.project_name}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span>{projectDossier.sector}</span>
                      <span>·</span>
                      <span>{projectDossier.agency}</span>
                      <span>·</span>
                      <span>{projectDossier.state}</span>
                    </div>
                  </div>

                  {/* Audit Priority Score Box */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-center shrink-0 min-w-[140px]">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Audit Priority Score
                    </span>
                    <span className="font-mono font-extrabold text-2xl text-gov-accent">
                      {projectDossier.audit_priority_score}
                      <span className="text-xs font-normal text-slate-400">/100</span>
                    </span>
                    <span className="text-[9.5px] text-slate-500 block mt-0.5">Triage Queue Ordering</span>
                  </div>
                </div>

                {/* Statutory Citation Banner */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border-l-2 border-gov-accent text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Applicable Authority: {projectDossier.required_approval_authority}
                    </span>
                    <span className="text-[10.5px] font-mono text-slate-400">Statutory Citation</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11.5px]">
                    {projectDossier.statutory_citation}
                  </p>
                </div>
              </div>

              {/* 1. CONTRIBUTING SIGNALS (§7.1) */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <h4 className="font-heading font-bold text-sm text-gov-navy dark:text-slate-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-gov-accent" />
                  Contributing Forensic Signals
                </h4>

                {projectDossier.contributing_signals?.length > 0 ? (
                  <div className="space-y-2">
                    {projectDossier.contributing_signals.map((sig, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${
                          sig.severity === 'RED'
                            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                            : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                            {sig.title}
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            {sig.description}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-xs text-gov-navy dark:text-slate-200 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                          {sig.metric}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-lg text-xs text-emerald-800 dark:text-emerald-300">
                    No adverse forensic signals detected. Project outlays remain within baseline parameters.
                  </div>
                )}
              </div>

              {/* 2. PROJECT EVIDENCE TIMELINE (§7.2) */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <ProjectEvidenceTimeline events={projectDossier.timeline_events} projectId={projectDossier.project_id} />
              </div>

              {/* 3. CANDIDATE LEGITIMATE EXPLANATIONS (§7.4) */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <LegitimateExplanationPanel explanations={projectDossier.legitimate_explanations} />
              </div>

              {/* 4. PEER BENCHMARKING (§7.5) */}
              <PeerBenchmarkCard peerData={projectDossier.peer_benchmark} projectOverrunPct={projectDossier.overrun_pct} />

              {/* 5. FINANCIAL EXPOSURE TRACE & CLAUSE 10CC FORENSICS (§7.6, §7.7) */}
              <FinancialExposureTrace
                clauseData={projectDossier.clause_10cc}
                originalCostCr={projectDossier.original_cost_cr}
                sanctionYear={projectDossier.sanction_year}
                revisedCostCr={projectDossier.revised_cost_cr}
              />

              {/* 6. RECOMMENDED HUMAN NEXT STEPS & AUDIT PACK (§7.8) */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-gov-navy dark:text-slate-100 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-gov-accent" />
                      Recommended Human Action &amp; Audit Pack
                    </h4>
                    <span className="text-[11.5px] text-slate-500 dark:text-slate-400">
                      Standard operating procedure for case file preparation and formal agency notice
                    </span>
                  </div>

                  <button
                    onClick={() => openAuditPack(projectDossier.project_id)}
                    className="px-4 py-2 rounded-lg bg-[#0060B6] hover:bg-[#00509E] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Generate Cryptographic Audit Pack</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">1. Notice Preparation</span>
                    <p className="text-slate-600 dark:text-slate-400 text-[11.5px] leading-relaxed">
                      Issue formal memorandum requesting the 7-instrument document checklist (RCE, Schedule F, Invoices).
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">2. SCCO / PIB Review</span>
                    <p className="text-slate-600 dark:text-slate-400 text-[11.5px] leading-relaxed">
                      Submit signed audit pack and agency rejoinder to the Standing Committee on Cost Overruns for revised AA&amp;ES appraisal.
                    </p>
                  </div>
                </div>
              </div>

              {/* 7. SOURCE REFERENCES */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1.5">
                <span className="font-bold text-slate-500 uppercase text-[10px] block">
                  Data Provenance References (Hard Rule 1)
                </span>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {projectDossier.source_references?.map((src, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      {src.dataset} · {src.field_name} (#{src.record_id})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="panel p-12 text-center text-xs text-slate-500">
              Select a project from the portfolio overview or enter a Project ID above.
            </div>
          )}
        </div>
      )}

      {/* ── 6. AUDIT PACK GENERATOR MODAL (§7.8) ── */}
      <AuditPackModal
        isOpen={auditPackModalOpen}
        onClose={() => setAuditPackModalOpen(false)}
        auditPack={auditPackData}
        projectId={selectedProjectId}
      />
    </div>
  );
}
