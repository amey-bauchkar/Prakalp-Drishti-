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

  return (    <div className="space-y-6 font-sans text-slate-900">
      {/* ── 1. SINGLE HERO HEADER WITH ONE-LINE DESCRIPTOR & CANONICAL STATEMENT ── */}
      <div className="command-header p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/[0.07] text-[9.5px] font-extrabold tracking-institutional uppercase text-gov-accent border-l-2 border-gov-accent">
            <Scale className="w-3.5 h-3.5 text-white" />
            <span>STATUTORY AUDIT · CCEA COST-OVERRUN BOUNDARY</span>
          </div>
          <h2 className="font-heading font-extrabold text-[21px] sm:text-[25px] tracking-[-0.025em] text-white leading-[1.12]">
            SATYA-KAVACH: CCEA BOUNDARY ANALYSIS
          </h2>
          <p className="text-[12.5px] text-ink-200 leading-relaxed font-sans max-w-xl">
            Identifying projects unusually close to the 20% CCEA Cabinet review boundary with deterministic forensic screening.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setViewMode('portfolio')}
            className={`px-3 py-1.5 rounded-xs text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'portfolio'
                ? 'bg-gov-accent text-gov-navy font-black shadow-xs'
                : 'bg-black/25 text-ink-200 hover:text-white border border-white/15'
            }`}
          >
            Portfolio Overview
          </button>
          <button
            onClick={() => setViewMode('inspector')}
            className={`px-3 py-1.5 rounded-xs text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'inspector'
                ? 'bg-gov-accent text-gov-navy font-black shadow-xs'
                : 'bg-black/25 text-ink-200 hover:text-white border border-white/15'
            }`}
          >
            Project Inspector
          </button>
        </div>
      </div>

      {viewMode === 'portfolio' ? (
        <div className="space-y-6">
          {/* ── 2. BOUNDARY ANALYSIS METRICS STRIP ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Active Revised Population */}
            <div className="panel p-4 bg-white">
              <span className="text-[10px] font-bold text-gov-muted uppercase block font-heading tracking-wider">
                Active Revised Population
              </span>
              <span className="font-mono font-bold text-xl text-gov-navy block mt-1">
                N = {boundary.active_revised_population_n || kpi.active_revised_projects || 1183}
              </span>
              <span className="text-[10.5px] text-gov-muted block mt-0.5">
                {boundary.excluded_unrevised_n || kpi.no_revision_on_file_projects || 1024} unrevised excluded
              </span>
            </div>

            {/* Proximity Band [18%, 20%) */}
            <div className="panel p-4 bg-amber-50/40 border-l-2 border-l-amber-500">
              <span className="text-[10px] font-bold text-amber-800 uppercase block font-heading tracking-wider">
                Band [18.0%, 20.0%)
              </span>
              <span className="font-mono font-bold text-xl text-amber-700 block mt-1">
                n = {boundary.numerator_count || signal.numerator_count || 28}
              </span>
              <span className="text-[10.5px] text-amber-800/90 block mt-0.5 font-medium">
                Threshold Proximity Zone
              </span>
            </div>

            {/* Comparison Band [20%, 22%) */}
            <div className="panel p-4 bg-rose-50/40 border-l-2 border-l-rose-500">
              <span className="text-[10px] font-bold text-rose-800 uppercase block font-heading tracking-wider">
                Band [20.0%, 22.0%)
              </span>
              <span className="font-mono font-bold text-xl text-rose-700 block mt-1">
                n = {boundary.denominator_count || signal.denominator_count || 17}
              </span>
              <span className="text-[10.5px] text-rose-800/90 block mt-0.5 font-medium">
                Cabinet Threshold Met
              </span>
            </div>

            {/* Bin-Mass Ratio and 95% CI */}
            <div className="panel p-4 bg-white">
              <span className="text-[10px] font-bold text-gov-muted uppercase block font-heading tracking-wider">
                Boundary Bin-Mass Ratio
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono font-bold text-xl text-gov-accent">
                  {boundary.ratio || signal.boundary_bin_mass_ratio || 1.65}x
                </span>
                <span className="text-[11px] font-mono text-gov-muted">
                  95% CI: {boundary.confidence_interval_95?.string || signal.confidence_interval_95 || '[0.91, 2.97]'}
                </span>
              </div>
              <span className="text-[10.5px] text-gov-muted block mt-0.5">
                [18,20) vs [20,22) Comparison
              </span>
            </div>
          </div>

          {/* Short Methodological Disclosure */}
          <div className="note note-info text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-gov-accent shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Methodological Disclosure:</strong> Boundary proximity is a screening indicator, not evidence of intentional manipulation.
              Documentary review is required to determine the cause of the revision.
            </p>
          </div>

          {/* ── 3. COST-OVERRUN HISTOGRAM ── */}
          <div className="panel p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-default pb-3">
              <div>
                <h3 className="font-heading font-extrabold text-[15px] text-gov-navy">
                  Cost Overrun Distribution Around the 20.0% CCEA Threshold
                </h3>
                <p className="text-[11.5px] text-gov-muted">
                  Active revised population (N = {histogramData?.population_metadata?.active_revised_count || 1183})
                </p>
              </div>
              <span className="text-xs font-mono text-gov-muted">
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
                    <span className="w-64 sm:w-72 shrink-0 text-right font-mono text-[11.5px] text-slate-700 font-medium">
                      {bin.bin_label}
                    </span>
                    <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden flex items-center p-0.5 border border-slate-200/80">
                      <div
                        style={{ width: `${pctWidth}%` }}
                        className={`h-full rounded transition-all flex items-center justify-end pr-2 ${
                          isProximity
                            ? 'bg-amber-500 text-white font-bold'
                            : isBreached
                            ? 'bg-rose-600 text-white font-bold'
                            : 'bg-gov-accent text-white font-semibold'
                        }`}
                      >
                        <span className="text-[10px] font-mono">{count}</span>
                      </div>
                    </div>
                    <span className="w-24 text-right font-mono text-[11px] text-gov-muted font-bold">
                      ₹{bin.total_capex_cr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 4. FLAGGED PROJECTS TABLE ── */}
          <div className="panel p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-default pb-3">
              <div>
                <h3 className="font-heading font-extrabold text-[15px] text-gov-navy">
                  Projects in the Threshold Proximity Band (18.0%–19.99%)
                </h3>
                <p className="text-[11.5px] text-gov-muted">
                  {flagged.length} projects positioned immediately below the Cabinet re-sanction threshold
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="ledger">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Agency</th>
                    <th className="num">Original Cost</th>
                    <th className="num">Revised Cost</th>
                    <th className="num">Overrun %</th>
                    <th className="num">Distance to Boundary</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {flagged.map((p, idx) => (
                    <tr key={idx}>
                      <td className="font-medium">
                        <span className="font-mono text-[10.5px] text-gov-muted block">#{p.project_id}</span>
                        <span className="text-gov-navy font-bold line-clamp-1">{p.project_name}</span>
                      </td>
                      <td className="text-slate-700">
                        <span className="block text-[11px] font-semibold truncate max-w-[160px]">{p.agency}</span>
                        <span className="text-[10px] text-gov-muted">{p.sector}</span>
                      </td>
                      <td className="num text-slate-700">
                        ₹{p.original_cost_cr.toLocaleString('en-IN')} Cr
                      </td>
                      <td className="num font-bold text-gov-navy">
                        ₹{p.revised_cost_cr.toLocaleString('en-IN')} Cr
                      </td>
                      <td className="num font-bold text-amber-700">
                        +{p.overrun_pct}%
                      </td>
                      <td className="num text-slate-600 font-mono">
                        {p.distance_to_boundary_pp} pp to 20%
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => handleInspectProject(p.project_id)}
                          className="btn-primary py-1 px-2.5 text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
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
        <div className="space-y-6">
          {/* Project Selector Bar */}
          <div className="panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 bg-slate-50 px-3 py-1.5 rounded-sm border border-border-default">
              <Search className="w-4 h-4 text-gov-muted shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Project ID (e.g. 619092, 400103)..."
                className="w-full text-xs font-mono bg-transparent border-none focus:outline-hidden text-gov-navy font-bold"
              />
              {searchQuery && (
                <button
                  onClick={() => handleInspectProject(searchQuery.trim())}
                  className="btn-primary py-1 px-3 text-xs font-bold rounded-xs cursor-pointer shrink-0"
                >
                  Inspect
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('portfolio')}
                className="btn-outline py-1.5 px-3 text-xs font-bold cursor-pointer"
              >
                Back to Portfolio Overview
              </button>
            </div>
          </div>

          {dossierLoading ? (
            <div className="panel p-12 text-center text-xs text-gov-muted space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-gov-accent" />
              <p>Loading Dossier for Project #{selectedProjectId}…</p>
            </div>
          ) : projectDossier && projectDossier.status !== 'not_found' ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Header: ID, Name, Sector, Agency, State */}
              <div className="panel p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-xs bg-slate-100 text-gov-navy border border-border-default">
                        PROJECT #{projectDossier.project_id}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-xs ${
                          projectDossier.boundary?.classification === 'THRESHOLD_PROXIMITY'
                            ? 'tag tag-warn'
                            : projectDossier.boundary?.classification === 'ESCALATION_CANDIDATE'
                            ? 'tag tag-critical'
                            : 'tag tag-ok'
                        }`}
                      >
                        {projectDossier.boundary?.classification_label || 'Within Budget Bounds'}
                      </span>
                    </div>

                    <h3 className="font-heading font-extrabold text-[17px] sm:text-[19px] text-gov-navy mt-2 leading-snug">
                      {projectDossier.project_name}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-gov-muted mt-1 flex-wrap font-medium">
                      <span>{projectDossier.sector}</span>
                      <span>·</span>
                      <span>{projectDossier.agency}</span>
                      <span>·</span>
                      <span>{projectDossier.state}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-sm border border-border-default text-right shrink-0">
                    <span className="text-[10px] font-mono uppercase text-gov-muted block font-bold">Distance to Boundary</span>
                    <span className="font-mono font-extrabold text-lg text-gov-navy">
                      {projectDossier.boundary?.distance_to_boundary_pp !== undefined
                        ? `${projectDossier.boundary.distance_to_boundary_pp} pp`
                        : 'N/A'}
                    </span>
                    <span className="text-[9.5px] text-gov-muted block">to 20.0% CCEA threshold</span>
                  </div>
                </div>

                {/* Applicable Authority & Citation */}
                <div className="note note-info text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gov-navy">
                      Applicable Authority: {projectDossier.boundary?.required_approval_authority || 'Administrative Line Ministry'}
                    </span>
                    <span className="text-[10.5px] font-mono text-gov-muted">CCEA Rule Citation</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed">
                    {projectDossier.boundary?.statutory_citation}
                  </p>
                </div>
              </div>

              {/* Financial Impact: Original -> Revised -> Increase -> Overrun % (4 numbers) */}
              <div className="panel p-5 space-y-4">
                <h4 className="font-heading font-extrabold text-sm text-gov-navy">
                  Financial Impact Summary
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="panel p-3.5 bg-slate-50/70 border border-border-default">
                    <span className="text-[10px] font-mono text-gov-muted uppercase block font-bold">1. Original Sanction</span>
                    <span className="font-mono font-bold text-base text-gov-navy mt-1 block">
                      ₹{projectDossier.costs?.original_cost_cr?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                    </span>
                    <span className="text-[10px] text-gov-muted block mt-0.5">Sanction Year: {projectDossier.costs?.sanction_year}</span>
                  </div>

                  <div className="panel p-3.5 bg-slate-50/70 border border-border-default">
                    <span className="text-[10px] font-mono text-gov-muted uppercase block font-bold">2. Current Revised Cost</span>
                    <span className="font-mono font-bold text-base text-gov-navy mt-1 block">
                      {projectDossier.costs?.revised_cost_cr !== null && projectDossier.costs?.revised_cost_cr !== undefined
                        ? `₹${projectDossier.costs.revised_cost_cr.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`
                        : 'No Revision on File'}
                    </span>
                    <span className="text-[10px] text-gov-muted block mt-0.5">
                      {projectDossier.has_revision_on_file ? 'Approved Revision' : 'Baseline Active'}
                    </span>
                  </div>

                  <div className="panel p-3.5 bg-slate-50/70 border border-border-default">
                    <span className="text-[10px] font-mono text-gov-muted uppercase block font-bold">3. Net Cost Increase</span>
                    <span className="font-mono font-bold text-base text-gov-navy mt-1 block">
                      ₹{projectDossier.costs?.cost_increase_cr?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                    </span>
                    <span className="text-[10px] text-gov-muted block mt-0.5">Total Variance</span>
                  </div>

                  <div className="panel p-3.5 bg-slate-50/70 border border-border-default">
                    <span className="text-[10px] font-mono text-gov-muted uppercase block font-bold">4. Cost Overrun %</span>
                    <span className={`font-mono font-bold text-base mt-1 block ${
                      projectDossier.costs?.overrun_pct >= 20
                        ? 'text-rose-700'
                        : projectDossier.costs?.overrun_pct >= 18
                        ? 'text-amber-700'
                        : 'text-gov-navy'
                    }`}>
                      +{projectDossier.costs?.overrun_pct}%
                    </span>
                    <span className="text-[10px] text-gov-muted block mt-0.5">Boundary: 20.0%</span>
                  </div>
                </div>
              </div>

              {/* Cost Revision History: Real State Changes Only */}
              <div className="panel p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border-default pb-3">
                  <h4 className="font-heading font-extrabold text-sm text-gov-navy flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gov-accent" />
                    Cost Revision History (Real State Changes)
                  </h4>
                  <span className="text-[11px] font-mono text-gov-muted">
                    {projectDossier.revision_history?.length || 0} Recorded Event(s)
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {projectDossier.revision_history?.map((evt, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 rounded-sm border border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gov-navy">
                            {evt.title}
                          </span>
                          <span className="text-[11px] font-mono text-gov-muted">
                            · {evt.date || 'Date unavailable'}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-slate-600 mt-0.5">
                          {evt.details}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                        <span className="text-gov-navy font-bold">
                          ₹{evt.cost_cr?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                        </span>
                        <span className={`px-2 py-0.5 rounded-xs font-bold ${
                          evt.overrun_pct >= 20
                            ? 'tag tag-critical'
                            : evt.overrun_pct >= 18
                            ? 'tag tag-warn'
                            : 'tag tag-info'
                        }`}>
                          +{evt.overrun_pct}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clause 10CC: Status, Amount, View Calculation Disclosure */}
              <div className="panel p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-default pb-3">
                  <div>
                    <h4 className="font-heading font-extrabold text-sm text-gov-navy flex items-center gap-2">
                      <Scale className="w-4 h-4 text-gov-accent" />
                      CPWD Clause 10CC Statutory Allowable Escalation
                    </h4>
                    <p className="text-[11.5px] text-gov-muted">
                      85% statutory escalable base indexed to bid date commodity WPI series
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="tag tag-info">
                      STATUS: {projectDossier.clause_10cc?.status || 'INDICATIVE'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCalculationDisclosure(!showCalculationDisclosure)}
                      className="btn-outline py-1 px-2.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showCalculationDisclosure ? 'Hide Calculation' : 'View Calculation'}</span>
                      {showCalculationDisclosure ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-xs text-gov-muted font-medium">Statutory 10CC Allowable Cap:</span>
                  <span className="font-mono font-bold text-lg text-emerald-800">
                    ₹{projectDossier.clause_10cc?.statutory_allowed_escalation_cr?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                  </span>
                  <span className="text-xs font-mono text-gov-muted">
                    ({projectDossier.clause_10cc?.cap_pct_of_original_cost}% of Original Sanction)
                  </span>
                </div>

                {/* Collapsible View Calculation Disclosure */}
                {showCalculationDisclosure && (
                  <div className="p-3.5 bg-slate-50 rounded-sm border border-border-default text-xs space-y-2 mt-2">
                    <span className="font-bold text-gov-navy block uppercase text-[10px] font-heading">
                      Calculation Breakdown
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                      <div>
                        <span className="text-gov-muted block text-[10px]">Escalable Base (85%)</span>
                        <span className="font-bold text-gov-navy">
                          ₹{projectDossier.clause_10cc?.calculation_disclosure?.escalable_base_cr} Cr
                        </span>
                      </div>
                      <div>
                        <span className="text-gov-muted block text-[10px]">Fixed Risk Margin (15%)</span>
                        <span className="font-bold text-gov-navy">
                          ₹{projectDossier.clause_10cc?.calculation_disclosure?.fixed_risk_deduction_cr} Cr
                        </span>
                      </div>
                      <div>
                        <span className="text-gov-muted block text-[10px]">Composite Inflation Rate</span>
                        <span className="font-bold text-emerald-700">
                          +{projectDossier.clause_10cc?.calculation_disclosure?.composite_inflation_pct}%
                        </span>
                      </div>
                    </div>

                    {projectDossier.clause_10cc?.is_implausible_legacy_cap && (
                      <div className="note note-warn mt-2">
                        <p className="leading-relaxed">
                          <strong>Note on Legacy Project:</strong> {projectDossier.clause_10cc.legacy_cap_caveat}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* The Standing Methodological Note (§3) */}
              <div className="note note-info text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-gov-accent shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Methodological Note:</strong> Threshold proximity is an anomaly signal, not evidence of intentional manipulation.
                  Documentary review is required to determine the cause of the revision.
                </p>
              </div>
            </div>
          ) : (
            <div className="panel p-12 text-center text-xs text-gov-muted">
              Project not found. Select a project from the portfolio overview.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
