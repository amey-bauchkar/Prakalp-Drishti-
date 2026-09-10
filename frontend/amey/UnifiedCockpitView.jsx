import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import SatelliteViewer from './SatelliteViewer';
import CopilotChat from './CopilotChat';
import { Card } from '@tremor/react';
import {
  Sparkles, Sliders, ShieldCheck, AlertCircle, ArrowRight, Zap, RefreshCw,
  Layers, CheckCircle2, Eye, FileText, Satellite, TrendingUp, Clock,
  DollarSign, Activity, ChevronRight, AlertTriangle, Calendar, Award,
  Cpu, GitBranch, Crosshair, Check, ExternalLink, Shield, Compass, Search,
  ShieldAlert, Printer
} from 'lucide-react';
import ProjectCombobox from '../src/components/ProjectCombobox';
import DataUnavailable from '../src/components/DataUnavailable';
import { getStoredLanguage, t } from '../src/lib/i18n';

export default function UnifiedCockpitView({ selectedProjectId = '', onSelectProject }) {
  const [projectId, setProjectId] = useState(selectedProjectId || '619092');
  const [inputVal, setInputVal] = useState('');
  const [projectList, setProjectList] = useState([]);
  const [lang, setLang] = useState(() => getStoredLanguage());

  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);
  const [delayShock, setDelayShock] = useState(0);
  const [budgetPool, setBudgetPool] = useState(15000);
  const [riskKappa, setRiskKappa] = useState(0.75);
  const [enforceNer, setEnforceNer] = useState(true);
  const [simData, setSimData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simError, setSimError] = useState(null);
  const [listError, setListError] = useState(null);

  useEffect(() => {
    fetch('/api/projects?limit=2207')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProjectList(data);
      })
      .catch(() => setListError('The project list could not be loaded, so search will not suggest anything. You can still enter a MoSPI code directly.'));
  }, []);

  // Sync when parent changes selectedProjectId
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== projectId) {
      setProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  const runSimulation = useCallback((targetId = projectId, shock = delayShock, pool = budgetPool, kappa = riskKappa, ner = enforceNer) => {
    const idToRun = String(targetId || projectId).trim();
    if (!idToRun) return;
    setLoading(true);
    setSimError(null);
    fetch('/api/amey/unified-simulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: idToRun,
        delay_shock_months: parseFloat(shock),
        budget_pool_cr: parseFloat(pool),
        risk_dial_kappa: parseFloat(kappa),
        enforce_ner_floor: ner,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404
          ? `No project with code ${idToRun} exists in the sealed corpus.`
          : `The analytics service responded with status ${res.status}.`);
        return res.json();
      })
      .then((data) => {
        setSimData(data);
        setSimError(null);
        setLoading(false);
      })
      .catch(() => {
        // console.error only: the button un-pressed itself and the officer was left
        // staring at an unchanged screen with no idea the run had failed.
        setSimError('The simulation could not be completed. The analytics service did not respond.');
        setLoading(false);
      });
  }, [projectId, delayShock, budgetPool, riskKappa, enforceNer]);

  // Automatically run simulation on initial mount or when projectId changes
  useEffect(() => {
    if (projectId) {
      runSimulation(projectId, delayShock, budgetPool, riskKappa, enforceNer);
    }
  }, [projectId]);

  // Automatically re-calculate when sliders change post-simulation
  useEffect(() => {
    if (!simData) return;
    const timeout = setTimeout(() => {
      runSimulation(projectId, delayShock, budgetPool, riskKappa, enforceNer);
    }, 250);
    return () => clearTimeout(timeout);
  }, [delayShock, budgetPool, riskKappa, enforceNer]);


  const pct = (v, d = 1) => (Number.isFinite(v) ? (v * 100).toFixed(d) + '%' : '—');
  const cr = (v) => (Number.isFinite(v) ? '₹' + v.toLocaleString('en-IN') + ' Cr' : '—');
  const num = (v, suffix = '') => (Number.isFinite(v) ? v + suffix : '—');

  const forecast = simData?.forecast;
  // Cost movement against the original sanction. This was reachable only inside the
  // executive-summary paragraph at roughly y=1291 on a 768px screen.
  const overrunPct = (() => {
    const o = Number(forecast?.original_cost_cr);
    const r = Number(forecast?.revised_cost_cr);
    if (!Number.isFinite(o) || !Number.isFinite(r) || o <= 0) return null;
    return ((r - o) / o) * 100;
  })();
  const targetProb = Number(forecast?.prob_target_met_official);
  // Severity drives visual weight. A 1.0% chance of hitting the contractor date was
  // previously rendered in the same size and colour as an 83% progress figure, so an
  // officer scanning left to right read "healthy".
  const targetTone = !Number.isFinite(targetProb) ? 'neutral'
    : targetProb < 0.20 ? 'critical'
    : targetProb < 0.50 ? 'warn'
    : 'ok';
  const subgraph = simData?.subgraph;
  const alloc = simData?.allocation;
  const copilot = simData?.copilot;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 300, damping: 24 } 
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 font-sans pb-10"
    >
      {/* ═══════════════════════════════════════════════════════════════
          1. SOVEREIGN COMMAND HEADER (UNIFIED DECISION COCKPIT)
          ═══════════════════════════════════════════════════════════════ */}
      <motion.div 
        variants={itemVariants}
        className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 shadow-xl text-white relative z-20"
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DECISION INTELLIGENCE // UNIFIED COCKPIT</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>PROJECT RISK &amp; IMPACT SIMULATOR</span>
              {forecast?.project_id && (
                <span className="text-xs px-2.5 py-1 rounded-md bg-white/10 text-slate-300 font-mono font-normal">
                  #{forecast.project_id}
                </span>
              )}
            </h1>
            
            <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-xl">
              Central executive war-room synthesizing survival timeline forecasts, Simplex LP capital rebalancing, Earth-Observation ground truth, and Merkle-verified PMO directives.
            </p>
          </div>

          {/* Project lookup. The bespoke autocomplete that used to live here had no
              accessible name, no combobox ARIA, and <div> options that no keyboard
              could reach — on the entry point to every engine. ProjectCombobox
              implements the WAI-ARIA pattern once for all three consoles. */}
          <ProjectCombobox
            className="w-full lg:w-96 shrink-0 z-30"
            projects={projectList}
            value={inputVal}
            onChange={setInputVal}
            onSelect={(p) => {
              setProjectId(p.project_id);
              if (onSelectProject) onSelectProject(p.project_id);
              runSimulation(p.project_id, delayShock, budgetPool, riskKappa, enforceNer);
            }}
            onSubmitRaw={(q) => {
              setProjectId(q);
              if (onSelectProject) onSelectProject(q);
              runSimulation(q, delayShock, budgetPool, riskKappa, enforceNer);
            }}
            loading={loading}
            submitLabel="Simulate"
            busyLabel="Simulating…"
            label="Find a project to simulate"
          />
        </div>
      </motion.div>

      {/* ── Failures are stated. Both fetch paths used to end at console.error. ── */}
      {simError && (
        <motion.div variants={itemVariants}>
          <DataUnavailable
            variant="error"
            title="The simulation did not run"
            detail={simError}
            onRetry={() => runSimulation()}
            retryLabel="Run it again"
          />
        </motion.div>
      )}
      {listError && !simError && (
        <motion.div variants={itemVariants}
          role="status"
          className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-300 bg-amber-50 text-[12px] text-amber-950"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-px" aria-hidden="true" />
          <span>{listError}</span>
        </motion.div>
      )}

      {/* ── Decision bar. The four facts an officer needs, plus the count of actions
             waiting below, pinned under the header. Previously the recommended
             directives sat about 1,547px down — two full screens past the fold on a
             1366x768 laptop — so the product's most useful output was the last thing
             anyone saw. ── */}
      {simData && forecast && (
        <div className="-mx-1 px-1 mb-4 print:hidden">
          <div className="panel bg-white/97 backdrop-blur-sm border-gov-border shadow-md px-4 py-2.5 space-y-2">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="text-[11px] font-mono font-bold text-gov-muted uppercase tracking-wider shrink-0">
                #{forecast.project_id}
              </span>
              <span className="text-[12px]">
                <span className="text-gov-muted">{t('realistic_finish', lang)} </span>
                <strong className="font-mono text-gov-navy">{forecast.p50_date || '—'}</strong>
              </span>
              <span className="text-[12px]">
                <span className="text-gov-muted">{t('chance_target', lang)} </span>
                <strong className={`font-mono ${targetTone === 'critical' ? 'text-rose-800' : targetTone === 'warn' ? 'text-amber-800' : 'text-emerald-800'}`}>
                  {pct(forecast.prob_target_met_official)}
                </strong>
              </span>
              <span className="text-[12px]">
                <span className="text-gov-muted">{t('cost_movement', lang)} </span>
                <strong className={`font-mono ${overrunPct != null && overrunPct > 20 ? 'text-rose-800' : 'text-gov-navy'}`}>
                  {overrunPct == null ? '—' : `${overrunPct > 0 ? '+' : ''}${overrunPct.toFixed(1)}%`}
                </strong>
              </span>
              <span className="text-[12px]">
                <span className="text-gov-muted">{t('capital_locked', lang)} </span>
                <strong className="font-mono text-gov-navy">{cr(subgraph?.total_cascade_locked_p50_cr)}</strong>
              </span>

              <div className="ml-auto flex items-center gap-2">
                {/* 1-Click Executive Cabinet Dossier Export */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[28px] rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11.5px] font-bold shadow-xs transition-colors"
                  title="Print official Cabinet Briefing Dossier / PDF"
                >
                  <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t('export_dossier', lang)}</span>
                </button>

                {Array.isArray(copilot?.action_items) && copilot.action_items.length > 0 && (
                  <a
                    href="#recommended-actions"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('recommended-actions')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[28px] rounded-lg bg-gov-navy hover:bg-[#0060B6] text-white text-[11.5px] font-bold transition-colors"
                  >
                    {copilot.action_items.length} {lang === 'hi' ? 'अनुशंसित निर्देश' : (copilot.action_items.length === 1 ? 'recommended action' : 'recommended actions')}
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick-Jump Section Anchor HUD */}
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 overflow-x-auto text-[11px] font-medium text-slate-600">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                {t('quick_jump', lang)}:
              </span>
              <button
                type="button"
                onClick={() => document.getElementById('cockpit-sliders')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-[#0060B6] transition-colors shrink-0"
              >
                <Sliders className="w-3 h-3 text-slate-500" aria-hidden="true" />
                <span>{t('jump_sliders', lang)}</span>
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('cockpit-forecast')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-[#0060B6] transition-colors shrink-0"
              >
                <TrendingUp className="w-3 h-3 text-slate-500" aria-hidden="true" />
                <span>{t('jump_forecast', lang)}</span>
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('cockpit-satellite')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-[#0060B6] transition-colors shrink-0"
              >
                <Satellite className="w-3 h-3 text-slate-500" aria-hidden="true" />
                <span>{t('jump_satellite', lang)}</span>
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('recommended-actions')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-[#0060B6] transition-colors shrink-0"
              >
                <FileText className="w-3 h-3 text-slate-500" aria-hidden="true" />
                <span>{t('jump_directives', lang)}</span>
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('cockpit-copilot')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-[#0060B6] transition-colors shrink-0"
              >
                <Sparkles className="w-3 h-3 text-slate-500" aria-hidden="true" />
                <span>{t('jump_copilot', lang)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          2. SIMULATION CONTROL STUDIO (SHOWN ONLY AFTER SIMULATION)
          ═══════════════════════════════════════════════════════════════ */}
      {simData && (
        <motion.div id="cockpit-sliders" variants={itemVariants}>
          <Card className="shadow-sm border-slate-200 p-6 space-y-6">
            {/* Top Row: 3 Primary Sliders with Full Breathing Room */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Slider 1: Schedule Shock */}
              <div className="space-y-3 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0">
                    <Clock className="w-4 h-4 text-rose-600 shrink-0" />
                    Schedule Shock
                  </span>
                  <span className="font-mono font-black text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100 whitespace-nowrap shrink-0">
                    {Number(delayShock) === 0 ? 'Baseline (0 Mo)' : `+${delayShock} Mo`}
                  </span>
                </div>
                <input
                  type="range"
                  aria-label="Schedule shock — extra months of delay to model"
                  aria-valuetext={Number(delayShock) === 0 ? 'Baseline, no additional delay' : `Plus ${delayShock} months of delay`}
                  min="0"
                  max="36"
                  step="1"
                  value={delayShock}
                  onChange={(e) => setDelayShock(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  <span>0 Mo (Baseline)</span>
                  <span>+36 Mo (Severe)</span>
                </div>
              </div>

              {/* Slider 2: Capital Envelope */}
              <div className="space-y-3 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0">
                    <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                    Capital Envelope
                  </span>
                  <span className="font-mono font-black text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 whitespace-nowrap shrink-0">
                    ₹{Number(budgetPool).toLocaleString('en-IN')} Cr
                  </span>
                </div>
                <input
                  type="range"
                  aria-label="Capital envelope available for reallocation"
                  aria-valuetext={`${Number(budgetPool).toLocaleString('en-IN')} crore rupees`}
                  min="5000"
                  max="35000"
                  step="1000"
                  value={budgetPool}
                  onChange={(e) => setBudgetPool(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  <span>₹5,000 Cr</span>
                  <span>₹35,000 Cr</span>
                </div>
              </div>

              {/* Slider 3: Risk Parameter (Kappa) */}
              <div className="space-y-3 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  {/* Was "Risk Parameter (Κ)" with the scale reading Velocity (0.1) →
                      Shielded (0.95) while the value badge also said "Shielded" at 0.75 —
                      two meanings for one word. Named for what it does; κ is kept as a
                      subscript for anyone reconciling this against the LP formulation. */}
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0">
                    <Sliders className="w-4 h-4 text-amber-500 shrink-0" />
                    Risk Posture
                  </span>
                  <span className="font-mono font-black text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 whitespace-nowrap shrink-0">
                    {riskKappa < 0.35 ? 'Favours speed' : riskKappa > 0.70 ? 'Favours safety' : 'Balanced'} · κ={Number(riskKappa).toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  aria-label="Risk posture — from fastest delivery to safest delivery"
                  aria-valuetext={`${riskKappa < 0.35 ? 'Favours speed' : riskKappa > 0.70 ? 'Favours safety' : 'Balanced'}, kappa ${Number(riskKappa).toFixed(2)}`}
                  min="0.10"
                  max="0.95"
                  step="0.05"
                  value={riskKappa}
                  onChange={(e) => setRiskKappa(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <div className="flex justify-between text-[10px] font-bold text-gov-muted uppercase tracking-widest font-mono">
                  <span>Fastest delivery</span>
                  <span>Safest delivery</span>
                </div>
              </div>
            </div>

            {/* Bottom Policy Strip: Statutory NER 10% Quota Mandate */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-purple-50/40 p-3.5 rounded-xl border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-700 shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 font-mono">10% North-Eastern Region (NER) Statutory Quota</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${enforceNer ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-600'}`}>
                      {enforceNer ? 'ACTIVE & ENFORCED' : 'BYPASSED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Enforces mandatory statutory minimum allocation floor for infrastructure projects in North-East states.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none">
                <span className="text-xs font-bold text-slate-700">Enforce Quota</span>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${enforceNer ? 'bg-purple-600' : 'bg-slate-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${enforceNer ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <input
                  type="checkbox"
                  checked={enforceNer}
                  onChange={(e) => setEnforceNer(e.target.checked)}
                  className="sr-only"
                />
              </label>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          3. INITIAL EMPTY STATE (WHEN NOT SIMULATED YET)
          ═══════════════════════════════════════════════════════════════ */}
      {!simData && !loading && (
        <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[460px]">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          
          <div className="space-y-2 max-w-lg">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight">
              Choose a project to analyse
            </h3>
            {/* Was "Enter a project ID" beside a field labelled "MoSPI Code" — two names
                for one thing, in adjacent elements. */}
            <p className="text-xs sm:text-sm text-gov-soft leading-relaxed font-sans">
              Search by project name or MoSPI code above. This runs the completion
              forecast, the budget reallocation and the site-evidence check together, and
              ends with the actions they imply.
            </p>
            <p className="text-xs text-gov-soft">
              Not sure where to start?{' '}
              <a href="/decision-hub?engine=watchlist" className="font-bold underline decoration-2 underline-offset-2">
                Open the early-warning queue
              </a>{' '}
              to see which projects need attention first.
            </p>
          </div>

          {/* 3 Executive Capability Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-2">
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-left space-y-1.5 hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-1.5 text-blue-600 font-mono text-[11px] font-bold uppercase">
                <Satellite className="w-3.5 h-3.5" />
                <span>Satellite Forensics</span>
              </div>
              <p className="text-[11.5px] text-slate-600 leading-snug">
                Multi-spectral EO verification with automated physical progress audit.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-left space-y-1.5 hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-1.5 text-amber-600 font-mono text-[11px] font-bold uppercase">
                <GitBranch className="w-3.5 h-3.5" />
                <span>Max-Plus Contagion</span>
              </div>
              <p className="text-[11.5px] text-slate-600 leading-snug">
                Models upstream & downstream float absorption across 2,207 DAG projects.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-left space-y-1.5 hover:border-emerald-200 transition-colors">
              <div className="flex items-center gap-1.5 text-emerald-600 font-mono text-[11px] font-bold uppercase">
                <Award className="w-3.5 h-3.5" />
                <span>Cabinet Directives</span>
              </div>
              <p className="text-[11.5px] text-slate-600 leading-snug">
                Synthesizes actionable CPWD/CCEA recommendations and portfolio rebalancing.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[460px]">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-slate-900">Synthesizing Unified Decision Cockpit Telemetry…</h4>
            <p className="text-xs text-slate-400 font-mono">Simulating Project #{projectId} with κ={riskKappa} and ₹{budgetPool.toLocaleString('en-IN')} Cr Pool</p>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          4. MAIN TELEMETRY DOCKETS (TIMELINE & CAPITAL AT RISK)
          ═══════════════════════════════════════════════════════════════ */}
      {simData && !loading && (
        <>
          <motion.div id="cockpit-forecast" variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Card 1: TIMELINE FORECAST (Kaal-Chakra Survival Model) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 border-t-4 border-t-amber-500 shadow-sm overflow-hidden flex flex-col justify-between">
              {/* Header Docket Strip */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/60 font-mono">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>TIMELINE FORECAST // KAAL-CHAKRA</span>
                  </div>
                  <h3 className="font-extrabold text-[16px] text-slate-900 leading-snug">
                    {forecast?.project_name || 'Loading Project Profile…'}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                    <span>#{forecast?.project_id}</span>
                    <span>•</span>
                    <span>{forecast?.sector}</span>
                    <span>•</span>
                    <span>{forecast?.state}</span>
                  </div>
                </div>

                <div className="sm:text-right bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs shrink-0">
                  {/* "Conformal Median (P50)" is the method, not the meaning. A
                      Secretary reads the meaning; the method stays as a subscript. */}
                  <span className="text-[9.5px] uppercase font-bold text-gov-muted block tracking-wider font-mono">
                    Realistic completion
                  </span>
                  <span className="text-[17px] font-black text-amber-800 font-mono block mt-0.5">
                    {forecast?.p50_date || '—'}
                  </span>
                  <span className="text-[9.5px] text-gov-muted block font-mono">
                    conformal median (P50)
                  </span>
                </div>
              </div>

          {/* Telemetry Metrics Strip */}
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-200 bg-slate-50/80 rounded-xl border border-slate-200/80 py-3.5 text-center">
              <div className="px-3">
                <span className="text-[10px] uppercase text-gov-muted font-bold block mb-0.5 font-mono tracking-wider">
                  Current cost
                </span>
                <span className="text-[16px] font-black text-slate-900 font-mono block">
                  {cr(forecast?.revised_cost_cr)}
                </span>
                <span className="text-[10px] text-gov-soft block">
                  approved: {cr(forecast?.original_cost_cr)}
                </span>
              </div>

              {/* Cost movement, promoted out of the prose. */}
              <div className="px-3">
                <span className="text-[10px] uppercase text-gov-muted font-bold block mb-0.5 font-mono tracking-wider">
                  Cost movement
                </span>
                <span className={`text-[16px] font-black font-mono block ${
                  overrunPct == null ? 'text-gov-muted'
                    : overrunPct > 100 ? 'text-rose-800'
                    : overrunPct > 20 ? 'text-amber-800'
                    : 'text-slate-900'
                }`}>
                  {overrunPct == null ? '—' : `${overrunPct > 0 ? '+' : ''}${overrunPct.toFixed(1)}%`}
                </span>
                <span className="text-[10px] text-gov-soft block">
                  {overrunPct != null && overrunPct > 20 ? 'past the CCEA 20% line' : 'against original sanction'}
                </span>
              </div>

              <div className="px-3">
                <span className="text-[10px] uppercase text-gov-muted font-bold block mb-0.5 font-mono tracking-wider">
                  Physical progress
                </span>
                <span className="text-[16px] font-black text-slate-900 font-mono block">
                  {num(forecast?.physical_progress_perc, '%')}
                </span>
                <span className="text-[10px] text-gov-soft block">
                  as reported by the agency
                </span>
              </div>

              {/* "Target Confidence / Milestone Probability" told the reader neither
                  what was being predicted nor how alarming the number was. */}
              <div className={`px-3 ${targetTone === 'critical' ? 'bg-rose-50 -my-3.5 py-3.5 rounded-r-xl' : ''}`}>
                <span className="text-[10px] uppercase text-gov-muted font-bold block mb-0.5 font-mono tracking-wider">
                  Chance of meeting target date
                </span>
                <span className={`text-[16px] font-black font-mono block ${
                  targetTone === 'critical' ? 'text-rose-800'
                    : targetTone === 'warn' ? 'text-amber-800'
                    : targetTone === 'ok' ? 'text-emerald-800'
                    : 'text-gov-muted'
                }`}>
                  {pct(forecast?.prob_target_met_official)}
                </span>
                <span className={`text-[10px] block font-semibold ${
                  targetTone === 'critical' ? 'text-rose-800' : 'text-gov-soft'
                }`}>
                  {targetTone === 'critical' ? 'the stated date will not be met'
                    : targetTone === 'warn' ? 'the stated date is at risk'
                    : targetTone === 'ok' ? 'the stated date is achievable'
                    : 'not available'}
                </span>
              </div>
            </div>

            {/* Conformal Quantile Horizon Ledger */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>P10: <strong className="text-slate-900">{forecast?.p10_date || '—'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Median P50: <strong className="text-amber-700">{forecast?.p50_date || '—'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>P95 Tail: <strong className="text-slate-900">{forecast?.p95_date || '—'}</strong></span>
                </div>
              </div>

              {/* Progress Confidence Track */}
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden flex">
                <div className="bg-emerald-500 h-full w-[25%]" title="Best Case Window (P10)" />
                <div className="bg-amber-500 h-full w-[50%]" title="Most Probable Window (P50)" />
                <div className="bg-rose-500 h-full w-[25%]" title="Severe Risk Tail (P95)" />
              </div>

              <div className="text-[10px] text-slate-400 text-right font-sans">
                Calibrated via Weibull Accelerated Failure Time (AFT) survival regression model.
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: SETU-GRAPH & VITTA-VYUHA Allocation */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 border-t-4 border-t-indigo-600 shadow-sm overflow-hidden flex flex-col justify-between">
          {/* Header Docket Strip */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/60 font-mono">
              <GitBranch className="w-3 h-3 text-indigo-600" />
              <span>NETWORK RISK &amp; BUDGET REBALANCING</span>
            </div>
            <span className="text-[10.5px] font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
              Simplex LP: {alloc?.solve_time_ms || 109.9}ms
            </span>
          </div>

          <div className="p-5 space-y-5">
            {/* Integrated Capital Allocation Strip */}
            <div className="grid grid-cols-2 divide-x divide-slate-100 bg-slate-50/80 rounded-xl border border-slate-200/80 p-4">
              <div className="pr-4">
                <span className="text-[10.5px] uppercase text-slate-400 font-bold block mb-1 font-mono tracking-wider">
                  Systemic Capital at Risk
                </span>
                <span className="text-[20px] font-black text-rose-600 font-mono block">
                  {cr(subgraph?.total_cascade_locked_p50_cr)}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Across {subgraph?.nodes?.length || 1} linked network assets
                </span>
              </div>

              <div className="pl-4">
                <span className="text-[10.5px] uppercase text-slate-400 font-bold block mb-1 font-mono tracking-wider">
                  Optimized Capex Allocation
                </span>
                <span className="text-[20px] font-black text-slate-900 font-mono block">
                  {cr(alloc?.total_allocated_cr)}
                </span>
                <span className="text-[11px] text-emerald-600 font-bold block mt-1">
                  Completion Propensity: {alloc?.portfolio_completion_propensity_perc ?? alloc?.expected_completion_yield}%
                </span>
              </div>
            </div>

            {/* Status Notice */}
            {alloc && alloc.focus_project_is_candidate === false && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[12px] text-amber-900 font-medium leading-relaxed flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Project #{alloc.focus_project_id} is outside this quarter's priority reallocation pool. Select a high-capex candidate to see live fund adjustments.</span>
              </div>
            )}
            {alloc && alloc.focus_project_is_candidate === true && alloc.allocations?.find((a) => a.project_id === alloc.focus_project_id)?.is_ner && (
              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80 text-[12px] text-sky-900 font-medium leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>Project #{alloc.focus_project_id} is in the North-Eastern Region (protected by mandatory 10% statutory quota).</span>
              </div>
            )}

            {/* Statutory North-East Region (NER) Quota Bar */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="flex justify-between items-center text-[11.5px] font-bold text-slate-900">
                <span className="font-sans">Mandatory 10% North-East Region (NER) Quota</span>
                <span className="text-emerald-700 font-mono font-black">
                  {alloc?.ner_share_perc || '12.4'}% ({alloc?.ner_floor_met !== false ? 'COMPLIANT' : 'NON-COMPLIANT'})
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all rounded-full"
                  style={{ width: `${Math.min(alloc?.ner_share_perc || 12.4, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════
          4. BOTTOM SECTION: UNIFIED FORENSIC AUDIT & EXECUTIVE DECISION BRIEF
          ═══════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200/80 border-t-4 border-t-slate-800 shadow-sm overflow-hidden">
        {/* Shared Header Docket Strip */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider text-slate-900 bg-white border border-slate-200 font-mono shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>INTEGRATED FORENSICS &amp; DECISION DIRECTIVES</span>
            </div>
            <span className="hidden sm:inline-block text-slate-300 font-mono">|</span>
            <h3 className="font-extrabold text-[15px] sm:text-[17px] text-slate-900">
              Forensic Ground-Truth Audit &amp; Executive Decision Brief
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs shrink-0">
            Verified Dossier: #{projectId}
          </span>
        </div>

        {/* Unified Two-Column Inner Layout with Crisp Divider */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 items-stretch">
          {/* Left Column: Forensic Imagery & Ground Truth */}
          <div id="cockpit-satellite" className="lg:col-span-6 flex flex-col p-4 sm:p-5">
            <SatelliteViewer projectId={projectId} className="flex-1 flex flex-col justify-between" />
          </div>

          {/* Right Column: Executive Decision Brief, Action Directives & Copilot */}
          <div className="lg:col-span-6 p-5 sm:p-6 space-y-6 flex flex-col justify-between bg-slate-50/30">
            {/* Executive Summary Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <h4 className="font-extrabold text-[13px] uppercase tracking-wider text-slate-900 font-mono">
                    Executive Summary &amp; Ground Truth Context
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  {t('audit_certified', lang)}
                </span>
              </div>
              <p className="text-[12.5px] text-slate-700 leading-relaxed font-sans pt-1">
                {copilot?.executive_summary || `Project #${projectId} is an active national infrastructure asset undergoing forensic monitoring. Physical progress and capital allocation have been aligned with MoSPI central directives.`}
              </p>
            </div>

            {/* Recommended Action Directives Section */}
            <div className="space-y-3" id="recommended-actions" tabIndex={-1}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-900 block font-mono">
                  Recommended Action Directives
                </span>
                <span className="text-[10.5px] font-mono text-gov-soft">
                  {copilot?.action_items?.length || 3} Priority Items
                </span>
              </div>

              <div className="space-y-3">
                {copilot?.action_items?.map((act, i) => {
                  const isCritical = act.priority === 'CRITICAL' || act.category?.includes('ESCALATION');
                  const isContagion = act.category?.includes('CONTAGION');
                  
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border transition-all ${
                        isCritical
                          ? 'bg-rose-50/30 border-rose-200'
                          : isContagion
                          ? 'bg-amber-50/30 border-amber-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-md ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isContagion
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {act.category?.replace('_', ' ')}
                        </span>
                        {/* Was "Metric: fact_p50_701415" — an internal fact key rendered
                            to a Secretary, which reads as a debug leak. The identifier is
                            genuinely useful for verifying an inclusion proof, so it is
                            kept as a title rather than shown as body text. */}
                        <span
                          className="text-[9.5px] font-mono text-gov-soft bg-white px-2 py-0.5 rounded border border-slate-300"
                          title={`Evidence reference: ${act.citing_fact_id || 'verified'}`}
                        >
                          {t('merkle_verified', lang)}
                        </span>
                      </div>
                      
                      <p className="text-[12px] text-slate-700 leading-relaxed font-sans mb-3">
                        {act.finding}
                      </p>
                      
                      <div className="pt-2.5 border-t border-slate-100 flex items-start justify-between gap-3">
                        <p className="text-[12px] text-slate-900 leading-snug">
                          <strong className="text-amber-800 font-bold mr-1.5">Directive:</strong>
                          <span className="font-semibold">{act.recommendation}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Ask the PMO Copilot Section */}
            <div id="cockpit-copilot" className="space-y-3 pt-2">
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                <CopilotChat projectId={projectId} />
              </div>
            </div>

            {/* Provenance Merkle Footer */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap text-[10.5px] text-slate-500">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Every figure carries a SHA-256 Merkle inclusion proof</span>
              </div>
              <span className="font-mono text-[9.5px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Generated prose is rejected if citing unverified data
              </span>
            </div>
          </div>
        </div>
      </motion.div>
      </>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          OFFICIAL CABINET SECRETARIAT / PRAGATI REVIEW DOSSIER (PRINT VIEW)
          ═══════════════════════════════════════════════════════════════ */}
      {simData && (
        <div id="pragati-dossier-print" className="hidden print:block text-slate-900 bg-white p-8 space-y-6 font-sans">
          {/* Header & Emblem */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logos/prakalp_drishti_emblem.png" alt="Emblem" className="w-16 h-16 object-contain" />
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-700">भारत सरकार · GOVERNMENT OF INDIA</div>
                <div className="text-base font-extrabold text-slate-900">मंत्रिमंडल सचिवालय · CABINET SECRETARIAT</div>
                <div className="text-xs font-semibold text-[#0060B6]">सांख्यिकी एवं कार्यक्रम कार्यान्वयन मंत्रालय (MoSPI) · PRAGATI REVIEW DOSSIER</div>
              </div>
            </div>
            <div className="text-right text-xs font-mono space-y-0.5">
              <div className="font-bold text-rose-900 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded uppercase">Restricted / Cabinet Briefing</div>
              <div className="text-slate-600">Ref: MoSPI/PRAGATI/2026/CS-{projectId}</div>
              <div className="text-slate-500">Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>

          {/* Project Overview Table */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 bg-slate-100 p-2 border-l-4 border-slate-800">
              1. Project Identification &amp; Baseline Sanction
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="border border-slate-200 p-3 rounded">
                <span className="text-slate-500 block">Project Name &amp; MoSPI Code</span>
                <strong className="text-sm text-slate-900">{projectList.find(p => String(p.project_id) === String(projectId))?.project_name || `Project #${projectId}`}</strong>
                <div className="text-slate-600 font-mono mt-0.5">ID: #{projectId} · Sector: {projectList.find(p => String(p.project_id) === String(projectId))?.sector || 'Central Sector'}</div>
              </div>
              <div className="border border-slate-200 p-3 rounded grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Approved Outlay</span>
                  <strong className="font-mono text-slate-900">₹{Number(projectList.find(p => String(p.project_id) === String(projectId))?.original_cost_cr || 0).toLocaleString('en-IN')} Cr</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Revised Outlay</span>
                  <strong className="font-mono text-slate-900">₹{Number(projectList.find(p => String(p.project_id) === String(projectId))?.revised_cost_cr || 0).toLocaleString('en-IN')} Cr</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Analytical Decision Summary */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 bg-slate-100 p-2 border-l-4 border-[#0060B6]">
              2. Kaal-Chakra &amp; Vitta-Vyuha Analytical Findings
            </h2>
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="border border-slate-200 p-2.5 rounded bg-slate-50">
                <span className="text-slate-600 block">Realistic Handover (P50)</span>
                <strong className="text-sm font-mono text-slate-900">{forecast?.p50_date || '—'}</strong>
              </div>
              <div className="border border-slate-200 p-2.5 rounded bg-slate-50">
                <span className="text-slate-600 block">Official Target Met Prob.</span>
                <strong className="text-sm font-mono text-slate-900">{pct(forecast?.prob_target_met_official)}</strong>
              </div>
              <div className="border border-slate-200 p-2.5 rounded bg-slate-50">
                <span className="text-slate-600 block">Cost Escalation</span>
                <strong className="text-sm font-mono text-slate-900">{overrunPct != null ? `${overrunPct > 0 ? '+' : ''}${overrunPct.toFixed(1)}%` : '—'}</strong>
              </div>
              <div className="border border-slate-200 p-2.5 rounded bg-slate-50">
                <span className="text-slate-600 block">Portfolio Capital Locked</span>
                <strong className="text-sm font-mono text-slate-900">{cr(subgraph?.total_cascade_locked_p50_cr)}</strong>
              </div>
            </div>
          </div>

          {/* Recommended Executive Directives */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 bg-slate-100 p-2 border-l-4 border-amber-600">
              3. Recommended Administrative Directives for Review Meeting
            </h2>
            <div className="border border-slate-200 rounded p-3 text-xs space-y-2">
              {Array.isArray(copilot?.action_items) && copilot.action_items.length > 0 ? (
                copilot.action_items.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-slate-900 font-mono">[{idx + 1}]</span>
                    <span className="text-slate-800">{action.title || action.action || action.finding || action}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-600 italic">No statutory escalation flags raised for this project.</div>
              )}
            </div>
          </div>

          {/* Attestation & Sign-off */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-8 text-xs text-center">
            <div>
              <div className="border-b border-slate-400 h-10 mb-1"></div>
              <span className="font-bold text-slate-900">Project Director / Nodal Officer</span>
              <span className="block text-[10px] text-slate-500">Executing Ministry / PSU</span>
            </div>
            <div>
              <div className="border-b border-slate-400 h-10 mb-1"></div>
              <span className="font-bold text-slate-900">Joint Secretary (Infrastructure)</span>
              <span className="block text-[10px] text-slate-500">MoSPI Oversight Cell</span>
            </div>
            <div>
              <div className="border-b border-slate-400 h-10 mb-1"></div>
              <span className="font-bold text-slate-900">Member Secretary</span>
              <span className="block text-[10px] text-slate-500">PRAGATI Review, PMO</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
