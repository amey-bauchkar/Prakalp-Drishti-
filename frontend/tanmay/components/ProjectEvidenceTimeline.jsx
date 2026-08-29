import React from 'react';
import { Calendar, Clock, ArrowRight, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import TracedNumber from './TracedNumber';

/**
 * ProjectEvidenceTimeline Component (§7.2)
 * Reconstructs factual project timeline from multi-month snapshot progression events.
 * Displays before/after distance to the 20% Cabinet boundary.
 */
export default function ProjectEvidenceTimeline({ events = [], projectId }) {
  if (!events || events.length === 0) {
    return (
      <div className="panel p-5 text-center text-xs text-slate-500">
        <Info className="w-4 h-4 mx-auto mb-1.5 text-slate-400" />
        <span>No multi-cycle timeline events recorded for Project #{projectId}. Baseline administrative sanction active.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <h4 className="font-heading font-bold text-sm text-gov-navy dark:text-slate-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gov-accent" />
          Factual Project Evidence Timeline
        </h4>
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          {events.length} Historical Event{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {events.map((evt, idx) => {
          const isOriginal = evt.event_type === 'ORIGINAL_SANCTION';
          const isLatest = evt.event_type === 'LATEST_APPROVED_STATE';
          const hasCallout = Boolean(evt.boundary_callout);

          return (
            <div key={idx} className="relative group">
              {/* Dot */}
              <div
                className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isOriginal
                    ? 'bg-blue-500 border-white dark:border-slate-900 text-white'
                    : isLatest
                    ? 'bg-emerald-500 border-white dark:border-slate-900 text-white'
                    : 'bg-white dark:bg-slate-900 border-amber-500 text-amber-500'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>

              {/* Event Card */}
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <span className="font-bold text-xs text-gov-navy dark:text-slate-200">
                    {evt.title}
                  </span>
                  {evt.date && evt.date !== 'nan' && evt.date !== 'None' && (
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {evt.date}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2.5">
                  {evt.details}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Recorded Outlay</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      ₹{evt.cost_cr.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Overrun %</span>
                    <span className={`font-mono font-bold ${evt.overrun_pct >= 20 ? 'text-rose-600 dark:text-rose-400' : evt.overrun_pct >= 18 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      +{evt.overrun_pct}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Boundary Distance</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      {evt.distance_to_boundary_pp > 0 ? `${evt.distance_to_boundary_pp} pp to 20%` : 'Boundary Met'}
                    </span>
                  </div>
                </div>

                {hasCallout && (
                  <div className="mt-2.5 p-2 bg-amber-50 dark:bg-amber-950/40 rounded border-l-2 border-amber-500 text-[11.5px] text-amber-900 dark:text-amber-200 font-sans flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{evt.boundary_callout}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
