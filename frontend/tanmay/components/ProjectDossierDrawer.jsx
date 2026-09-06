import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ShieldAlert, AlertTriangle, Scale, Clock, Building2,
  FileText, Landmark, ArrowRight, CheckCircle2, TrendingUp,
  Layers, Download, ChevronRight, HelpCircle
} from 'lucide-react';
import { Card, Metric, Text } from '@tremor/react';

export default function ProjectDossierDrawer({ projectId, onClose }) {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    fetchDossier(projectId);
  }, [projectId]);

  const fetchDossier = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tanmay/project-dossier/${id}`);
      if (!res.ok) throw new Error(`Project #${id} dossier not found.`);
      const data = await res.json();
      setDossier(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!projectId) return null;

  const costs = dossier?.costs || {};
  const boundary = dossier?.boundary || {};
  const clause10 = dossier?.clause_10cc || {};
  const history = dossier?.revision_history || [];
  const disclosure = clause10?.calculation_disclosure || {};
  const contribs = disclosure?.component_contributions_cr || {};
  const growth = disclosure?.commodity_growth_rates || {};

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        />

        {/* Slide-over Drawer */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white shadow-2xl border-l border-slate-200 h-full overflow-y-auto z-10 flex flex-col font-sans"
        >
          {/* Header */}
          <div className="sticky top-0 z-20 p-5 bg-slate-900 text-white border-b border-slate-800 flex items-start justify-between">
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-sm bg-white/10 text-[10.5px] font-mono text-amber-400 border border-white/10 uppercase tracking-wider font-bold">
                  PROJECT #{projectId}
                </span>
                <span className="px-2 py-0.5 rounded-sm bg-rose-500/20 text-[10.5px] font-mono text-rose-300 border border-rose-500/30 uppercase tracking-wider font-bold">
                  {boundary.classification_label || "THRESHOLD PROXIMITY"}
                </span>
              </div>
              <h2 className="font-heading font-extrabold text-lg text-white line-clamp-2">
                {dossier?.project_name || `Project Dossier #${projectId}`}
              </h2>
              <p className="text-xs text-slate-300 font-mono flex items-center gap-2">
                <span>{dossier?.sector || 'Infrastructure'}</span>
                <span>•</span>
                <span>Agency: {dossier?.agency || 'N/A'}</span>
                <span>•</span>
                <span>State: {dossier?.state || 'National'}</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 flex-1 text-slate-800 text-xs">
            {loading ? (
              <div className="p-12 text-center text-slate-500 space-y-3 font-mono">
                <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading forensic revision dossier…</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                <p className="font-bold">Failed to load dossier</p>
                <p className="text-xs">{error}</p>
              </div>
            ) : (
              <>
                {/* 1. Cost & Boundary Telemetry */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Original Cost</span>
                    <span className="font-mono font-bold text-sm text-slate-900 block mt-0.5">
                      ₹{costs.original_cost_cr?.toLocaleString('en-IN')} Cr
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Base Year: {costs.sanction_year || 'N/A'}</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Revised Cost</span>
                    <span className="font-mono font-bold text-sm text-slate-900 block mt-0.5">
                      ₹{costs.revised_cost_cr?.toLocaleString('en-IN')} Cr
                    </span>
                    <span className="text-[10px] text-amber-600 font-bold block mt-0.5">
                      +₹{costs.cost_increase_cr?.toLocaleString('en-IN', { maximumFractionDigits: 1 })} Cr
                    </span>
                  </div>

                  <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-300">
                    <span className="text-[10px] font-mono text-amber-800 uppercase block font-bold">Total Overrun</span>
                    <span className="font-mono font-bold text-sm text-amber-700 block mt-0.5">
                      +{costs.overrun_pct}%
                    </span>
                    <span className="text-[10px] text-amber-800 block mt-0.5 font-medium">
                      {boundary.distance_to_boundary_pp} pp to 20% limit
                    </span>
                  </div>

                  <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-300">
                    <span className="text-[10px] font-mono text-emerald-800 uppercase block font-bold">10CC Allowed Cap</span>
                    <span className="font-mono font-bold text-sm text-emerald-700 block mt-0.5">
                      ₹{clause10.statutory_allowed_escalation_cr?.toLocaleString('en-IN')} Cr
                    </span>
                    <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
                      (+{clause10.cap_pct_of_original_cost}% inflation cap)
                    </span>
                  </div>
                </div>

                {/* 2. Statutory Directive Banner */}
                <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Landmark className="w-4 h-4" />
                    <span className="font-mono text-xs uppercase font-bold tracking-wider">
                      STATUTORY JURISDICTION DIRECTIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    <strong>Competent Review Authority:</strong> {boundary.required_approval_authority || 'Standing Committee on Cost Overruns (SCCO) / Line Ministry'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Statutory Rule: Department of Expenditure OM No. 24(35)/PF-II/2012. Revisions exceeding ₹100 Cr and 20% baseline mandate Cabinet/CCEA clearance.
                  </p>
                </div>

                {/* 3. Chronological Revision Lineage */}
                <div className="space-y-3">
                  <h4 className="font-heading font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-700" />
                    CHRONOLOGICAL BASELINE & REVISION LINEAGE
                  </h4>

                  <div className="space-y-2 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-8">
                    {history.map((evt, idx) => (
                      <div key={idx} className="relative space-y-0.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <div className="absolute -left-8 top-3.5 w-3 h-3 rounded-full bg-slate-800 ring-4 ring-white" />
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-slate-900">{evt.title}</span>
                          <span className="font-mono text-[10px] text-slate-500">{evt.date?.split(' ')[0] || 'N/A'}</span>
                        </div>
                        <p className="text-xs text-slate-600 font-sans mt-0.5">{evt.details}</p>
                        <div className="flex items-center gap-3 pt-1.5 text-[11px] font-mono text-slate-500">
                          <span>Cost: ₹{evt.cost_cr?.toLocaleString('en-IN')} Cr</span>
                          <span>•</span>
                          <span className="text-amber-600 font-bold">Overrun: +{evt.overrun_pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. CPWD Clause 10CC Forensic Breakdown */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-emerald-600" />
                      CPWD GCC CLAUSE 10CC COMMODITY PRICE DECOMPOSITION
                    </h4>
                    <span className="px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[10px] font-bold">
                      85% Escalable Base
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    Clause 10CC calculates allowable price variation against bid-date commodity wholesale price indices (WPI), deducting 15% fixed contractor risk cushion:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 font-mono text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-semibold">Escalable Base (85%)</span>
                      <span className="font-bold text-slate-900 text-sm">₹{disclosure.escalable_base_cr?.toLocaleString('en-IN')} Cr</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-semibold">Fixed Risk Deduction (15%)</span>
                      <span className="font-bold text-slate-900 text-sm">₹{disclosure.fixed_risk_deduction_cr?.toLocaleString('en-IN')} Cr</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-semibold">Composite WPI Inflation</span>
                      <span className="font-bold text-emerald-600 text-sm">+{disclosure.composite_inflation_pct}%</span>
                    </div>
                  </div>

                  {/* Component Contributions */}
                  <div className="space-y-1.5 pt-2">
                    <span className="font-mono text-[11px] font-bold text-slate-700 block">
                      Allowable Escalation Component Contributions (₹ Cr):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono text-[11px]">
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-bold">Steel</span>
                        <span className="font-bold text-slate-800">₹{contribs.steel || 0} Cr</span>
                        <span className="text-[9.5px] text-slate-500 block mt-0.5">+{growth.steel_growth_pct}% WPI</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-bold">Cement</span>
                        <span className="font-bold text-slate-800">₹{contribs.cement || 0} Cr</span>
                        <span className="text-[9.5px] text-slate-500 block mt-0.5">+{growth.cement_growth_pct}% WPI</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-bold">Fuel/Bitumen</span>
                        <span className="font-bold text-slate-800">₹{contribs.fuel || 0} Cr</span>
                        <span className="text-[9.5px] text-slate-500 block mt-0.5">+{growth.fuel_growth_pct}% WPI</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-bold">Labor (CPI)</span>
                        <span className="font-bold text-slate-800">₹{contribs.labor || 0} Cr</span>
                        <span className="text-[9.5px] text-slate-500 block mt-0.5">+{growth.labor_growth_pct}% CPI</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-bold">Other Mat.</span>
                        <span className="font-bold text-slate-800">₹{contribs.other || 0} Cr</span>
                        <span className="text-[9.5px] text-slate-500 block mt-0.5">+{growth.other_growth_pct}% WPI</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
