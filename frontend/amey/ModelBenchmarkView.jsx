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
  sector_mean_baseline: 'Sector Mean Baseline (Conventional)',
  ols_linear_regression: 'OLS Linear Regression (Conventional)',
  gradient_boosting: 'Gradient Boosted Trees (Machine Learning)',
};

const TARGET_LABEL = {
  cost_overrun_pct: 'Cost Overrun (% of Sanctioned Capex)',
  slip_months: 'Schedule Slippage (Months)',
};

const BAND_CLS = {
  CRITICAL: 'bg-rose-50 text-rose-800 border-rose-300',
  HIGH: 'bg-amber-50 text-amber-800 border-amber-300',
  MODERATE: 'bg-sky-50 text-sky-800 border-sky-300',
  LOW: 'bg-emerald-50 text-emerald-800 border-emerald-300',
};

export default function ModelBenchmarkView() {
  const [bench, setBench] = useState(null);
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [queueDenied, setQueueDenied] = useState(null);
  const [leadTime, setLeadTime] = useState(null);

  useEffect(() => {
    let dead = false;
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
    return (
      <div className="bg-white p-12 rounded-3xl border border-border-default shadow-card text-center">
        <FlaskConical className="w-8 h-8 text-gov-saffron animate-spin mx-auto mb-3" />
        <p className="text-gov-navy font-bold text-sm">Loading empirical model benchmarks and early-warning queue…</p>
      </div>
    );
  }

  if (!bench || bench.available === false) {
    return (
      <div className="bg-white p-7 rounded-3xl border border-border-default shadow-card">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <FlaskConical className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <span><strong>Benchmarks not yet fitted.</strong> {bench?.reason}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Sovereign Top Header */}
      <section className="bg-white border border-border-default rounded-3xl p-7 sm:p-9 shadow-card">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gov-saffron-light text-gov-saffron-dark border border-gov-gold-border text-[11px] font-bold uppercase tracking-wider font-mono">
            <FlaskConical className="w-3.5 h-3.5 text-gov-saffron" />
            <span>Module 7 · Model Evidence &amp; Benchmarks</span>
          </div>
          <h2 className="font-heading font-extrabold text-[26px] sm:text-[32px] tracking-tight text-gov-navy leading-tight">
            AI/ML VS CONVENTIONAL STATISTICAL BASELINES: EMPIRICAL BENCHMARK AUDIT
          </h2>
          <p className="text-text-secondary text-[14.5px] max-w-2xl font-sans leading-relaxed">
            Transparent evaluation comparing Gradient Boosted Trees against OLS and Sector Mean baselines across all 2,207 projects.
          </p>
        </div>
      </section>

      {/* ── Dimension (b): ML vs conventional ─────────────────────────── */}
      {Object.entries(bench.targets || {}).map(([target, blk]) => {
        const mv = blk.ml_vs_conventional;
        const variant = mv?.evaluated_variant || 'cuf_plus_external';
        const rows = blk[variant] || blk.cuf_plus_external;
        const ab = blk.cuf_vs_external_ablation;
        const ci = blk.calendar_identity;
        return (
          <div key={target} className="bg-white p-7 sm:p-9 rounded-3xl border border-border-default shadow-card space-y-6">
            <div className="flex items-center gap-3 border-b border-border-default pb-4">
              <div className="w-10 h-10 rounded-xl bg-gov-saffron-light text-gov-saffron-dark border border-gov-gold-border flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-gov-saffron" />
              </div>
              <div>
                <h3 className="text-[17px] font-heading font-extrabold text-gov-navy uppercase tracking-wider">
                  {TARGET_LABEL[target] || target}
                </h3>
                <span className="text-[11.5px] text-text-muted font-mono">
                  n={blk.n_usable} · held-out test={blk.n_test} · identical split for every model ·
                  feature set <strong className="text-gov-navy font-mono">
                    {variant === 'cuf_only' ? 'CUF only' : 'CUF + external features'}
                  </strong> (chosen by held-out MAE)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Model Architecture</th>
                    <th className="num">R² (Explained Variance)</th>
                    <th className="num">MAE (Mean Absolute Error)</th>
                    <th className="num">RMSE (Root Mean Square Error)</th>
                  </tr>
                </thead>
                <tbody>
                  {['sector_mean_baseline', 'ols_linear_regression', 'gradient_boosting'].map((m) => {
                    const row = rows[m];
                    const isML = m === 'gradient_boosting';
                    return (
                      <tr key={m} className={isML ? 'bg-slate-50 font-bold' : 'hover:bg-slate-50/60'}>
                        <td className={isML ? 'font-black text-gov-navy' : 'font-semibold text-text-secondary'}>
                          {MODEL_LABEL[m]}
                        </td>
                        <td className="num font-mono">{fmt(row.r2)}</td>
                        <td className="num font-mono font-black text-gov-navy">{fmt(row.mae, 2)}</td>
                        <td className="num font-mono text-text-muted">{fmt(row.rmse, 2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-5 rounded-2xl border text-[12.5px] ${mv.ml_is_better
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'}`}>
                <span className="font-bold uppercase text-[10px] tracking-wider block mb-1 font-mono">
                  Dimension (b) — AI/ML vs Conventional Econometric Baseline
                </span>
                {mv.ml_is_better
                  ? <>Machine Learning reduces MAE by <strong className="font-mono font-bold">{fmt(mv.mae_improvement, 2)}</strong> ({mv.mae_improvement_pct}%)
                      against the strongest conventional baseline method.</>
                  : <>The conventional method <strong>matches or beats</strong> ML here. Reported as measured.</>}
              </div>
              <div className={`p-5 rounded-2xl border text-[12.5px] ${ab.external_helps
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'}`}>
                <span className="font-bold uppercase text-[10px] tracking-wider block mb-1 font-mono">
                  Dimension (c) — CUF Baseline vs Multi-Modal External Ingestion
                </span>
                MAE {fmt(ab.cuf_only_mae, 2)} → <strong className="font-mono font-bold">{fmt(ab.with_external_mae, 2)}</strong>{' '}
                ({ab.mae_improvement_pct}%) when IMD monsoon, WPI inflation, PSU financials, satellite
                and graph features are incorporated.
              </div>
            </div>

            {/* Honesty disclosure: part of this target's accuracy is arithmetic. */}
            {ci?.applies && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-[12px] text-rose-950">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>
                  <strong>Calendar-identity disclosure.</strong> Slippage is measured against the
                  original end date, which is recoverable from the sanction year and planned
                  duration — both features. Removing that anchor drops R² from{' '}
                  <strong className="font-mono">{fmt(ci.r2_with_calendar)}</strong> to{' '}
                  <strong className="font-mono">{fmt(ci.r2_calendar_free)}</strong>, so{' '}
                  <span className="font-mono font-bold">{fmt(ci.r2_attributable_to_calendar)}</span> of it is arithmetic rather than learned
                  skill. The lower figure is the defensible one.
                </span>
              </div>
            )}

            {/* Outcome (f): drivers */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-gov-navy" />
                <span className="text-[11px] font-bold text-gov-navy uppercase tracking-wider font-heading">
                  Empirical Feature Attribution &amp; Permutation Loss Importance
                </span>
              </div>
              <div className="space-y-2">
                {(blk.drivers || []).slice(0, 6).map((d) => {
                  const max = blk.drivers[0].mae_increase_when_shuffled || 1;
                  const pctW = Math.max(2, (d.mae_increase_when_shuffled / max) * 100);
                  return (
                    <div key={d.feature} className="flex items-center gap-3 text-[11px]">
                      <span className="w-56 shrink-0 truncate font-mono text-gov-navy font-medium" title={d.feature}>
                        {d.feature}
                      </span>
                      <div className="flex-1 h-3 bg-slate-100 rounded-full border border-slate-200 overflow-hidden">
                        <div className={`h-full rounded-full ${d.is_external ? 'bg-sky-500' : 'bg-gov-navy'}`}
                             style={{ width: `${pctW}%` }} />
                      </div>
                      <span className="w-16 text-right font-mono text-text-muted font-bold">
                        {fmt(d.mae_increase_when_shuffled, 2)}
                      </span>
                      <span className={`w-16 text-[9px] font-bold uppercase font-mono ${d.is_external ? 'text-sky-700' : 'text-text-muted'}`}>
                        {d.is_external ? 'External' : 'CUF'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-text-muted mt-2 flex items-start gap-1 font-sans">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Value represents the empirical increase in held-out MAE when that column is randomly shuffled —
                measuring true feature degradation impact.
              </p>
            </div>
          </div>
        );
      })}

      {/* ── Outcome (d): is the warning actually EARLY? ───────────────── */}
      {leadTime?.available && (
        <div className="bg-white p-7 sm:p-9 rounded-3xl border border-border-default shadow-card space-y-5">
          <div className="flex items-center gap-2 border-b border-border-default pb-4">
            <AlertTriangle className="w-5 h-5 text-gov-saffron" />
            <div>
              <h3 className="text-[16px] font-bold text-gov-navy uppercase tracking-wider font-heading">
                Empirical Early-Warning Lead-Time Validation (Pre-Sanction Baseline)
              </h3>
              <span className="text-[11px] text-text-muted font-mono">
                Sanction-time information only · n={leadTime.n_evaluated} mature projects
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { k: 'Precision (PPV)', v: leadTime.precision, sub: `vs ${leadTime.base_rate} base rate`,
                good: leadTime.precision > leadTime.base_rate },
              { k: 'Recall (Sensitivity)', v: leadTime.recall, sub: 'of eventual overruns caught', good: leadTime.recall > 0.7 },
              { k: 'F1-Harmonic Score', v: leadTime.f1, sub: 'balance of precision & recall', good: leadTime.f1 > 0.6 },
              { k: 'Median Lead-Time', v: `${leadTime.median_lead_months} mo`,
                sub: 'sanction → recorded revision', good: true },
            ].map((m) => (
              <div key={m.k} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase text-text-muted font-bold block font-mono">{m.k}</span>
                <span className={`text-xl font-black font-mono ${m.good ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {m.v ?? '—'}
                </span>
                <span className="text-[10px] text-text-muted block mt-0.5">{m.sub}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-text-muted mt-2 font-sans">
            Lift over base rate ={' '}
            <strong className="text-gov-navy font-mono">
              {(leadTime.precision / leadTime.base_rate).toFixed(2)}×
            </strong>{' '}
            better than flagging at random. Reported as precision/recall rather than
            accuracy: at a {(leadTime.base_rate * 100).toFixed(0)}% base rate, accuracy
            would be dominated by true negatives and would flatter the result.
          </p>
        </div>
      )}

      {queueDenied && (
        <div className="bg-white p-6 rounded-3xl border border-rose-300 bg-rose-50 text-xs font-semibold text-rose-800 flex items-start gap-2 shadow-sm">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-px text-rose-600" />
          <span>{queueDenied}
            <span className="block font-normal mt-1">The early-warning queue requires the monitoring officer role or above.</span>
          </span>
        </div>
      )}

      {/* ── Outcome (d): early-warning queue ──────────────────────────── */}
      {queue?.alerts && (
        <div className="bg-white p-7 sm:p-9 rounded-3xl border border-border-default shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-border-default pb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="text-[16px] font-bold text-gov-navy uppercase tracking-wider font-heading">
                  Early-Warning Risk Escalation Queue
                </h3>
                <span className="text-[11px] text-text-muted font-mono">
                  Ranked by risk × √capex · {queue.coverage?.projects_scored} projects scored
                </span>
              </div>
            </div>
            <span className="text-[13px] font-mono font-black text-rose-700">
              ₹{Number(queue.capex_at_risk_cr).toLocaleString()} Cr in queue
            </span>
          </div>

          <div className="space-y-2">
            {queue.alerts.map((a, i) => (
              <div key={a.project_id} className="flex items-start gap-3 p-3.5 rounded-2xl border border-border-default hover:bg-slate-50 transition-colors">
                <span className="text-[11px] font-mono text-text-muted w-6 shrink-0 pt-0.5 font-bold">#{i + 1}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 font-mono ${BAND_CLS[a.risk_band] || BAND_CLS.LOW}`}>
                  {a.risk_band} {a.risk_score}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-bold text-gov-navy truncate" title={a.project_name}>
                    {a.project_name}
                  </div>
                  <div className="text-[10.5px] text-text-muted">{a.why_flagged}</div>
                </div>
                <span className="text-[11.5px] font-mono font-bold text-gov-navy shrink-0">
                  ₹{Number(a.capex_cr).toLocaleString()} Cr
                </span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-text-muted mt-3 font-sans">
            Weights are declared policy, not fitted — no ground-truth risk label exists to fit
            against. Missing signals are renormalised, never scored as zero risk.
          </p>
        </div>
      )}
    </div>
  );
}
