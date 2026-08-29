import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, FileQuestion, HelpCircle, ChevronDown, ChevronUp, FileText, Info } from 'lucide-react';

/**
 * LegitimateExplanationPanel Component (§7.4)
 * Evaluates candidate legitimate explanations against the empirical data.
 * Explanations: Supported (evidence present), Possible (plausible, data incomplete), Not Supported (unverified).
 */
export default function LegitimateExplanationPanel({ explanations = [] }) {
  const [openItem, setOpenItem] = useState(null);

  if (!explanations || explanations.length === 0) {
    return (
      <div className="panel p-5 text-center text-xs text-slate-500">
        <Info className="w-4 h-4 mx-auto mb-1.5 text-slate-400" />
        <span>No candidate explanation evaluations available for this project.</span>
      </div>
    );
  }

  const supportedCount = explanations.filter((e) => e.status === 'SUPPORTED').length;
  const possibleCount = explanations.filter((e) => e.status === 'POSSIBLE').length;
  const unverifiedCount = explanations.filter((e) => e.status === 'UNVERIFIED_IN_DATA' || e.status === 'NOT_SUPPORTED').length;

  return (
    <div className="space-y-3 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div>
          <h4 className="font-heading font-bold text-sm text-gov-navy dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gov-accent" />
            Candidate Legitimate Explanations Evaluation
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Systematic screening across 8 standard infrastructure cost-variance drivers
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
            {supportedCount} Supported
          </span>
          {possibleCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
              {possibleCount} Possible
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {unverifiedCount} Unverified in Data
          </span>
        </div>
      </div>

      {/* Mandatory Standing Disclosure Note (§7.4) */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 text-[11.5px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
        <Info className="w-4 h-4 text-gov-accent shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Standing Methodological Note:</strong> An evaluation of <em>“Unverified in Data”</em> indicates
          that supporting documentary evidence is not recorded in the statutory CUF dataset. It denotes an
          <strong> unverified claim</strong> requiring human review, not disproof of fact.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {explanations.map((exp, idx) => {
          const isSupported = exp.status === 'SUPPORTED';
          const isPossible = exp.status === 'POSSIBLE';
          const statusLabel = isSupported ? 'SUPPORTED' : isPossible ? 'POSSIBLE' : 'UNVERIFIED IN DATA';

          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border transition-all ${
                isSupported
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                  : isPossible
                  ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  {isSupported ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : isPossible ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <FileQuestion className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {exp.category}
                  </span>
                </div>

                <span
                  className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-extrabold uppercase tracking-wide shrink-0 ${
                    isSupported
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                      : isPossible
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {statusLabel}
                </span>
              </div>

              <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {exp.evidence}
              </p>

              {exp.missing_document && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Required Document:</span>
                  <span className="font-mono text-gov-accent dark:text-sky-400 text-right truncate max-w-[200px]" title={exp.missing_document}>
                    {exp.missing_document}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
