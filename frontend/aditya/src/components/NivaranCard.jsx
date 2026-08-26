import React, { useState } from 'react';
import { Scale, FileText, AlertOctagon, Sparkles, X } from 'lucide-react';

/**
 * NIVARAN: Dispute Risk Gauge & Flagged Clauses Drawer Component (React / Next.js / Tailwind)
 */
export default function NivaranCard({ data, onRunCustomText }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const {
    clause_risk_score = 0,
    contractor_litigation_index = 0,
    litigation_probability = 0,
    dispute_risk_level = 'LOW',
    flagged_clauses = [],
    recommended_preemptive_action = ''
  } = data || {};

  const gaugeOffset = 251.2 - (251.2 * litigation_probability);

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden text-slate-100">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">NIVARAN ENGINE</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded">MODULE 1</span>
            </div>
            <p className="text-xs text-slate-400">Contractual, Arbitration & Dispute Risk Engine</p>
          </div>
        </div>

        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center space-x-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
        >
          <FileText className="w-4 h-4" />
          <span>Flagged Clauses ({flagged_clauses.length})</span>
        </button>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center bg-slate-950/60 p-5 rounded-xl border border-slate-800/80">
        
        {/* CIRCULAR GAUGE */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" className="text-slate-800" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                className="text-red-500 transition-all duration-1000 ease-out"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={gaugeOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-white font-mono">{Math.round(litigation_probability * 100)}%</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Litigation Prob.</span>
            </div>
          </div>
          <span className="mt-2 text-xs font-bold px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md">
            {dispute_risk_level} RISK
          </span>
        </div>

        {/* BARS */}
        <div className="sm:col-span-7 space-y-4">
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-slate-300">NLP Clause Risk Score</span>
              <span className="text-amber-400 font-bold font-mono">{clause_risk_score} / 1.0</span>
            </div>
            <div className="meter">
              <div className="h-full bg-gov-navy-light" style={{ width: `${clause_risk_score * 100}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-slate-300">Contractor Litigation Index</span>
              <span className="text-red-400 font-bold font-mono">{contractor_litigation_index} / 100</span>
            </div>
            <div className="meter">
              <div className="h-full bg-gov-navy-light" style={{ width: `${contractor_litigation_index}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* PREEMPTIVE DIRECTIVE */}
      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 space-y-1.5">
        <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400">
          <Sparkles className="w-4 h-4" />
          <span>NIVARAN PREEMPTIVE INTERVENTION DIRECTIVE</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-medium">
          {recommended_preemptive_action}
        </p>
      </div>

      {/* DRAWER SLIDE-OVER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-950 border-l border-slate-800 p-6 flex flex-col justify-between space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <AlertOctagon className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Flagged High-Risk Clauses</h3>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1">
              {flagged_clauses.map((c, i) => (
                <div key={i} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-400">{c.clause_title}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded border bg-red-500/10 text-red-400 border-red-500/20">{c.severity}</span>
                  </div>
                  <p className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] font-mono text-slate-300">"{c.snippet}"</p>
                  <p className="text-[11px] text-slate-400"><strong className="text-slate-300">Trigger:</strong> {c.risk_reason}</p>
                </div>
              ))}
            </div>

            <button onClick={() => setDrawerOpen(false)} className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-lg self-end">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
