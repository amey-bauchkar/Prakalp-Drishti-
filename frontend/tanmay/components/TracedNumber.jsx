import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Database, FileText, AlertCircle, Info } from 'lucide-react';

/**
 * TracedNumber Component
 * Core enforcement of Hard Rule 1: No bare primitives in forensic paths.
 * Accepts a TracedValue object and renders the value with recursive provenance disclosure,
 * or an explicit unavailable state naming missing inputs.
 */
export default function TracedNumber({
  traced,
  value,
  unit = '',
  formula,
  sources = [],
  inputs = [],
  assumptions = [],
  findingCappedAt,
  reason,
  missingInputs = [],
  formatter = (v) => (typeof v === 'number' ? v.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : v),
  className = '',
  label = '',
}) {
  const [open, setOpen] = useState(false);

  // Normalize input from either full TracedValue object or direct props
  const status = traced?.status || (traced?.reason || reason ? 'unavailable' : 'computed');
  const displayVal = traced?.value !== undefined ? traced.value : value;
  const displayUnit = traced?.unit || unit;
  const displayFormula = traced?.formula || formula;
  const displaySources = traced?.sources || sources;
  const displayInputs = traced?.inputs || inputs;
  const displayAssumptions = traced?.assumptions || assumptions;
  const displayCappedAt = traced?.finding_capped_at || findingCappedAt;
  const displayReason = traced?.reason || reason;
  const displayMissing = traced?.missing_inputs || missingInputs;

  if (status === 'unavailable' || displayVal === undefined || displayVal === null) {
    return (
      <div className={`inline-flex flex-col text-left ${className}`}>
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-mono border border-dashed border-slate-300 dark:border-slate-700">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-sans font-medium text-[11px]">Unavailable</span>
        </div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs leading-tight">
          {displayReason || 'Source filing unavailable in database'}
          {displayMissing?.length > 0 && (
            <span className="block text-[9.5px] font-mono text-amber-600 dark:text-amber-400 mt-0.5">
              Missing: {displayMissing.join(', ')}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col text-left group ${className}`}>
      <div className="inline-flex items-center gap-1.5 flex-wrap">
        <span className="font-mono font-bold tracking-tight">
          {formatter(displayVal)}
          {displayUnit && <span className="ml-1 text-[0.85em] font-sans font-normal opacity-80">{displayUnit}</span>}
        </span>

        {displayCappedAt && (
          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700" title="Model assumptions cap this finding at Amber">
            Model-Dependent
          </span>
        )}

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="inline-flex items-center gap-0.5 text-[10.5px] font-sans text-gov-accent hover:text-gov-navy dark:hover:text-white transition-colors cursor-pointer ml-1 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Inspect calculation formula and data provenance"
        >
          <HelpCircle className="w-3 h-3 text-gov-accent opacity-75 group-hover:opacity-100" />
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {open && (
        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900/90 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 shadow-sm max-w-md animate-fadeIn z-10">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-[11px] text-gov-navy dark:text-slate-200 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-gov-accent" />
              How was this calculated?
            </span>
            <span className="text-[10px] font-mono text-slate-400">Deterministic Lineage</span>
          </div>

          {displayFormula && (
            <div className="mb-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Formula</span>
              <code className="px-1.5 py-0.5 bg-white dark:bg-slate-950 rounded text-[11px] font-mono text-gov-accent block border border-slate-200 dark:border-slate-800">
                {displayFormula}
              </code>
            </div>
          )}

          {displayInputs?.length > 0 && (
            <div className="mb-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Component Inputs</span>
              <div className="space-y-1 pl-1 border-l-2 border-slate-200 dark:border-slate-700">
                {displayInputs.map((inp, idx) => (
                  <div key={idx} className="text-[11px] flex items-center justify-between gap-2">
                    <span className="text-slate-600 dark:text-slate-400">{inp.name || `Input #${idx + 1}`}:</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                      {inp.value !== undefined ? `${inp.value} ${inp.unit || ''}` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {displayAssumptions?.length > 0 && (
            <div className="mb-2 text-[10.5px] bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200">
              <span className="font-bold block text-[10px] uppercase">Declared Assumptions:</span>
              <ul className="list-disc pl-3 mt-0.5 space-y-0.5">
                {displayAssumptions.map((asmp, i) => (
                  <li key={i}>{asmp}</li>
                ))}
              </ul>
            </div>
          )}

          {displaySources?.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Source Provenance</span>
              <div className="space-y-1">
                {displaySources.map((src, idx) => (
                  <div key={idx} className="text-[10px] font-mono bg-white dark:bg-slate-950 p-1 rounded border border-slate-200 dark:border-slate-800 flex items-center gap-1">
                    <Database className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-gov-navy dark:text-slate-200 font-bold">{src.dataset}</span>
                    <span className="text-slate-400">·</span>
                    <span>{src.field_name}</span>
                    {src.record_id && <span className="text-slate-400">#{src.record_id}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
