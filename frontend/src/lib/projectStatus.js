/**
 * Project status — one definition, shared by the citizen portal, the master
 * register, the map and the officer watchlist.
 *
 * WHY THIS REPLACED THE OLD THREE BUCKETS
 * The previous rule lived inline in PublicDashboardView and read:
 *
 *     delayed > 24 || (progress < 40 && delayed > 12)  -> CRITICAL DELAY
 *     delayed > 0  || progress < 70                    -> UNDER MONITORING
 *     otherwise                                        -> ON TRACK
 *
 * Measured across all 2,207 projects that produced:
 *
 *     UNDER MONITORING   1,488   67.4%     <- two-thirds of the portfolio, one label
 *     CRITICAL DELAY       608   27.5%
 *     ON TRACK             111    5.0%
 *
 * A label carried by two-thirds of the portfolio cannot be used to triage. Worse,
 * because the rule never looked at completion, 133 projects at >= 99% physical
 * progress were painted red as "CRITICAL DELAY" — a 21.9% false-positive rate on
 * the highest-severity bucket. The default project on the public portal was one of
 * them, so a citizen's first impression was a card reading 100.0% PHYSICAL PROGRESS
 * beside CRITICAL DELAY and +48.3 MONTHS DELAY, with nothing reconciling them.
 *
 * The fix is to stop conflating two independent facts. Delivery state (is the work
 * finished?) and schedule state (was it on time?) are reported separately, and red
 * is reserved for work that is BOTH unfinished AND badly late — the only population
 * an officer can still act on.
 *
 *     CRITICAL          475   21.5%
 *     DELAYED           526   23.8%
 *     SLIPPING          147    6.7%
 *     ON_TRACK          789   35.7%
 *     COMPLETED_LATE    246   11.1%
 *     COMPLETED          24    1.1%
 *
 * Largest bucket 35.7%, and every completed project is out of the alert list while
 * still carrying its delivery record honestly.
 *
 * COLOUR INDEPENDENCE: each status carries a `shape` as well as a `color`. WCAG
 * 1.4.1 forbids colour as the only carrier of meaning, and the map previously used
 * green/amber/rose dots with a colour-only legend — unreadable for the roughly 8%
 * of Indian men with a red-green deficiency.
 */

import { toHindiDigits, getStoredLanguage } from './i18n';

export const COMPLETE_THRESHOLD = 99;   // physical progress % at which work is "finished"

export const STATUS = {
  CRITICAL: {
    id: 'CRITICAL',
    label: 'Critical',
    hiLabel: 'गंभीर विलंब',
    /** Plain-language gloss for the citizen tier. */
    publicLabel: 'Badly delayed, still under construction',
    hiPublicLabel: 'गंभीर विलंब, निर्माण जारी',
    shape: 'triangle',
    symbol: '▲',
    color: '#B4142A',
    rank: 0,
    badgeClass: 'bg-rose-50 text-rose-900 border-rose-300',
    dotClass: 'bg-rose-700',
    textClass: 'text-rose-800',
    describe: (m) => `Unfinished and ${m} months past its approved completion date`,
    describeHi: (m) => `अपूर्ण, स्वीकृत पूर्णता तिथि से ${m} माह विलंबित`,
  },
  DELAYED: {
    id: 'DELAYED',
    label: 'Delayed',
    hiLabel: 'विलंबित',
    publicLabel: 'Running late',
    hiPublicLabel: 'समय से पीछे',
    shape: 'square',
    symbol: '■',
    color: '#A9680A',
    rank: 1,
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
    dotClass: 'bg-amber-700',
    textClass: 'text-amber-900',
    describe: (m) => `${m} months past its approved completion date`,
    describeHi: (m) => `स्वीकृत पूर्णता तिथि से ${m} माह विलंबित`,
  },
  SLIPPING: {
    id: 'SLIPPING',
    label: 'Slipping',
    hiLabel: 'धीमी प्रगति',
    publicLabel: 'Slightly behind',
    hiPublicLabel: 'प्रगति धीमी',
    shape: 'diamond',
    symbol: '◆',
    color: '#8A6A18',
    rank: 2,
    badgeClass: 'bg-gold-wash text-[#6b5210] border-amber-200',
    dotClass: 'bg-[#8A6A18]',
    textClass: 'text-[#6b5210]',
    describe: (m) => `${m} months behind, within the first six`,
    describeHi: (m) => `${m} माह पीछे, प्रथम छह माह के भीतर`,
  },
  ON_TRACK: {
    id: 'ON_TRACK',
    label: 'On track',
    hiLabel: 'समय पर',
    publicLabel: 'On schedule',
    hiPublicLabel: 'निर्धारित समय पर',
    shape: 'circle',
    symbol: '●',
    color: '#0E7A4A',
    rank: 3,
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    dotClass: 'bg-emerald-700',
    textClass: 'text-emerald-800',
    describe: () => 'On or ahead of its approved completion date',
    describeHi: () => 'स्वीकृत पूर्णता तिथि पर अथवा उससे आगे',
  },
  COMPLETED_LATE: {
    id: 'COMPLETED_LATE',
    label: 'Completed late',
    hiLabel: 'विलंब से पूर्ण',
    publicLabel: 'Finished, but late',
    hiPublicLabel: 'विलंब से समाप्त',
    shape: 'check',
    symbol: '✓',
    color: '#17557F',
    rank: 4,
    badgeClass: 'bg-azure-wash text-[#0f3f61] border-sky-300',
    dotClass: 'bg-[#17557F]',
    textClass: 'text-[#0f3f61]',
    describe: (m) => `Work is complete; it finished ${m} months late`,
    describeHi: (m) => `कार्य पूर्ण; ${m} माह विलंब से समाप्त हुआ`,
  },
  COMPLETED: {
    id: 'COMPLETED',
    label: 'Completed',
    hiLabel: 'पूर्ण',
    publicLabel: 'Finished on time',
    hiPublicLabel: 'सफलतापूर्वक पूर्ण',
    shape: 'check',
    symbol: '✓',
    color: '#0E7A4A',
    rank: 5,
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    dotClass: 'bg-emerald-700',
    textClass: 'text-emerald-800',
    describe: () => 'Work is complete and finished on schedule',
    describeHi: () => 'कार्य पूर्ण एवं निर्धारित समय पर समाप्त',
  },
};

/** Ordered worst-first — the order an officer's worklist should use. */
export const STATUS_ORDER = Object.values(STATUS).sort((a, b) => a.rank - b.rank);

export function getProjectStatus(p) {
  const delayed = Number(p?.delayed_months) || 0;
  const progress = Number(p?.progress_perc) || 0;

  if (progress >= COMPLETE_THRESHOLD) {
    return delayed > 0 ? STATUS.COMPLETED_LATE : STATUS.COMPLETED;
  }
  if (delayed > 24 || (progress < 40 && delayed > 12)) return STATUS.CRITICAL;
  if (delayed > 6) return STATUS.DELAYED;
  if (delayed > 0) return STATUS.SLIPPING;
  return STATUS.ON_TRACK;
}

/** True when the work is still running, i.e. an officer can still change the outcome. */
export function isActive(p) {
  return (Number(p?.progress_perc) || 0) < COMPLETE_THRESHOLD;
}

/**
 * Full sentence for a status badge's tooltip and its screen-reader description.
 *
 * Language-aware: this string is attached to every badge, so on a 50-row register
 * it was several hundred English text nodes sitting under <html lang="hi"> — the
 * largest single block of mis-declared content on the page.
 */
export function describeStatus(p, lang = 'en') {
  const s = getProjectStatus(p);
  const m = Math.abs(Math.round((Number(p?.delayed_months) || 0) * 10) / 10);
  if (lang === 'hi') return `${s.hiLabel || s.label} — ${(s.describeHi || s.describe)(m)}।`;
  return `${s.label} — ${s.describe(m)}.`;
}

/**
 * Sector names as published in the MoSPI corpus, with their official Hindi forms.
 * Held here rather than in a view so the citizen register, the map popups and the
 * officer watchlist all render a sector the same way.
 */
export const SECTOR_HI = {
  'Atomic Energy': 'परमाणु ऊर्जा',
  'Aviation & Aviation Infrastructure': 'विमानन एवं विमानन अवसंरचना',
  'Civil Aviation': 'नागर विमानन',
  'Coal': 'कोयला',
  'Construction': 'निर्माण',
  'Education': 'शिक्षा',
  'Electricity Generation': 'विद्युत उत्पादन',
  'Energy Storage': 'ऊर्जा भंडारण',
  'Fertilizers': 'उर्वरक',
  'Health & Family Welfare': 'स्वास्थ्य एवं परिवार कल्याण',
  'Health and Family Welfare': 'स्वास्थ्य एवं परिवार कल्याण',
  'Healthcare': 'स्वास्थ्य सेवा',
  'Heavy Industry': 'भारी उद्योग',
  'Inland Waterways': 'अंतर्देशीय जलमार्ग',
  'Logistics Infrastructure': 'संभारतंत्र अवसंरचना',
  'Metals & Mining': 'धातु एवं खनन',
  'Mines': 'खान',
  'Oil & Gas': 'तेल एवं गैस',
  'Petroleum': 'पेट्रोलियम',
  'Power': 'विद्युत एवं ऊर्जा',
  'Railways': 'रेलवे',
  'Real Estate': 'स्थावर संपदा',
  'Road Transport & Highways': 'सड़क परिवहन एवं राजमार्ग',
  'Road Transport and Highways': 'सड़क परिवहन एवं राजमार्ग',
  'Roads': 'सड़क मार्ग',
  'Roads & Highways': 'सड़क एवं राजमार्ग',
  'Shipping': 'पोत परिवहन',
  'Shipping & Ports': 'पोत परिवहन एवं पत्तन',
  'Shipping and Ports': 'पोत परिवहन एवं पत्तन',
  'Steel': 'इस्पात',
  'Telecommunication': 'दूरसंचार',
  'Telecommunications': 'दूरसंचार',
  'Tourism, Hospitality & Wellness': 'पर्यटन, आतिथ्य एवं स्वास्थ्य',
  'Transmission & Distribution': 'पारेषण एवं वितरण',
  'Urban Development': 'शहरी विकास',
  'Urban Public Transport': 'शहरी सार्वजनिक परिवहन',
  'Waste & Water': 'अपशिष्ट एवं जल',
  'Water Resources': 'जल संसाधन',
};

/**
 * Sector name in the reader's language.
 *
 * A sector with no Hindi form falls back to the corpus spelling, and
 * `sectorIsTranslated` lets the caller mark that fallback lang="en" so a Hindi
 * speech engine does not read English with Hindi phonetics.
 */
export const sectorName = (sec, lang = 'en') =>
  (lang === 'hi' ? (SECTOR_HI[sec] || sec) : sec) || '—';

export const sectorIsTranslated = (sec, lang = 'en') =>
  lang !== 'hi' || Boolean(SECTOR_HI[sec]);

/* ── Formatting ────────────────────────────────────────────────────────────
   Indian digit grouping was applied inconsistently: 50 call sites passed
   'en-IN' and 30 called toLocaleString() bare, which follows the VIEWER's
   locale — so the same portfolio total rendered 8,00,000 on one panel and
   800,000 on another, and neither was reliably Indian on a machine set to
   en-US. These helpers are the single answer.                              */

export const formatCount = (n, lang) => {
  const currentLang = lang || getStoredLanguage();
  if (!Number.isFinite(Number(n))) return '—';
  const str = Number(n).toLocaleString('en-IN');
  return currentLang === 'hi' ? toHindiDigits(str) : str;
};

export function formatCr(n, { lakhCrore = false, lang } = {}) {
  const currentLang = lang || getStoredLanguage();
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  if (lakhCrore || Math.abs(v) >= 1e5) {
    const numVal = (v / 1e5).toFixed(2);
    return currentLang === 'hi' ? `₹${toHindiDigits(numVal)} लाख करोड़` : `₹${numVal}L Cr`;
  }
  const formatted = v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  return currentLang === 'hi'
    ? `₹${toHindiDigits(formatted)} करोड़`
    : `₹${formatted} Cr`;
}

/** Dates as an Indian reader writes them, not as the database stores them. */
export function formatDate(iso, lang) {
  const currentLang = lang || getStoredLanguage();
  if (!iso) return '—';
  const d = new Date(String(iso).slice(0, 10));
  if (Number.isNaN(d.getTime())) return '—';
  const str = d.toLocaleDateString(currentLang === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return currentLang === 'hi' ? toHindiDigits(str) : str;
}

export const formatMonths = (m, lang) => {
  const currentLang = lang || getStoredLanguage();
  const v = Number(m);
  if (!Number.isFinite(v) || v <= 0) return currentLang === 'hi' ? 'समय पर' : 'No delay';
  const numStr = v.toFixed(1).replace(/\.0$/, '');
  return currentLang === 'hi' ? `${toHindiDigits(numStr)} माह विलंब` : `${numStr} months late`;
};
