import React, { useEffect, useState } from 'react';
import { FlaskConical, AlertTriangle, TrendingUp, Layers, ShieldAlert, Info } from 'lucide-react';
import { apiFetch } from './authClient';

const API = 'http://127.0.0.1:8000';

/**
 * MoSPI Outcomes (e) and (f), Dimensions (b) and (c), plus the Outcome (d) queue.
 *
 * Presentation rule this view follows: the conventional baselines are shown in the same
 * table as the ML model, at the same precision, with no visual de-emphasis. Dimension (b)
 * asks whether ML *actually* provides gains; a layout that buries the baseline would be
 * answering a different question. If OLS wins a column, it should be visible that it won.
 */

const fmt = (v, d = 3) => (v == null ? '—' : Number(v).toFixed(d));

const MODEL_LABEL = {
  sector_mean_baseline: 'Sector mean (conventional)',
  ols_linear_regression: 'OLS linear regression (conventional)',
  gradient_boosting: 'Gradient boosting (AI/ML)',
};

const TARGET_LABEL = {
  cost_overrun_pct: 'Cost Overrun  (% of original sanction)',
  slip_months: 'Schedule Slippage  (months)',
};

const BAND_CLS = {
  CRITICAL: 'bg-rose-100 text-rose-800 border-rose-300',
  HIGH: 'bg-amber-100 text-amber-800 border-amber-300',
  MODERATE: 'bg-sky-100 text-sky-800 border-sky-300',
  LOW: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

export default function ModelBenchmarkView() {
  const [bench, setBench] = useState(null);
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [queueDenied, setQueueDenied] = useState(null);
  const [leadTime, setLeadTime] = useState(null);

  useEffect(() => {
    let dead = false;
    // /benchmark is public (it describes model quality, not project data).
    // /early-warning requires read_alerts, so a 403 is rendered as a role message
    // rather than an empty panel.
    Promise.all([
      fetch(`${API}/api/amey/benchmark`).then((r) => r.json()).catch(() => null),
      apiFetch('/api/amey/early-warning?limit=12'),
      fetch(`${API}/api/amey/lead-time`).then((r) => r.json()).catch(() => null),
    ]).then(([b, q, lt]) => {
      if (dead) return;
      setBench(b);
      setQueue(q.ok ? q.data : null);
      setQueueDenied(q.ok ? null : q.error);
      setLeadTime(lt);
      setLoading(false);
    });
    return () => { dead = true; };
  }, []);

  if (loading) {
    return <div className="bg-white p-8 rounded-2xl border border-gov-border text-xs text-gov-muted text-center">
      Loading model benchmarks and early-warning queue…
    </div>;
  }

  if (!bench || bench.available === false) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-gov-border shadow-card">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
          <FlaskConical className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span><strong>Benchmarks not yet fitted.</strong> {bench?.reason}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Dimension (b): ML vs conventional ─────────────────────────── */}
      {Object.entries(bench.targets || {}).map(([target, blk]) => {
        const mv = blk.ml_vs_conventional;
        // Show the variant that is actually deployed, not whichever block is largest.
        const variant = mv?.evaluated_variant || 'cuf_plus_external';
        const rows = blk[variant] || blk.cuf_plus_external;
        const ab = blk.cuf_vs_external_ablation;
        const ci = blk.calendar_identity;
        return (
          <div key={target} className="bg-white p-5 rounded-2xl border border-gov-border shadow-card">
            <div className="flex items-center gap-2 border-b border-gov-border pb-3 mb-3">
              <TrendingUp className="w-4 h-4 text-gov-navy" />
              <div>
                <h3 className="text-xs font-black text-gov-navy uppercase tracking-wider">
                  {TARGET_LABEL[target] || target}
                </h3>
                <span className="text-[10px] text-gov-muted">
                  n={blk.n_usable} · held-out test={blk.n_test} · identical split for every model ·
                  feature set <strong className="font-mono">
                    {variant === 'cuf_only' ? 'CUF only' : 'CUF + external'}
                  </strong> (chosen by held-out MAE)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="text-gov-muted border-b border-gov-border">
                  <tr>
                    <th className="py-1.5 pr-2 font-bold">Model</th>
                    <th className="py-1.5 px-2 font-bold text-right">R²</th>
                    <th className="py-1.5 px-2 font-bold text-right">MAE</th>
                    <th className="py-1.5 pl-2 font-bold text-right">RMSE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gov-border">
                  {['sector_mean_baseline', 'ols_linear_regression', 'gradient_boosting'].map((m) => {
                    const row = rows[m];
                    const isML = m === 'gradient_boosting';
                    return (
                      <tr key={m} className={isML ? 'bg-gov-surface/60' : ''}>
                        <td className={`py-1.5 pr-2 ${isML ? 'font-black text-gov-navy' : 'font-semibold text-gov-muted-dark'}`}>
                          {MODEL_LABEL[m]}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono">{fmt(row.r2)}</td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold">{fmt(row.mae, 2)}</td>
                        <td className="py-1.5 pl-2 text-right font-mono">{fmt(row.rmse, 2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className={`p-3 rounded-xl border text-[11px] ${mv.ml_is_better
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                <span className="font-black uppercase text-[9px] tracking-wider block mb-0.5">
                  Dimension (b) — AI/ML vs conventional
                </span>
                {mv.ml_is_better
                  ? <>ML reduces MAE by <strong>{fmt(mv.mae_improvement, 2)}</strong> ({mv.mae_improvement_pct}%)
                      against the best conventional method.</>
                  : <>The conventional method <strong>matches or beats</strong> ML here. Reported as measured.</>}
              </div>
              <div className={`p-3 rounded-xl border text-[11px] ${ab.external_helps
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                <span className="font-black uppercase text-[9px] tracking-wider block mb-0.5">
                  Dimension (c) — CUF vs CUF + external
                </span>
                MAE {fmt(ab.cuf_only_mae, 2)} → <strong>{fmt(ab.with_external_mae, 2)}</strong>{' '}
                ({ab.mae_improvement_pct}%) when IMD monsoon, WPI, PSU financials, satellite
                and graph features are added.
              </div>
            </div>

            {/* Honesty disclosure: part of this target's accuracy is arithmetic. */}
            {ci?.applies && (
              <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-900">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                <span>
                  <strong>Calendar-identity disclosure.</strong> Slippage is measured against the
                  original end date, which is recoverable from the sanction year and planned
                  duration — both features. Removing that anchor drops R² from{' '}
                  <strong>{fmt(ci.r2_with_calendar)}</strong> to{' '}
                  <strong>{fmt(ci.r2_calendar_free)}</strong>, so{' '}
                  {fmt(ci.r2_attributable_to_calendar)} of it is arithmetic rather than learned
                  skill. The lower figure is the defensible one.
                </span>
              </div>
            )}

            {/* Outcome (f): drivers */}
            <div className="mt-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Layers className="w-3.5 h-3.5 text-gov-navy" />
                <span className="text-[10px] font-black text-gov-navy uppercase tracking-wider">
                  Escalation drivers — permutation importance
                </span>
              </div>
              <div className="space-y-1">
                {(blk.drivers || []).slice(0, 6).map((d) => {
                  const max = blk.drivers[0].mae_increase_when_shuffled || 1;
                  const pctW = Math.max(2, (d.mae_increase_when_shuffled / max) * 100);
                  return (
                    <div key={d.feature} className="flex items-center gap-2 text-[10px]">
                      <span className="w-52 shrink-0 truncate font-mono text-gov-navy" title={d.feature}>
                        {d.feature}
                      </span>
                      <div className="flex-1 h-2.5 bg-gov-surface rounded border border-gov-border overflow-hidden">
                        <div className={`h-full rounded ${d.is_external ? 'bg-sky-500' : 'bg-gov-navy'}`}
                             style={{ width: `${pctW}%` }} />
                      </div>
                      <span className="w-14 text-right font-mono text-gov-muted">
                        {fmt(d.mae_increase_when_shuffled, 2)}
                      </span>
                      <span className={`w-16 text-[8px] font-black uppercase ${d.is_external ? 'text-sky-700' : 'text-gov-muted'}`}>
                        {d.is_external ? 'External' : 'CUF'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-gov-muted mt-1.5 flex items-start gap-1">
                <Info className="w-3 h-3 shrink-0 mt-px" />
                Value is the increase in held-out MAE when that column is randomly shuffled —
                i.e. how much worse the model gets without it.
              </p>
            </div>
          </div>
        );
      })}

      {/* ── Outcome (d): is the warning actually EARLY? ───────────────── */}
      {leadTime?.available && (
        <div className="bg-white p-5 rounded-2xl border border-gov-border shadow-card">
          <div className="flex items-center gap-2 border-b border-gov-border pb-3 mb-3">
            <AlertTriangle className="w-4 h-4 text-gov-navy" />
            <div>
              <h3 className="text-xs font-black text-gov-navy uppercase tracking-wider">
                Early-Warning Validation — measured, not asserted
              </h3>
              <span className="text-[10px] text-gov-muted">
                Sanction-time information only · n={leadTime.n_evaluated} mature projects
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { k: 'Precision', v: leadTime.precision, sub: `vs ${leadTime.base_rate} base rate`,
                good: leadTime.precision > leadTime.base_rate },
              { k: 'Recall', v: leadTime.recall, sub: 'of eventual overruns caught', good: leadTime.recall > 0.7 },
              { k: 'F1', v: leadTime.f1, sub: 'balance of the two', good: leadTime.f1 > 0.6 },
              { k: 'Median lead', v: `${leadTime.median_lead_months} mo`,
                sub: 'sanction → recorded revision', good: true },
            ].map((m) => (
              <div key={m.k} className="bg-gov-surface p-3 rounded-xl border border-gov-border">
                <span className="text-[9px] uppercase text-gov-muted font-bold block">{m.k}</span>
                <span className={`text-lg font-black font-mono ${m.good ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {m.v ?? '—'}
                </span>
                <span className="text-[9px] text-gov-muted block">{m.sub}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gov-muted mt-2.5">
            Lift over base rate ={' '}
            <strong className="text-gov-navy">
              {(leadTime.precision / leadTime.base_rate).toFixed(2)}×
            </strong>{' '}
            better than flagging at random. Reported as precision/recall rather than
            accuracy: at a {(leadTime.base_rate * 100).toFixed(0)}% base rate, accuracy
            would be dominated by true negatives and would flatter the result.
          </p>
        </div>
      )}

      {queueDenied && (
        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-900 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-px text-amber-600" />
          <span>{queueDenied}
            <span className="block font-normal mt-0.5">The early-warning queue requires the monitoring officer role or above.</span>
          </span>
        </div>
      )}

      {/* ── Outcome (d): early-warning queue ──────────────────────────── */}
      {queue?.alerts && (
        <div className="bg-white p-5 rounded-2xl border border-gov-border shadow-card">
          <div className="flex items-center justify-between border-b border-gov-border pb-3 mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <div>
                <h3 className="text-xs font-black text-gov-navy uppercase tracking-wider">
                  Early-Warning Queue
                </h3>
                <span className="text-[10px] text-gov-muted">
                  Ranked by risk × √capex · {queue.coverage?.projects_scored} projects scored
                </span>
              </div>
            </div>
            <span className="text-[11px] font-mono font-black text-rose-700">
              ₹{Number(queue.capex_at_risk_cr).toLocaleString()} Cr in queue
            </span>
          </div>

          <div className="space-y-1.5">
            {queue.alerts.map((a, i) => (
              <div key={a.project_id} className="flex items-start gap-2 p-2 rounded-lg border border-gov-border hover:bg-gov-surface/60 transition-colors">
                <span className="text-[10px] font-mono text-gov-muted w-5 shrink-0 pt-0.5">{i + 1}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border shrink-0 ${BAND_CLS[a.risk_band] || BAND_CLS.LOW}`}>
                  {a.risk_band} {a.risk_score}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-gov-navy truncate" title={a.project_name}>
                    {a.project_name}
                  </div>
                  <div className="text-[9px] text-gov-muted">{a.why_flagged}</div>
                </div>
                <span className="text-[10px] font-mono text-gov-navy shrink-0">
                  ₹{Number(a.capex_cr).toLocaleString()} Cr
                </span>
              </div>
            ))}
          </div>

          <p className="text-[9px] text-gov-muted mt-2.5">
            Weights are declared policy, not fitted — no ground-truth risk label exists to fit
            against. Missing signals are renormalised, never scored as zero risk.
          </p>
        </div>
      )}
    </div>
  );
}
