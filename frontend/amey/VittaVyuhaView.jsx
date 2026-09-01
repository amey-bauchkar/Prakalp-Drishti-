import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from './authClient';
import { DollarSign, Sliders, ShieldAlert, TrendingUp, CheckCircle2, Zap, BarChart2, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, Metric, Text, BadgeDelta, Flex, Grid } from "@tremor/react";

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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="space-y-8 font-sans pb-10">
      {/* ═══════════════════════════════════════════════════════════════
          TOP BANNER (SOVEREIGN INSTITUTIONAL COMMAND HEADER)
          ═══════════════════════════════════════════════════════════════ */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 rounded-2xl bg-gradient-to-br from-gov-navy to-gov-navy-hover shadow-lg border border-slate-700/50"
      >
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-extrabold tracking-institutional uppercase text-amber-400 border-l-2 border-amber-400">
            <DollarSign className="w-3.5 h-3.5 text-white" />
            <span>MODULE 3 · SMART BUDGET REBALANCING</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-white leading-tight">
            VITTA-VYUHA Optimizer
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            Rebalances national infrastructure funds to maximize completed projects, protect the mandatory 10% North-Eastern Region (NER) quota, and maximize capital efficiency.
          </p>
        </div>

        <div className="flex flex-col gap-3 shrink-0 w-full lg:w-auto">
          {denied && !loading && (
            <div className="bg-rose-500/20 border border-rose-500/50 p-3 rounded-lg flex items-start gap-2 backdrop-blur-sm max-w-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="text-xs text-rose-200">
                <strong className="block text-rose-100">{denied}</strong>
                <span>Capital reallocation requires administrator clearance.</span>
              </div>
            </div>
          )}

          {data && (
            <div className="flex items-center gap-4 bg-black/40 px-5 py-3 rounded-xl border border-white/20 backdrop-blur-md shadow-inner">
              <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono tracking-wider">Simplex Solve Time</span>
                <span className="text-xl font-black text-white font-mono">{data.solve_time_ms} ms</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Interactive Controls Bar */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Budget Pool Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Capital Envelope
                  </span>
                  <span className="font-mono font-black text-lg text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
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
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  <span>₹5,000 Cr</span>
                  <span>₹50,000 Cr</span>
                </div>
              </div>

              {/* Risk Dial Slider (Kappa) */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-amber-500" />
                    Risk Parameter (κ)
                  </span>
                  <span className="font-mono font-black text-sm text-amber-700 bg-amber-50 px-2 py-1.5 rounded-md border border-amber-100">
                    {riskKappa < 0.35 ? 'Max Velocity' : riskKappa > 0.70 ? 'Risk Averse' : 'Neutral'} (κ={riskKappa.toFixed(2)})
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={riskKappa}
                  onChange={(e) => setRiskKappa(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  <span>Velocity (0.0)</span>
                  <span>Averse (1.0)</span>
                </div>
              </div>

              {/* Statutory NER 10% Floor Toggle */}
              <div className="flex flex-col justify-between space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  Statutory Mandates
                </span>
                <label className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${enforceNer ? 'bg-purple-50 border-purple-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                  <div className="flex flex-col gap-0.5">
                    <span className={`font-bold text-sm ${enforceNer ? 'text-purple-900' : 'text-slate-700'}`}>10% North-East Quota</span>
                    <span className="text-[10px] text-slate-500 font-medium">Enforce legal minimum allocation floor</span>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${enforceNer ? 'bg-purple-600' : 'bg-slate-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${enforceNer ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  {/* Visually hidden actual checkbox to keep form accessibility */}
                  <input
                    type="checkbox"
                    checked={enforceNer}
                    onChange={(e) => setEnforceNer(e.target.checked)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </Card>
        </motion.div>

        {data && (
          <div className="space-y-6">
            {/* Top KPI Cards */}
            <motion.div variants={itemVariants}>
              <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
                
                {/* Metric 1 */}
                <Card className="shadow-sm border-slate-200 flex flex-col justify-between decoration-emerald-500 decoration-4 bg-white">
                  <div>
                    <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Funds Allocated</Text>
                    <Metric className="font-mono text-3xl font-black text-slate-800">₹{data.total_allocated_cr.toLocaleString()}</Metric>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">Out of ₹{data.total_budget_pool_cr.toLocaleString()} Envelope</span>
                    <BadgeDelta deltaType="increase" size="xs">Deployed</BadgeDelta>
                  </div>
                </Card>

                {/* Metric 2 */}
                <Card className="shadow-sm border-slate-200 flex flex-col justify-between bg-white relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${data.ner_floor_met ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <div className="pl-2">
                    <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">North-East Region Share</Text>
                    <Metric className="font-mono text-3xl font-black text-slate-800">₹{data.ner_allocated_cr.toLocaleString()}</Metric>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 pl-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md font-mono ${
                        data.ner_floor_met
                          ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                          : 'text-rose-800 bg-rose-50 border border-rose-200'}`}>
                        {data.ner_share_perc.toFixed(1)}% Share
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium truncate">
                        {data.ner_floor_met ? 'Statutory 10% Quota Met' : 'Quota Deficit'}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Metric 3 */}
                <Card className="shadow-sm border-amber-200 flex flex-col justify-between bg-amber-50/30">
                  <div>
                    <Text className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5"/> Marginal Efficiency</Text>
                    <Metric className="font-mono text-3xl font-black text-amber-600">+{data.shadow_price_budget_pi.toFixed(3)} <span className="text-lg text-amber-500/50">π</span></Metric>
                  </div>
                  <div className="mt-4 pt-4 border-t border-amber-200/50">
                    <span className="text-[11px] text-amber-800/70 font-medium">Additional yield per ₹1 Cr budget</span>
                  </div>
                </Card>

                {/* Metric 4 */}
                <Card className="shadow-sm border-emerald-200 flex flex-col justify-between bg-emerald-50/30">
                  <div>
                    <Text className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> Optimality Status</Text>
                    <Metric className="font-mono text-3xl font-black text-emerald-600">100%</Metric>
                  </div>
                  <div className="mt-4 pt-4 border-t border-emerald-200/50">
                    <span className="text-[11px] text-emerald-800/70 font-medium font-mono">Globally Optimal (Simplex LP)</span>
                  </div>
                </Card>

              </Grid>
            </motion.div>

            {/* Allocation Table */}
            <motion.div variants={itemVariants}>
              <Card className="shadow-sm border-slate-200 p-0 overflow-hidden">
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-white">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-gov-navy/5 rounded-lg border border-gov-navy/10">
                      <BarChart2 className="w-5 h-5 text-gov-navy" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide font-heading">
                        Optimized Budget Distribution
                      </h3>
                      <p className="text-xs text-slate-500">Top priority infrastructure projects</p>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    {data.allocations.length} Evaluated Projects
                  </div>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      <tr>
                        <th className="px-4 py-3">Project & ID</th>
                        <th className="px-4 py-3">Region</th>
                        <th className="px-4 py-3 text-right">Baseline Capex</th>
                        <th className="px-4 py-3 text-right text-gov-navy">Reallocation</th>
                        <th className="px-4 py-3 text-center">Yield Boost (ΔΦ)</th>
                        <th className="px-4 py-3 text-center">Spillover (γ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data.allocations.map((alloc) => (
                        <tr key={alloc.project_id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 min-w-[200px] max-w-[250px] whitespace-normal">
                            <div className="font-bold text-slate-800 line-clamp-2" title={alloc.project_name}>{alloc.project_name}</div>
                            <span className="text-[10px] text-slate-400 font-mono">#{alloc.project_id}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-600">{alloc.state}</span>
                              {alloc.is_ner && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-purple-50 text-purple-700 border border-purple-200">
                                  NER Quota
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-400 whitespace-nowrap">
                            ₹{alloc.requested_capex_cr.toLocaleString()} Cr
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-black text-slate-800 bg-slate-50/30 whitespace-nowrap">
                            ₹{alloc.allocated_capex_cr.toLocaleString()} Cr
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                              +{alloc.completion_yield_phi}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-amber-50 text-amber-700 border border-amber-100">
                              {alloc.systemic_benefit_gamma.toFixed(2)}x
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
