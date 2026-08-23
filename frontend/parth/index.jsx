import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Activity, AlertCircle, Building, CheckCircle, RefreshCw, BarChart2 } from 'lucide-react';

export default function ArthaNetraView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/parth/psu-risk')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load Artha-Netra data:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#141D30] via-[#1E2A45] to-[#28385C] text-white p-6 sm:p-8 rounded-2xl shadow-elevated border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" /> ARTHA-NETRA · PSU Financial Solvency
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Contractor Solvency & Equity Market Coupling
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Macro-Financial Early Warning System: Correlates executing PSU debt leverage ratios (Debt/Equity), Altman Z-scores, and equity market drawdowns to predict contractor distress 4 to 6 quarters ahead.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 bg-white/10 px-5 py-4 rounded-xl border border-white/15 backdrop-blur-md">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Module Lead</span>
          <span className="text-lg font-black text-emerald-400">Parth</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
            Live Connected: /api/parth
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gov-border shadow-card flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-gov-navy animate-spin" />
          <span className="text-xs font-bold text-gov-muted">Connecting to PSU financial balance sheets & equity telemetry...</span>
        </div>
      ) : data ? (
        <>
          {/* Econometric Key Finding Alert */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3 text-xs text-emerald-200">
            <Activity className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-emerald-300 mr-1">Granger Causality Signal:</span>
              {data.granger_causality_finding}
            </div>
          </div>

          {/* PSU Health Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.psu_risk_records?.map((psu, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gov-border shadow-card p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs px-2.5 py-1 rounded bg-slate-100 text-gov-navy font-mono">
                      NSE: {psu.ticker}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded font-black uppercase tracking-wider ${
                      psu.debt_to_equity > 2.0
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : psu.debt_to_equity > 1.0
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {psu.financial_health_tier}
                    </span>
                  </div>

                  <h3 className="font-black text-base text-gov-navy">{psu.agency_name}</h3>
                  <span className="text-xs text-gov-muted block">{psu.sector}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-gov-border text-xs">
                  <div>
                    <span className="text-[10px] text-gov-muted block font-medium">Debt / Equity</span>
                    <span className={`font-mono font-black text-base ${psu.debt_to_equity > 2.0 ? 'text-rose-600' : 'text-gov-navy'}`}>
                      {psu.debt_to_equity}x
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gov-muted block font-medium">Altman Z-Score</span>
                    <span className="font-mono font-black text-base text-gov-navy">{psu.altman_z_score}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gov-muted block font-medium">Avg Overrun %</span>
                    <span className="font-mono font-bold text-amber-600">+{psu.avg_project_overrun_pct}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gov-muted block font-medium">Active Capex</span>
                    <span className="font-mono font-bold text-gov-navy">₹{(psu.total_monitored_capex_cr / 1000).toFixed(1)}k Cr</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
