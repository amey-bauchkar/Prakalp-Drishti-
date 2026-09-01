import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertTriangle, Scale, RefreshCw, Search,
  ChevronRight, ArrowRight, FileText, Info, HelpCircle,
  ChevronDown, ChevronUp, Clock, AlertCircle, Building2, Landmark,
  X, ExternalLink, SlidersHorizontal
} from 'lucide-react';

export default function SatyaKavachView() {
  // Data state
  const [summaryData, setSummaryData] = useState(null);
  const [histogramData, setHistogramData] = useState(null);
  const [projectDossier, setProjectDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dossierLoading, setDossierLoading] = useState(false);
  
  // Slide-over Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCalculationDisclosure, setShowCalculationDisclosure] = useState(false);

  // Global project selection listener
  useEffect(() => {
    const handleSelect = (e) => {
      if (e.detail) {
        const pid = String(e.detail);
        setSelectedProjectId(pid);
        loadProjectDossier(pid);
        setIsDrawerOpen(true);
      }
    };
    window.addEventListener('prakalp:selectProject', handleSelect);
    return () => window.removeEventListener('prakalp:selectProject', handleSelect);
  }, []);

  // Keyboard shortcut: Escape closes the slide-over drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  // Fetch initial summary & histogram datasets
  useEffect(() => {
    fetchAllData();
  }, []);

  // Load project dossier when selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId) {
      loadProjectDossier(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [sumRes, histRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/tanmay/pattern-analysis'),
        fetch('http://127.0.0.1:8000/api/tanmay/bunching-histogram'),
      ]);

      const [sum, hist] = await Promise.all([
        sumRes.ok ? sumRes.json() : null,
        histRes.ok ? histRes.json() : null,
      ]);

      setSummaryData(sum);
      setHistogramData(hist);
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

  const handleInspectProject = (pid) => {
    setSelectedProjectId(String(pid));
    localStorage.setItem('prakalp:selectedProjectId', String(pid));
    setShowCalculationDisclosure(false);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  if (loading && !summaryData) {
    return (
      <div className="panel p-12 text-center text-xs text-slate-500 font-sans space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gov-accent" />
        <p className="font-medium text-slate-600 dark:text-slate-400">
          Loading SATYA-KAVACH CCEA Boundary Engine…
        </p>
      </div>
    );
  }

  const kpi = summaryData?.kpi_metrics || {};
  const boundary = summaryData?.boundary_metrics || {};
  const signal = summaryData?.mccrary_bunching_signal || {};
  const flagged = summaryData?.flagged_sample_projects || [];

  // Filter flagged projects if user types in search
  const filteredFlagged = flagged.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.project_id.toLowerCase().includes(q) ||
      p.project_name.toLowerCase().includes(q) ||
      p.agency?.toLowerCase().includes(q) ||
      p.sector?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative font-sans text-slate-900 dark:text-slate-100 space-y-5">
      {/* ── 1. SINGLE HERO HEADER WITH CANONICAL STATEMENT ── */}
      <div className="command-header p-5 sm:p-6 rounded-xl bg-gradient-to-r from-[#1A365D] via-[#0F2342] to-[#0A192F] text-white shadow-md border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-mono uppercase tracking-wider text-gov-accent border-l-2 border-gov-accent">
              <Scale className="w-3.5 h-3.5" />
              <span>STATUTORY AUDIT · CCEA COST-OVERRUN BOUNDARY</span>
            </div>
            <h2 className="font-heading font-extrabold text-[21px] sm:text-[25px] tracking-tight mt-2 text-white">
              SATYA-KAVACH: CCEA BOUNDARY ANALYSIS
            </h2>
            <p className="text-[12px] font-mono text-slate-300 mt-0.5">
              Screening projects unusually close to the 20% CCEA Cabinet review boundary
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-white/10 text-white/90 text-xs font-mono border border-white/10">
              <span className="font-bold text-amber-400">{flagged.length}</span> Proximity Projects Flagged
            </div>
          </div>
        </div>

        {/* Canonical Statement */}
        <div className="mt-4 p-3 bg-white/10 backdrop-blur-xs rounded-lg border border-white/15 text-[12px] leading-relaxed text-slate-100">
          <p className="font-sans italic">
            “A deterministic forensic layer for screening anomalous cost-reporting patterns around the applicable CCEA cost-overrun boundary.”
          </p>
        </div>
      </div>

      {/* ── 2. BOUNDARY ANALYSIS METRICS STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Active Revised Population */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10.5px] font-mono text-slate-500 uppercase block">
            Active Revised Population
          </span>
          <span className="font-mono font-bold text-xl text-slate-900 dark:text-slate-100 block mt-0.5">
            N = {boundary.active_revised_population_n || kpi.active_revised_projects || 1183}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {boundary.excluded_unrevised_n || kpi.no_revision_on_file_projects || 1024} unrevised excluded
          </span>
        </div>

        {/* Proximity Band [18%, 20%) */}
        <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-2xs">
          <span className="text-[10.5px] font-mono text-amber-800 dark:text-amber-300 uppercase block font-bold">
            Band [18.0%, 20.0%)
          </span>
          <span className="font-mono font-bold text-xl text-amber-700 dark:text-amber-400 block mt-0.5">
            n = {boundary.numerator_count || signal.numerator_count || 28}
          </span>
          <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 block mt-0.5">
            Threshold Proximity Zone
          </span>
        </div>

        {/* Comparison Band [20%, 22%) */}
        <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40 shadow-2xs">
          <span className="text-[10.5px] font-mono text-rose-800 dark:text-rose-300 uppercase block font-bold">
            Band [20.0%, 22.0%)
          </span>
          <span className="font-mono font-bold text-xl text-rose-700 dark:text-rose-400 block mt-0.5">
            n = {boundary.denominator_count || signal.denominator_count || 17}
          </span>
          <span className="text-[10px] text-rose-700/80 dark:text-rose-400/80 block mt-0.5">
            Cabinet Threshold Met
          </span>
        </div>

        {/* Bin-Mass Ratio and 95% CI */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10.5px] font-mono text-slate-500 uppercase block">
            Boundary Bin-Mass Ratio
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-mono font-bold text-xl text-gov-accent">
              {boundary.ratio || signal.boundary_bin_mass_ratio || 1.65}x
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              95% CI: {boundary.confidence_interval_95?.string || signal.confidence_interval_95 || '[0.91, 2.97]'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            [18,20) vs [20,22) Comparison
          </span>
        </div>
      </div>

      {/* Short Methodological Disclosure */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-gov-accent shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Methodological Disclosure:</strong> Boundary proximity is a screening indicator, not evidence of intentional manipulation.
          Documentary review is required to determine the cause of the revision.
        </p>
      </div>

      {/* ── 3. COST-OVERRUN HISTOGRAM ── */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
          <div>
            <h3 className="font-heading font-bold text-sm text-gov-navy dark:text-slate-100">
              Cost Overrun Distribution Around the 20.0% CCEA Threshold
            </h3>
            <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
              Active revised population (N = {histogramData?.population_metadata?.active_revised_count || 1183})
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Excluded: {histogramData?.population_metadata?.excluded_no_revision_count || 1024} unrevised projects
          </span>
        </div>

        <div className="space-y-2 pt-1">
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
      </div>

      {/* ── 4. FLAGGED PROJECTS TABLE (SINGLE-PAGE MASTER VIEW) ── */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-heading font-bold text-sm text-gov-navy dark:text-slate-100">
              Projects in the Threshold Proximity Band (18.0%–19.99%)
            </h3>
            <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
              {flagged.length} projects positioned immediately below the Cabinet re-sanction threshold · Click <span className="font-bold text-gov-accent">Inspect</span> to slide open deep dossier
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter projects or agencies…"
                className="pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-gov-accent w-48 sm:w-60"
              />
            </div>
            <div
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10.5px] text-slate-600 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700"
              title="CPWD GCC Clause 10CC: 85% escalable base indexed to bid-date commodity WPI series; 15% fixed contractor risk deducted"
            >
              <Scale className="w-3.5 h-3.5 text-gov-accent shrink-0" />
              <span><strong>10CC Cap:</strong> 85% Base × WPI Inflation</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <th className="py-2.5 px-2">Project</th>
                <th className="py-2.5 px-2">Agency</th>
                <th className="py-2.5 px-2 text-right">Original Cost</th>
                <th className="py-2.5 px-2 text-right">Revised Cost</th>
                <th className="py-2.5 px-2 text-right">Overrun %</th>
                <th className="py-2.5 px-2 text-right">Distance to Boundary</th>
                <th className="py-2.5 px-2 text-right">Statutory 10CC Cap</th>
                <th className="py-2.5 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {filteredFlagged.map((p, idx) => {
                const isSelected = isDrawerOpen && selectedProjectId === String(p.project_id);
                return (
                  <tr
                    key={idx}
                    onClick={() => handleInspectProject(p.project_id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-gov-accent/10 dark:bg-gov-accent/20 border-l-4 border-gov-accent font-medium'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 px-2 font-medium">
                      <span className="font-mono text-[10px] text-slate-400 block">#{p.project_id}</span>
                      <span className="text-slate-800 dark:text-slate-200 line-clamp-1">{p.project_name}</span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400">
                      <span className="block text-[11px] truncate max-w-[160px]">{p.agency}</span>
                      <span className="text-[10px] text-slate-400">{p.sector}</span>
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
                      {p.distance_to_boundary_pp} pp to 20%
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 block">
                        ₹{(p.total_allowed_10cc_cost_cr || p.statutory_10cc_cap_cr)?.toLocaleString('en-IN')} Cr
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        (+{p.statutory_10cc_cap_pct}% inflation cap)
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectProject(p.project_id);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all shadow-2xs ${
                          isSelected
                            ? 'bg-gov-navy text-white'
                            : 'bg-gov-accent hover:bg-[#00509E] text-white'
                        }`}
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. SLIDE-OVER INSPECTOR DRAWER (OPTION 1) ── */}
      {isDrawerOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <div
            onClick={handleCloseDrawer}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xs z-40 transition-opacity animate-fadeIn"
          />

          {/* Slide-over Drawer Panel */}
          <div
            className="fixed inset-y-0 right-0 w-full max-w-xl sm:max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-y-auto flex flex-col transform transition-transform duration-300 ease-out animate-slideInRight"
          >
            {/* Drawer Sticky Header */}
            <div className="sticky top-0 bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-800 z-10 flex items-start justify-between gap-3 shadow-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                    PROJECT #{selectedProjectId}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      projectDossier?.boundary?.classification === 'THRESHOLD_PROXIMITY'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {projectDossier?.boundary?.classification_label || 'CCEA Threshold Proximity (18.0%–19.99%)'}
                  </span>
                </div>
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-white leading-snug">
                  {projectDossier?.project_name || `Project #${selectedProjectId}`}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
                  <span>{projectDossier?.sector}</span>
                  <span>·</span>
                  <span>{projectDossier?.agency}</span>
                  <span>·</span>
                  <span>{projectDossier?.state}</span>
                </div>
              </div>

              <button
                onClick={handleCloseDrawer}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
                title="Close Inspector (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="p-4 sm:p-6 space-y-5 flex-1 text-slate-900 dark:text-slate-100">
              {dossierLoading ? (
                <div className="p-16 text-center text-xs text-slate-500 space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gov-accent" />
                  <p className="font-medium">Loading project dossier for #{selectedProjectId}…</p>
                </div>
              ) : projectDossier && projectDossier.status !== 'not_found' ? (
                <>
                  {/* CCEA Regulatory Status Bar */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">
                        Statutory Distance to Boundary
                      </span>
                      <span className="font-mono font-extrabold text-xl text-gov-navy dark:text-slate-100">
                        {projectDossier.boundary?.distance_to_boundary_pp !== undefined
                          ? `${projectDossier.boundary.distance_to_boundary_pp} pp`
                          : '0.03 pp'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">below the 20.0% CCEA Cabinet threshold</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">
                        Approval Authority
                      </span>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block mt-0.5">
                        {projectDossier.boundary?.required_approval_authority || 'Administrative Line Ministry'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Internal Delegation</span>
                    </div>
                  </div>

                  {/* Financial Impact Matrix: 4 Numbers */}
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                    <h4 className="font-heading font-bold text-xs uppercase tracking-wide text-gov-navy dark:text-slate-200">
                      1. Financial Impact Matrix
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Original Sanction</span>
                        <span className="font-mono font-bold text-base text-slate-800 dark:text-slate-200 mt-0.5 block">
                          ₹{projectDossier.costs?.original_cost_cr?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                        </span>
                        <span className="text-[10px] text-slate-400 block">Sanction Year: {projectDossier.costs?.sanction_year}</span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Reported Revised Cost</span>
                        <span className="font-mono font-bold text-base text-slate-900 dark:text-white mt-0.5 block">
                          ₹{projectDossier.costs?.revised_cost_cr?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                        </span>
                        <span className="text-[10px] text-slate-400 block">Current Claim</span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Net Cost Increase</span>
                        <span className="font-mono font-bold text-base text-slate-800 dark:text-slate-200 mt-0.5 block">
                          ₹{projectDossier.costs?.cost_increase_cr?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                        </span>
                        <span className="text-[10px] text-slate-400 block">Demanded Variance</span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Cost Overrun %</span>
                        <span className={`font-mono font-bold text-base mt-0.5 block ${
                          projectDossier.costs?.overrun_pct >= 20
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          +{projectDossier.costs?.overrun_pct}%
                        </span>
                        <span className="text-[10px] text-slate-400 block">Cliff Boundary: 20.0%</span>
                      </div>
                    </div>
                  </div>

                  {/* CPWD Clause 10CC Statutory Price Variation */}
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <h4 className="font-heading font-bold text-xs uppercase tracking-wide text-gov-navy dark:text-slate-200 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-gov-accent" />
                        2. CPWD Clause 10CC Allowable Escalation
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowCalculationDisclosure(!showCalculationDisclosure)}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{showCalculationDisclosure ? 'Hide Math' : 'View Math'}</span>
                        {showCalculationDisclosure ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
                        <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 uppercase block">
                          Total Legitimate 10CC Cap
                        </span>
                        <span className="font-mono font-bold text-base text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                          ₹{((projectDossier.costs?.original_cost_cr || 0) + (projectDossier.clause_10cc?.statutory_allowed_escalation_cr || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                          (+{projectDossier.clause_10cc?.cap_pct_of_original_cost}% inflation cap)
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">
                          Allowable Escalation Only
                        </span>
                        <span className="font-mono font-bold text-base text-slate-800 dark:text-slate-200 mt-0.5 block">
                          +₹{projectDossier.clause_10cc?.statutory_allowed_escalation_cr?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                        </span>
                        <span className="text-[10px] text-slate-400 block">85% base indexed to WPI</span>
                      </div>
                    </div>

                    {/* Collapsible Math Breakdown */}
                    {showCalculationDisclosure && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-2 animate-fadeIn">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block uppercase text-[10px]">
                          Clause 10CC Calculation Breakdown:
                        </span>
                        <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Escalable Base (85%)</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              ₹{projectDossier.clause_10cc?.calculation_disclosure?.escalable_base_cr} Cr
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Contractor Risk (15%)</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              ₹{projectDossier.clause_10cc?.calculation_disclosure?.fixed_risk_deduction_cr} Cr
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Composite Inflation</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              +{projectDossier.clause_10cc?.calculation_disclosure?.composite_inflation_pct}%
                            </span>
                          </div>
                        </div>

                        {projectDossier.clause_10cc?.is_implausible_legacy_cap && (
                          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded border-l-2 border-amber-500 text-[10.5px] text-amber-900 dark:text-amber-200 mt-2">
                            <p className="leading-relaxed">
                              <strong>Legacy Project Note:</strong> {projectDossier.clause_10cc.legacy_cap_caveat}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Deduplicated Cost Revision History */}
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <h4 className="font-heading font-bold text-xs uppercase tracking-wide text-gov-navy dark:text-slate-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gov-accent" />
                        3. Real State-Change Revision Timeline
                      </h4>
                      <span className="text-[10.5px] font-mono text-slate-500">
                        {projectDossier.revision_history?.length || 0} Recorded Event(s)
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {projectDossier.revision_history?.map((evt, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {evt.title}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                · {evt.date || 'Date unavailable'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                              {evt.details}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                            <span className="text-slate-800 dark:text-slate-200 font-bold">
                              ₹{evt.cost_cr?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              evt.overrun_pct >= 20
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              +{evt.overrun_pct}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Standing Methodological Note */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <Info className="w-4 h-4 text-gov-accent shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      <strong>Methodological Note:</strong> Threshold proximity is an anomaly signal for documentary audit prioritization, not evidence of intentional manipulation.
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-xs text-slate-500">
                  Project dossier not found.
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px]">ESC</kbd> or click anywhere outside to close
              </span>
              <button
                onClick={handleCloseDrawer}
                className="px-4 py-1.5 rounded-lg bg-gov-navy text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
