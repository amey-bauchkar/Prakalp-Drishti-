import React, { useState } from 'react';
import { GitMerge, Send, TrendingUp, X } from 'lucide-react';

/**
 * ANUMATI: Clearance Pipeline Stepper & Stagnation Tracker Component (React / Next.js / Tailwind)
 */
export default function AnumatiCard({ data }) {
  const [modalOpen, setModalOpen] = useState(false);
  const {
    overall_clearance_status = 'IN_PROGRESS',
    regulatory_stagnation_index = 1.0,
    bottleneck_department = 'N/A',
    days_overdue = 0,
    economic_impact_delay_risk = '',
    pmo_escalation_flag = false,
    paperwork_loopbacks_detected = false,
    stage_breakdown = [],
    recommended_escalation_memo = ''
  } = data || {};

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden text-slate-100">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <GitMerge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">ANUMATI ENGINE</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">CLEARANCES</span>
            </div>
            <p className="text-xs text-slate-400">Statutory Clearance & Regulatory Bottleneck Tracker</p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-amber-600/20"
        >
          <Send className="w-4 h-4" />
          <span>PRAGATI Brief</span>
        </button>
      </div>

      {/* SUMMARY INDEX */}
      <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-center">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase">Clearance Status</p>
          <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-extrabold rounded ${overall_clearance_status === 'STALLED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
            {overall_clearance_status}
          </span>
        </div>
        <div className="border-x border-slate-800 px-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase">Stagnation Index (RSI)</p>
          <p className="text-lg font-black text-amber-400 font-mono mt-0.5">{regulatory_stagnation_index.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase">Paperwork Loops</p>
          <span className={`inline-block mt-1 px-2.5 py-0.5 text-[11px] font-bold rounded ${paperwork_loopbacks_detected ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
            {paperwork_loopbacks_detected ? 'LOOPS DETECTED' : 'NO LOOPS'}
          </span>
        </div>
      </div>

      {/* STEPPER PIPELINE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span>5-STAGE STATUTORY CLEARANCE PIPELINE</span>
          <span className="text-red-400 font-mono font-extrabold">{days_overdue} Days Overdue</span>
        </div>

        <div className="space-y-2.5">
          {stage_breakdown.map((stage, idx) => (
            <div key={idx} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div className={`w-2.5 h-2.5 rounded-full ${stage.is_stagnated ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`}></div>
                <div>
                  <p className="font-bold text-white">{stage.stage_name}</p>
                  <p className="text-[11px] text-slate-400">{stage.department}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stage.is_stagnated ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
                  {stage.days_pending} / {stage.benchmark_days} days (RSI {stage.stagnation_ratio})
                </span>
                {stage.paperwork_loopback_detected && <p className="text-[10px] text-amber-400 font-semibold mt-1">Paper Loopback</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ECONOMIC IMPACT */}
      <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4 space-y-1">
        <div className="flex items-center space-x-2 text-xs font-bold text-red-400">
          <TrendingUp className="w-4 h-4" />
          <span>QUANTIFIED DELAY COST EXPOSURE</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          {economic_impact_delay_risk}
        </p>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">PMO PRAGATI Review Brief</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-200 font-mono bg-amber-950/30 border border-amber-500/30 p-4 rounded-xl">{recommended_escalation_memo}</p>
            <div className="flex justify-end">
              <button onClick={() => setModalOpen(false)} className="bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
