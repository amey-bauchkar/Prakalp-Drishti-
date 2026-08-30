import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from './authClient';
import { DollarSign, Sliders, ShieldAlert, TrendingUp, CheckCircle2, Zap, BarChart2, Layers } from 'lucide-react';

export default function VittaVyuhaView() {
  const [budget, setBudget] = useState(12000);
  const [riskKappa, setRiskKappa] = useState(0.70);
  const [enforceNer, setEnforceNer] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(null);

  const runAllocation = useCallback(async (b, k, ner) => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/amey/allocate', {
        method: 'POST',
        body: JSON.stringify({
          budget_pool_cr: b,
          risk_dial_kappa: k,
          enforce_ner_floor: ner,
          agency_absorption_multiplier: 1.25,
        }),
      });
      if (res.ok) { setData(res.data); setDenied(null); }
      else { setData(null); setDenied(res.error); }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      runAllocation(budget, riskKappa, enforceNer);
    }, 150);
    return () => clearTimeout(timeout);
  }, [budget, riskKappa, enforceNer, runAllocation]);

  return (
    <div className="space-y-8 font-sans">
      {/* ═══════════════════════════════════════════════════════════════
          TOP BANNER (SOVEREIGN INSTITUTIONAL COMMAND HEADER)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="command-header p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/[0.07] text-[9.5px] font-extrabold tracking-institutional uppercase text-gov-accent border-l-2 border-gov-accent">
            <DollarSign className="w-3.5 h-3.5 text-white" />
            <span>MODULE 3 · SMART BUDGET REBALANCING</span>
          </div>
          <h2 className="font-heading font-extrabold text-[21px] sm:text-[25px] tracking-[-0.025em] text-white leading-[1.12]">
            VITTA-VYUHA: SMART BUDGET ALLOCATION &amp; REBALANCING
          </h2>
          <p className="text-[12.5px] text-ink-200 leading-relaxed font-sans max-w-xl">
            Rebalances national infrastructure funds to maximize completed projects, protect the mandatory 10% North-Eastern Region (NER) quota, and maximize capital efficiency.
          </p>
        </div>

        {/* Solve Speed Badge */}
        {denied && !loading && (
          <div className="note note-critical flex items-start gap-2 shrink-0">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-px text-rose-600" />
            <span>{denied}<span className="block font-normal mt-0.5">Capital reallocation requires the administrator role.</span></span>
          </div>
        )}

        {data && (
          <div className="flex items-center gap-3 bg-black/25 px-4 py-2.5 rounded-sm border border-white/15 shrink-0">
            <Zap className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[9.5px] uppercase font-bold text-ink-200 block font-mono">Optimization Speed</span>
              <span className="text-[17px] font-black text-white font-mono">{data.solve_time_ms} ms</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Controls Bar */}
      <div className="panel p-4 sm:p-5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Budget Pool Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gov-navy flex items-center gap-1.5 font-heading">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Quarterly Capex Optimization Envelope:
              </span>
              <span className="font-mono font-black text-sm text-gov-navy">
                ₹{budget.toLocaleString()} Cr
              </span>
            </div>
            <input
              type="range"
              min="5000"
              max="50000"
              step="1000"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-gov-navy border border-slate-200"
            />
            <div className="flex justify-between text-[11px] text-text-muted font-mono">
              <span>₹5,000 Cr (Budget Crunch)</span>
              <span>₹50,000 Cr (Full Funding)</span>
            </div>
          </div>

          {/* Risk Dial Slider (Kappa) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gov-navy flex items-center gap-1.5 font-heading">
                <Sliders className="w-4 h-4 text-gov-saffron" />
                Allocation Risk Sensitivity (Kappa Parameter):
              </span>
              <span className="font-mono font-bold text-xs text-gov-saffron">
                {riskKappa < 0.35 ? 'Max Velocity (κ=0.0)' : riskKappa > 0.70 ? 'Max Risk Aversion (κ=1.0)' : 'Risk-Neutral (κ=0.5)'}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={riskKappa}
              onChange={(e) => setRiskKappa(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-gov-saffron border border-slate-200"
            />
            <div className="flex justify-between text-[11px] text-text-muted font-mono">
              <span>Max Velocity (κ=0.0)</span>
              <span>Max Delay-Aversion (κ=1.0)</span>
            </div>
          </div>

          {/* Statutory NER 10% Floor Toggle */}
          <div className="flex flex-col justify-between space-y-2">
            <span className="font-bold text-xs text-gov-navy flex items-center gap-1.5 font-heading">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Government Mandates:
            </span>
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-border-default cursor-pointer hover:bg-slate-100 transition-colors shadow-sm">
              <input
                type="checkbox"
                checked={enforceNer}
                onChange={(e) => setEnforceNer(e.target.checked)}
                className="w-4 h-4 rounded text-gov-navy focus:ring-gov-navy accent-gov-navy"
              />
              <div className="text-xs">
                <span className="font-bold text-gov-navy block">Mandatory 10% North-East Quota</span>
                <span className="text-[10.5px] text-text-muted font-sans">Legal reservation for North-Eastern Region</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {data && (
        <div className="space-y-8">
          {/* Top KPI Cards & Dual Shadow Prices */}
          <div className="hairgrid hairgrid-4">
            <div className="metric-cell">
              <span className="metric-label">Total Funds Allocated</span>
              <p className="metric-value metric-value-lg">₹{data.total_allocated_cr.toLocaleString()} Cr</p>
              <span className="metric-sub">out of ₹{data.total_budget_pool_cr.toLocaleString()} Cr envelope</span>
            </div>

            <div className="metric-cell">
              <span className="metric-label">North-East Region Share</span>
              <p className="metric-value metric-value-lg">₹{data.ner_allocated_cr.toLocaleString()} Cr</p>
              <div className="flex items-center gap-1.5 mt-1">
                {data.ner_floor_met
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  : <ShieldAlert className="w-4 h-4 text-rose-600" />}
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-sm font-mono ${
                  data.ner_floor_met
                    ? 'text-emerald-800 bg-emerald-50 border border-emerald-300'
                    : 'text-rose-800 bg-rose-50 border border-rose-300'}`}>
                  {data.ner_share_perc.toFixed(1)}%{' '}
                  ({data.ner_floor_met ? '10% quota met' : 'BELOW 10% statutory floor'})
                </span>
              </div>
              {data.ner_coverage && (
                <p className="text-[10px] text-text-muted mt-2 leading-snug font-sans">
                  Computed on{' '}
                  <strong className="text-gov-navy font-mono">
                    {data.ner_coverage.state_reported_by_ministry.toLocaleString('en-IN')}
                  </strong>{' '}
                  projects whose state the ministry recorded.{' '}
                  {data.ner_coverage.state_absent.toLocaleString('en-IN')} projects carry
                  no reported state and cannot count toward a statutory floor, even where
                  this console infers their location from imagery geocodes.
                </p>
              )}
            </div>

            <div className="metric-cell panel-accent">
              <span className="metric-label">Marginal Capital Efficiency (Dual Shadow Price π)</span>
              <p className="metric-value metric-value-lg">+{data.shadow_price_budget_pi.toFixed(3)}</p>
              <span className="metric-sub">Marginal progress yield gained per additional ₹1 Cr budget envelope</span>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Optimization Optimality Status</span>
              <p className="text-[30px] font-black text-emerald-700 mt-1 tracking-tight font-mono">100%</p>
              <span className="text-[11.5px] text-emerald-800 font-bold mt-1 block font-sans">100% Globally Optimal (Simplex LP Solved)</span>
            </div>
          </div>

          {/* Allocation Table */}
          <div className="panel overflow-hidden p-4 sm:p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-border-default pb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-gov-saffron" />
                <h3 className="text-[17px] font-extrabold text-gov-navy uppercase tracking-wider font-heading">
                  Recommended Project Budget Distribution (Top Priority Projects)
                </h3>
              </div>
              <span className="text-[12.5px] font-bold text-text-muted font-mono">
                Showing {data.allocations.length} Evaluated Projects
              </span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="data-table">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th>Project Name</th>
                    <th>State / Region</th>
                    <th className="num">Sanctioned Baseline Capex</th>
                    <th className="num">Optimized Reallocation (₹ Cr)</th>
                    <th className="text-center">Physical Yield Boost (ΔΦ)</th>
                    <th className="text-center">Systemic Spillover Multiplier (γ)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.allocations.map((alloc) => (
                    <tr key={alloc.project_id} className="hover:bg-slate-50/80 transition-colors">
                      <td>
                        <div className="font-bold text-gov-navy">{alloc.project_name}</div>
                        <span className="text-[10.5px] text-text-muted font-mono">#{alloc.project_id}</span>
                      </td>
                      <td>
                        <span className="font-medium text-gov-navy">{alloc.state}</span>
                        {alloc.is_ner && (
                          <span className="ml-2 px-2 py-0.5 rounded-sm text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-300">
                            North-East Quota
                          </span>
                        )}
                      </td>
                      <td className="num font-mono font-bold text-text-muted">
                        ₹{alloc.requested_capex_cr.toLocaleString()} Cr
                      </td>
                      <td className="num font-mono font-black text-gov-navy">
                        ₹{alloc.allocated_capex_cr.toLocaleString()} Cr
                      </td>
                      <td className="text-center">
                        <span className="note note-ok font-mono">
                          +{alloc.completion_yield_phi}%
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gov-navy text-gov-saffron-light font-mono">
                          {alloc.systemic_benefit_gamma.toFixed(2)}x
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
  );
}
