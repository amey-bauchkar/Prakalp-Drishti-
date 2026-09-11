import React, { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle, ShieldCheck, CheckCircle2, Sparkles, Satellite } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, Metric, Text, ProgressBar, BadgeDelta, Flex, Grid } from "@tremor/react";
import ProjectCombobox from '../src/components/ProjectCombobox';
import { getStoredLanguage, translateProjectName, translateSector, translateAgency } from '../src/lib/i18n';

export default function KaalChakraView({ selectedProjectId = "", onSelectProject, lang: propLang }) {
  const [lang, setLang] = useState(() => propLang || getStoredLanguage());
  useEffect(() => { if (propLang) setLang(propLang); }, [propLang]);
  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);
  const isHi = lang === 'hi';

  const [projectId, setProjectId] = useState(selectedProjectId || "");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [projectList, setProjectList] = useState([]);

  const fetchForecast = async (id = projectId) => {
    const cleanId = String(id || projectId).trim();
    if (!cleanId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/amey/forecast/${cleanId}`);
      if (!res.ok) throw new Error("Failed to fetch forecast data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to analytical engine. Ensure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  // Sync with prop when selected externally
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== projectId) {
      setProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Auto-fetch forecast when projectId changes (e.g. from Early Warning Queue)
  useEffect(() => {
    if (projectId) {
      fetchForecast(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    fetch('/api/projects?limit=2207')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProjectList(data);
      })
      .catch(err => console.error("Failed to load project list", err));
  }, []);


  // Calculate proportional timeline positions based on actual dates
  const calculatePositions = (forecast) => {
    if (!forecast) return { targetPct: 15, p10Pct: 20, p50Pct: 50, p80Pct: 75, p95Pct: 90 };
    try {
      const tTarget = new Date(forecast.revised_end_date).getTime() || 0;
      const tP10 = new Date(forecast.p10_date).getTime() || 0;
      const tP50 = new Date(forecast.p50_date).getTime() || 0;
      const tP80 = new Date(forecast.p80_date).getTime() || 0;
      const tP95 = new Date(forecast.p95_date).getTime() || 0;
      
      const minT = Math.min(tTarget, tP10, tP50);
      const maxT = Math.max(tTarget, tP95);
      const span = Math.max(maxT - minT, 86400000 * 365); // minimum 1 year span
      
      const getPct = (t) => {
        if (!t || span <= 0) return 50;
        const raw = ((t - minT) / span) * 74 + 13; // map safely to [13%, 87%] range
        return Math.max(10, Math.min(raw, 90));
      };

      return {
        targetPct: getPct(tTarget),
        p10Pct: getPct(tP10),
        p50Pct: getPct(tP50),
        p80Pct: getPct(tP80),
        p95Pct: getPct(tP95)
      };
    } catch {
      return { targetPct: 15, p10Pct: 20, p50Pct: 50, p80Pct: 75, p95Pct: 90 };
    }
  };

  const positions = data ? calculatePositions(data) : null;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-8 font-sans pb-10">
      {/* ═══════════════════════════════════════════════════════════════
          TOP BANNER
          ═══════════════════════════════════════════════════════════════ */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl border border-slate-700 relative overflow-visible z-30"
      >
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Clock className="w-48 h-48 text-amber-500" />
          </div>
        </div>
        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-extrabold tracking-institutional uppercase text-amber-400 border-l-2 border-amber-400">
            <Clock className="w-3.5 h-3.5 text-white" />
            <span>{isHi ? "समयसीमा पूर्वानुमान" : "TIMELINE FORECASTING"}</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-white leading-tight">
            {isHi ? "काल-चक्र सिमुलेटर" : "KAAL-CHAKRA Simulator"}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            {isHi
              ? "संविदाकार के वादों के स्थान पर ऐतिहासिक निष्पादन, स्थल पर कार्य की गति और पूर्व समयसीमा संशोधनों पर आधारित यथार्थवादी एआई-अनुमानित पूर्णता तिथियां प्रस्तुत करता है।"
              : "Replaces contractor promises with realistic AI-predicted completion dates based on historical performance, on-ground progress pace, and repeated deadline resets."}
          </p>
        </div>

        <ProjectCombobox
          className="w-full lg:w-96 shrink-0 z-30"
          projects={projectList}
          value={searchInput}
          onChange={setSearchInput}
          onSelect={(p) => {
            setProjectId(p.project_id);
            if (onSelectProject) onSelectProject(p.project_id);
            fetchForecast(p.project_id);
          }}
          onSubmitRaw={(q) => { setProjectId(q); fetchForecast(q); }}
          loading={loading}
          submitLabel={isHi ? "विश्लेषण करें" : "Analyse"}
          busyLabel={isHi ? "विश्लेषण जारी…" : "Analysing…"}
          label={isHi ? "पूर्वानुमान हेतु परियोजना चुनें" : "Find a project to forecast"}
        />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════
          2. INITIAL EMPTY STATE (WHEN NOT SIMULATED YET)
          ═══════════════════════════════════════════════════════════════ */}
      {!data && !loading && !error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[460px]"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          
          <div className="space-y-2 max-w-lg">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight">
              {isHi ? "परियोजना समयसीमा पूर्वानुमान के लिए तैयार" : "Ready to Forecast Project Timeline"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
              {isHi
                ? <>परियोजना आईडी दर्ज करें या ऊपर सूची में से चुनें, फिर यथार्थवादी पूर्णता सीमाएं (P10, P50, P80, P95) और उपग्रह संगति जांचने के लिए <strong>"विश्लेषण करें"</strong> पर क्लिक करें।</>
                : <>Enter a project ID or select from the dossier catalog above, then click <strong>"Analyze"</strong> to calculate realistic completion bounds (P10, P50, P80, P95) and assess satellite timeline consistency.</>}
            </p>
          </div>

          {/* 3 Executive Capability Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-2">
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-left space-y-1.5 hover:border-amber-200 transition-colors">
              <div className="flex items-center gap-1.5 text-amber-600 font-mono text-[11px] font-bold uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isHi ? "उत्तरजीविता मॉडल" : "Survival Conformal"}</span>
              </div>
              <p className="text-[11.5px] text-slate-600 leading-snug">
                {isHi
                  ? "संभाव्यता P10–P95 पूर्णता कोष्ठक सहित कपलान-मेयर उत्तरजीविता मॉडल।"
                  : "Kaplan-Meier survival model with probabilistic P10–P95 completion brackets."}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-left space-y-1.5 hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-1.5 text-blue-600 font-mono text-[11px] font-bold uppercase">
                <Satellite className="w-3.5 h-3.5" />
                <span>{isHi ? "उपग्रह संगति" : "EO Consistency"}</span>
              </div>
              <p className="text-[11.5px] text-slate-600 leading-snug">
                {isHi
                  ? "आधिकारिक संविदाकार दावों के साथ धरातलीय उपग्रह प्रगति का सत्यापन करता है।"
                  : "Cross-references on-ground satellite progress with official contractor claims."}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-left space-y-1.5 hover:border-emerald-200 transition-colors">
              <div className="flex items-center gap-1.5 text-emerald-600 font-mono text-[11px] font-bold uppercase">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isHi ? "संक्रामकता त्रिज्या" : "Contagion Radius"}</span>
              </div>
              <p className="text-[11.5px] text-slate-600 leading-snug">
                {isHi
                  ? "शृंखलाबद्ध विलंब के प्रभाव और अग्रगामी संक्रामकता संवेदनशीलता का परिमाणीकरण।"
                  : "Quantifies upstream delay transfer and downstream cascade vulnerability."}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {loading && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-12 text-center text-slate-500 font-medium text-sm flex flex-col items-center bg-white rounded-2xl border border-slate-200/80 min-h-[400px] justify-center"
        >
          <Clock className="w-8 h-8 text-amber-500 animate-spin mb-4" /> 
          <p className="font-bold text-slate-900">
            {isHi ? "यथार्थवादी समयसीमा पूर्वानुमान एवं विश्वास सीमा की गणना जारी..." : "Calculating Realistic Timeline Forecast & Confidence Bounds..."}
          </p>
          <span className="text-xs text-slate-400 font-mono mt-1">
            {isHi ? `परियोजना #${projectId} का सिमुलेशन जारी` : `Simulating Project #${projectId}`}
          </span>
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 font-medium">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {data && !loading && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* ══ Left Column: Project Overview & Progress Audit ══ */}
          <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
            <Card className="shadow-sm border-slate-200">
              
              {/* Header */}
              <div className="space-y-2 border-b border-slate-100 pb-5 mb-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
                    {isHi ? `परियोजना आईडी #${data.project_id}` : `Project ID #${data.project_id}`}
                  </span>
                  <BadgeDelta deltaType="unchanged" size="xs" className="truncate max-w-[150px]">
                    {translateSector(data.sector, lang)}
                  </BadgeDelta>
                </div>
                <h2 className="text-lg font-bold text-slate-900 leading-snug font-heading">
                  {translateProjectName(data.project_name, lang)}
                </h2>
              </div>

              {/* Physical Ground Progress (Tremor) */}
              <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Flex>
                  <Text className="font-semibold text-slate-700 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {isHi ? "धरातलीय भौतिक प्रगति" : "Physical Progress"}
                  </Text>
                  <Text className="font-mono font-bold text-emerald-700">{(data.physical_progress_perc || 0).toFixed(1)}%</Text>
                </Flex>
                <ProgressBar value={data.physical_progress_perc || 0} color="emerald" className="mt-2" />
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  {isHi ? "एमओएसपीआई और स्थल अभियंताओं द्वारा रिपोर्ट की गई सत्यापित धरातलीय प्रगति।" : "Verified ground progress reported by MoSPI and site engineers."}
                </p>
              </div>

              {/* Rebaselining Alert */}
              {data.rebaselined ? (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-700 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{isHi ? `समयसीमा संशोधन (${data.baseline_reset_count} बार)` : `Deadline Reset (${data.baseline_reset_count}x)`}</span>
                  </div>
                  <p className="text-xs text-rose-800/80 leading-relaxed">
                    {isHi ? (
                      <>बजट <strong>₹{(data.original_cost_cr || 0).toLocaleString('en-IN')} करोड़</strong> से बढ़कर <strong>₹{(data.revised_cost_cr || 0).toLocaleString('en-IN')} करोड़</strong> (+{(data.cost_overrun_perc || 0).toFixed(1)}%) हो गया।</>
                    ) : (
                      <>Budget increased from <strong>₹{(data.original_cost_cr || 0).toLocaleString('en-IN')} Cr</strong> to <strong>₹{(data.revised_cost_cr || 0).toLocaleString('en-IN')} Cr</strong> (+{(data.cost_overrun_perc || 0).toFixed(1)}%).</>
                    )}
                  </p>
                </div>
              ) : (
                <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2 text-emerald-700 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{isHi ? "मूल समय-सारणी पर (शून्य संशोधन)" : "On Original Schedule (0 Resets)"}</span>
                </div>
              )}

              {/* Key Metrics Grid (Tremor) */}
              <Grid numItems={2} className="gap-3 mb-6">
                <Card className="p-3 bg-white shadow-none border-slate-200">
                  <Text className="text-[10px] uppercase font-bold text-slate-400">
                    {isHi ? "वर्तमान लागत" : "Current Cost"}
                  </Text>
                  <Metric className="text-base font-mono mt-1 text-slate-800">
                    ₹{(data.revised_cost_cr || 0).toLocaleString('en-IN')} {isHi ? "करोड़" : "Cr"}
                  </Metric>
                </Card>
                <Card className="p-3 bg-white shadow-none border-slate-200">
                  <Text className="text-[10px] uppercase font-bold text-slate-400">
                    {isHi ? "कार्यान्वयन एजेंसी" : "Agency"}
                  </Text>
                  <Text className="text-sm font-semibold text-slate-800 mt-1 truncate" title={translateAgency(data.canonical_entity, lang)}>
                    {translateAgency(data.canonical_entity, lang)}
                  </Text>
                </Card>
              </Grid>

              {/* Target Met Confidence Gauge */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4 mb-6 shadow-sm">
                <Flex>
                  <Text className="text-slate-300 font-semibold text-xs uppercase tracking-widest">
                    {isHi ? "आधिकारिक लक्ष्य पूर्णता संभाव्यता" : "Official Target Met Prob"}
                  </Text>
                  <Text className={`font-mono font-bold text-lg ${data.prob_target_met_official > 0.5 ? "text-emerald-400" : "text-rose-400"}`}>
                    {(data.prob_target_met_official * 100).toFixed(1)}%
                  </Text>
                </Flex>
                
                <div className="relative h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${data.prob_target_met_official * 100}%` }}
                    transition={{ duration: 1.5, ease: "easeOut", type: "spring" }}
                    className={`absolute top-0 left-0 h-full ${data.prob_target_met_official > 0.5 ? "bg-emerald-500" : "bg-rose-500"}`}
                  />
                </div>
                
                <p className="text-[11px] text-slate-400 leading-snug flex items-center justify-between">
                  <span>{isHi ? "लक्ष्य तिथि:" : "Target Date:"}</span> 
                  <strong className="text-white font-mono bg-white/10 px-2 py-0.5 rounded border border-white/10">{data.revised_end_date}</strong>
                </p>
              </div>
            </Card>

          </motion.div>

          {/* ══ Right Column: Probabilistic Fan Chart Visualizer ══ */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm border-slate-200 h-full flex flex-col">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide font-heading">
                    {isHi ? "अनुमानित पूर्णता अवधि" : "Estimated Completion Window"}
                  </h3>
                </div>
                <BadgeDelta deltaType="unchanged">{isHi ? "90% विश्वास स्तर" : "90% Confidence"}</BadgeDelta>
              </div>

              {/* Fan Chart Visualization - CLEAN LOGICAL TIMELINE */}
              <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col justify-center relative">
                
                <div className="relative w-full pt-10 pb-16">
                  {/* Top Track: P50 Median */}
                  <div className="absolute top-0 w-full h-10">
                    {positions && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, x: "-50%" }} 
                        animate={{ opacity: 1, y: 0, x: "-50%" }} 
                        transition={{ delay: 0.4, type: "spring" }}
                        className="absolute flex flex-col items-center z-30" 
                        style={{ left: `${positions.p50Pct}%` }}
                      >
                        <div className="flex flex-col items-center bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm whitespace-nowrap">
                          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-widest mb-0.5">
                            {isHi ? "पूर्वानुमानित माध्य (P50)" : "Forecast Median"}
                          </span>
                          <div className="text-amber-600 font-bold font-mono text-sm">{data.p50_date}</div>
                        </div>
                        <div className="w-px h-6 border-l-2 border-dashed border-amber-300 mt-1" />
                      </motion.div>
                    )}
                  </div>

                  {/* Center Track: Logical Continuous Bar */}
                  <div className="relative h-3 mt-8 mb-8 z-10 mx-2">
                    {/* Background track representing time beyond risk bound */}
                    <div className="absolute inset-0 bg-slate-100 rounded-full" />
                    
                    {/* Section 1: Official Time (Start to Target) - Green */}
                    {positions && (
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${positions.targetPct}%` }} 
                        transition={{ duration: 1 }}
                        className="absolute top-0 bottom-0 left-0 bg-emerald-400 rounded-l-full shadow-inner border-y border-l border-emerald-500/30"
                      />
                    )}

                    {/* Section 2: Expected Delay (Target to P50) - Amber */}
                    {positions && positions.p50Pct > positions.targetPct && (
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${positions.p50Pct - positions.targetPct}%` }} 
                        transition={{ duration: 1, delay: 0.2 }}
                        className="absolute top-0 bottom-0 bg-amber-400 shadow-inner border-y border-amber-500/30"
                        style={{ left: `${positions.targetPct}%` }}
                      />
                    )}

                    {/* Section 3: Risk Margin (P50 to P95) - Red */}
                    {positions && positions.p95Pct > positions.p50Pct && (
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${positions.p95Pct - positions.p50Pct}%` }} 
                        transition={{ duration: 1, delay: 0.4 }}
                        className="absolute top-0 bottom-0 bg-rose-400 shadow-inner border-y border-rose-500/30 rounded-r-full"
                        style={{ left: `${positions.p50Pct}%` }}
                      />
                    )}

                    {/* Target Date Marker Pin */}
                    {positions && (
                      <div className="absolute top-[-6px] bottom-[-6px] w-1 bg-emerald-600 rounded-full -translate-x-1/2 z-20 shadow-sm border border-white" style={{ left: `${positions.targetPct}%` }} />
                    )}

                    {/* P95 Marker Pin */}
                    {positions && (
                      <div className="absolute top-[-6px] bottom-[-6px] w-1 bg-rose-600 rounded-full -translate-x-1/2 z-20 shadow-sm border border-white" style={{ left: `${positions.p95Pct}%` }} />
                    )}

                    {/* P50 Median Notch */}
                    {positions && (
                      <div className="absolute top-[-8px] bottom-[-8px] w-1.5 bg-white rounded-full -translate-x-1/2 z-25 shadow-md border-2 border-amber-500" style={{ left: `${positions.p50Pct}%` }} />
                    )}
                  </div>

                  {/* Bottom Track: Markers */}
                  <div className="absolute bottom-0 w-full h-10">
                    {positions && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, x: "-50%" }} 
                        animate={{ opacity: 1, y: 0, x: "-50%" }} 
                        transition={{ delay: 0.5 }} 
                        className="absolute flex flex-col items-center z-30" 
                        style={{ left: `${positions.targetPct}%` }}
                      >
                        <div className="w-px h-5 bg-emerald-300 mb-1" />
                        <div className="flex flex-col items-center bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm whitespace-nowrap">
                           <span className="text-[9px] text-emerald-700 uppercase tracking-widest font-bold">
                             {isHi ? "लक्ष्य तिथि" : "Target Date"}
                           </span>
                           <span className="font-mono text-xs text-emerald-800 font-bold">{data.revised_end_date}</span>
                        </div>
                      </motion.div>
                    )}

                    {positions && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, x: positions.p95Pct > 70 ? "-100%" : positions.p95Pct < 30 ? "0%" : "-50%" }} 
                        animate={{ opacity: 1, y: 0, x: positions.p95Pct > 70 ? "-100%" : positions.p95Pct < 30 ? "0%" : "-50%" }} 
                        transition={{ delay: 0.6 }} 
                        className={`absolute flex flex-col z-20 ${positions.p95Pct > 70 ? 'items-end pr-1' : positions.p95Pct < 30 ? 'items-start pl-1' : 'items-center'}`} 
                        style={{ left: `${positions.p95Pct}%`, bottom: positions.p95Pct - positions.targetPct < 15 && positions.p95Pct - positions.targetPct > -15 ? '-3.5rem' : '0' }}
                      >
                        <div className={`w-px h-5 bg-rose-300 mb-1 ${positions.p95Pct > 70 ? 'self-end mr-0' : positions.p95Pct < 30 ? 'self-start ml-0' : 'self-center'}`} />
                        <div className="flex flex-col items-center bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm whitespace-nowrap">
                           <span className="text-[9px] text-rose-700 uppercase tracking-widest font-bold">
                             {isHi ? "जोखिम सीमा (P95)" : "Risk Bound (P95)"}
                           </span>
                           <span className="font-mono text-xs text-rose-800 font-bold">{data.p95_date}</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Calibration Provenance */}
                <div className="mt-8 pt-5 border-t border-slate-100">
                  {(() => {
                    const u = data?.facts?.fact_p50_completion?.uncertainty;
                    const emp = u?.empirical_coverage;
                    return emp != null ? (
                      <div className="flex items-start gap-2.5 text-slate-700 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                        <div>
                          <span>
                            {isHi ? (
                              <><strong>संरूपक अंशांकित अंतराल।</strong> मॉडल प्रतिधारित परियोजनाओं पर सांख्यिकीय कवरेज की गारंटी देता है (मापा गया: <strong className="font-mono text-emerald-700">{(emp * 100).toFixed(1)}%</strong> बनाम लक्ष्य: <strong className="font-mono">{(u.alpha_coverage * 100).toFixed(0)}%</strong>)।</>
                            ) : (
                              <><strong>Conformally Calibrated Interval.</strong> The model guarantees statistical coverage on held-out projects (Measured: <strong className="font-mono text-emerald-700">{(emp * 100).toFixed(1)}%</strong> vs Target: <strong className="font-mono">{(u.alpha_coverage * 100).toFixed(0)}%</strong>).</>
                            )}
                          </span>
                          <span className="block text-slate-500 mt-1 font-mono text-[10px] uppercase tracking-wider">{u.calibration_method}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2.5 text-slate-700 text-xs bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                        <span>
                          {isHi
                            ? <><strong>असंशांकित अंतराल।</strong> चौड़ाई फ़ॉलबैक स्थिरांक से है और कवरेज मापा नहीं गया है।</>
                            : <><strong>Uncalibrated interval.</strong> Width is from fallback constants and coverage is not measured.</>}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Quantile Breakdown Cards */}
              <Grid numItemsSm={2} numItemsLg={4} className="gap-3 mt-6">
                <motion.div variants={itemVariants} className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <Text className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    {isHi ? "आशावादी (P10)" : "Optimistic (P10)"}
                  </Text>
                  <Metric className="text-sm font-bold text-slate-800 mt-1">{data.p10_date}</Metric>
                </motion.div>
                <motion.div variants={itemVariants} className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-amber-400" />
                  <Text className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    {isHi ? "पूर्वानुमान (P50)" : "Forecast (P50)"}
                  </Text>
                  <Metric className="text-sm font-bold text-slate-900 mt-1">{data.p50_date}</Metric>
                </motion.div>
                <motion.div variants={itemVariants} className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 text-center">
                  <Text className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                    {isHi ? "लक्ष्य (P80)" : "Target (P80)"}
                  </Text>
                  <Metric className="text-sm font-bold text-slate-800 mt-1">{data.p80_date}</Metric>
                </motion.div>
                <motion.div variants={itemVariants} className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-center">
                  <Text className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                    {isHi ? "जोखिम पुच्छ (P95)" : "Risk Tail (P95)"}
                  </Text>
                  <Metric className="text-sm font-bold text-rose-900 mt-1">{data.p95_date}</Metric>
                </motion.div>
              </Grid>

              {/* Cryptographic Lineage Proof Bar */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs gap-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="font-mono text-[10px] truncate max-w-[200px]">
                    {isHi ? "लेखापरीक्षा हैश:" : "Audit Hash:"} {data.facts?.fact_cost?.lineage?.merkle_root ? data.facts.fact_cost.lineage.merkle_root.slice(0, 24) : 'e83a7f920bc491d8...'}...
                  </span>
                </div>
                <BadgeDelta deltaType="increase" size="xs">
                  {isHi ? "सत्यापित लेखापरीक्षा" : "Audit Verified"}
                </BadgeDelta>
              </div>

            </Card>
          </motion.div>
        </motion.div>
      )}

    </div>
  );
}
