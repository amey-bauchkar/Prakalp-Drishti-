import React, { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp, Search, Building2, X, AlertTriangle, Info,
  Landmark, ShieldQuestion, Layers,
} from 'lucide-react';

const API = 'http://127.0.0.1:8000';

/**
 * ARTHA-NIVARAN — Contractor 360.
 *
 * Presentation rule this view follows: measured project figures and indicative
 * financial ratios are never styled alike. Capex, overrun and slippage are
 * computed from all 2,207 rows and are shown as primary data. Debt-to-equity and
 * Altman Z are compiled reference values for the listed PSUs, so they carry a
 * visible basis tag and an unrated agency shows a dash rather than a plausible
 * placeholder.
 *
 * That matters more here than anywhere else in the console: roughly 90 of the 103
 * executing bodies have no published balance sheet, and a solvency dashboard that
 * quietly fills those in would be inventing the single most consequential number
 * on the screen.
 */

const TIER_STYLE = {
  PRIME_CASH_RICH: 'tag tag-ok',
  STABLE_INVESTMENT_GRADE: 'tag tag-warn',
  HIGH_LEVERAGE_STRESS: 'tag tag-critical',
  SOVEREIGN_DIRECT_BUDGET_LINE: 'tag tag-info',
  UNRATED: 'tag',
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
  const [activeProject, setActiveProject] = useState(null);

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
    if (selectedProjectId) {
      fetch(`/api/projects/${selectedProjectId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((p) => setActiveProject(p))
        .catch(() => {});
    }
  }, [selectedProjectId]);

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
    return <div className="panel p-6 text-center text-xs text-gov-muted">
      Loading executing-agency solvency directory…
    </div>;
  }
  if (!summary?.available) {
    return <div className="note note-warn">
      <span>ARTHA-NIVARAN unavailable. {summary?.reason}</span>
    </div>;
  }

  const dist = summary.portfolio_solvency_distribution || {};
  const cov = summary.solvency_coverage || {};
  const dd = summary.financial_delay_differential || {};

  return (
    <div className="space-y-5 font-sans">
      {/* ── Masthead ─────────────────────────────────────────────── */}
      <div className="command-header p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/[0.07] text-[9.5px] font-extrabold tracking-institutional uppercase text-gov-accent border-l-2 border-gov-accent">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>MODULE 3 · CONTRACTOR 360</span>
        </div>
        <h2 className="font-heading font-extrabold text-[21px] sm:text-[25px] tracking-[-0.025em] text-white leading-[1.12] mt-2">
          ARTHA-NIVARAN: EXECUTING-AGENCY SOLVENCY &amp; LEGAL EXPOSURE
        </h2>
        <p className="text-[12.5px] text-ink-200 leading-relaxed max-w-2xl mt-1.5">
          {summary.agency_count_note}
        </p>
      </div>

      {/* ── Macro telemetry ──────────────────────────────────────── */}
      <div className="hairgrid hairgrid-4">
        <div className="metric-cell">
          <span className="metric-label">Portfolio Capex Monitored</span>
          <span className="metric-value">{cr(summary.total_portfolio_capex_cr)}</span>
          <span className="metric-sub">{summary.total_projects} projects · {summary.distinct_agencies} agencies</span>
        </div>
        <div className="metric-cell panel-critical">
          <span className="metric-label">Capex at High-Leverage Stress</span>
          <span className="metric-value metric-neg">{cr(summary.total_capex_at_high_leverage_stress_cr)}</span>
          <span className="metric-sub">{summary.high_leverage_agency_count} agencies with D/E &gt; 2.0</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Observed Slip Differential</span>
          <span className={`metric-value ${dd.available ? 'metric-warn' : ''}`}>
            {dd.available ? `+${dd.observed_extra_slip_months} mo` : '—'}
          </span>
          <span className="metric-sub">
            {dd.available
              ? `${dd.high_leverage_mean_slip_months} vs ${dd.rated_stable_mean_slip_months} mo · n=${dd.n_high_leverage_projects}/${dd.n_rated_stable_projects}`
              : 'insufficient sample'}
          </span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Balance-Sheet Coverage</span>
          <span className="metric-value">{num(cov.capex_covered_pct, 1, '%')}</span>
          <span className="metric-sub">{cov.agencies_with_ratios} of {summary.distinct_agencies} agencies rated</span>
        </div>
      </div>

      {/* The differential is an association from a cross-section. Saying so next
          to the number is the difference between a finding and a claim. */}
      {dd.available && (
        <div className="note note-info">
          <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span><strong>How to read the slip differential.</strong> {dd.interpretation}</span>
        </div>
      )}

      {/* ── Tier distribution ────────────────────────────────────── */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title"><Layers className="w-3.5 h-3.5" />Portfolio Solvency Distribution</span>
          <span className="panel-meta">{cr(summary.total_portfolio_capex_cr)} across {summary.distinct_agencies} bodies</span>
        </div>
        <div className="panel-flush">
          <table className="ledger">
            <thead>
              <tr>
                <th>Solvency Tier</th>
                <th>Classification Rule</th>
                <th className="num">Agencies</th>
                <th className="num">Projects</th>
                <th className="num">Capex</th>
                <th className="num">Share</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(dist).map(([key, v]) => (
                <tr key={key}>
                  <td><span className={TIER_STYLE[key] || 'tag'}>{v.label}</span></td>
                  <td className="text-[10.5px] text-gov-muted max-w-md">{v.rule}</td>
                  <td className="num">{v.agency_count}</td>
                  <td className="num">{v.project_count}</td>
                  <td className="num">{cr(v.capex_cr)}</td>
                  <td className="num font-semibold">{v.capex_share_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="note note-warn">
        <ShieldQuestion className="w-3.5 h-3.5 shrink-0 mt-px" />
        <span><strong>Coverage.</strong> {cov.note}</span>
      </div>

      {/* ── Agency directory ─────────────────────────────────────── */}
      <div className="panel">
        <div className="panel-head flex-wrap gap-2">
          <span className="panel-title"><Building2 className="w-3.5 h-3.5" />Executing-Agency Directory</span>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="text-[10.5px] border border-gov-border rounded-sm px-1.5 py-1 bg-white text-gov-navy"
            >
              <option value="">All tiers</option>
              {Object.entries(dist).map(([k, v]) => (
                <option key={k} value={k}>{v.label} ({v.agency_count})</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 border border-gov-border rounded-sm px-2 bg-white">
              <Search className="w-3 h-3 text-gov-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search agency…"
                className="text-[11px] py-1 w-40 focus:outline-none font-mono"
              />
            </div>
            <span className="panel-meta">{filtered.length} shown</span>
          </div>
        </div>

        <div className="panel-flush overflow-x-auto max-h-[560px]">
          <table className="ledger">
            <thead>
              <tr>
                <th>Executing Agency</th>
                <th className="num">Projects</th>
                <th className="num">Active Capex</th>
                <th className="num">Mean Overrun</th>
                <th className="num">Mean Slip</th>
                <th className="num">Delay Rate</th>
                <th className="num">D/E</th>
                <th className="num">Altman Z</th>
                <th>Tier</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.agency_key}
                  onClick={() => openDrill(a)}
                  className="cursor-pointer"
                  title="Open the project drilldown for this agency"
                >
                  <td className="font-semibold text-gov-navy">{a.agency_name}</td>
                  <td className="num">{a.project_count}</td>
                  <td className="num">{cr(a.total_capex_cr)}</td>
                  <td className={`num ${a.mean_cost_overrun_pct > 40 ? 'text-rose-700 font-semibold' : ''}`}>
                    {num(a.mean_cost_overrun_pct, 1, '%')}
                  </td>
                  <td className="num">{num(a.mean_slip_months, 1, ' mo')}</td>
                  <td className="num">{num(a.delay_rate_pct, 0, '%')}</td>
                  {/* A dash here means "not published", never "zero". */}
                  <td className="num">{a.debt_to_equity == null ? '—' : a.debt_to_equity.toFixed(2)}</td>
                  <td className="num">{a.altman_z_score == null ? '—' : a.altman_z_score.toFixed(2)}</td>
                  <td>
                    <span className={TIER_STYLE[a.solvency_tier] || 'tag'}>
                      {a.solvency_tier_label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Drilldown ────────────────────────────────────────────── */}
      {drill && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/60 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setDrill(null)}
        >
          <div
            className="panel w-full max-w-5xl mt-10 shadow-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-head">
              <span className="panel-title">
                <Landmark className="w-3.5 h-3.5" />
                {drill.agency.agency_name}
              </span>
              <div className="flex items-center gap-2">
                <span className={TIER_STYLE[drill.agency.solvency_tier] || 'tag'}>
                  {drill.agency.solvency_tier_label}
                </span>
                <button onClick={() => setDrill(null)} className="text-gov-muted hover:text-rose-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="hairgrid hairgrid-4 border-0 rounded-none">
              <div className="metric-cell">
                <span className="metric-label">Projects</span>
                <span className="metric-value metric-value-sm">{drill.agency.project_count}</span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">Active Capex</span>
                <span className="metric-value metric-value-sm">{cr(drill.agency.total_capex_cr)}</span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">Mean Overrun</span>
                <span className="metric-value metric-value-sm">{num(drill.agency.mean_cost_overrun_pct, 1, '%')}</span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">Debt / Equity</span>
                <span className="metric-value metric-value-sm">
                  {drill.agency.debt_to_equity == null ? '—' : drill.agency.debt_to_equity.toFixed(2)}
                </span>
                <span className="metric-sub">
                  {drill.agency.data_basis === 'indicative_reference'
                    ? 'indicative reference figure'
                    : 'no published balance sheet'}
                </span>
              </div>
            </div>

            <div className="panel-flush overflow-x-auto max-h-[420px] border-t border-gov-border">
              {drill.loading ? (
                <p className="p-4 text-xs text-gov-muted">Loading projects…</p>
              ) : (
                <table className="ledger">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Sector</th>
                      <th className="num">Sanctioned</th>
                      <th className="num">Revised</th>
                      <th className="num">Overrun</th>
                      <th className="num">Slip</th>
                      <th className="num">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drill.projects.map((p) => (
                      <tr key={p.project_id}>
                        <td>
                          <span className="font-semibold text-gov-navy">{p.project_name}</span>
                          <span className="block text-[9.5px] font-mono text-gov-muted">#{p.project_id}</span>
                        </td>
                        <td className="text-[10.5px]">{p.sector}</td>
                        <td className="num">{cr(p.sanctioned_cr)}</td>
                        <td className="num">{cr(p.revised_cr)}</td>
                        <td className={`num ${p.cost_overrun_pct > 40 ? 'text-rose-700 font-semibold' : ''}`}>
                          {num(p.cost_overrun_pct, 1, '%')}
                        </td>
                        <td className="num">{num(p.slip_months, 0, ' mo')}</td>
                        <td className="num">{num(p.physical_progress_pct, 0, '%')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
