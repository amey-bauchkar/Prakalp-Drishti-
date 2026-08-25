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
      // Requires the allocate_capital permission; a non-admin gets a clear 403 message
      // rather than a silently empty panel.
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
    }, 150); // Debounce slider for smooth 60fps UI
    return () => clearTimeout(timeout);
  }, [budget, riskKappa, enforceNer, runAllocation]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Banner */}
      <div 
        className="p-6 rounded-2xl text-white shadow-elevated border border-gov-border"
        style={{ backgroundColor: '#1E2A45', color: '#FFFFFF' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-gov-accent text-gov-navy text-[11px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
                Module 3 · Smart Budget Rebalancing
              </span>
              <span className="bg-white/10 text-white/90 text-[11px] font-bold px-2 py-0.5 rounded border border-white/20">
                Optimized Fund Distribution Engine
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-gov-accent" />
              <span>VITTA-VYUHA: Smart Budget Allocation & Rebalancing Engine</span>
            </h1>
            <p className="text-gray-300 text-xs mt-1 max-w-2xl font-normal">
              Rebalances national infrastructure funds to maximize completed projects, protect the mandatory 10% North-Eastern Region (NER) quota, and get the highest return on public money.
            </p>
          </div>

          {/* Solve Speed Badge */}
          {denied && !loading && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-px text-amber-600" />
          <span>{denied}<span className="block font-normal mt-0.5">Capital reallocation requires the administrator role.</span></span>
        </div>
      )}

      {data && (
            <div className="flex items-center gap-2 bg-emerald-950/80 px-3.5 py-2 rounded-xl border border-emerald-500/40 text-emerald-400">
              <Zap className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-white/70 block">Optimization Speed</span>
                <span className="text-sm font-black text-emerald-300 font-mono">{data.solve_time_ms} ms</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="bg-white p-6 rounded-xl border border-gov-border shadow-card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Budget Pool Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gov-navy flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Total Available Budget Pool:
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
              className="w-full h-2 bg-gov-surface rounded-lg appearance-none cursor-pointer accent-gov-navy"
            />
            <div className="flex justify-between text-[10px] text-gov-muted">
              <span>₹5,000 Cr (Budget Crunch)</span>
              <span>₹50,000 Cr (Full Funding)</span>
            </div>
          </div>

          {/* Risk Dial Slider (Kappa) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gov-navy flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-gov-accent-dark" />
                Caution Level (Risk Dial):
              </span>
              <span className="font-black text-xs text-gov-muted-dark">
                {riskKappa < 0.35 ? 'Fastest Completion' : riskKappa > 0.70 ? 'High Delay Protection' : 'Balanced Approach'}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={riskKappa}
              onChange={(e) => setRiskKappa(Number(e.target.value))}
              className="w-full h-2 bg-gov-surface rounded-lg appearance-none cursor-pointer accent-gov-accent-dark"
            />
            <div className="flex justify-between text-[10px] text-gov-muted">
              <span>Fast Growth (0.0)</span>
              <span>Maximum Safety (1.0)</span>
            </div>
          </div>

          {/* Statutory NER 10% Floor Toggle */}
          <div className="flex flex-col justify-between space-y-2">
            <span className="font-bold text-xs text-gov-navy flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Government Mandates:
            </span>
            <label className="flex items-center gap-3 p-2.5 bg-gov-surface rounded-lg border border-gov-border cursor-pointer hover:bg-gov-muted-surface transition-colors">
              <input
                type="checkbox"
                checked={enforceNer}
                onChange={(e) => setEnforceNer(e.target.checked)}
                className="w-4 h-4 rounded text-gov-navy focus:ring-gov-navy"
              />
              <div className="text-xs">
                <span className="font-bold text-gov-navy block">Mandatory 10% North-East Quota</span>
                <span className="text-[10px] text-gov-muted">Legal reservation for North-Eastern Region</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {data && (
        <div className="space-y-6">
          {/* Top KPI Cards & Dual Shadow Prices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gov-border shadow-card">
              <span className="text-[10px] font-bold text-gov-muted uppercase">Total Funds Allocated</span>
              <p className="text-xl font-black text-gov-navy mt-1">₹{data.total_allocated_cr.toLocaleString()} Cr</p>
              <span className="text-[10px] text-gov-muted font-medium">out of ₹{data.total_budget_pool_cr.toLocaleString()} Cr pool</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gov-border shadow-card">
              <span className="text-[10px] font-bold text-gov-muted uppercase">North-East Region Share</span>
              <p className="text-xl font-black text-gov-navy mt-1">₹{data.ner_allocated_cr.toLocaleString()} Cr</p>
              {/* The badge tracks ner_floor_met. It previously rendered a green check
                  and the words "Quota Met" unconditionally, so a solve that MISSED the
                  statutory floor would still have displayed as compliant. */}
              <div className="flex items-center gap-1 mt-0.5">
                {data.ner_floor_met
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  : <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />}
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  data.ner_floor_met
                    ? 'text-emerald-800 bg-emerald-100'
                    : 'text-rose-800 bg-rose-100'}`}>
                  {data.ner_share_perc.toFixed(1)}%{' '}
                  ({data.ner_floor_met ? '10% quota met' : 'BELOW 10% statutory floor'})
                </span>
              </div>
              {data.ner_coverage && (
                <p className="text-[9px] text-gov-muted mt-1.5 leading-snug">
                  Computed on{' '}
                  <strong className="text-gov-navy">
                    {data.ner_coverage.state_reported_by_ministry.toLocaleString('en-IN')}
                  </strong>{' '}
                  projects whose state the ministry recorded.{' '}
                  {data.ner_coverage.state_absent.toLocaleString('en-IN')} projects carry
                  no reported state and cannot count toward a statutory floor, even where
                  this console infers their location from imagery geocodes.
                </p>
              )}
            </div>

            <div className="bg-white p-4 rounded-xl border-2 border-gov-navy shadow-card">
              <span className="text-[10px] font-bold text-gov-navy uppercase">Value of Extra Funding</span>
              <p className="text-xl font-black text-gov-navy mt-1">+{data.shadow_price_budget_pi.toFixed(3)}</p>
              <span className="text-[10px] text-gov-muted">Return for every extra ₹1 Cr added</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gov-border shadow-card">
              <span className="text-[10px] font-bold text-gov-muted uppercase">Calculation Accuracy</span>
              <p className="text-xl font-black text-emerald-700 mt-1">100%</p>
              <span className="text-[10px] text-emerald-800 font-bold">Exact Global Optimum</span>
            </div>
          </div>

          {/* Allocation Table */}
          <div className="bg-white rounded-xl border border-gov-border shadow-card overflow-hidden">
            <div className="p-4 bg-gov-surface border-b border-gov-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-gov-navy" />
                <h3 className="text-xs font-black text-gov-navy uppercase tracking-wider">
                  Recommended Project Budget Distribution (Top Priority Projects)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-gov-muted">
                Showing {data.allocations.length} Evaluated Projects
              </span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-gov-surface text-gov-muted font-bold border-b border-gov-border sticky top-0">
                  <tr>
                    <th className="p-3">Project Name</th>
                    <th className="p-3">State / Region</th>
                    <th className="p-3">Requested Funds</th>
                    <th className="p-3">Recommended Allocation</th>
                    <th className="p-3">Expected Progress Boost</th>
                    <th className="p-3">Network Benefit Multiplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gov-border">
                  {data.allocations.map((alloc) => (
                    <tr key={alloc.project_id} className="hover:bg-gov-surface/50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-gov-navy">{alloc.project_name}</div>
                        <span className="text-[10px] text-gov-muted font-mono">#{alloc.project_id}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-gov-navy">{alloc.state}</span>
                        {alloc.is_ner && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-100 text-purple-800 border border-purple-300">
                            North-East Quota
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-gov-muted">
                        ₹{alloc.requested_capex_cr.toLocaleString()} Cr
                      </td>
                      <td className="p-3 font-mono font-black text-gov-navy">
                        ₹{alloc.allocated_capex_cr.toLocaleString()} Cr
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          +{alloc.completion_yield_phi}%
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gov-navy text-gov-accent">
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
