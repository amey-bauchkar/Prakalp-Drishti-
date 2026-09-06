import React from 'react';
import { Scale, ShieldAlert, CheckCircle2, Landmark, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SatyaKavachHeader({ flaggedCount = 28, onRefresh, loading, hasData = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl border border-slate-700 relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Scale className="w-48 h-48 text-amber-500" />
      </div>

      <div className="space-y-3 max-w-3xl relative z-10">
        <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-extrabold tracking-widest uppercase text-amber-400 border-l-2 border-amber-400">
          <Scale className="w-3.5 h-3.5 text-white" />
          <span>MODULE 2 · STATUTORY CCEA BOUNDARY AUDIT & FINANCIAL INTEGRITY</span>
        </div>

        <h2 className="font-heading font-extrabold text-[24px] sm:text-[32px] tracking-tight text-white leading-tight flex items-center gap-3">
          SATYA-KAVACH Simulator
          <span className="text-xs font-normal font-sans text-slate-300 py-1 px-2.5 rounded-md bg-white/10 border border-white/15">
            सत्य-कवच
          </span>
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
          Statistical screening engine that detects artificial cost-overrun capping just below the <strong>20% Cabinet approval limit</strong>. Evaluates McCrary bunching density jumps and audits CPWD GCC Clause 10CC price variations.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-600 text-xs text-slate-200 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Evaluated on <strong>2,207 Master Project Corpus</strong> (1,183 active revised)
          </span>

          {hasData && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-xs text-amber-300 font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <strong>{flaggedCount} Projects</strong> flagged in [18%, 20%) proximity band
            </span>
          )}
        </div>
      </div>

      {onRefresh && (
        <div className="shrink-0 w-full lg:w-auto relative z-10">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="w-full lg:w-auto min-w-[270px] bg-slate-100 hover:bg-indigo-600 text-slate-800 hover:text-white border-2 border-slate-300 hover:border-indigo-600 font-extrabold py-3.5 px-6 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-xs hover:shadow-lg hover:shadow-indigo-500/25 cursor-pointer disabled:opacity-50 group"
          >
            <Scale className="w-4 h-4 text-indigo-600 group-hover:text-white transition-colors" />
            <span>{loading ? 'Auditing Portfolios…' : 'Execute Forensic Audit'}</span>
          </button>
        </div>
      )}
    </motion.div>
  );
}
