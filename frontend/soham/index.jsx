import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, Award, CheckCircle2, Clock, RefreshCw, Landmark } from 'lucide-react';

export default function DPRScorerView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/soham/election-rush')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load DPR-Scorer data:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1E1B4B] via-[#312E81] to-[#1E293B] text-white p-6 sm:p-8 rounded-2xl shadow-elevated border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-black uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" /> DPR-SCORER · Proposal Quality Forensics
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Pre-Election Sanction Rush & DPR Scoping Auditor
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Forensic Analysis of Detailed Project Reports (DPR): Audits project approval timestamps against national & state election cycles to detect rushed foundation approvals lacking statutory 80% Right-of-Way (ROW) acquisition.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 bg-white/10 px-5 py-4 rounded-xl border border-white/15 backdrop-blur-md">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Module Lead</span>
          <span className="text-lg font-black text-indigo-400">Soham</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
            Live Connected: /api/soham
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gov-border shadow-card flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-gov-navy animate-spin" />
          <span className="text-xs font-bold text-gov-muted">Evaluating DPR scoping quality scores and election sanction timestamps...</span>
        </div>
      ) : data ? (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gov-border shadow-card space-y-1">
              <span className="text-xs font-bold text-gov-muted uppercase">Pre-Election Rush Sanctions</span>
              <div className="text-3xl font-black text-indigo-700">{data.election_rush_sanction_count} Projects</div>
              <span className="text-[10px] text-gov-muted block">{data.election_rush_percentage}% of entire national portfolio</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gov-border shadow-card space-y-1">
              <span className="text-xs font-bold text-gov-muted uppercase">Avg Delay Penalty</span>
              <div className="text-3xl font-black text-rose-600">+{data.avg_delay_penalty_election_rush_months} Months</div>
              <span className="text-[10px] text-gov-muted block">Excess delay caused by premature DPR sanction</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gov-border shadow-card space-y-1">
              <span className="text-xs font-bold text-gov-muted uppercase">Statutory Rule</span>
              <div className="text-sm font-black text-gov-navy leading-tight">Mandatory 80% ROW Possession</div>
              <span className="text-[10px] text-gov-muted block">Required before financial sanction</span>
            </div>
          </div>

          {/* Flagged Rush Projects Table */}
          <div className="bg-white rounded-2xl border border-gov-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-gov-border flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-700" />
                <h3 className="font-black text-sm text-gov-navy uppercase tracking-wider">
                  Sample Projects Sanctioned During Pre-Election Quarters
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/75 text-gov-muted border-b border-gov-border font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3.5">Project ID & Name</th>
                    <th className="p-3.5">Sector / State</th>
                    <th className="p-3.5">Sanction Date</th>
                    <th className="p-3.5 text-center">DPR Scoping Score</th>
                    <th className="p-3.5 text-right">Cost Overrun %</th>
                    <th className="p-3.5 text-center">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gov-border">
                  {data.flagged_rush_projects?.map((p, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="p-3.5 font-bold text-gov-navy">
                        <span className="text-gov-muted mr-1.5">#{p.project_id}</span>
                        {p.project_name}
                      </td>
                      <td className="p-3.5 text-gov-text-body">
                        <span className="font-semibold block">{p.sector}</span>
                        <span className="text-[10px] text-gov-muted">{p.state}</span>
                      </td>
                      <td className="p-3.5 font-mono text-gov-muted">{p.sanction_date}</td>
                      <td className="p-3.5 text-center font-mono font-black text-indigo-700">
                        {p.dpr_scoping_quality_score}/100
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                        +{p.cost_overrun_pct}%
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                          {p.pre_election_rush_flag}
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
