import React, { useEffect, useState } from 'react';
import { Target, AlertTriangle, CheckCircle2, FlaskConical } from 'lucide-react';
import { getStoredLanguage } from '../src/lib/i18n';

const API = '';

/**
 * Publishes MEASURED geocoding precision per tier.
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

const getTierLabel = (key, isHi) => {
  const map = {
    OSM_LANDMARK_MATCH: isHi ? 'ओपनस्ट्रीटमैप लैंडमार्क' : 'OSM landmark',
    GAZETTEER_CITY_MATCH: isHi ? 'राजपत्रक शहर' : 'Gazetteer city',
    OSM_CORRIDOR_MIDPOINT: isHi ? 'गलियारा मध्यबिंदु' : 'Corridor midpoint',
    GEONAMES_TOKEN_MATCH: isHi ? 'जियोनेम्स टोकन' : 'GeoNames token',
    GEONAMES_EXACT_MATCH: isHi ? 'जियोनेम्स सटीक' : 'GeoNames exact',
    GEONAMES_EXACT_UNCONSTRAINED: isHi ? 'जियोनेम्स अद्वितीय' : 'GeoNames unique',
    STATE_CENTROID_MATCH: isHi ? 'राज्य केन्द्रक' : 'State centroid',
  };
  return map[key] || TIER_LABEL[key] || key;
};

const pct = (v) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`);

export default function GeocodePrecisionPanel({ lang: propLang }) {
  const [lang, setLang] = useState(() => propLang || getStoredLanguage());
  useEffect(() => { if (propLang) setLang(propLang); }, [propLang]);
  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);
  const isHi = lang === 'hi';

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
        {isHi ? 'भू-कोडिंग सत्यापन लोड हो रहा है…' : 'Loading geocoding validation…'}
      </div>
    );
  }

  const header = (
    <div className="flex items-center gap-2 border-b border-gov-border pb-3 mb-3">
      <Target className="w-4 h-4 text-gov-navy" />
      <div>
        <h3 className="text-xs font-black text-gov-navy uppercase tracking-wider">
          {isHi ? 'भू-कोडिंग सटीकता — मापित' : 'Geocoding Precision — Measured'}
        </h3>
        <span className="text-[10px] text-gov-muted">
          {isHi ? 'हस्त-चिह्नित स्तरीकृत नमूना · विल्सन ९५% अंतराल' : 'Hand-labelled stratified sample · Wilson 95% intervals'}
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
            <strong>{isHi ? 'अभी तक मापा नहीं गया।' : 'Not yet measured.'}</strong>{' '}
            {isHi 
              ? '२००-परियोजना स्तरीकृत नमूना तैयार किया गया है किंतु अभी हस्त-सत्यापित नहीं हुआ है, अतः यह प्रणाली वर्तमान में नहीं जानती कि इसके जियोकोड कितनी बार सही हैं। जब तक यह पैनल संख्या रिपोर्ट न करे, प्रत्येक श्रेणी लेबल को असत्यापित मानें।'
              : 'A 200-project stratified sample has been drawn but not yet hand-labelled, so this system does not currently know how often its geocodes are correct. Treat every tier label as unverified until this panel reports a number.'}
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
            {isHi ? 'पोर्टफोलियो — उपग्रह चित्र परियोजना दर्शाता है' : 'Portfolio — imagery shows the project'}
          </span>
          <span className="text-xl font-black font-mono text-gov-navy">
            {pct(data.portfolio_strict_precision)}
          </span>
          <span className="text-[10px] text-gov-muted block mt-0.5">
            {isHi ? 'स्थल-स्तरीय श्रेणियों में जनसंख्या-भारित' : 'Population-weighted across site-level tiers'}
          </span>
        </div>
        <div className="bg-gov-surface p-3 rounded-xl border border-gov-border">
          <span className="text-[10px] uppercase text-gov-muted font-bold block">
            {isHi ? 'पोर्टफोलियो — सही स्थानीयता' : 'Portfolio — right locality'}
          </span>
          <span className="text-xl font-black font-mono text-emerald-700">
            {pct(data.portfolio_lenient_precision)}
          </span>
          <span className="text-[10px] text-gov-muted block mt-0.5">
            {data.median_error_km != null
              ? (isHi ? `माध्यिका त्रुटि ${data.median_error_km} किमी (n=${data.n_with_true_coords})` : `Median error ${data.median_error_km} km (n=${data.n_with_true_coords})`)
              : (isHi ? `${data.sample_size} में से ${data.labelled} पंक्तियां चिह्नित` : `${data.labelled} of ${data.sample_size} rows labelled`)}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="text-gov-muted border-b border-gov-border">
            <tr>
              <th className="py-1.5 pr-2 font-bold">{isHi ? 'श्रेणी' : 'Tier'}</th>
              <th className="py-1.5 px-2 font-bold text-right">{isHi ? 'परियोजनाएं' : 'Projects'}</th>
              <th className="py-1.5 px-2 font-bold text-right">{isHi ? 'चिह्नित' : 'Labelled'}</th>
              <th className="py-1.5 px-2 font-bold text-right">{isHi ? 'सटीकता' : 'Precision'}</th>
              <th className="py-1.5 pl-2 font-bold">{isHi ? '९५% सीआई' : '95% CI'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gov-border">
            {tiers.map(([name, t]) => (
              <tr key={name}>
                <td className="py-1.5 pr-2 font-semibold text-gov-navy">
                  {getTierLabel(name, isHi)}
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
            <strong>{isHi ? 'नकारात्मक नियंत्रण:' : 'Negative control:'}</strong>{' '}
            {isHi
              ? `${control.scored} ज्ञात-अशुद्ध राज्य-केन्द्रक परियोजनाएं बिना लेबल के नमूने में मिलाई गईं। ${pct(control.strict_precision)} को सही चिह्नित किया गया। ${data.negative_control_warning ? 'यह ढीले अंकन का सुझाव देने के लिए पर्याप्त उच्च है — उपरोक्त आंकड़ों को ऊपरी सीमा मानें।' : 'अपेक्षित अनुसार कम, इसलिए अंकन व्यवस्थित रूप से आशावादी नहीं था।'}`
              : `${control.scored} known-bad state-centroid projects were mixed into the sample unlabelled. ${pct(control.strict_precision)} were marked correct. ${data.negative_control_warning ? 'That is high enough to suggest lenient labelling — treat the figures above as an upper bound.' : 'Low, as expected, so the labelling was not systematically optimistic.'}`}
          </span>
        </div>
      )}
    </div>
  );
}
