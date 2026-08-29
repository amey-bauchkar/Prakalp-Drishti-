import React, { useState } from 'react';
import { Users, Filter, AlertCircle, Info, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';

/**
 * PeerBenchmarkCard Component (§7.5)
 * Displays transparent, data-driven cohort benchmarking with strict suppression floors:
 * - N < 10: Panel suppressed (shows sector median only)
 * - 10 <= N < 20: Peer median shown (percentile rank suppressed)
 * - N >= 20: Full percentile rank and dispersion
 */
export default function PeerBenchmarkCard({ peerData, projectOverrunPct }) {
  const [showCriteria, setShowCriteria] = useState(false);

  if (!peerData) {
    return (
      <div className="panel p-5 text-center text-xs text-slate-500">
        <Info className="w-4 h-4 mx-auto mb-1.5 text-slate-400" />
        <span>Peer benchmark data unavailable for this project.</span>
      </div>
    );
  }

  const { status, selection_criteria: crit, sector_median_overrun_pct: secMedian, peer_median_overrun_pct: peerMedian, percentile_rank: percentile, peer_iqr: iqr, suppression_reason: reason } = peerData;

  const isPanelSuppressed = status === 'PANEL_SUPPRESSED_INSUFFICIENT_N';
  const isPercentileSuppressed = status === 'PERCENTILE_SUPPRESSED_THIN_SAMPLE';
  const isFull = status === 'FULL_BENCHMARK_AVAILABLE';

  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs font-sans space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gov-accent" />
          <h4 className="font-heading font-bold text-sm text-gov-navy dark:text-slate-100">
            Peer Cohort Benchmarking
          </h4>
        </div>

        <button
          type="button"
          onClick={() => setShowCriteria(!showCriteria)}
          className="inline-flex items-center gap-1 text-[11px] text-gov-accent hover:text-gov-navy dark:hover:text-white transition-colors"
        >
          <Filter className="w-3 h-3" />
          <span>How were peers selected?</span>
          {showCriteria ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showCriteria && crit && (
        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 animate-fadeIn">
          <div className="font-bold text-[11px] text-gov-navy dark:text-slate-200 uppercase tracking-wider mb-1">
            Cohort Selection Criteria (N = {crit.peer_count})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11.5px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Sector Filter:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{crit.sector}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Cost Band (±50%):</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{crit.cost_band}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Vintage Window:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{crit.vintage_window}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Sector Total:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{crit.sector_total_projects} projects</span>
            </div>
          </div>
        </div>
      )}

      {/* Suppression State: N < 10 */}
      {isPanelSuppressed && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Peer Benchmark Suppressed (Insufficient Sample Size)</span>
          </div>
          <p className="text-[11.5px] leading-relaxed text-amber-800 dark:text-amber-300">
            {reason}
          </p>
          <div className="pt-2 border-t border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs">
            <span>Overall {crit?.sector} Sector Median Overrun:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">+{secMedian}%</span>
          </div>
        </div>
      )}

      {/* Thin Sample: 10 <= N < 20 */}
      {isPercentileSuppressed && (
        <div className="space-y-2.5">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-gov-accent shrink-0 mt-0.5" />
            <span>{reason}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block uppercase">Project Overrun</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">+{projectOverrunPct}%</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block uppercase">Peer Median (N={crit?.peer_count})</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">+{peerMedian}%</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block uppercase">Sector Median</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">+{secMedian}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Full Benchmark: N >= 20 */}
      {isFull && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block uppercase">This Project</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">+{projectOverrunPct}%</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block uppercase">Peer Median</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">+{peerMedian}%</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block uppercase">Percentile Rank</span>
              <span className="font-mono font-bold text-sm text-gov-accent">
                {percentile}th
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block uppercase">Interquartile (P25–P75)</span>
              <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                +{iqr?.p25}% to +{iqr?.p75}%
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded text-xs text-slate-600 dark:text-slate-400">
            {peerData.interpretation}
          </div>
        </div>
      )}
    </div>
  );
}
