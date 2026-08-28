import React, { useState, useEffect } from 'react';
import { 
  GitMerge, Send, TrendingUp, AlertTriangle, CheckCircle2, 
  Clock, ShieldAlert, Building2, RefreshCw, FileText, ArrowRight, Copy, Check
} from 'lucide-react';
import LoginGate from '../amey/LoginGate.jsx';

export default function AnumatiView() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    return localStorage.getItem('prakalp:selectedProjectId') || 'PRJ-NH-2026-089';
  });
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memoCopied, setMemoCopied] = useState(false);

  // Global project selection sync
  useEffect(() => {
    const handleSelect = (e) => {
      if (e.detail) {
        setSelectedProjectId(String(e.detail));
      }
    };
    window.addEventListener('prakalp:selectProject', handleSelect);
    return () => window.removeEventListener('prakalp:selectProject', handleSelect);
  }, []);

  // Fetch project list
  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch('/api/aditya/projects');
        if (res.ok) {
          const list = await res.json();
          setProjects(list);
          const savedId = localStorage.getItem('prakalp:selectedProjectId');
          if (savedId) {
            setSelectedProjectId(savedId);
          } else if (list.length > 0 && !selectedProjectId) {
            setSelectedProjectId(list[0].project_id);
          }
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    }
    loadProjects();
  }, []);

  // Fetch combined profile for selected project
  useEffect(() => {
    async function loadData() {
      if (!selectedProjectId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/aditya/governance/combined-risk-profile/${selectedProjectId}`);
        if (res.ok) {
          const json = await res.json();
          setProfileData(json);
        }
      } catch (err) {
        console.error('Failed to load Anumati data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedProjectId]);

  const anumati = profileData?.anumati_assessment;
  const meta = profileData?.project_metadata;
  const stages = anumati?.stage_breakdown || [];
  const rsi = anumati?.regulatory_stagnation_index ?? 1.85;

  const handleCopyMemo = () => {
    if (anumati?.recommended_escalation_memo) {
      navigator.clipboard.writeText(anumati.recommended_escalation_memo);
      setMemoCopied(true);
      setTimeout(() => setMemoCopied(false), 2500);
    }
  };

  return (
    <LoginGate>
      <div className="space-y-8 font-sans pb-16">
        
        {/* ═══════ MODULE HERO HEADER ═══════ */}
        <div className="bg-slate-900 text-white rounded-2xl p-7 sm:p-9 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold uppercase tracking-wider">
                <GitMerge className="w-4 h-4 text-blue-400" />
                <span>ANUMATI · Statutory Clearance &amp; Regulatory Bottleneck Engine</span>
              </div>
              <h1 className="font-heading font-extrabold text-[28px] sm:text-[34px] text-white leading-tight tracking-tight">
                Statutory Clearances &amp; Bureaucratic Stagnation
              </h1>
              <p className="text-slate-300 text-[14px] leading-relaxed max-w-2xl">
                PARIVESH environmental, forest Stage-I/II, and wildlife clearance tracking. Detects central-state paperwork 
                loopbacks, calculates Regulatory Stagnation Index (RSI), and generates instant PMO PRAGATI escalation briefs.
              </p>
            </div>

            {/* Quick Stat Strip */}
            <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4.5 grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-[10.5px] font-bold text-slate-400 uppercase">Clearance Stages</div>
                <div className="font-mono text-[22px] font-extrabold text-white mt-0.5">5 Stages</div>
                <div className="text-[9.5px] text-slate-500 mt-0.5">PARIVESH &amp; GAD Sync</div>
              </div>
              <div>
                <div className="text-[10.5px] font-bold text-slate-400 uppercase">Mean Stagnation (RSI)</div>
                <div className="font-mono text-[22px] font-extrabold text-amber-400 mt-0.5">1.72×</div>
                <div className="text-[9.5px] text-slate-500 mt-0.5">vs Benchmark Timeline</div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ PROJECT SELECTOR BAR ═══════ */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-gov-navy shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-text-muted uppercase">Select Monitored Infrastructure Project</div>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="font-heading font-bold text-[14px] text-gov-navy bg-slate-50 border border-slate-300 rounded px-3 py-1 mt-0.5 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                {projects.length > 0 ? (
                  projects.map((p) => (
                    <option key={p.project_id} value={p.project_id}>
                      {p.project_name} ({p.project_id}) — ₹{p.total_sanctioned_cost_cr} Cr
                    </option>
                  ))
                ) : (
                  <option value="PRJ-NH-2026-089">Bharatmala Express Highway Expansion (Package 4)</option>
                )}
              </select>
            </div>
          </div>

          {meta && (
            <div className="flex items-center gap-4 text-xs font-sans">
              <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                {meta.sector}
              </span>
              <span className="text-text-secondary">
                Agency: <strong className="text-gov-navy">{meta.executing_agency}</strong>
              </span>
              <span className="text-text-secondary font-mono">
                Sanctioned: <strong className="text-gov-navy">₹{meta.total_sanctioned_cost_cr.toLocaleString()} Cr</strong>
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500 font-medium border border-slate-200 flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span>Connecting to PARIVESH portal &amp; computing Regulatory Stagnation Index...</span>
          </div>
        ) : (
          <>
            {/* ═══════ SUMMARY METRIC TILES ═══════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Tile 1: Status */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
                <div className="text-[11px] font-bold text-text-muted uppercase">Overall Clearance Status</div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-3 py-1 text-sm font-extrabold rounded-lg ${
                    anumati?.overall_clearance_status === 'STALLED' 
                      ? 'bg-red-100 text-red-700 border border-red-200' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {anumati?.overall_clearance_status || 'IN_PROGRESS'}
                  </span>
                </div>
                <p className="text-[11.5px] text-text-secondary mt-1">
                  {anumati?.overall_clearance_status === 'STALLED' ? 'Action required in PARIVESH portal' : 'Operating within standard statutory grace'}
                </p>
              </div>

              {/* Tile 2: RSI */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
                <div className="text-[11px] font-bold text-text-muted uppercase">Regulatory Stagnation Index (RSI)</div>
                <div className="font-mono text-[28px] font-black text-amber-600 leading-none">
                  {rsi.toFixed(2)}×
                </div>
                <p className="text-[11.5px] text-text-secondary">
                  {rsi > 1.5 ? 'Severe timeline inflation (>1.5× statutory benchmark)' : 'Normal processing duration'}
                </p>
              </div>

              {/* Tile 3: Days Overdue */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
                <div className="text-[11px] font-bold text-text-muted uppercase">Cumulative Days Overdue</div>
                <div className="font-mono text-[28px] font-black text-red-600 leading-none">
                  {anumati?.days_overdue || 142} <span className="text-sm font-normal text-slate-500">days</span>
                </div>
                <p className="text-[11.5px] text-text-secondary">
                  Bottleneck: <strong className="text-slate-800">{anumati?.bottleneck_department || 'Forest / MoEFCC'}</strong>
                </p>
              </div>

              {/* Tile 4: Paperwork Loops */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
                <div className="text-[11px] font-bold text-text-muted uppercase">Paperwork Loopback Detection</div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-3 py-1 text-sm font-extrabold rounded-lg ${
                    anumati?.paperwork_loopbacks_detected 
                      ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {anumati?.paperwork_loopbacks_detected ? 'LOOP DETECTED' : 'CLEAN DISPATCH'}
                  </span>
                </div>
                <p className="text-[11.5px] text-text-secondary">
                  {anumati?.paperwork_loopbacks_detected ? 'Queries bouncing between State & Union nodal officers' : 'Sequential non-recursive clearances'}
                </p>
              </div>

            </div>

            {/* ═══════ 5-STAGE CLEARANCE PIPELINE STEPPER ═══════ */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-md space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-blue-600" />
                  <h3 className="font-heading font-extrabold text-[16px] text-gov-navy">
                    5-Stage Statutory Clearance Pipeline
                  </h3>
                </div>
                <span className="text-[11.5px] text-text-muted font-bold font-mono">
                  BENCHMARK VS ACTUAL PROCESSING DAYS
                </span>
              </div>

              <div className="space-y-4">
                {stages.map((stg, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4.5 rounded-xl border transition-all ${
                      stg.is_stagnated 
                        ? 'bg-red-50/50 border-red-200' 
                        : 'bg-slate-50 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          stg.is_stagnated 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : 'bg-emerald-500 text-white'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-heading font-bold text-[14px] text-gov-navy">
                              {stg.stage_name}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                              {stg.department}
                            </span>
                            {stg.paperwork_loopback_detected && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                                ↺ Central-State Query Bounce
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-text-secondary mt-1">
                            Status: <strong className={stg.is_stagnated ? 'text-red-700' : 'text-emerald-700'}>{stg.status}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Stagnation Badge & Days */}
                      <div className="sm:text-right shrink-0">
                        <div className="font-mono font-bold text-[13px] text-slate-800">
                          {stg.days_pending} / <span className="text-slate-400">{stg.benchmark_days} statutory days</span>
                        </div>
                        <div className="text-[11px] font-mono font-bold mt-0.5">
                          <span className={stg.is_stagnated ? 'text-red-600' : 'text-emerald-600'}>
                            RSI: {stg.stagnation_ratio}× ({stg.is_stagnated ? 'Stagnated' : 'On Track'})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${stg.is_stagnated ? 'bg-red-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(100, (stg.days_pending / stg.benchmark_days) * 100)}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══════ QUANTIFIED ECONOMIC DELAY COST & PRAGATI BRIEF ═══════ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left: Quantified Delay Impact */}
              <div className="lg:col-span-5 bg-red-900 text-white rounded-2xl p-6 border border-red-800 shadow-lg space-y-4">
                <div className="flex items-center gap-2 text-red-300 text-xs font-bold uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4" />
                  <span>Quantified Delay Cost Exposure</span>
                </div>
                <h3 className="font-heading font-extrabold text-[20px] text-white">
                  Idle Capital Lockup &amp; Inflation Shock
                </h3>
                <div className="bg-red-950/60 p-4 rounded-xl border border-red-800/80 space-y-2">
                  <div className="text-[11px] text-red-200 font-medium">Estimated Monthly Capital Drag:</div>
                  <div className="font-mono text-[26px] font-black text-amber-300 leading-none">
                    ₹{((meta?.total_sanctioned_cost_cr || 3450) * 0.0085).toFixed(1)} Cr / month
                  </div>
                  <div className="text-[11px] text-red-300">
                    Based on 10.2% WACC capital servicing on uncommissioned linear package assets.
                  </div>
                </div>
                <p className="text-[12.5px] text-red-100 leading-relaxed font-sans">
                  {anumati?.economic_impact_delay_risk || 'Prolonged Stage-II Forest clearance stagnation is escalating idle machinery overheads and triggering price revision claims under CPWD GCC Clause 10CC.'}
                </p>
              </div>

              {/* Right: PMO PRAGATI Escalation Memo */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-amber-600" />
                    <h3 className="font-heading font-extrabold text-[16px] text-gov-navy">
                      PMO PRAGATI Action Escalation Memo
                    </h3>
                  </div>
                  <button
                    onClick={handleCopyMemo}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                  >
                    {memoCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{memoCopied ? 'Copied to Clipboard!' : 'Copy Official Memo'}</span>
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[12px] text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {anumati?.recommended_escalation_memo || 'MEMORANDUM FOR CABINET SECRETARIAT & PMO PRAGATI:\nProject requires immediate inter-ministerial resolution for pending Stage-II Forest clearances.'}
                </div>

                <div className="text-[11.5px] text-text-secondary flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Automatically formatted for submission into the PMO PRAGATI portal review meeting agenda.</span>
                </div>
              </div>

            </div>

          </>
        )}

      </div>
    </LoginGate>
  );
}
