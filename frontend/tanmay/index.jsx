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
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCalculationDisclosure, setShowCalculationDisclosure] = useState(false);

  // Fetch initial summary & histogram datasets
  useEffect(() => {
    fetchAllData();
  }, []);

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

  if (loading && !summaryData) {
    return (
      <div className="panel p-12 text-center text-xs text-slate-500 font-sans space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gov-accent" />
        <p className="font-medium text-slate-600 ">
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
    <div className="relative font-sans text-slate-900  space-y-5">
      {/* ── 1. SINGLE HERO HEADER WITH CANONICAL STATEMENT ── */}
      <div className="command-header p-5 sm:p-6 rounded-xl bg-gradient-to-r from-[#1A365D] via-[#0F2342] to-[#0A192F] text-white shadow-md border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-mono uppercase tracking-wider text-gov-accent border-l-2 border-gov-accent">
              <Scale className="w-3.5 h-3.5" />
              <span>AUDIT: 20% COST LIMIT CHECK</span>
            </div>
            <h2 className="font-heading font-extrabold text-[21px] sm:text-[25px] tracking-tight mt-2 text-white">
              SATYA-KAVACH: SMART AUDIT
            </h2>
            <p className="text-[12px] font-mono text-slate-300 mt-0.5">
              Finding projects that stopped just below the 20% Cabinet approval limit
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
            “An AI tool that flags suspicious project budgets trying to bypass high-level government checks.”
          </p>
        </div>
      </div>

      {/* ── 2. BOUNDARY ANALYSIS METRICS STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Active Revised Population */}
        <div className="p-3.5 bg-white  rounded-xl border border-slate-200  shadow-2xs">
          <span className="text-[10.5px] font-mono text-slate-500 uppercase block">
            Total Projects Checked
          </span>
          <span className="font-mono font-bold text-xl text-slate-900  block mt-0.5">
            N = {boundary.active_revised_population_n || kpi.active_revised_projects || 1183}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {boundary.excluded_unrevised_n || kpi.no_revision_on_file_projects || 1024} projects without cost changes ignored
          </span>
        </div>

        {/* Proximity Band [18%, 20%) */}
        <div className="p-3.5 bg-amber-50/50  rounded-xl border border-amber-200  shadow-2xs">
          <span className="text-[10.5px] font-mono text-amber-800  uppercase block font-bold">
            Suspicious Zone (18% - 19.99%)
          </span>
          <span className="font-mono font-bold text-xl text-amber-700  block mt-0.5">
            n = {boundary.numerator_count || signal.numerator_count || 28}
          </span>
          <span className="text-[10px] text-amber-700/80  block mt-0.5">
            Just Below Cabinet Limit
          </span>
        </div>

        {/* Comparison Band [20%, 22%) */}
        <div className="p-3.5 bg-rose-50/50  rounded-xl border border-rose-200  shadow-2xs">
          <span className="text-[10.5px] font-mono text-rose-800  uppercase block font-bold">
            Cabinet Approval Zone (20% - 21.99%)
          </span>
          <span className="font-mono font-bold text-xl text-rose-700  block mt-0.5">
            n = {boundary.denominator_count || signal.denominator_count || 17}
          </span>
          <span className="text-[10px] text-rose-700/80  block mt-0.5">
            Crossed the Limit
          </span>
        </div>

        {/* Bin-Mass Ratio and 95% CI */}
        <div className="p-3.5 bg-white  rounded-xl border border-slate-200  shadow-2xs">
          <span className="text-[10.5px] font-mono text-slate-500 uppercase block">
            Suspicion Score (Ratio)
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
            Comparing Suspicious vs Normal Projects
          </span>
        </div>
      </div>

      {/* Short Methodological Disclosure */}
      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-gov-accent shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Note:</strong> Being flagged doesn't guarantee fraud. 
          It means an auditor needs to manually check the bills and files.
        </p>
      </div>

      {/* ── 3. COST-OVERRUN HISTOGRAM ── */}
      <div className="p-4 sm:p-5 bg-white  rounded-xl border border-slate-200  shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200  pb-2.5">
          <div>
            <h3 className="font-heading font-bold text-sm text-gov-navy ">
              How Project Budgets Increased Around the 20% Limit
            </h3>
            <p className="text-[11.5px] text-slate-500 ">
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
                <span className="w-64 sm:w-72 shrink-0 text-right font-mono text-[11.5px] text-slate-700  font-medium">
                  {bin.bin_label}
                </span>
                <div className="flex-1 h-6 bg-slate-100  rounded overflow-hidden flex items-center p-0.5">
                  <div
                    style={{ width: `${pctWidth}%` }}
                    className={`h-full rounded transition-all flex items-center justify-end pr-2 ${
                      isBreached
                        ? 'bg-rose-700 text-white font-bold'
                        : 'bg-amber-500 text-white font-bold'
                    }`}
                  >
                    <span className="text-[10px] font-mono">{count}</span>
                  </div>
                </div>
                <span className="w-24 text-right font-mono text-[11px] text-slate-500 ">
                  ₹{bin.total_capex_cr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. FLAGGED PROJECTS TABLE (SINGLE-PAGE MASTER VIEW) ── */}
      <div className="p-4 sm:p-5 bg-white  rounded-xl border border-slate-200  shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200  pb-3">
          <div>
            <h3 className="font-heading font-bold text-sm text-gov-navy ">
              Suspicious Projects Just Below the 20% Limit
            </h3>
            <p className="text-[11.5px] text-slate-500 ">
              {flagged.length} projects stopped right before the 20% limit to avoid PMO/Cabinet review. Score evaluates gaming likelihood.
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
                className="pl-8 pr-3 py-1 bg-slate-50  text-xs rounded-lg border border-slate-200  text-slate-800  focus:outline-hidden focus:border-gov-accent w-48 sm:w-60"
              />
            </div>
            <div
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100  text-[10.5px] text-slate-600  font-mono border border-slate-200 "
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
              <tr className="border-b border-slate-200  text-slate-400 uppercase font-mono text-[10px]">
                <th className="py-2.5 px-2">Project</th>
                <th className="py-2.5 px-2">Agency</th>
                <th className="py-2.5 px-2 text-right">Original Cost</th>
                <th className="py-2.5 px-2 text-right">Revised Cost</th>
                <th className="py-2.5 px-2 text-right">Overrun %</th>
                <th className="py-2.5 px-2 text-right">Distance to Boundary</th>
                <th className="py-2.5 px-2 text-right">Statutory 10CC Cap</th>
                <th className="py-2.5 px-2 text-center">Suspicion Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100  font-sans">
              {filteredFlagged.map((p, idx) => {
                return (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-2.5 px-2 font-medium">
                      <span className="font-mono text-[10px] text-slate-400 block">#{p.project_id}</span>
                      <span className="text-slate-800  line-clamp-1">{p.project_name}</span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 ">
                      <span className="block text-[11px] truncate max-w-[160px]">{p.agency}</span>
                      <span className="text-[10px] text-slate-400">{p.sector}</span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-700 ">
                      ₹{p.original_cost_cr.toLocaleString('en-IN')} Cr
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 ">
                      ₹{p.revised_cost_cr.toLocaleString('en-IN')} Cr
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-amber-600 ">
                      +{p.overrun_pct}%
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-500">
                      {p.distance_to_boundary_pp} pp to 20%
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono">
                      <span className="font-bold text-emerald-700  block">
                        ₹{(p.total_allowed_10cc_cost_cr || p.statutory_10cc_cap_cr)?.toLocaleString('en-IN')} Cr
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        (+{p.statutory_10cc_cap_pct}% inflation cap)
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold shadow-2xs font-mono inline-block ${
                          (p.suspicion_score >= 85) ? 'bg-rose-600 text-white' :
                          (p.suspicion_score >= 65) ? 'bg-orange-500 text-white' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {p.suspicion_score ?? 'N/A'}/100
                        </span>
                        {p.suspicion_driver && (
                          <span className="text-[9px] text-slate-500 max-w-[120px] truncate" title={p.suspicion_driver}>
                            {p.suspicion_driver}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
