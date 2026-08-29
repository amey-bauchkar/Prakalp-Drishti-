import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertTriangle, Scale, RefreshCw, Search,
  ChevronRight, ArrowRight, FileText, Info, HelpCircle,
  ChevronDown, ChevronUp, Clock, AlertCircle, Building2, Landmark
} from 'lucide-react';

export default function SatyaKavachView() {
  const [viewMode, setViewMode] = useState('portfolio'); // 'portfolio' | 'inspector'
  
  // Data state
  const [summaryData, setSummaryData] = useState(null);
  const [histogramData, setHistogramData] = useState(null);
  const [projectDossier, setProjectDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dossierLoading, setDossierLoading] = useState(false);
  
  // Selected project state
  const [selectedProjectId, setSelectedProjectId] = useState(() => localStorage.getItem('prakalp:selectedProjectId') || '619092');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCalculationDisclosure, setShowCalculationDisclosure] = useState(false);

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
    loadProjectDossier(String(pid));
    setViewMode('inspector');
    setShowCalculationDisclosure(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <div className="space-y-5 font-sans text-slate-900 dark:text-slate-100">
      {/* ── 1. SINGLE HERO HEADER WITH ONE-LINE DESCRIPTOR & CANONICAL STATEMENT ── */}
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
              Identifying projects unusually close to the 20% CCEA Cabinet review boundary
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('portfolio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'portfolio'
                  ? 'bg-gov-accent text-white shadow-xs'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              Portfolio Overview
            </button>
            <button
              onClick={() => setViewMode('inspector')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'inspector'
                  ? 'bg-gov-accent text-white shadow-xs'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              Project Inspector
            </button>
          </div>
        </div>

        {/* Canonical Statement */}
        <div className="mt-4 p-3 bg-white/10 backdrop-blur-xs rounded-lg border border-white/15 text-[12px] leading-relaxed text-slate-100">
          <p className="font-sans italic">
            “A deterministic forensic layer for screening anomalous cost-reporting patterns around the applicable CCEA cost-overrun boundary.”
          </p>
        </div>
      </div>

      {viewMode === 'portfolio' ? (
        <div className="space-y-5">
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

          {/* ── 4. FLAGGED PROJECTS TABLE ── */}
          <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <div>
                <h3 className="font-heading font-bold text-sm text-gov-navy dark:text-slate-100">
                  Projects in the Threshold Proximity Band (18.0%–19.99%)
                </h3>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                  {flagged.length} projects positioned immediately below the Cabinet re-sanction threshold
                </p>
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
                    <th className="py-2.5 px-2 text-center">Action</th>
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
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => handleInspectProject(p.project_id)}
                          className="px-2.5 py-1 rounded bg-gov-accent hover:bg-[#00509E] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
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
      ) : (
        /* ── 5. PROJECT INSPECTOR VIEW (§3) ── */
        <div className="space-y-5">
          {/* Project Selector Bar */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Project ID (e.g. 619092, 400103)..."
                className="w-full text-xs font-mono bg-transparent border-none focus:outline-hidden text-slate-800 dark:text-slate-200"
              />
              {searchQuery && (
                <button
                  onClick={() => handleInspectProject(searchQuery.trim())}
                  className="px-3 py-1 bg-gov-accent text-white text-xs font-bold rounded cursor-pointer"
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
                Back to Portfolio Overview
              </button>
            </div>
          </div>

          {dossierLoading ? (
            <div className="panel p-12 text-center text-xs text-slate-500 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-gov-accent" />
              <p>Loading Dossier for Project #{selectedProjectId}…</p>
            </div>
          ) : projectDossier && projectDossier.status !== 'not_found' ? (
            <div className="space-y-5 animate-fadeIn">
              {/* Header: ID, Name, Sector, Agency, State */}
              <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        PROJECT #{projectDossier.project_id}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded ${
                          projectDossier.boundary?.classification === 'THRESHOLD_PROXIMITY'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                            : projectDossier.boundary?.classification === 'ESCALATION_CANDIDATE'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {projectDossier.boundary?.classification_label || 'Within Budget Bounds'}
                      </span>
                    </div>

                    <h3 className="font-heading font-extrabold text-base sm:text-lg text-gov-navy dark:text-white mt-1.5 leading-snug">
                      {projectDossier.project_name}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span>{projectDossier.sector}</span>
                      <span>·</span>
                      <span>{projectDossier.agency}</span>
                      <span>·</span>
                      <span>{projectDossier.state}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-right shrink-0">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Distance to Boundary</span>
                    <span className="font-mono font-extrabold text-lg text-gov-navy dark:text-slate-100">
                      {projectDossier.boundary?.distance_to_boundary_pp !== undefined
                        ? `${projectDossier.boundary.distance_to_boundary_pp} pp`
                        : 'N/A'}
                    </span>
                    <span className="text-[9.5px] text-slate-400 block">to 20.0% CCEA threshold</span>
                  </div>
                </div>

                {/* Applicable Authority & Citation */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border-l-2 border-gov-accent text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Applicable Authority: {projectDossier.boundary?.required_approval_authority || 'Administrative Line Ministry'}
                    </span>
                    <span className="text-[10.5px] font-mono text-slate-400">CCEA Rule Citation</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11.5px]">
                    {projectDossier.boundary?.statutory_citation}
                  </p>
                </div>
              </div>

              {/* Financial Impact: Original -> Revised -> Increase -> Overrun % (4 numbers) */}
              <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <h4 className="font-heading font-bold text-sm text-gov-navy dark:text-slate-100">
                  Financial Impact Summary
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10.5px] font-mono text-slate-500 uppercase block">1. Original Sanction</span>
                    <span className="font-mono font-bold text-base text-slate-800 dark:text-slate-200 mt-0.5 block">
                      ₹{projectDossier.costs?.original_cost_cr?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                    </span>
                    <span className="text-[10px] text-slate-400 block">Sanction Year: {projectDossier.costs?.sanction_year}</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10.5px] font-mono text-slate-500 uppercase block">2. Current Revised Cost</span>
                    <span className="font-mono font-bold text-base text-slate-900 dark:text-white mt-0.5 block">
                      {projectDossier.costs?.revised_cost_cr !== null && projectDossier.costs?.revised_cost_cr !== undefined
                        ? `₹${projectDossier.costs.revised_cost_cr.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`
                        : 'No Revision on File'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {projectDossier.has_revision_on_file ? 'Approved Revision' : 'Baseline Active'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10.5px] font-mono text-slate-500 uppercase block">3. Net Cost Increase</span>
                    <span className="font-mono font-bold text-base text-slate-800 dark:text-slate-200 mt-0.5 block">
                      ₹{projectDossier.costs?.cost_increase_cr?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                    </span>
                    <span className="text-[10px] text-slate-400 block">Total Variance</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10.5px] font-mono text-slate-500 uppercase block">4. Cost Overrun %</span>
                    <span className={`font-mono font-bold text-base mt-0.5 block ${
                      projectDossier.costs?.overrun_pct >= 20
                        ? 'text-rose-600 dark:text-rose-400'
                        : projectDossier.costs?.overrun_pct >= 18
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      +{projectDossier.costs?.overrun_pct}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">Boundary: 20.0%</span>
                  </div>
                </div>
              </div>

              {/* Cost Revision History: Real State Changes Only */}
              <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="font-heading font-bold text-sm text-gov-navy dark:text-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gov-accent" />
                    Cost Revision History (Real State Changes)
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    {projectDossier.revision_history?.length || 0} Recorded Event(s)
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {projectDossier.revision_history?.map((evt, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {evt.title}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            · {evt.date || 'Date unavailable'}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {evt.details}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                        <span className="text-slate-800 dark:text-slate-200 font-bold">
                          ₹{evt.cost_cr?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                        </span>
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          evt.overrun_pct >= 20
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : evt.overrun_pct >= 18
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          +{evt.overrun_pct}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clause 10CC: Status, Amount, View Calculation Disclosure */}
              <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-gov-navy dark:text-slate-100 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-gov-accent" />
                      CPWD Clause 10CC Statutory Allowable Escalation
                    </h4>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                      85% statutory escalable base indexed to bid date commodity WPI series
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-300">
                      STATUS: {projectDossier.clause_10cc?.status || 'INDICATIVE'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCalculationDisclosure(!showCalculationDisclosure)}
                      className="px-2.5 py-1 rounded bg-gov-navy text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showCalculationDisclosure ? 'Hide Calculation' : 'View Calculation'}</span>
                      {showCalculationDisclosure ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-xs text-slate-500">Statutory 10CC Allowable Cap:</span>
                  <span className="font-mono font-bold text-lg text-emerald-700 dark:text-emerald-300">
                    ₹{projectDossier.clause_10cc?.statutory_allowed_escalation_cr?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ({projectDossier.clause_10cc?.cap_pct_of_original_cost}% of Original Sanction)
                  </span>
                </div>

                {/* Collapsible View Calculation Disclosure */}
                {showCalculationDisclosure && (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-2 mt-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block uppercase text-[10px]">
                      Calculation Breakdown
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Escalable Base (85%)</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          ₹{projectDossier.clause_10cc?.calculation_disclosure?.escalable_base_cr} Cr
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Fixed Risk Margin (15%)</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          ₹{projectDossier.clause_10cc?.calculation_disclosure?.fixed_risk_deduction_cr} Cr
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Composite Inflation Rate</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          +{projectDossier.clause_10cc?.calculation_disclosure?.composite_inflation_pct}%
                        </span>
                      </div>
                    </div>

                    {projectDossier.clause_10cc?.is_implausible_legacy_cap && (
                      <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded border-l-2 border-amber-500 text-[11px] text-amber-900 dark:text-amber-200 mt-2">
                        <p className="leading-relaxed">
                          <strong>Note on Legacy Project:</strong> {projectDossier.clause_10cc.legacy_cap_caveat}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* The Standing Methodological Note (§3) */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-gov-accent shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Methodological Note:</strong> Threshold proximity is an anomaly signal, not evidence of intentional manipulation.
                  Documentary review is required to determine the cause of the revision.
                </p>
              </div>
            </div>
          ) : (
            <div className="panel p-12 text-center text-xs text-slate-500">
              Project not found. Select a project from the portfolio overview.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
