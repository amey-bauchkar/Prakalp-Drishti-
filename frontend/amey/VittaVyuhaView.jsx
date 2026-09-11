import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from './authClient';
import { DollarSign, Sliders, ShieldAlert, TrendingUp, CheckCircle2, Zap, BarChart2, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, Metric, Text, BadgeDelta, Flex, Grid } from "@tremor/react";
import { getStoredLanguage } from '../src/lib/i18n';

export default function VittaVyuhaView({ onOpenProject, lang: propLang }) {
  const [lang, setLang] = useState(() => propLang || getStoredLanguage());
  useEffect(() => { if (propLang) setLang(propLang); }, [propLang]);
  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);
  const isHi = lang === 'hi';

  const [budget, setBudget] = useState(12000);
  const [riskKappa, setRiskKappa] = useState(0.70);
  const [enforceNer, setEnforceNer] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(null);

  const [hasExecuted, setHasExecuted] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const runAllocation = useCallback(async (b, k, ner) => {
    setLoading(true);
    setHasExecuted(true);
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
      if (res.ok) { setData(res.data); setDenied(null); setPage(1); }
      else { setData(null); setDenied(res.error); }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // When parameters change and user has already executed once, auto-recalculate
  useEffect(() => {
    if (!hasExecuted) return;
    const timeout = setTimeout(() => {
      runAllocation(budget, riskKappa, enforceNer);
    }, 200);
    return () => clearTimeout(timeout);
  }, [budget, riskKappa, enforceNer, hasExecuted, runAllocation]);

  // Auto-run baseline allocation on mount so data is live on arrival
  useEffect(() => {
    runAllocation(budget, riskKappa, enforceNer);
  }, []);

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
        className="p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl border border-slate-700 relative overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <DollarSign className="w-48 h-48 text-amber-500" />
          </div>
        </div>
        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-extrabold tracking-institutional uppercase text-amber-400 border-l-2 border-amber-400">
            <DollarSign className="w-3.5 h-3.5 text-white" />
            <span>{isHi ? "पूंजी आवंटन एवं अनुकूलन" : "CAPITAL ALLOCATION & OPTIMIZATION"}</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-white leading-tight">
            {isHi ? "वित्त-व्यूह पूंजी अनुकूलक" : "VITTA-VYUHA Capital Optimizer"}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            {isHi
              ? "कमीशनिंग गति को अधिकतम करने, अवरुद्ध निर्भरताओं में पूंजी को फंसने से रोकने और सांविधिक 10% पूर्वोत्तर क्षेत्र (NER) आवंटन अधिदेश को लागू करने के लिए केंद्रीय पूंजीगत व्यय का पुनर्संतुलन करता है।"
              : "Rebalances central capex across projects to maximize commissioning velocity, prevent capital lockup in stalled dependencies, and enforce the statutory 10% North-Eastern Region (NER) allocation mandate."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto z-10">
          {denied && !loading && (
            <div className="bg-rose-500/20 border border-rose-500/50 p-3 rounded-lg flex items-start gap-2 backdrop-blur-sm max-w-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="text-xs text-rose-200">
                <strong className="block text-rose-100">{denied}</strong>
                <span>{isHi ? "पूंजी पुनः आवंटन हेतु प्रशासक स्तर की अनुमति आवश्यक है।" : "Capital reallocation requires administrator clearance."}</span>
              </div>
            </div>
          )}

          {data && (
            <div className="flex items-center gap-4 bg-black/40 px-5 py-3 rounded-xl border border-white/20 backdrop-blur-md shadow-inner">
              <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono tracking-wider">
                  {isHi ? "सिम्प्लेक्स समाधान समय" : "Simplex Solve Time"}
                </span>
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
        {/* Interactive Controls Bar - Visible after optimization */}
        {data && (
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Budget Pool Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      {isHi ? "पूंजी सीमा (बजट)" : "Capital Envelope"}
                    </span>
                    <span className="font-mono font-black text-lg text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                      ₹{budget.toLocaleString('en-IN')} {isHi ? "करोड़" : "Cr"}
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="Capital envelope available for reallocation"
                    aria-valuetext={`${Number(budget).toLocaleString('en-IN')} crore rupees`}
                    min="5000"
                    max="50000"
                    step="1000"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    <span>₹5,000 {isHi ? "करोड़" : "Cr"}</span>
                    <span>₹50,000 {isHi ? "करोड़" : "Cr"}</span>
                  </div>
                </div>

                {/* Risk Dial Slider (Kappa) */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-amber-500" />
                      {isHi ? "जोखिम मापदंड (κ)" : "Risk Parameter (κ)"}
                    </span>
                    <span className="font-mono font-black text-sm text-amber-700 bg-amber-50 px-2 py-1.5 rounded-md border border-amber-100">
                      {isHi
                        ? (riskKappa < 0.35 ? 'अधिकतम गति' : riskKappa > 0.70 ? 'जोखिम विमुख' : 'संतुलित')
                        : (riskKappa < 0.35 ? 'Max Velocity' : riskKappa > 0.70 ? 'Risk Averse' : 'Neutral')} (κ={riskKappa.toFixed(2)})
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="Risk posture — from fastest delivery to safest delivery"
                    aria-valuetext={`${riskKappa < 0.35 ? 'Favours speed' : riskKappa > 0.70 ? 'Favours safety' : 'Balanced'}, kappa ${riskKappa.toFixed(2)}`}
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={riskKappa}
                    onChange={(e) => setRiskKappa(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    <span>{isHi ? "गति (0.0)" : "Velocity (0.0)"}</span>
                    <span>{isHi ? "विमुख (1.0)" : "Averse (1.0)"}</span>
                  </div>
                </div>

                {/* Statutory NER 10% Floor Toggle */}
                <div className="flex flex-col justify-between space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-purple-600" />
                    {isHi ? "सांविधिक अधिदेश" : "Statutory Mandates"}
                  </span>
                  <label className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${enforceNer ? 'bg-purple-50 border-purple-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                    <div className="flex flex-col gap-0.5">
                      <span className={`font-bold text-sm ${enforceNer ? 'text-purple-900' : 'text-slate-700'}`}>
                        {isHi ? "10% पूर्वोत्तर कोटा (NER)" : "10% North-East Quota"}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {isHi ? "विधिक न्यूनतम आवंटन सीमा लागू करें" : "Enforce legal minimum allocation floor"}
                      </span>
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
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[360px]">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">Solving Simplex Linear Program…</p>
              <p className="text-xs text-slate-500">Balancing marginal yield, risk parameter κ, and 10% North-East statutory reserve</p>
            </div>
          </div>
        )}

        {/* Empty State Hero */}
        {!data && !loading && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[440px]">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
              <DollarSign className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-bold text-slate-800">
                Ready to Optimize Capital Reallocation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Click <strong className="text-slate-700">"OPTIMIZE CAPITAL ALLOCATION"</strong> in the header above to compute the globally optimal simplex budget distribution across the 2,207 project portfolio.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-2">
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/60 text-emerald-700 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-700">Multi-Knapsack LP Solver</h4>
                <p className="text-[11px] text-slate-500 leading-tight">Solves multi-constraint simplex optimization in &lt;10ms</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100/60 text-purple-700 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-700">10% NER Statutory Floor</h4>
                <p className="text-[11px] text-slate-500 leading-tight">Guarantees mandatory North-Eastern capital ringfencing</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100/60 text-amber-700 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-700">Risk Dial (κ) Containment</h4>
                <p className="text-[11px] text-slate-500 leading-tight">Fine-tune capital velocity against variance penalty</p>
              </div>
            </div>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Top KPI Cards */}
            <motion.div variants={itemVariants}>
              <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
                
                {/* Metric 1 */}
                <Card className="shadow-sm border-slate-200 flex flex-col justify-between decoration-emerald-500 decoration-4 bg-white">
                  <div>
                    <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      {isHi ? "कुल आवंटित निधि" : "Total Funds Allocated"}
                    </Text>
                    <Metric className="font-mono text-3xl font-black text-slate-800">
                      ₹{data.total_allocated_cr.toLocaleString('en-IN')} {isHi ? "करोड़" : "Cr"}
                    </Metric>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {isHi ? `कुल ₹${data.total_budget_pool_cr.toLocaleString('en-IN')} करोड़ सीमा में से` : `Out of ₹${data.total_budget_pool_cr.toLocaleString('en-IN')} Envelope`}
                    </span>
                    <BadgeDelta deltaType="increase" size="xs">{isHi ? "तैनात" : "Deployed"}</BadgeDelta>
                  </div>
                </Card>

                {/* Metric 2 */}
                <Card className="shadow-sm border-slate-200 flex flex-col justify-between bg-white">
                  <div>
                    <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      {isHi ? "पूर्वोत्तर क्षेत्र का हिस्सा (NER)" : "North-East Region Share"}
                    </Text>
                    <Metric className="font-mono text-3xl font-black text-slate-800">
                      ₹{data.ner_allocated_cr.toLocaleString('en-IN')} {isHi ? "करोड़" : "Cr"}
                    </Metric>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md font-mono ${
                        data.ner_floor_met
                          ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                          : 'text-rose-800 bg-rose-50 border border-rose-200'}`}>
                        {data.ner_share_perc.toFixed(1)}% {isHi ? "हिस्सा" : "Share"}
                      </span>
                      <span className="text-[11px] text-slate-600 font-semibold">
                        {data.ner_floor_met ? (isHi ? 'सांविधिक 10% कोटा पूर्ण' : 'Statutory 10% Quota Met') : (isHi ? 'कोटा घाटा' : 'Quota Deficit')}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Metric 3 */}
                <Card className="shadow-sm border-amber-200 flex flex-col justify-between bg-amber-50/30">
                  <div>
                    <Text className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5"/>
                      {isHi ? "सीमांत दक्षता" : "Marginal Efficiency"}
                    </Text>
                    <Metric className="font-mono text-3xl font-black text-amber-600">+{data.shadow_price_budget_pi.toFixed(3)} <span className="text-lg text-amber-500/50">π</span></Metric>
                  </div>
                  <div className="mt-4 pt-4 border-t border-amber-200/50">
                    <span className="text-[11px] text-amber-800/70 font-medium">
                      {isHi ? "प्रति ₹1 करोड़ बजट पर अतिरिक्त प्रतिफल" : "Additional yield per ₹1 Cr budget"}
                    </span>
                  </div>
                </Card>

                {/* Metric 4 */}
                <Card className="shadow-sm border-emerald-200 flex flex-col justify-between bg-emerald-50/30">
                  <div>
                    <Text className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5"/>
                      {isHi ? "अनुकूलतम स्थिति" : "Optimality Status"}
                    </Text>
                    <Metric className="font-mono text-3xl font-black text-emerald-600">100%</Metric>
                  </div>
                  <div className="mt-4 pt-4 border-t border-emerald-200/50">
                    <span className="text-[11px] text-emerald-800/70 font-medium font-mono">
                      {isHi ? "वैश्विक रूप से अनुकूलतम (सिम्प्लेक्स एलपी)" : "Globally Optimal (Simplex LP)"}
                    </span>
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
                        {isHi ? "अनुकूलित बजट वितरण" : "Optimized Budget Distribution"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isHi ? "शीर्ष प्राथमिकता वाली अवसंरचना परियोजनाएं" : "Top priority infrastructure projects"}
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    {isHi ? `${data.allocations.length} मूल्यांकित परियोजनाएं` : `${data.allocations.length} Evaluated Projects`}
                  </div>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      <tr>
                        <th className="px-4 py-3">{isHi ? "परियोजना एवं आईडी" : "Project & ID"}</th>
                        <th className="px-4 py-3">{isHi ? "राज्य / क्षेत्र" : "Region"}</th>
                        <th className="px-4 py-3 text-right">{isHi ? "मूल पूंजीगत व्यय" : "Baseline Capex"}</th>
                        <th className="px-4 py-3 text-right text-gov-navy">{isHi ? "पुनः आवंटित पूंजी" : "Reallocation"}</th>
                        <th className="px-4 py-3 text-center">{isHi ? "उपज वृद्धि (ΔΦ)" : "Yield Boost (ΔΦ)"}</th>
                        <th className="px-4 py-3 text-center">{isHi ? "विस्तार प्रभाव (γ)" : "Spillover (γ)"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data.allocations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((alloc) => (
                        <tr key={alloc.project_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 min-w-[200px] max-w-[250px] whitespace-normal">
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenProject) {
                                  onOpenProject(alloc.project_id);
                                } else {
                                  window.dispatchEvent(new CustomEvent('prakalp:selectProject', { detail: alloc.project_id }));
                                }
                              }}
                              className="text-left group cursor-pointer focus:outline-none"
                              title="Open project in Unified Cockpit"
                            >
                              <div className="font-bold text-slate-800 group-hover:text-amber-700 transition-colors line-clamp-2" title={alloc.project_name}>
                                {alloc.project_name}
                              </div>
                              <span className="text-[10px] text-slate-400 group-hover:text-amber-600 font-mono flex items-center gap-1">
                                #{alloc.project_id} <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗ {isHi ? "दस्तावेज़ खोलें" : "Open Dossier"}</span>
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-600">{alloc.state}</span>
                              {alloc.is_ner && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-purple-50 text-purple-700 border border-purple-200">
                                  {isHi ? "पूर्वोत्तर कोटा" : "NER Quota"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-400 whitespace-nowrap">
                            ₹{alloc.requested_capex_cr.toLocaleString('en-IN')} {isHi ? "करोड़" : "Cr"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-black text-slate-800 bg-slate-50/30 whitespace-nowrap">
                            ₹{alloc.allocated_capex_cr.toLocaleString('en-IN')} {isHi ? "करोड़" : "Cr"}
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

                {/* Pagination Controls */}
                {data.allocations.length > 0 && (
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
                    <div>
                      {isHi ? (
                        <>कुल <span className="font-bold text-slate-800">{data.allocations.length}</span> में से <span className="font-bold text-slate-800">{(page - 1) * PAGE_SIZE + 1}</span> से <span className="font-bold text-slate-800">{Math.min(page * PAGE_SIZE, data.allocations.length)}</span> परियोजनाएं प्रदर्शित (एक बार में 10 दृश्यमान)</>
                      ) : (
                        <>Showing <span className="font-bold text-slate-800">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="font-bold text-slate-800">{Math.min(page * PAGE_SIZE, data.allocations.length)}</span> of <span className="font-bold text-slate-800">{data.allocations.length}</span> projects (10 visible at once)</>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 transition-colors cursor-pointer shadow-xs"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>{isHi ? "पिछला" : "Previous"}</span>
                      </button>
                      <div className="flex items-center gap-1 px-3 py-1 font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-lg shadow-xs">
                        {isHi ? `पृष्ठ ${page} / ${Math.ceil(data.allocations.length / PAGE_SIZE) || 1}` : `Page ${page} of ${Math.ceil(data.allocations.length / PAGE_SIZE) || 1}`}
                      </div>
                      <button
                        onClick={() => setPage(p => Math.min(Math.ceil(data.allocations.length / PAGE_SIZE), p + 1))}
                        disabled={page >= Math.ceil(data.allocations.length / PAGE_SIZE)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 transition-colors cursor-pointer shadow-xs"
                      >
                        <span>{isHi ? "अगला" : "Next"}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
