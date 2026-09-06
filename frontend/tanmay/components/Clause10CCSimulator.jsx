import React, { useState, useEffect } from 'react';
import { Card, Metric, Text } from '@tremor/react';
import { Scale, Calculator, AlertTriangle, CheckCircle2, RefreshCw, Landmark, HelpCircle, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Clause10CCSimulator() {
  const [originalCost, setOriginalCost] = useState(1000);
  const [sanctionYear, setSanctionYear] = useState(2018);
  const [revisedCost, setRevisedCost] = useState(1195);
  const [claimedEscalation, setClaimedEscalation] = useState(195);

  const [pSteel, setPSteel] = useState(0.20);
  const [pCement, setPCement] = useState(0.15);
  const [pFuel, setPFuel] = useState(0.15);
  const [pLabor, setPLabor] = useState(0.25);
  const [pOther, setPOther] = useState(0.25);

  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-run simulation on state changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 200);
    return () => clearTimeout(timer);
  }, [originalCost, sanctionYear, revisedCost, claimedEscalation, pSteel, pCement, pFuel, pLabor, pOther]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tanmay/simulate-clause-10cc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_cost_cr: Number(originalCost),
          sanction_year: Number(sanctionYear),
          revised_cost_cr: Number(revisedCost),
          claimed_escalation_cr: Number(claimedEscalation),
          p_steel: Number(pSteel),
          p_cement: Number(pCement),
          p_fuel: Number(pFuel),
          p_labor: Number(pLabor),
          p_other: Number(pOther),
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSimResult(data);
      }
    } catch (e) {
      console.error("Simulation failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const overrunPct = originalCost > 0 ? (((revisedCost - originalCost) / originalCost) * 100).toFixed(2) : 0;
  const isCloseTo20 = overrunPct >= 18.0 && overrunPct < 20.0;
  const isOver20 = overrunPct >= 20.0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-sans">
      {/* Left Input Configuration Column */}
      <Card className="lg:col-span-6 p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-md bg-white space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              <Calculator className="w-4 h-4" />
            </span>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 tracking-tight">
              CLAUSE 10CC WHAT-IF LAB
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono font-bold">
            CPWD GCC Standard Model
          </span>
        </div>

        {/* Project Cost Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-[11px] font-mono text-slate-600 uppercase block font-bold">
              Original Sanction (₹ Cr)
            </label>
            <input
              type="number"
              value={originalCost}
              onChange={(e) => setOriginalCost(Math.max(1, Number(e.target.value)))}
              className="mt-1 w-full px-3 py-2 bg-slate-50 text-xs font-mono font-bold rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-600 uppercase block font-bold">
              Sanction / Bid Year
            </label>
            <select
              value={sanctionYear}
              onChange={(e) => setSanctionYear(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 bg-slate-50 text-xs font-mono font-bold rounded-lg border border-slate-200 text-slate-900 focus:outline-none"
            >
              {Array.from({ length: 22 }, (_, i) => 2005 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-600 uppercase block font-bold">
              Demanded Revised Cost (₹ Cr)
            </label>
            <input
              type="number"
              value={revisedCost}
              onChange={(e) => setRevisedCost(Math.max(1, Number(e.target.value)))}
              className="mt-1 w-full px-3 py-2 bg-slate-50 text-xs font-mono font-bold rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-600 uppercase block font-bold">
              Claimed Escalation (₹ Cr)
            </label>
            <input
              type="number"
              value={claimedEscalation}
              onChange={(e) => setClaimedEscalation(Math.max(0, Number(e.target.value)))}
              className="mt-1 w-full px-3 py-2 bg-slate-50 text-xs font-mono font-bold rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Commodity Weight Sliders */}
        <div className="pt-3 border-t border-slate-200 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-heading">
              <Sliders className="w-3.5 h-3.5 text-slate-700" />
              COMMODITY WPI COMPONENT FRACTIONS (P-WEIGHTS)
            </span>
            <span className="font-mono text-[11px] text-slate-500 font-bold">
              Sum: {((pSteel + pCement + pFuel + pLabor + pOther) * 100).toFixed(0)}%
            </span>
          </div>

          {/* Steel */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-600 font-medium">Steel Weight (P_steel)</span>
              <span className="font-bold text-slate-900">{(pSteel * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={pSteel}
              onChange={(e) => setPSteel(Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Cement */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-600 font-medium">Cement Weight (P_cement)</span>
              <span className="font-bold text-slate-900">{(pCement * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={pCement}
              onChange={(e) => setPCement(Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Fuel */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-600 font-medium">Fuel & Bitumen (P_fuel)</span>
              <span className="font-bold text-slate-900">{(pFuel * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={pFuel}
              onChange={(e) => setPFuel(Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Labor */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-600 font-medium">Labor / CPI Component (P_labor)</span>
              <span className="font-bold text-slate-900">{(pLabor * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={pLabor}
              onChange={(e) => setPLabor(Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </Card>

      {/* Right Simulation Results Column */}
      <Card className="lg:col-span-6 p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-md bg-white space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h3 className="font-heading font-extrabold text-lg text-slate-900 tracking-tight">
            FORENSIC VERDICT & ALLOWABLE CEILING
          </h3>
          {loading && <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />}
        </div>

        {/* CCEA Boundary Status Alert */}
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          isCloseTo20
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : isOver20
            ? 'bg-rose-50 border-rose-300 text-rose-900'
            : 'bg-emerald-50 border-emerald-300 text-emerald-900'
        }`}>
          {isCloseTo20 ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : isOver20 ? (
            <Landmark className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1">
            <span className="font-mono text-xs font-bold uppercase tracking-wider block">
              {isCloseTo20
                ? "⚠️ SUSPICIOUS: CCEA EVASION PROXIMITY [18%, 20%)"
                : isOver20
                ? "🚨 CCEA MANDATORY REVIEW REQUIRED (≥20%)"
                : "✅ NORMAL COMPLIANT REVISION (<18%)"}
            </span>
            <p className="text-xs leading-relaxed font-sans">
              {isCloseTo20
                ? `Demanded overrun of +${overrunPct}% stops exactly ${(20.0 - overrunPct).toFixed(2)} pp below the 20% CCEA Cabinet re-sanction threshold.`
                : isOver20
                ? `Overrun of +${overrunPct}% breaches the statutory 20% threshold. Mandatory Standing Committee and Cabinet approval required.`
                : `Demanded overrun of +${overrunPct}% is within standard ministerial delegated financial powers.`}
            </p>
          </div>
        </div>

        {/* 10CC Calculation Results Grid */}
        <div className="grid grid-cols-2 gap-3.5 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Escalable Base (85%)</span>
            <span className="font-bold text-base text-slate-900 block mt-0.5">
              ₹{simResult?.escalable_base_cr?.toLocaleString('en-IN')} Cr
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">15% Contractor Fixed Risk deducted</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Composite WPI Inflation</span>
            <span className="font-bold text-base text-emerald-600 block mt-0.5">
              +{simResult?.composite_inflation_pct}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{sanctionYear} to 2026</span>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10.5px] text-indigo-800 block uppercase font-bold">
                  Statutory Allowed Escalation (Clause 10CC Cap)
                </span>
                <span className="font-bold text-lg text-indigo-900 block mt-0.5">
                  ₹{simResult?.statutory_allowed_escalation_cr?.toLocaleString('en-IN')} Cr
                </span>
              </div>
              <span className="px-3 py-1 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-300 font-mono text-xs font-bold">
                +{simResult?.cap_pct_of_original_cost}% Original Cap
              </span>
            </div>
          </div>
        </div>

        {/* Explanatory Formula Note */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
          <span className="font-mono font-bold text-slate-800 block">
            CPWD GCC Clause 10CC Statutory Formula:
          </span>
          <p className="font-mono text-[10.5px] text-slate-700">
            V = 0.85 × BaseCost × ( P_s × ΔS/S₀ + P_c × ΔC/C₀ + P_f × ΔF/F₀ + P_l × ΔL/L₀ + P_m × ΔM/M₀ )
          </p>
        </div>
      </Card>
    </div>
  );
}
