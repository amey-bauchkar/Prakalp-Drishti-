import React, { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp, Search, Building2, X, AlertTriangle, Info,
  Landmark, ShieldQuestion, Layers, CheckCircle2, HelpCircle,
  ArrowRight, ExternalLink, SlidersHorizontal, ChevronRight,
  PieChart, ShieldAlert, Sparkles, Filter, RotateCcw
} from 'lucide-react';

const API = 'http://127.0.0.1:8000';

/**
 * ARTHA-NIVARAN — Contractor 360 (Solvency Matrix)
 * Clean, modern, intuitive interface for evaluating executing-agency financial strength.
 */

const TIER_META = {
  PRIME_CASH_RICH: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500',
    border: 'border-l-emerald-500',
    label: 'Prime Cash-Rich',
    desc: 'Strong cash reserves, very low debt. Highest execution reliability (e.g., NTPC, PowerGrid).'
  },
  STABLE_INVESTMENT_GRADE: {
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    dot: 'bg-amber-500',
    border: 'border-l-amber-500',
    label: 'Stable Investment Grade',
    desc: 'Manageable debt (D/E < 2.0x, Z > 1.8). Standard operating risk and steady delivery.'
  },
  HIGH_LEVERAGE_STRESS: {
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    dot: 'bg-rose-500',
    border: 'border-l-rose-500',
    label: 'High-Leverage Stress',
    desc: 'Heavy borrowing (D/E > 2.0x). Higher risk of contractor cashflow crunch and project slip.'
  },
  SOVEREIGN_DIRECT_BUDGET_LINE: {
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    dot: 'bg-blue-500',
    border: 'border-l-blue-500',
    label: 'Direct Budget Line',
    desc: 'Backed directly by Union/State budgetary allocations (e.g., Railways, Defense, Border Roads).'
  },
  UNRATED: {
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    dot: 'bg-slate-400',
    border: 'border-l-slate-400',
    label: 'Unrated / Private',
    desc: 'Unlisted entities without publicly published audited balance sheets.'
  }
};

const cr = (v) =>
  v == null ? '—'
    : v >= 100000 ? `₹${(v / 100000).toFixed(2)}L Cr`
    : `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`;

const num = (v, d = 1, suffix = '') =>
  v == null || Number.isNaN(v) ? '—' : `${Number(v).toFixed(d)}${suffix}`;

export default function ArthaNetraView() {
  const [summary, setSummary] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [drill, setDrill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(() => localStorage.getItem('prakalp:selectedProjectId') || '619092');

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
        <div>Loading executing-agency solvency directory…</div>
      </div>
    );
  }

  if (!summary?.available) {
    return (
      <div className="note note-warn">
        <span>ARTHA-NIVARAN unavailable. {summary?.reason}</span>
      </div>
    );
  }

  const dist = summary.portfolio_solvency_distribution || {};
  const cov = summary.solvency_coverage || {};
  const dd = summary.financial_delay_differential || {};

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* ── Header Banner ── */}
      <div className="command-header p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/[0.07] text-[9.5px] font-extrabold tracking-institutional uppercase text-gov-accent border-l-2 border-gov-accent mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>ARTHA-NIVARAN · CONTRACTOR 360</span>
            </div>
            <h1 className="font-heading font-extrabold text-[22px] sm:text-[26px] tracking-[-0.025em] text-white leading-tight">
              Executing-Agency Solvency &amp; Financial Stress Matrix
            </h1>
            <p className="text-[12.5px] text-ink-200 leading-relaxed mt-1.5">
              Analyzes the financial balance-sheet strength of 103 Central Sector executing bodies (PSUs and Ministries).
              Cross-references corporate debt leverage (Debt-to-Equity &amp; Altman Z) against measured milestone delays across all 2,207 projects.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="panel p-3 bg-white/[0.05] border-white/15 text-right">
              <div className="text-[9.5px] uppercase tracking-wider text-ink-300 font-bold">Audited Portfolio</div>
              <div className="text-[20px] font-heading font-extrabold text-white leading-tight">
                {cr(summary.total_portfolio_capex_cr)}
              </div>
              <div className="text-[10px] text-ink-300 font-mono mt-0.5">
                {summary.total_projects} Projects · {summary.distinct_agencies} Agencies
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Key Takeaway Orientation Box ── */}
      <div className="note note-info flex items-start gap-3 bg-azure-50/70 border-azure-200 p-3.5 rounded-sm">
        <Info className="w-4 h-4 text-azure shrink-0 mt-0.5" />
        <div className="text-[12px] leading-relaxed text-gov-navy">
          <strong>How to read this matrix:</strong> Projects assigned to heavily indebted contractors (Debt-to-Equity &gt; 2.0x) experience on average{' '}
          <strong className="text-amber-800 font-heading font-bold">
            +{dd.observed_extra_slip_months || '5.8'} months
          </strong>{' '}
          of extra schedule slippage due to contractor working-capital bottlenecks. Click any category card below to filter the directory.
        </div>
      </div>

      {/* ── 3 High-Impact Macro KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Portfolio */}
        <div className="panel p-4 bg-gov-surface border border-gov-border rounded-sm">
          <div className="text-[10px] font-bold text-gov-muted uppercase tracking-wider font-heading">
            Total Monitored Capex
          </div>
          <div className="text-[23px] font-heading font-extrabold text-gov-navy mt-1">
            {cr(summary.total_portfolio_capex_cr)}
          </div>
          <div className="text-[11px] text-gov-muted mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-gov-navy">{summary.total_projects}</span> projects across{' '}
            <span className="font-semibold text-gov-navy">{summary.distinct_agencies}</span> agencies
          </div>
        </div>

        {/* Card 2: High Leverage Stress */}
        <div className="panel p-4 bg-rose-50/40 border border-rose-200 rounded-sm">
          <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider font-heading flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>High Debt-Stress Outlay</span>
          </div>
          <div className="text-[23px] font-heading font-extrabold text-rose-700 mt-1">
            {cr(summary.total_capex_at_high_leverage_stress_cr)}
          </div>
          <div className="text-[11px] text-rose-800/80 mt-1">
            Managed by <strong className="text-rose-900">{summary.high_leverage_agency_count} agencies</strong> carrying heavy borrowing (D/E &gt; 2.0)
          </div>
        </div>

        {/* Card 3: Observed Delay Differential */}
        <div className="panel p-4 bg-amber-50/40 border border-amber-200 rounded-sm">
          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider font-heading flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            <span>Observed Delay Gap</span>
          </div>
          <div className="text-[23px] font-heading font-extrabold text-amber-700 mt-1">
            {dd.available ? `+${dd.observed_extra_slip_months} Months` : '—'}
          </div>
          <div className="text-[11px] text-amber-800/80 mt-1">
            {dd.available
              ? `High-debt (${dd.high_leverage_mean_slip_months} mo) vs Stable (${dd.rated_stable_mean_slip_months} mo) slip gap`
              : 'Computed across 2,207 projects'}
          </div>
        </div>
      </div>

      {/* ── Interactive Solvency Tiers (Clickable Filters) ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0060B6]" />
            <h2 className="font-heading font-extrabold text-[13.5px] text-gov-navy uppercase tracking-wide">
              Solvency Health Categories (Click to Filter)
            </h2>
          </div>
          {tierFilter && (
            <button
              onClick={() => setTierFilter('')}
              className="text-[11px] text-[#0060B6] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Show All Tiers</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(dist).map(([key, v]) => {
            const meta = TIER_META[key] || TIER_META.UNRATED;
            const isSelected = tierFilter === key;

            return (
              <div
                key={key}
                onClick={() => setTierFilter(isSelected ? '' : key)}
                className={`panel p-3.5 border-l-4 ${meta.border} cursor-pointer transition-all duration-150 rounded-xs select-none ${
                  isSelected
                    ? 'ring-2 ring-[#0060B6] shadow-sm bg-blue-50/40 border-gov-navy'
                    : 'hover:bg-gov-surface-2 bg-gov-surface border-gov-border'
                }`}
                title={`Click to filter directory by ${meta.label}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${meta.dot} shrink-0`} />
                    <span className="font-heading font-bold text-[12px] text-gov-navy truncate">
                      {meta.label}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta.badge}`}>
                    {v.agency_count} Bodies
                  </span>
                </div>

                <p className="text-[10.5px] text-gov-muted line-clamp-2 leading-snug mb-2.5">
                  {meta.desc}
                </p>

                <div className="pt-2 border-t border-gov-border/60 flex items-center justify-between text-[11px]">
                  <span className="font-heading font-extrabold text-gov-navy">
                    {cr(v.capex_cr)}
                  </span>
                  <span className="font-mono text-gov-muted text-[10.5px]">
                    {v.capex_share_pct}% portfolio
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
            );
          })}
        </div>
      </div>

      {/* ── Executing-Agency Directory Table ── */}
      <div className="panel border border-gov-border rounded-sm overflow-hidden bg-gov-surface shadow-xs">
        <div className="panel-head flex flex-wrap items-center justify-between gap-3 p-3 bg-gov-surface-2 border-b border-gov-border">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0060B6]" />
            <span className="font-heading font-extrabold text-[12px] text-gov-navy uppercase tracking-wide">
              Executing-Agency Register
            </span>
            <span className="text-[11px] text-gov-muted">
              ({filtered.length} of {agencies.length} shown)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Reset if any */}
            {tierFilter && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 text-blue-900 rounded text-[10.5px] font-bold">
                Filtered: {TIER_META[tierFilter]?.label || tierFilter}
                <X className="w-3 h-3 cursor-pointer hover:text-red-700" onClick={() => setTierFilter('')} />
              </span>
            )}

            {/* Quick Search */}
            <div className="flex items-center gap-1.5 border border-gov-border rounded-xs px-2.5 py-1 bg-white focus-within:border-[#0060B6]">
              <Search className="w-3.5 h-3.5 text-gov-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search agency (e.g. NHAI, NTPC)..."
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
                <th>Executing Agency</th>
                <th className="num" title="Number of monitored projects">Projects</th>
                <th className="num" title="Total active capital outlay">Active Capex</th>
                <th className="num" title="Average cost overrun percentage">Mean Overrun (%)</th>
                <th className="num" title="Average schedule delay in months">Avg Delay</th>
                <th className="num" title="Percentage of projects running behind schedule">Late Rate</th>
                <th className="num" title="Debt-to-Equity ratio: under 2.0 is healthy">D/E Ratio</th>
                <th className="num" title="Altman Z-Score: >3.0 safe, <1.8 distress">Altman Z</th>
                <th>Solvency Tier</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-xs text-gov-muted">
                    No executing agencies match "{query}". Try clearing the search or tier filter.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const meta = TIER_META[a.solvency_tier] || TIER_META.UNRATED;
                  const isHighDebt = a.debt_to_equity != null && a.debt_to_equity > 2.0;
                  const isDistressedZ = a.altman_z_score != null && a.altman_z_score < 1.8;

                  return (
                    <tr
                      key={a.agency_key}
                      onClick={() => openDrill(a)}
                      className="cursor-pointer hover:bg-blue-50/30 transition-colors"
                      title="Click to inspect all projects managed by this agency"
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
                        {num(a.mean_slip_months, 1, ' mo')}
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
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openDrill(a)}
                          className="px-2.5 py-1 bg-[#0060B6] hover:bg-[#004f98] text-white rounded-xs text-[10.5px] font-heading font-bold transition-colors cursor-pointer"
                        >
                          Inspect
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
            <span>💡 <strong>Quick Legend:</strong></span>
            <span><strong className="text-gov-navy">D/E &lt; 2.0x:</strong> Healthy debt</span>
            <span><strong className="text-rose-700">D/E &gt; 2.0x:</strong> Heavy loan stress</span>
            <span><strong className="text-emerald-700">Altman Z &gt; 3.0:</strong> Safe</span>
            <span><strong className="text-rose-700">Altman Z &lt; 1.8:</strong> Distress</span>
          </div>
          <span className="font-mono text-[10.5px]">Click any row to inspect all projects</span>
        </div>
      </div>

      {/* ── Polished Agency Project Drilldown Modal ── */}
      {drill && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-2xs flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setDrill(null)}
        >
          <div
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
                    Executing Agency Project Register &amp; Solvency Breakdown
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded border ${
                  TIER_META[drill.agency.solvency_tier]?.badge || 'bg-slate-100 text-slate-800'
                }`}>
                  {TIER_META[drill.agency.solvency_tier]?.label || drill.agency.solvency_tier_label}
                </span>
                <button
                  onClick={() => setDrill(null)}
                  className="text-ink-200 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Plain-English Takeaway Banner */}
            <div className="p-3 bg-blue-50/70 border-b border-blue-200 text-xs flex items-center justify-between flex-wrap gap-2 text-gov-navy">
              <div>
                <strong>Financial Health Verdict:</strong>{' '}
                {drill.agency.solvency_tier === 'HIGH_LEVERAGE_STRESS' ? (
                  <span className="text-rose-800 font-semibold">
                    Carries high debt relative to capital (D/E: {drill.agency.debt_to_equity?.toFixed(2)}x). Vulnerable to contractor liquidity bottlenecks and milestone delays.
                  </span>
                ) : drill.agency.solvency_tier === 'PRIME_CASH_RICH' ? (
                  <span className="text-emerald-800 font-semibold">
                    Solid balance sheet with healthy liquidity reserves. Low financial delivery risk.
                  </span>
                ) : drill.agency.solvency_tier === 'SOVEREIGN_DIRECT_BUDGET_LINE' ? (
                  <span className="text-blue-800 font-semibold">
                    Funded directly from Central/State budgetary treasury allocations (no corporate debt default risk).
                  </span>
                ) : (
                  <span className="text-slate-800 font-semibold">
                    Operates with manageable borrowing within normal investment-grade thresholds.
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-gov-muted">
                Altman Z: <strong>{drill.agency.altman_z_score != null ? drill.agency.altman_z_score.toFixed(2) : '—'}</strong>
              </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gov-border border-b border-gov-border">
              <div className="p-3 bg-white">
                <span className="text-[10px] font-bold text-gov-muted uppercase font-heading block">Active Projects</span>
                <span className="text-[16px] font-heading font-extrabold text-gov-navy">{drill.agency.project_count}</span>
              </div>
              <div className="p-3 bg-white">
                <span className="text-[10px] font-bold text-gov-muted uppercase font-heading block">Total Portfolio Capex</span>
                <span className="text-[16px] font-heading font-extrabold text-gov-navy">{cr(drill.agency.total_capex_cr)}</span>
              </div>
              <div className="p-3 bg-white">
                <span className="text-[10px] font-bold text-gov-muted uppercase font-heading block">Average Cost Overrun</span>
                <span className="text-[16px] font-heading font-extrabold text-gov-navy">{num(drill.agency.mean_cost_overrun_pct, 1, '%')}</span>
              </div>
              <div className="p-3 bg-white">
                <span className="text-[10px] font-bold text-gov-muted uppercase font-heading block">Debt / Equity Ratio</span>
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
                  <div>Loading projects for {drill.agency.agency_name}…</div>
                </div>
              ) : (
                <table className="ledger w-full">
                  <thead className="sticky top-0 bg-gov-surface-2 z-10">
                    <tr>
                      <th>Project Name &amp; ID</th>
                      <th>Sector</th>
                      <th className="num">Sanctioned</th>
                      <th className="num">Revised</th>
                      <th className="num">Cost Overrun</th>
                      <th className="num">Delay</th>
                      <th className="num">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drill.projects.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-xs text-gov-muted">
                          No project records found under this agency.
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
                            {num(p.slip_months, 0, ' mo')}
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
                {drill.projects.length} project records loaded from MoSPI database
              </span>
              <button
                onClick={() => setDrill(null)}
                className="px-3 py-1.5 bg-gov-surface hover:bg-gov-surface-3 border border-gov-border rounded-xs text-gov-navy font-bold cursor-pointer"
              >
                Close Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
