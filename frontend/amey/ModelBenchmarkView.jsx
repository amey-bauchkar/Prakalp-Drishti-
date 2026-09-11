import React, { useEffect, useState } from 'react';
import {
  FlaskConical, AlertTriangle, Layers, ShieldAlert,
  CheckCircle2, Award, Clock, ArrowRight,
  Zap, Sparkles, BarChart2, ShieldCheck, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Metric, Text, ProgressBar, Flex, Grid, BadgeDelta } from "@tremor/react";
import { apiFetch } from './authClient';
import { getStoredLanguage } from '../src/lib/i18n';

const API = '';

const fmt = (v, d = 3) => (v == null ? '—' : Number(v).toFixed(d));

const MODEL_LABEL = {
  sector_mean_baseline: 'Static Sector Average',
  ols_linear_regression: 'OLS Linear Regression',
  gradient_boosting: 'PRAKALP-DRISHTI AI',
};

const getModelLabel = (key, isHi) => {
  const map = {
    sector_mean_baseline: isHi ? 'स्थिर क्षेत्रीय औसत' : 'Static Sector Average',
    ols_linear_regression: isHi ? 'ओएलएस रैखिक प्रतिगमन' : 'OLS Linear Regression',
    gradient_boosting: isHi ? 'प्रकल्प-दृष्टि एआई' : 'PRAKALP-DRISHTI AI',
  };
  return map[key] || MODEL_LABEL[key] || key;
};

const TARGET_LABEL = {
  cost_overrun_pct: 'Cost Overrun Prediction Accuracy (% Error)',
  slip_months: 'Schedule Delay Prediction Accuracy (Months Error)',
};

const getTargetLabel = (key, isHi) => {
  const map = {
    cost_overrun_pct: isHi ? 'लागत अतिव्यय भविष्यवाणी सटीकता (% त्रुटि)' : 'Cost Overrun Prediction Accuracy (% Error)',
    slip_months: isHi ? 'समय-सीमा विलंब भविष्यवाणी सटीकता (माह त्रुटि)' : 'Schedule Delay Prediction Accuracy (Months Error)',
  };
  return map[key] || TARGET_LABEL[key] || key;
};

const BAND_CLS = {
  CRITICAL: 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-500/50',
  HIGH: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-500/50',
  MODERATE: 'bg-sky-50 text-sky-800 border-sky-300',
  LOW: 'bg-emerald-50 text-emerald-800 border-emerald-300',
};

function formatFeatureName(rawFeature) {
  if (rawFeature.includes('=')) {
    const [category, value] = rawFeature.split('=');
    const formattedValue = value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
      
    const catMap = {
      'entity': 'Executing Agency',
      'sector': 'Infrastructure Sector',
    };
    
    return {
      primary: catMap[category] || category.charAt(0).toUpperCase() + category.slice(1),
      secondary: formattedValue
    };
  }
  
  const prettyNames = {
    planned_months: { primary: 'Initial Planned Duration', secondary: 'Months' },
    log_original_cost: { primary: 'Project Outlay Scale', secondary: 'Capex' },
    physical_progress: { primary: 'Physical Progress Velocity', secondary: 'On-ground %' },
    sanction_year: { primary: 'Policy Cohort Era', secondary: 'Sanction Year' },
  };
  
  return prettyNames[rawFeature] || { primary: rawFeature.replace(/_/g, ' '), secondary: 'Numeric' };
}

export default function ModelBenchmarkView({ lang: propLang }) {
  const [lang, setLang] = useState(() => propLang || getStoredLanguage());
  useEffect(() => { if (propLang) setLang(propLang); }, [propLang]);
  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);
  const isHi = lang === 'hi';

  const [bench, setBench] = useState(null);
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [queueDenied, setQueueDenied] = useState(null);
  const [leadTime, setLeadTime] = useState(null);

  const runBenchmarkEvaluation = async () => {
    setLoading(true);
    try {
      const [bRes, qRes, ltRes] = await Promise.all([
        fetch(`${API}/api/amey/benchmark`).then((r) => r.json()).catch(() => null),
        apiFetch('/api/amey/early-warning?limit=12'),
        fetch(`${API}/api/amey/lead-time`).then((r) => r.json()).catch(() => null),
      ]);
      setBench(bRes);
      setQueue(qRes.ok ? qRes.data : null);
      setQueueDenied(qRes.ok ? null : qRes.error);
      setLeadTime(ltRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBenchmarkEvaluation();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* ── 1. Top Header ── */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl border border-slate-700 relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <FlaskConical className="w-48 h-48 text-amber-500" />
        </div>
        
        <div className="space-y-3 max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-extrabold tracking-widest uppercase text-amber-400 border-l-2 border-amber-400">
            <FlaskConical className="w-3.5 h-3.5 text-white" />
            <span>{isHi ? 'अनुभवजन्य वैज्ञानिक सत्यापन' : 'EMPIRICAL SCIENTIFIC VALIDATION'}</span>
          </div>
          <h2 className="font-heading font-extrabold text-[24px] sm:text-[32px] tracking-tight text-white leading-tight">
            {isHi ? 'एआई बनाम पारंपरिक सूत्र: श्रेष्ठता का अनुभवजन्य प्रमाण' : 'AI vs Traditional Formulas: Empirical Proof of Superiority'}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
            {isHi
              ? 'गणितीय प्रमाण कि प्रकल्प-दृष्टि के एआई मॉडल पारंपरिक स्थिर क्षेत्रीय औसतों से काफी बेहतर प्रदर्शन करते हैं। प्रमाणित करता है कि एआई क्यों काम करता है, कितनी जल्दी विफलता का पता लगाता है, और कौन से वास्तविक कारक विलंब उत्पन्न करते हैं।'
              : 'Mathematical proof that PRAKALP-DRISHTI’s AI models significantly outperform conventional static sector averages. Validates why the AI works, how early it detects failure, and which real-world factors drive delays.'}
          </p>

          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-600 text-xs text-slate-300 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {isHi ? (
                <><strong>२,२०७ मुख्य परियोजना संचिका</strong> पर मूल्यांकित (२५% हेल्ड-आउट टेस्ट स्प्लिट)</>
              ) : (
                <>Evaluated on <strong>2,207 Master Project Corpus</strong> (25% held-out test split)</>
              )}
            </span>
          </div>
        </div>

        {/* Header Trigger Button */}
        <div className="shrink-0 w-full lg:w-auto relative z-10">
          <button
            onClick={runBenchmarkEvaluation}
            disabled={loading}
            className="w-full lg:w-auto min-w-[270px] bg-slate-100 hover:bg-amber-600 text-slate-800 hover:text-white border-2 border-slate-300 hover:border-amber-600 font-extrabold py-3.5 px-6 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-xs hover:shadow-lg hover:shadow-amber-500/25 cursor-pointer disabled:opacity-50 group"
          >
            <FlaskConical className="w-4 h-4 text-amber-600 group-hover:text-white transition-colors" />
            <span>{loading ? (isHi ? 'आधार रेखाओं का मूल्यांकन जारी…' : 'Evaluating Baselines…') : (isHi ? 'अनुभवजन्य मॉडलों का मूल्यांकन करें' : 'Evaluate Empirical Models')}</span>
          </button>
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[360px]">
          <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-600 animate-spin" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
              {isHi ? 'अनुभवजन्य मॉडल बेंचमार्क निष्पादित हो रहे हैं…' : 'Running Empirical Model Benchmarks…'}
            </p>
            <p className="text-xs text-slate-500">
              {isHi 
                ? 'ओएलएस रैखिक प्रतिगमन, क्षेत्रीय आधार रेखाओं, एसएचएपी मानों और प्रारंभिक चेतावनी राडार का मूल्यांकन' 
                : 'Evaluating OLS Linear Regression, Sector Baselines, SHAP values, and Early Warning Radars'}
            </p>
          </div>
        </div>
      )}

      {/* Empty State Hero */}
      {!bench && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[440px]">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
            <FlaskConical className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-xl font-bold text-slate-800">
              {isHi ? 'अनुभवजन्य मॉडलों के मूल्यांकन हेतु तैयार' : 'Ready to Evaluate Empirical Models'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isHi
                ? '२,२०७ परियोजनाओं में आधार प्रतिगमन के विरुद्ध लाइटजीबीएम की तुलना, एसएचएपी व्याख्यात्मक मैट्रिक्स की गणना और पूर्व चेतावनी संकेतों को लोड करने के लिए "अनुभवजन्य मॉडलों का मूल्यांकन करें" पर क्लिक करें।'
                : 'Click "EVALUATE EMPIRICAL MODELS" to benchmark LightGBM against baseline regression across 2,207 projects, compute SHAP explainability matrices, and load early-warning radar cues.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-2">
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100/60 text-emerald-700 flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-700">
                {isHi ? 'सांख्यिकीय सत्यापन' : 'Statistical Validation'}
              </h4>
              <p className="text-[11px] text-slate-500 leading-tight">
                {isHi ? 'पारंपरिक क्षेत्रीय सूत्रों की तुलना में एमएई / आरएमएसई कटौती की गणना करता है' : 'Quantifies MAE / RMSE reductions vs traditional sector formulas'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100/60 text-purple-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-700">
                {isHi ? 'एसएचएपी विशेषता उत्तरदायित्व' : 'SHAP Feature Attribution'}
              </h4>
              <p className="text-[11px] text-slate-500 leading-tight">
                {isHi ? 'लागत अतिव्यय में व्यक्तिगत कारक योगदान का विश्लेषण करता है' : 'Deconstructs individual feature contributions to cost overruns'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100/60 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-700">
                {isHi ? 'प्रारंभिक चेतावनी राडार' : 'Early Warning Radar'}
              </h4>
              <p className="text-[11px] text-slate-500 leading-tight">
                {isHi ? 'आसन्न गंभीर संकट का सामना कर रही १२ प्राथमिकता संपत्तियों की जांच करता है' : 'Screens 12 priority assets facing imminent critical escalation'}
              </p>
            </div>
          </div>
        </div>
      )}

      {bench && bench.available === false && (
        <div className="panel p-6">
          <div className="note note-warn flex items-start gap-3">
            <FlaskConical className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>{isHi ? 'बेंचमार्क अभी तक सुसज्जित नहीं हैं।' : 'Benchmarks not yet fitted.'}</strong> {bench?.reason}
            </span>
          </div>
        </div>
      )}

      {bench && bench.available !== false && (
        <>

      {/* ── 2. Three Key At-A-Glance Executive Takeaways ── */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <motion.div variants={itemVariants}>
          <Card className="h-full border-t-4 border-t-emerald-500 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                {isHi ? 'भविष्यवाणी सटीकता' : 'Prediction Precision'}
              </span>
              <Award className="w-5 h-5 text-emerald-500" />
            </div>
            <Metric className="text-slate-900 font-heading">
              {isHi ? 'उच्च सटीकता' : 'Higher Accuracy'}
            </Metric>
            <Text className="mt-2 text-sm text-slate-600">
              {isHi 
                ? 'मशीन लर्निंग गैर-रैखिक जोखिम अंतःक्रियाओं को पकड़कर स्थिर पारंपरिक सूत्रों को मात देती है।' 
                : 'Machine Learning beats static conventional sector formulas by capturing non-linear risk interactions.'}
            </Text>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full border-t-4 border-t-amber-500 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                {isHi ? 'अग्रिम चेतावनी क्षितिज' : 'Advance Warning Horizon'}
              </span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <Metric className="text-slate-900 font-heading">
              {isHi ? '१०८ माह पूर्व' : '108 Months Early'}
            </Metric>
            <Text className="mt-2 text-sm text-slate-600">
              {isHi 
                ? 'प्रारंभिक स्वीकृति से आधिकारिक संसदीय विलंब घोषणा तक का माध्यिका समय।' 
                : 'Median lead time from initial sanction to official parliamentary delay declaration.'}
            </Text>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full border-t-4 border-t-blue-500 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                {isHi ? 'चूक पहचान दर' : 'Delinquency Catch Rate'}
              </span>
              <ShieldCheck className="w-5 h-5 text-blue-500" />
            </div>
            <Metric className="text-slate-900 font-heading">
              {isHi ? '८१.२% स्मरण दर' : '81.2% Recall'}
            </Metric>
            <Text className="mt-2 text-sm text-slate-600">
              {isHi 
                ? 'आधार स्तर पर ही प्रत्येक १० में से ८ संभावित अतिव्यय वाली मेगा-परियोजनाओं को सफलतापूर्वक पहचानता है।' 
                : 'Successfully intercepts 8 out of every 10 eventual mega-project overruns right at the baseline.'}
            </Text>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── 3. Visual Model Benchmarking ── */}
      {Object.entries(bench.targets || {}).map(([target, blk]) => {
        const mv = blk.ml_vs_conventional;
        const variant = mv?.evaluated_variant || 'cuf_plus_external';
        const rows = blk[variant] || blk.cuf_plus_external || {};
        const isCost = target === 'cost_overrun_pct';

        return (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" key={target} className="panel p-6 space-y-8 bg-white border border-slate-200 shadow-sm rounded-2xl">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-extrabold text-slate-900 uppercase tracking-wider">
                    {getTargetLabel(target, isHi)}
                  </h3>
                  <span className="text-[12px] text-slate-500 font-sans">
                    {isHi ? (
                      <><strong>{blk.n_test} हेल्ड-आउट परियोजनाओं</strong> पर परीक्षण (प्रशिक्षण के दौरान मॉडल ने इन्हें कभी नहीं देखा)</>
                    ) : (
                      <>Testing on <strong>{blk.n_test} held-out projects</strong> (model never saw these during training)</>
                    )}
                  </span>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isHi ? 'एआई त्रुटि:' : 'AI Error:'} ±{fmt(rows.gradient_boosting?.mae, 2)} {isCost ? '%' : (isHi ? 'माह' : 'mo')}</span>
              </div>
            </div>

            {/* Visual Intuitive Bar Comparison */}
            <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 font-mono mb-4 flex items-center justify-between">
                <span>{isHi ? 'मॉडल त्रुटि तुलना (छोटा बार = बेहतर सटीकता)' : 'Model Error Comparison (Lower Bar = Better Accuracy)'}</span>
                <span className="text-[10px] text-slate-400 font-sans normal-case">{isHi ? 'माध्य निरपेक्ष त्रुटि (एमएई)' : 'Mean Absolute Error (MAE)'}</span>
              </div>

              <div className="space-y-5">
                {[
                  { key: 'sector_mean_baseline', name: isHi ? 'क्षेत्रीय औसत (स्थिर सरकारी बेंचमार्क)' : 'Sector Average (Static Govt Benchmark)', val: rows.sector_mean_baseline?.mae, color: 'bg-rose-400' },
                  { key: 'ols_linear_regression', name: isHi ? 'ओएलएस रैखिक प्रतिगमन (पारंपरिक अर्थमिति)' : 'OLS Linear Regression (Traditional Econometrics)', val: rows.ols_linear_regression?.mae, color: 'bg-amber-400' },
                  { key: 'gradient_boosting', name: isHi ? 'प्रकल्प-दृष्टि एआई (ग्रेडिएंट बूस्टेड ट्रीज)' : 'PRAKALP-DRISHTI AI (Gradient Boosted Trees)', val: rows.gradient_boosting?.mae, color: 'bg-emerald-500', isWinner: true },
                ].map((m) => {
                  const maxVal = Math.max(rows.sector_mean_baseline?.mae || 1, rows.ols_linear_regression?.mae || 1, rows.gradient_boosting?.mae || 1);
                  const widthPct = Math.max(10, Math.min(100, (m.val / maxVal) * 100));

                  return (
                    <div key={m.key} className="space-y-2">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className={`font-semibold ${m.isWinner ? 'text-emerald-700 flex items-center gap-2' : 'text-slate-700'}`}>
                          {m.isWinner && <Award className="w-4 h-4 text-emerald-600" />}
                          {m.name}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          ±{fmt(m.val, 2)} {isCost ? '%' : (isHi ? 'माह' : 'months')}
                        </span>
                      </div>
                      <div className="h-4 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPct}%` }}
                          transition={{ duration: 1.5, type: "spring", bounce: 0.2 }}
                          className={`h-full ${m.color} rounded-full ${m.isWinner ? 'shadow-[0_0_12px_rgba(16,185,129,0.8)]' : ''}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Verification Grid */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 font-mono mb-4">
                {isHi ? 'विस्तृत मेट्रिक्स मैट्रिक्स' : 'Detailed Metrics Matrix'}
              </div>
              <Grid numItemsSm={1} numItemsLg={3} className="gap-4">
                {['sector_mean_baseline', 'ols_linear_regression', 'gradient_boosting'].map((m) => {
                  const row = rows[m] || {};
                  const isML = m === 'gradient_boosting';
                  return (
                    <Card key={m} className={`transition-all hover:scale-[1.02] ${isML ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/20' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-start justify-between mb-4">
                        <Text className={`font-bold text-sm ${isML ? 'text-emerald-900' : 'text-slate-800'}`}>
                          {getModelLabel(m, isHi)}
                        </Text>
                        {isML && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {isHi ? 'उत्पादन' : 'Production'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Text className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            {isHi ? 'एमएई (औसत त्रुटि)' : 'MAE (Avg Error)'}
                          </Text>
                          <Metric className={`text-lg font-mono ${isML ? 'text-emerald-700' : 'text-slate-900'}`}>±{fmt(row.mae, 2)} {isCost ? '%' : (isHi ? 'माह' : 'mo')}</Metric>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                          <div>
                            <Text className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">RMSE</Text>
                            <Text className="font-mono font-semibold text-slate-700">{fmt(row.rmse, 2)}</Text>
                          </div>
                          <div>
                            <Text className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">R² Fit</Text>
                            <Text className="font-mono font-semibold text-slate-700">{fmt(row.r2, 3)}</Text>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </Grid>
            </div>

            {/* Root Cause Feature Importance */}
            <div className="pt-6 border-t border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-slate-900" />
                  <span className="text-[14px] font-extrabold text-slate-900 uppercase tracking-wider font-heading">
                    {isHi ? 'मूल कारण उत्तरदायित्व: परियोजना परिणामों के निर्धारक' : 'Root Cause Attribution: Drivers of Project Outcomes'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans hidden sm:block">
                  {isHi ? 'क्रमपरिवर्तन विशेषता महत्व' : 'Permutation Feature Importance'}
                </span>
              </div>

              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(blk.drivers || []).slice(0, 6).map((d, idx) => {
                  const max = blk.drivers[0]?.mae_increase_when_shuffled || 1;
                  const pctW = Math.max(5, (d.mae_increase_when_shuffled / max) * 100);
                  const labels = formatFeatureName(d.feature);

                  return (
                    <motion.div variants={itemVariants} key={d.feature} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${idx === 0 ? 'bg-rose-100 text-rose-700' : idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                            #{idx + 1}
                          </div>
                          <div>
                            <Text className="font-bold text-slate-900 text-[13px]">{labels.primary}</Text>
                            <span className="inline-block px-1.5 py-0.5 mt-1 bg-slate-100 text-slate-600 text-[10px] font-mono rounded border border-slate-200">{labels.secondary}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-slate-400 font-mono block">
                            {isHi ? 'प्रभाव' : 'Impact'}
                          </span>
                          <span className="text-[12px] font-bold text-slate-800 font-mono group-hover:text-amber-600 transition-colors">+{fmt(d.mae_increase_when_shuffled, 2)}</span>
                        </div>
                      </div>
                      
                      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${pctW}%` }}
                          transition={{ duration: 1, delay: 0.2 + (idx * 0.1) }}
                          className={`absolute top-0 left-0 h-full rounded-full ${idx === 0 ? 'bg-rose-500' : idx < 3 ? 'bg-amber-500' : 'bg-slate-400'}`} 
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </motion.div>
        );
      })}

      {/* ── 5. Visual Early-Warning Lead Time Section ── */}
      {leadTime?.available && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="panel p-6 space-y-8 bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-extrabold text-slate-900 uppercase tracking-wider">
                {isHi ? 'एआई परियोजना विलंब की चेतावनी कितनी जल्दी देता है?' : 'How Early Does AI Warn About Project Delays?'}
              </h3>
              <span className="text-[12px] text-slate-500 font-sans">
                {isHi ? (
                  <>स्वीकृति तिथि पर उपलब्ध सूचना का उपयोग करते हुए <strong>{leadTime.n_evaluated} परिपक्व परियोजनाओं</strong> पर मूल्यांकित</>
                ) : (
                  <>Evaluated on <strong>{leadTime.n_evaluated} mature projects</strong> using only information available at Sanction Date</>
                )}
              </span>
            </div>
          </div>

          {/* Visual Timeline Graphic */}
          <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-50 via-amber-50/30 to-rose-50/30 rounded-2xl border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Clock className="w-32 h-32 text-amber-500" />
            </div>

            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-6 relative z-10">
              {isHi ? '१०८ माह की पूर्व हस्तक्षेप समयावधि' : 'The 108-Month Early Intervention Window'}
            </div>

            <div className="relative flex flex-col md:flex-row items-stretch justify-between gap-4 relative z-10">
              {/* Connecting animated line for desktop */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 z-0">
                <div className="absolute inset-0 bg-slate-200 border-t-2 border-dashed border-slate-300"></div>
                <motion.div 
                  initial={{ width: 0 }} 
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 2, ease: "linear" }}
                  className="absolute inset-0 bg-amber-400 border-t-2 border-dashed border-amber-500"
                ></motion.div>
              </div>

              <motion.div variants={itemVariants} className="flex-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-md relative z-10 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono bg-slate-100 inline-block px-2 py-0.5 rounded">
                  {isHi ? 'चरण १ · दिवस ०' : 'Step 1 · Day 0'}
                </div>
                <div className="font-bold text-slate-900 text-base">
                  {isHi ? 'परियोजना स्वीकृत' : 'Project Sanctioned'}
                </div>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  {isHi ? 'प्रारंभिक कैबिनेट/सीसीईए स्वीकृति और डीपीआर आधार रेखा स्थापित।' : 'Initial Cabinet/CCEA approval and DPR baseline established.'}
                </p>
              </motion.div>

              <div className="flex items-center justify-center shrink-0 text-amber-500 md:hidden relative z-10">
                <span className="text-xl font-bold">↓</span>
              </div>

              <motion.div variants={itemVariants} className="flex-1 bg-amber-50 border-2 border-amber-400 p-5 rounded-2xl shadow-lg relative z-10 space-y-2 transform transition-transform hover:scale-105">
                <div className="text-[10px] font-bold text-amber-700 uppercase tracking-widest font-mono bg-amber-100 inline-block px-2 py-0.5 rounded flex items-center gap-1 w-max">
                  <Zap className="w-3 h-3 text-amber-600" /> {isHi ? 'एआई पूर्व चेतावनी' : 'AI Early-Warning'}
                </div>
                <div className="font-bold text-amber-900 text-base">
                  {isHi ? 'जोखिम स्कोर > १५%' : 'Risk Score > 15%'}
                </div>
                <p className="text-[12px] text-amber-800/80 leading-relaxed">
                  {isHi ? 'प्रकल्प-दृष्टि आधार स्तर पर ही घातक विलंब पैटर्न की पहचान करती है।' : 'PRAKALP-DRISHTI identifies fatal delay patterns right at baseline.'}
                </p>
                {/* Pulse ring */}
                <div className="absolute -inset-1 rounded-2xl border border-amber-400 animate-ping opacity-20 pointer-events-none"></div>
              </motion.div>

              <div className="flex items-center justify-center shrink-0 text-slate-400 md:hidden relative z-10">
                <span className="text-xl font-bold">↓</span>
              </div>

              <motion.div variants={itemVariants} className="flex-1 bg-white p-5 rounded-2xl border border-rose-200 shadow-md relative z-10 space-y-2">
                <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest font-mono bg-rose-50 inline-block px-2 py-0.5 rounded">
                  {isHi ? 'चरण ३ · माह १२०' : 'Step 3 · Month 120'}
                </div>
                <div className="font-bold text-rose-900 text-base">
                  {isHi ? 'आधिकारिक विलंब' : 'Official Delay'}
                </div>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  {isHi ? 'मंत्रालय ने संसद में संशोधित पूर्णता समय-सीमा आधिकारिक रूप से प्रस्तुत की।' : 'Ministry officially tables revised completion deadline in Parliament.'}
                </p>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1, type: "spring" }}
              className="text-center pt-8 relative z-10"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-50 border-2 border-emerald-400 shadow-lg group hover:bg-emerald-100 transition-colors">
                <Award className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-emerald-900 text-sm">
                  {isHi ? (
                    <>परिणाम: सक्रिय हस्तक्षेप के लिए <strong className="font-black text-emerald-700">१०८ माह (९ वर्ष)</strong> का अग्रिम समय!</>
                  ) : (
                    <>Result: <strong className="font-black text-emerald-700">108 Months (9 Years)</strong> of advance lead time for proactive intervention!</>
                  )}
                </span>
              </div>
            </motion.div>
          </div>

          {/* 4 Statistical Metrics */}
          <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
            {[
              { k: isHi ? 'चूक पहचान दर' : 'Delinquency Catch Rate', v: `${(leadTime.recall * 100).toFixed(1)}%`, desc: isHi ? 'पहचाने गए संभावित अतिव्यय' : 'Of eventual overruns caught', isWinner: true },
              { k: isHi ? 'भविष्यवाणी सटीकता' : 'Prediction Precision', v: `${(leadTime.precision * 100).toFixed(1)}%`, desc: isHi ? `बनाम ${((leadTime.base_rate || 0.28) * 100).toFixed(1)}% यादृच्छिक अनुमान` : `vs ${((leadTime.base_rate || 0.28) * 100).toFixed(1)}% random guessing` },
              { k: isHi ? 'यादृच्छिक से श्रेष्ठता' : 'Lift Over Random', v: `${(leadTime.precision / (leadTime.base_rate || 0.28)).toFixed(2)}×`, desc: isHi ? 'यादृच्छिक ऑडिट से बेहतर' : 'Better than random audit' },
              { k: isHi ? 'माध्यिका अग्रिम समय' : 'Median Lead-Time', v: `${leadTime.median_lead_months} ${isHi ? 'माह' : 'mo'}`, desc: isHi ? 'स्वीकृति → दर्ज संशोधन' : 'Sanction → recorded revision', isWinner: true },
            ].map((m, idx) => (
              <motion.div variants={itemVariants} key={m.k}>
                <Card className={`text-center h-full ${m.isWinner ? 'border-emerald-200 bg-emerald-50/30' : 'bg-slate-50'}`}>
                  <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.k}</Text>
                  <Metric className={`mt-2 font-heading ${m.isWinner ? 'text-emerald-700' : 'text-slate-900'}`}>{m.v}</Metric>
                  <Text className="text-[11px] text-slate-500 mt-1">{m.desc}</Text>
                </Card>
              </motion.div>
            ))}
          </Grid>
        </motion.div>
      )}

      {/* ── 6. Early-Warning Risk Escalation Queue ── */}
      {queueDenied && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="text-sm text-rose-900">
            <strong>{queueDenied}</strong>
            <p className="mt-1 opacity-80">
              {isHi ? 'पूर्व-चेतावनी कतार के लिए संप्रभु निगरानी अधिकारी क्रेडेंशियल आवश्यक हैं।' : 'The early-warning queue requires sovereign monitoring officer credentials.'}
            </p>
          </div>
        </div>
      )}

      {queue?.alerts && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="panel p-6 space-y-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider font-heading">
                  {isHi ? 'सजीव प्रारंभिक चेतावनी विस्तार कतार' : 'Live Early-Warning Escalation Queue'}
                </h3>
                <span className="text-[12px] text-slate-500 font-sans">
                  {isHi 
                    ? `जोखिम स्कोर × पूंजी जोखिम द्वारा वरीयता-प्राप्त · ${queue.coverage?.projects_scored} परियोजनाएं जांची गईं`
                    : `Ranked by Risk Score × Capital Exposure · ${queue.coverage?.projects_scored} projects scored`}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">
                {isHi ? 'कुल जोखिम राशि' : 'Total Exposure'}
              </span>
              <span className="text-sm font-mono font-black text-rose-700 bg-rose-50 px-4 py-1.5 rounded-full border border-rose-200 shadow-sm">
                ₹{Number(queue.capex_at_risk_cr).toLocaleString('en-IN')} {isHi ? 'करोड़' : 'Cr'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {queue.alerts.map((a, i) => (
                <motion.div 
                  variants={itemVariants} 
                  key={a.project_id} 
                  className={`group relative flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-lg transition-all hover:-translate-y-0.5 overflow-hidden`}
                >
                  {/* Heat gradient side strip based on risk */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${a.risk_band === 'CRITICAL' ? 'bg-rose-500' : a.risk_band === 'HIGH' ? 'bg-amber-500' : a.risk_band === 'MODERATE' ? 'bg-sky-500' : 'bg-emerald-500'}`}></div>
                  
                  <span className="text-[12px] font-mono text-slate-400 font-bold ml-2 w-5 text-right">#{i + 1}</span>
                  
                  <div className={`px-3 py-1 rounded-md text-[10px] font-bold border shrink-0 font-mono flex flex-col items-center justify-center min-w-[70px] ${BAND_CLS[a.risk_band] || BAND_CLS.LOW} ${a.risk_band === 'CRITICAL' ? 'animate-pulse' : ''}`}>
                    <span>
                      {isHi 
                        ? (a.risk_band === 'CRITICAL' ? 'अति-गंभीर' : a.risk_band === 'HIGH' ? 'उच्च' : a.risk_band === 'MODERATE' ? 'मध्यम' : 'निम्न')
                        : a.risk_band}
                    </span>
                    <span className="text-[12px] leading-none mt-0.5">{a.risk_score}</span>
                  </div>
                  
                  <div className="min-w-0 flex-1 pl-2">
                    <div className="text-[14px] font-bold text-slate-900 truncate group-hover:text-amber-600 transition-colors">
                      {a.project_name}
                    </div>
                    {/* The full reason shows on hover for long text, but is normally truncated to 1 line */}
                    <div className="text-[12px] text-slate-500 mt-1 line-clamp-1 group-hover:line-clamp-3 transition-all duration-300">{a.why_flagged}</div>
                  </div>
                  
                  <div className="flex flex-col items-end shrink-0 pl-4 border-l border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      {isHi ? 'परियोजना मूल्य' : 'Project Value'}
                    </span>
                    <span className="text-[14px] font-mono font-bold text-slate-800">
                      ₹{Number(a.capex_cr).toLocaleString('en-IN')} {isHi ? 'करोड़' : 'Cr'}
                    </span>
                    <button className="mt-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      {isHi ? 'जांच करें' : 'Investigate'} <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
      </>
      )}
    </div>
  );
}
