import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, ArrowRight, Landmark, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function DPRScorerView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/soham/election-rush')
      .then((res) => res.json())
      .then((json) => { setData(json); setLoading(false); })
      .catch((err) => { console.error('Failed to load DPR-Scorer data:', err); setLoading(false); });
  }, []);

  return (
    <div className="space-y-8 font-sans">
      {/* ═══════ MODULE HERO (SOVEREIGN INSTITUTIONAL DOSSIER) ═══════ */}
      <section className="panel p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-gov-saffron-light text-gov-saffron-dark border border-gov-gold-border text-[11px] font-bold uppercase tracking-wider font-mono">
              <FileText className="w-3.5 h-3.5 text-gov-saffron" />
              <span>DPR-SCORER · Proposal Quality Forensics</span>
            </div>
            <h1 className="font-heading font-extrabold text-[30px] sm:text-[38px] leading-[1.15] text-gov-navy tracking-tight">
              Pre-Election Sanction Rush &amp;<br />
              DPR Scoping Auditor
            </h1>
            <p className="text-text-secondary text-[15px] sm:text-[15.5px] leading-relaxed max-w-2xl font-sans">
              Forensic analysis of Detailed Project Reports: audits project approval timestamps 
              against national &amp; state election cycles to detect rushed foundation approvals 
              lacking statutory 80% Right-of-Way acquisition.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#rush-table" className="btn-saffron-pill py-3 px-6 text-[13.5px] font-bold shadow-md">
                <span>View Flagged Projects</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7 text-center w-full max-w-xs shadow-subtle">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2 font-mono">Key Finding</div>
              <div className="text-[28px] font-heading font-black text-gov-navy leading-snug">23% of portfolio</div>
              <div className="text-[13.5px] text-text-secondary font-bold mt-2">Pre-election rush sanctions</div>
              <div className="text-[11px] font-mono text-gov-saffron-dark mt-1 font-bold">Approved in quarters preceding elections</div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="loading-center py-12"><RefreshCw className="w-5 h-5 animate-spin" />Evaluating DPR scoping quality…</div>
      ) : data ? (
        <>
          {/* ═══════ STAT STRIP ═══════ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="panel p-4">
              <div className="text-[11.5px] text-text-muted font-bold uppercase tracking-wider">Rush Sanctions</div>
              <div className="text-[30px] font-black text-gov-navy mt-1 tracking-tight font-mono">{data.election_rush_sanction_count}</div>
              <div className="text-[12px] text-text-muted mt-1 font-medium">{data.election_rush_percentage}% of national portfolio</div>
            </div>
            <div className="panel p-4">
              <div className="text-[11.5px] text-text-muted font-bold uppercase tracking-wider">Avg Delay Penalty</div>
              <div className="text-[30px] font-black text-rose-600 mt-1 tracking-tight font-mono">+{data.avg_delay_penalty_election_rush_months} months</div>
              <div className="text-[12px] text-text-muted mt-1 font-medium">Excess delay from premature sanction</div>
            </div>
            <div className="panel p-4">
              <div className="text-[11.5px] text-text-muted font-bold uppercase tracking-wider">Statutory Rule</div>
              <div className="text-[20px] font-black text-gov-navy mt-2 font-mono">80% ROW Possession</div>
              <div className="text-[12px] text-text-muted mt-1 font-medium">Required before financial sanction</div>
            </div>
          </div>

          {/* ═══════ FLAGGED PROJECTS TABLE ═══════ */}
          <section id="rush-table" className="panel p-4 sm:p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-border-default pb-4">
              <h2 className="font-heading font-extrabold text-[22px] text-gov-navy">Projects Sanctioned During Pre-Election Quarters</h2>
              <span className="text-[12px] text-text-muted font-mono font-bold">{data.flagged_rush_projects?.length} Flagged Projects</span>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Sector / State</th>
                    <th>Sanction Date</th>
                    <th className="text-center">DPR Score</th>
                    <th className="num">Cost Overrun</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.flagged_rush_projects?.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td><span className="text-text-muted text-[11px] font-mono mr-1">#{p.project_id}</span><span className="font-bold text-gov-navy">{p.project_name}</span></td>
                      <td><span className="font-medium text-gov-navy">{p.sector}</span><br /><span className="text-[11px] text-text-muted">{p.state}</span></td>
                      <td className="text-text-muted font-mono font-medium">{p.sanction_date}</td>
                      <td className="text-center font-mono font-bold text-gov-navy">{p.dpr_scoping_quality_score}/100</td>
                      <td className="num font-bold text-rose-600 font-mono">+{p.cost_overrun_pct}%</td>
                      <td className="text-center"><span className="status-badge status-danger">{p.pre_election_rush_flag}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ═══════ METHODOLOGY ═══════ */}
          <section className="panel p-5 sm:p-6">
            <h3 className="text-[17px] font-heading font-extrabold text-gov-navy mb-3">Methodology</h3>
            <p className="text-[14px] text-text-secondary leading-relaxed max-w-3xl font-sans">
              Project sanction dates cross-referenced against Election Commission of India calendars 
              for Lok Sabha and State Legislative Assembly elections (2004–2024). Projects sanctioned 
              in the two quarters preceding any national or state election are flagged for DPR scoping 
              quality review against the mandatory 80% ROW acquisition benchmark.
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}
