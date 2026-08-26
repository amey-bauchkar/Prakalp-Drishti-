import React, { useEffect, useState } from 'react';
import { Target, AlertTriangle, CheckCircle2, FlaskConical } from 'lucide-react';

const API = 'http://127.0.0.1:8000';

/**
 * Publishes MEASURED geocoding precision per tier.
 *
 * This panel deliberately renders in the "not yet measured" state rather than hiding
 * itself when no labels exist. A metric that disappears when it is missing reads to a
 * reviewer exactly like a metric that passed; the entire purpose of publishing this
 * number is that an unmeasured claim and a measured one must look different.
 *
 * Strict vs lenient is not cosmetic. The EO pipeline gates on strict -- "imagery at
 * this coordinate actually shows this project" -- because that is the condition under
 * which a change measurement means anything. The map view only needs lenient.
 */

const TIER_LABEL = {
  OSM_LANDMARK_MATCH: 'OSM landmark',
  GAZETTEER_CITY_MATCH: 'Gazetteer city',
  OSM_CORRIDOR_MIDPOINT: 'Corridor midpoint',
  GEONAMES_TOKEN_MATCH: 'GeoNames token',
  GEONAMES_EXACT_MATCH: 'GeoNames exact',
  GEONAMES_EXACT_UNCONSTRAINED: 'GeoNames unique',
  STATE_CENTROID_MATCH: 'State centroid',
};

const pct = (v) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`);

export default function GeocodePrecisionPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let dead = false;
    fetch(`${API}/api/amey/geocode-precision`)
      .then((r) => r.json())
      .then((j) => { if (!dead) { setData(j); setLoading(false); } })
      .catch(() => { if (!dead) { setData(null); setLoading(false); } });
    return () => { dead = true; };
  }, []);

  if (loading) {
    return (
      <div className="panel p-4 text-xs text-gov-muted">
        Loading geocoding validation…
      </div>
    );
  }

  const header = (
    <div className="flex items-center gap-2 border-b border-gov-border pb-3 mb-3">
      <Target className="w-4 h-4 text-gov-navy" />
      <div>
        <h3 className="text-xs font-black text-gov-navy uppercase tracking-wider">
          Geocoding Precision — Measured
        </h3>
        <span className="text-[10px] text-gov-muted">
          Hand-labelled stratified sample · Wilson 95% intervals
        </span>
      </div>
    </div>
  );

  if (!data || data.available === false) {
    return (
      <div className="panel p-4">
        {header}
        <div className="note note-warn flex items-start gap-2">
          <FlaskConical className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>
            <strong>Not yet measured.</strong> A 200-project stratified sample has been drawn but
            not yet hand-labelled, so this system does <em>not</em> currently know how often its
            geocodes are correct. Treat every tier label as unverified until this panel reports a
            number.
            <span className="block mt-1 text-amber-800/80">{data?.reason}</span>
          </span>
        </div>
      </div>
    );
  }

  const tiers = Object.entries(data.tiers || {})
    .filter(([, t]) => !t.is_negative_control && t.scored > 0)
    .sort((a, b) => b[1].population - a[1].population);
  const control = Object.values(data.tiers || {}).find((t) => t.is_negative_control);

  return (
    <div className="panel p-4">
      {header}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gov-surface p-3 rounded-xl border border-gov-border">
          <span className="text-[10px] uppercase text-gov-muted font-bold block">
            Portfolio — imagery shows the project
          </span>
          <span className="text-xl font-black font-mono text-gov-navy">
            {pct(data.portfolio_strict_precision)}
          </span>
          <span className="text-[10px] text-gov-muted block mt-0.5">
            Population-weighted across site-level tiers
          </span>
        </div>
        <div className="bg-gov-surface p-3 rounded-xl border border-gov-border">
          <span className="text-[10px] uppercase text-gov-muted font-bold block">
            Portfolio — right locality
          </span>
          <span className="text-xl font-black font-mono text-emerald-700">
            {pct(data.portfolio_lenient_precision)}
          </span>
          <span className="text-[10px] text-gov-muted block mt-0.5">
            {data.median_error_km != null
              ? `Median error ${data.median_error_km} km (n=${data.n_with_true_coords})`
              : `${data.labelled} of ${data.sample_size} rows labelled`}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="text-gov-muted border-b border-gov-border">
            <tr>
              <th className="py-1.5 pr-2 font-bold">Tier</th>
              <th className="py-1.5 px-2 font-bold text-right">Projects</th>
              <th className="py-1.5 px-2 font-bold text-right">Labelled</th>
              <th className="py-1.5 px-2 font-bold text-right">Precision</th>
              <th className="py-1.5 pl-2 font-bold">95% CI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gov-border">
            {tiers.map(([name, t]) => (
              <tr key={name}>
                <td className="py-1.5 pr-2 font-semibold text-gov-navy">
                  {TIER_LABEL[name] || name}
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-gov-muted">{t.population}</td>
                <td className="py-1.5 px-2 text-right font-mono text-gov-muted">{t.scored}</td>
                <td className={`py-1.5 px-2 text-right font-mono font-black ${
                  t.strict_precision >= 0.8 ? 'text-emerald-700'
                    : t.strict_precision >= 0.6 ? 'text-amber-700' : 'text-rose-700'}`}>
                  {pct(t.strict_precision)}
                </td>
                <td className="py-1.5 pl-2 font-mono text-gov-muted">
                  [{(t.strict_ci95?.[0] * 100).toFixed(0)}–{(t.strict_ci95?.[1] * 100).toFixed(0)}%]
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {control && control.scored > 0 && (
        <div className={`mt-3 flex items-start gap-2 p-2.5 rounded-lg text-[11px] border ${
          data.negative_control_warning
            ? 'note note-critical'
            : 'note note-ok'}`}>
          {data.negative_control_warning
            ? <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
            : <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />}
          <span>
            <strong>Negative control:</strong> {control.scored} known-bad state-centroid projects
            were mixed into the sample unlabelled. {pct(control.strict_precision)} were marked
            correct.{' '}
            {data.negative_control_warning
              ? 'That is high enough to suggest lenient labelling — treat the figures above as an upper bound.'
              : 'Low, as expected, so the labelling was not systematically optimistic.'}
          </span>
        </div>
      )}
    </div>
  );
}
