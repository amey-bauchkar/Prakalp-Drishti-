import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, ArrowRight, Landmark } from 'lucide-react';

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
    <div className="space-y-0">

      {/* ═══════ MODULE HERO ═══════ */}
      <section className="pb-12 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="text-[12px] font-semibold uppercase tracking-widest text-gov-saffron">
              DPR-SCORER · Proposal Quality Forensics
            </div>
            <h1 className="text-[36px] leading-[1.12] font-semibold text-gov-navy tracking-tight">
              Pre-Election Sanction Rush &amp;<br />
              DPR Scoping Auditor
            </h1>
            <p className="text-text-secondary text-[15px] leading-relaxed max-w-xl">
              Forensic analysis of Detailed Project Reports: audits project approval timestamps 
              against national &amp; state election cycles to detect rushed foundation approvals 
              lacking statutory 80% Right-of-Way acquisition.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <a href="#rush-table" className="btn-primary">
                View Flagged Projects <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="bg-white border border-border-default rounded-lg p-8 shadow-card text-center max-w-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-4">Key Finding</div>
              <div className="text-[18px] font-semibold text-gov-navy leading-snug">23% of portfolio</div>
              <div className="text-[14px] text-text-secondary mt-2">Pre-election rush sanctions</div>
              <div className="text-[12px] text-text-muted mt-1">Approved in quarters preceding elections</div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="loading-center"><RefreshCw className="w-5 h-5 animate-spin" />Evaluating DPR scoping quality…</div>
      ) : data ? (
        <>
          {/* ═══════ STAT STRIP ═══════ */}
          <div className="stat-strip -mx-6 sm:mx-0 sm:rounded-lg overflow-hidden mb-12">
            <div className="stat-strip-item">
              <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider">Rush Sanctions</div>
              <div className="text-[28px] font-semibold text-gov-navy mt-1 tracking-tight">{data.election_rush_sanction_count}</div>
              <div className="text-[12px] text-text-muted mt-0.5">{data.election_rush_percentage}% of national portfolio</div>
            </div>
            <div className="stat-strip-item">
              <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider">Avg Delay Penalty</div>
              <div className="text-[28px] font-semibold text-gov-danger mt-1 tracking-tight">+{data.avg_delay_penalty_election_rush_months} months</div>
              <div className="text-[12px] text-text-muted mt-0.5">Excess delay from premature sanction</div>
            </div>
            <div className="stat-strip-item">
              <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider">Statutory Rule</div>
              <div className="text-[18px] font-semibold text-gov-navy mt-1">80% ROW Possession</div>
              <div className="text-[12px] text-text-muted mt-0.5">Required before financial sanction</div>
            </div>
          </div>

          {/* ═══════ FLAGGED PROJECTS TABLE ═══════ */}
          <section id="rush-table">
            <h2 className="text-[22px] font-semibold text-gov-navy mb-6">Projects Sanctioned During Pre-Election Quarters</h2>
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
                    <tr key={idx}>
                      <td><span className="text-text-muted text-[11px] mr-1">#{p.project_id}</span><span className="font-medium text-gov-navy">{p.project_name}</span></td>
                      <td><span className="font-medium">{p.sector}</span><br /><span className="text-[11px] text-text-muted">{p.state}</span></td>
                      <td className="text-text-muted font-medium">{p.sanction_date}</td>
                      <td className="text-center font-semibold text-gov-navy">{p.dpr_scoping_quality_score}/100</td>
                      <td className="num font-medium text-gov-danger">+{p.cost_overrun_pct}%</td>
                      <td className="text-center"><span className="status-badge status-danger">{p.pre_election_rush_flag}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ═══════ METHODOLOGY ═══════ */}
          <section className="bg-white border border-border-default rounded-lg p-8 mt-12">
            <h3 className="text-[16px] font-semibold text-gov-navy mb-3">Methodology</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed max-w-3xl">
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
