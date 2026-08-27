import React, { useEffect, useState } from 'react';
import { Landmark, AlertTriangle, Info, TreePine, Repeat } from 'lucide-react';

const API = 'http://127.0.0.1:8000';

/**
 * ANUMATI — PARIVESH statutory clearance pipeline.
 *
 * The coverage banner is not decoration. Clearance filings exist for a handful of
 * projects, not for the 2,207-project portfolio, and a panel that showed stalled
 * counts without that context would read as "3 of 2,207 projects are stalled"
 * when the truth is "3 of 3 projects with filings are visible at all".
 */

const STATUS_TAG = {
  APPROVED: 'tag tag-ok',
  IN_PROGRESS: 'tag tag-warn',
  STALLED: 'tag tag-critical',
};

const num = (v, d = 2) => (v == null ? '—' : Number(v).toFixed(d));

export default function AnumatiClearancesPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    let dead = false;
    fetch(`${API}/api/tanmay/anumati/clearances`)
      .then((r) => r.json())
      .then((d) => { if (!dead) { setData(d); setLoading(false); } })
      .catch(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
  }, []);

  if (loading) {
    return <div className="panel p-6 text-center text-xs text-gov-muted">
      Loading PARIVESH clearance pipeline…
    </div>;
  }
  if (!data?.available) {
    return <div className="note note-warn">
      <span><strong>Clearance data unavailable.</strong> {data?.reason}</span>
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="hairgrid hairgrid-4">
        <div className="metric-cell">
          <span className="metric-label">Projects with Filings</span>
          <span className="metric-value">{data.projects_with_clearance_records}</span>
          <span className="metric-sub">{data.clearance_stages_tracked} clearance stages tracked</span>
        </div>
        <div className="metric-cell panel-critical">
          <span className="metric-label">Stalled</span>
          <span className="metric-value metric-neg">{data.projects_stalled}</span>
          <span className="metric-sub">RSI at or above the stagnation threshold</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">PMO Escalation Flagged</span>
          <span className="metric-value metric-warn">{data.projects_flagged_for_pmo_escalation}</span>
          <span className="metric-sub">warrant PRAGATI-level intervention</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Forest Diversion</span>
          <span className="metric-value">
            {num(data.projects.reduce((s, p) => s + (p.total_forest_diversion_ha || 0), 0), 1)}
          </span>
          <span className="metric-sub">hectares across filed proposals</span>
        </div>
      </div>

      <div className="note note-info">
        <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
        <span><strong>Coverage.</strong> {data.coverage_note}</span>
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title"><Landmark className="w-3.5 h-3.5" />PARIVESH Clearance Pipeline</span>
          <span className="panel-meta">Regulatory Stagnation Index per project</span>
        </div>
        <div className="panel-flush overflow-x-auto">
          <table className="ledger">
            <thead>
              <tr>
                <th>Project</th>
                <th>State</th>
                <th className="num">RSI</th>
                <th>Bottleneck Department</th>
                <th className="num">Days Overdue</th>
                <th>Loopbacks</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.projects.map((p) => (
                <tr
                  key={p.project_id}
                  onClick={() => setOpen(open === p.project_id ? null : p.project_id)}
                  className="cursor-pointer"
                  title="Show the stage-by-stage breakdown"
                >
                  <td>
                    <span className="font-semibold text-gov-navy">{p.project_name}</span>
                    <span className="block text-[9.5px] font-mono text-gov-muted">
                      {(p.proposal_numbers || []).slice(0, 2).join(' · ')}
                    </span>
                  </td>
                  <td className="text-[10.5px]">{p.state || '—'}</td>
                  <td className={`num font-semibold ${p.regulatory_stagnation_index >= 1.25 ? 'text-rose-700' : ''}`}>
                    {num(p.regulatory_stagnation_index)}
                  </td>
                  <td className="text-[10.5px]">{p.bottleneck_department}</td>
                  <td className="num">{p.days_overdue}</td>
                  <td>
                    {p.paperwork_loopbacks_detected
                      ? <span className="tag tag-warn"><Repeat className="w-2.5 h-2.5" />Detected</span>
                      : <span className="tag">None</span>}
                  </td>
                  <td>
                    <span className={STATUS_TAG[p.overall_clearance_status] || 'tag'}>
                      {p.overall_clearance_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stage-level breakdown for the selected project. */}
      {open && (() => {
        const p = data.projects.find((x) => x.project_id === open);
        if (!p) return null;
        return (
          <div className="panel panel-accent">
            <div className="panel-head">
              <span className="panel-title"><TreePine className="w-3.5 h-3.5" />{p.project_name}</span>
              <span className="panel-meta">{p.economic_impact_delay_risk}</span>
            </div>
            <div className="panel-flush overflow-x-auto">
              <table className="ledger">
                <thead>
                  <tr>
                    <th>Clearance Stage</th>
                    <th>Department</th>
                    <th className="num">Days Pending</th>
                    <th className="num">Benchmark</th>
                    <th className="num">Stagnation Ratio</th>
                    <th>Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {p.stage_breakdown.map((s) => (
                    <tr key={s.stage_code}>
                      <td className="font-semibold text-gov-navy">{s.stage_name}</td>
                      <td className="text-[10.5px]">{s.department}</td>
                      <td className="num">{s.days_pending}</td>
                      <td className="num text-gov-muted">{s.benchmark_days}</td>
                      <td className={`num font-semibold ${s.stagnation_ratio >= 1.25 ? 'text-rose-700' : ''}`}>
                        {num(s.stagnation_ratio)}×
                      </td>
                      <td>
                        {s.is_stagnated
                          ? <span className="tag tag-critical"><AlertTriangle className="w-2.5 h-2.5" />Stagnated</span>
                          : <span className="tag tag-ok">Within SLA</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {p.recommended_escalation_memo && (
              <div className="note note-authority m-3">
                <span><strong>Escalation memo.</strong> {p.recommended_escalation_memo}</span>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
