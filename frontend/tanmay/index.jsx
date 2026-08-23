import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Scale, CheckCircle2, RefreshCw, ChevronRight, FileSearch, ShieldCheck } from 'lucide-react';

export default function SatyaKavachView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tanmay/gaming-analysis')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load Satya-Kavach data:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1E2A45] via-[#28385C] to-[#141D30] text-white p-6 sm:p-8 rounded-2xl shadow-elevated border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" /> SATYA-KAVACH · Anti-Gaming Forensics
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            20% CCEA Cabinet Rule Evasion Detector
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Statutory Econometric Audit: Detects artificial clustering of project budget revisions in the 18.0%–19.9% zone to bypass mandatory Cabinet Committee on Economic Affairs (CCEA) scrutiny.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 bg-white/10 px-5 py-4 rounded-xl border border-white/15 backdrop-blur-md">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Module Lead</span>
          <span className="text-lg font-black text-amber-400">Tanmay</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
            Live Connected: /api/tanmay
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gov-border shadow-card flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-gov-navy animate-spin" />
          <span className="text-xs font-bold text-gov-muted">Executing McCrary Density Audit across 2,207 projects...</span>
        </div>
      ) : data ? (
        <>
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gov-border shadow-card space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gov-muted uppercase">Bunching Zone (18-20%)</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-amber-600">{data.projects_in_bunching_zone_18_20pct}</div>
              <span className="text-[10px] text-gov-muted block">Projects avoiding CCEA approval</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gov-border shadow-card space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gov-muted uppercase">Cabinet Breached (&gt;=20%)</span>
                <Scale className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-3xl font-black text-rose-600">{data.projects_above_20pct_cabinet_rule}</div>
              <span className="text-[10px] text-gov-muted block">Subject to mandatory CCEA notes</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gov-border shadow-card space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gov-muted uppercase">Bunching Density Ratio</span>
                <ShieldCheck className="w-4 h-4 text-gov-navy" />
              </div>
              <div className="text-3xl font-black text-gov-navy">{data.bunching_density_ratio}x</div>
              <span className="text-[10px] text-gov-muted block">Clustering discontinuity index</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gov-border shadow-card space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gov-muted uppercase">Zero Overrun Projects</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-emerald-600">{data.zero_overrun_projects}</div>
              <span className="text-[10px] text-gov-muted block">Operating within initial budget</span>
            </div>
          </div>

          {/* Flagged Projects Table */}
          <div className="bg-white rounded-2xl border border-gov-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-gov-border flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-gov-navy" />
                <h3 className="font-black text-sm text-gov-navy uppercase tracking-wider">
                  Flagged Projects: Suspicious 18.0%–19.9% Escalation Clustering
                </h3>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                Top Priority Forensic Scrutiny
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/75 text-gov-muted border-b border-gov-border font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3.5">Project ID & Name</th>
                    <th className="p-3.5">Sector / State</th>
                    <th className="p-3.5">Executing Agency</th>
                    <th className="p-3.5 text-right">Original Cost</th>
                    <th className="p-3.5 text-right">Revised Cost</th>
                    <th className="p-3.5 text-right">Overrun %</th>
                    <th className="p-3.5 text-center">Safety Margin to 20%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gov-border">
                  {data.flagged_sample_projects?.map((p, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/50 transition-colors">
                      <td className="p-3.5 font-bold text-gov-navy">
                        <span className="text-gov-muted mr-1.5">#{p.project_id}</span>
                        {p.project_name}
                      </td>
                      <td className="p-3.5 text-gov-text-body">
                        <span className="font-semibold block">{p.sector}</span>
                        <span className="text-[10px] text-gov-muted">{p.state}</span>
                      </td>
                      <td className="p-3.5 text-gov-text-body font-medium">{p.agency}</td>
                      <td className="p-3.5 text-right font-mono font-medium">₹{p.original_cost_cr.toLocaleString()} Cr</td>
                      <td className="p-3.5 text-right font-mono font-bold text-gov-navy">₹{p.revised_cost_cr.toLocaleString()} Cr</td>
                      <td className="p-3.5 text-right font-mono font-black text-amber-600">+{p.overrun_pct}%</td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-black text-[10px] border border-amber-300">
                          {p.evasion_margin_pct}% below CCEA
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
