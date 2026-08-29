import React, { useState } from 'react';
import { DollarSign, Calculator, ArrowRight, ShieldCheck, AlertCircle, Info, RefreshCw } from 'lucide-react';
import TracedNumber from './TracedNumber';

/**
 * FinancialExposureTrace Component (§7.6, §7.7)
 * Primary forensic financial exposure decomposition and Clause 10CC simulator.
 */
export default function FinancialExposureTrace({ clauseData, originalCostCr, sanctionYear, revisedCostCr }) {
  const [showSim, setShowSim] = useState(false);
  const [simClaim, setSimClaim] = useState(195.0);
  const [weights, setWeights] = useState({
    steel: 20,
    cement: 15,
    fuel: 15,
    labor: 25,
    other: 25,
  });
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  const runSimulation = async () => {
    setSimLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/tanmay/simulate-clause-10cc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_cost_cr: originalCostCr || 1000.0,
          sanction_year: sanctionYear || 2018,
          revised_cost_cr: revisedCostCr || 1195.0,
          claimed_escalation_cr: parseFloat(simClaim) || 0.0,
          p_steel: weights.steel / 100.0,
          p_cement: weights.cement / 100.0,
          p_fuel: weights.fuel / 100.0,
          p_labor: weights.labor / 100.0,
          p_other: weights.other / 100.0,
        }),
      });
      const data = await res.json();
      setSimResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSimLoading(false);
    }
  };

  const statutoryCap = clauseData?.statutory_allowed_escalation_cr || 0.0;
  const tracedCap = clauseData?.traced_statutory_cap;
  const tracedClaim = clauseData?.traced_claimed_escalation;
  const tracedVariance = clauseData?.traced_unsupported_variance;
  const contributions = clauseData?.component_contributions_cr || {};
  const deltas = clauseData?.macro_deltas || {};

  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs font-sans space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <div>
          <h4 className="font-heading font-bold text-sm text-gov-navy dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Financial Exposure Trace &amp; Clause 10CC Forensics
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            CPWD GCC Section 10CC / NHAI Clause 70 Statutory Price Adjustment Audit
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
            Model-Dependent — Contract Schedule F Required
          </span>
          <button
            type="button"
            onClick={() => {
              setShowSim(!showSim);
              if (!simResult) runSimulation();
            }}
            className="px-2.5 py-1 rounded bg-gov-navy dark:bg-slate-800 text-white text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{showSim ? 'Close Simulator' : 'What-If Simulator'}</span>
          </button>
        </div>
      </div>

      {/* Exposure Decomposition Triplets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Claimed Escalation (Unavailable on real dossiers) */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            1. Contractor Claimed Escalation
          </span>
          <div className="pt-1">
            <TracedNumber traced={tracedClaim} unit="₹ Cr" />
          </div>
          <span className="text-[10px] text-slate-400 block pt-1">
            Requires contractor itemized RA bill invoices.
          </span>
        </div>

        {/* 2. Calculated Statutory Applicable Cap */}
        <div className="p-3.5 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/40 space-y-1">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
            2. Statutory 10CC Allowable Cap
          </span>
          <div className="pt-1 text-lg font-bold text-emerald-700 dark:text-emerald-300 flex items-baseline gap-2 flex-wrap">
            <TracedNumber
              traced={tracedCap}
              value={statutoryCap}
              unit="₹ Cr"
              findingCappedAt="AMBER"
            />
            {clauseData?.cap_pct_of_original_cost !== undefined && (
              <span className="text-xs font-mono font-normal text-emerald-800 dark:text-emerald-300">
                ({clauseData.cap_pct_of_original_cost}% of Original)
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 block pt-1">
            85% escalable base pegged to tender bid date.
          </span>
        </div>

        {/* 3. Potential Unsupported Variance */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            3. Potential Unsupported Variance
          </span>
          <div className="pt-1">
            <TracedNumber traced={tracedVariance} unit="₹ Cr" />
          </div>
          <span className="text-[10px] text-slate-400 block pt-1">
            Computed upon receipt of contractor claim filing.
          </span>
        </div>
      </div>

      {/* Period-Wise Compounding Limitation Callout (§7.6, Point 5) */}
      {clauseData?.is_implausible_legacy_cap && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border-l-3 border-amber-500 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Methodological Limitation: Multi-Decade Accrual on Legacy Project</span>
          </div>
          <p className="leading-relaxed text-[11.5px] text-amber-800 dark:text-amber-300">
            {clauseData.legacy_cap_caveat}
          </p>
        </div>
      )}

      {/* Decomposed Material Components (§7.7) */}
      <div className="p-3.5 bg-slate-50/60 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Intermediate Material Contribution Sub-Terms (Pegged to WPI/CPI Indices):</span>
          <span className="text-[11px] font-mono text-slate-400">Sum = ₹{statutoryCap.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">Steel (20% wt)</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              ₹{contributions.steel_cr || 0.0} Cr
            </span>
            <span className="text-[9.5px] font-mono text-slate-400 block">
              +{deltas.steel_growth_pct || 0}% WPI
            </span>
          </div>

          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">Cement (15% wt)</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              ₹{contributions.cement_cr || 0.0} Cr
            </span>
            <span className="text-[9.5px] font-mono text-slate-400 block">
              +{deltas.cement_growth_pct || 0}% WPI
            </span>
          </div>

          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">Fuel/Bitumen (15%)</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              ₹{contributions.fuel_cr || 0.0} Cr
            </span>
            <span className="text-[9.5px] font-mono text-slate-400 block">
              +{deltas.fuel_growth_pct || 0}% WPI
            </span>
          </div>

          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">Labor (25% wt)</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              ₹{contributions.labor_cr || 0.0} Cr
            </span>
            <span className="text-[9.5px] font-mono text-slate-400 block">
              +{deltas.labor_growth_pct || 0}% CPI-IW
            </span>
          </div>

          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">Other (25% wt)</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              ₹{contributions.other_materials_cr || 0.0} Cr
            </span>
            <span className="text-[9.5px] font-mono text-slate-400 block">
              +{deltas.other_growth_pct || 0}% Basket
            </span>
          </div>
        </div>
      </div>

      {/* Operator What-If Simulator Panel */}
      {showSim && (
        <div className="p-4 bg-slate-900 text-white rounded-lg space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-gov-saffron" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                Operator What-If Simulation Tool
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-400">
              User Input Experiment — Not A Dataset Fact
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Hypothetical Contractor Claimed Escalation (₹ Cr):
              </label>
              <input
                type="number"
                value={simClaim}
                onChange={(e) => setSimClaim(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-gov-accent"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Adjust Material Weight Fractions (Must sum to 100%):
              </label>
              <div className="grid grid-cols-5 gap-1 text-center font-mono text-[11px]">
                <div>
                  <span className="text-[9.5px] text-slate-400 block">Steel</span>
                  <input
                    type="number"
                    value={weights.steel}
                    onChange={(e) => setWeights({ ...weights, steel: Number(e.target.value) })}
                    className="w-full px-1 py-1 rounded bg-slate-800 border border-slate-700 text-center"
                  />
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block">Cement</span>
                  <input
                    type="number"
                    value={weights.cement}
                    onChange={(e) => setWeights({ ...weights, cement: Number(e.target.value) })}
                    className="w-full px-1 py-1 rounded bg-slate-800 border border-slate-700 text-center"
                  />
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block">Fuel</span>
                  <input
                    type="number"
                    value={weights.fuel}
                    onChange={(e) => setWeights({ ...weights, fuel: Number(e.target.value) })}
                    className="w-full px-1 py-1 rounded bg-slate-800 border border-slate-700 text-center"
                  />
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block">Labor</span>
                  <input
                    type="number"
                    value={weights.labor}
                    onChange={(e) => setWeights({ ...weights, labor: Number(e.target.value) })}
                    className="w-full px-1 py-1 rounded bg-slate-800 border border-slate-700 text-center"
                  />
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 block">Other</span>
                  <input
                    type="number"
                    value={weights.other}
                    onChange={(e) => setWeights({ ...weights, other: Number(e.target.value) })}
                    className="w-full px-1 py-1 rounded bg-slate-800 border border-slate-700 text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={runSimulation}
              disabled={simLoading}
              className="px-3 py-1.5 rounded bg-gov-accent text-white text-xs font-bold hover:bg-sky-600 transition-colors flex items-center gap-1.5"
            >
              {simLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
              <span>Re-calculate 10CC Permissible Cap</span>
            </button>

            {simResult && (
              <div className="text-right text-xs">
                <span className="text-slate-400 block">Simulated Unsupported Variance:</span>
                <span className={`font-mono font-bold text-sm ${simResult.unsupported_variance_cr > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  ₹{simResult.unsupported_variance_cr?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
