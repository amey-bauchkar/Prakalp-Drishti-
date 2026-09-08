import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, ClipboardList, Database, FileUp, History,
  Loader2, MapPin, PlusCircle, ShieldAlert, UploadCloud, Copy, Check,
  Sparkles, Layers, RefreshCw, ArrowRight, ShieldCheck, FileCheck,
  Building2, Hash as HashIcon, Calendar, Compass, HelpCircle, Terminal
} from 'lucide-react';

import LoginGate, { useSession } from '../../amey/LoginGate.jsx';
import { apiFetch, apiUpload } from '../../amey/authClient.js';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.03 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 340, damping: 26 }
  }
};

const TABS = [
  {
    id: 'onboard',
    label: 'Project Onboarding',
    icon: PlusCircle,
    badge: 'Single Entry',
    desc: 'Register a central-sector project into the append-only ledger'
  },
  {
    id: 'cuf',
    label: 'Monthly CUF Upload',
    icon: UploadCloud,
    badge: 'Bulk CSV / XLSX',
    desc: 'Bulk MoSPI Common Upload Form monthly returns'
  },
  {
    id: 'history',
    label: 'Ingest History & Queue',
    icon: History,
    badge: 'Audit & Triage',
    desc: 'Sealed Merkle versions and unmapped agency resolution'
  },
];

const EMPTY_FORM = {
  ProjectId: '', ProjectName: '', SectorName: '', LineMinistry: '',
  COMPANYNAME: '', OriginalCost: '', SanctionDate: '', OriginalEndDate: '',
  StateName: '', Latitude: '', Longitude: '',
};

function Hash({ value }) {
  const [copied, setCopied] = useState(false);

  if (!value) return <span className="text-zinc-400 font-mono text-xs">—</span>;

  const copy = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex items-center gap-1.5 bg-zinc-950 text-zinc-200 px-2.5 py-1 rounded border border-zinc-800 font-mono text-[11px] shadow-2xs group">
      <span title={value} className="select-all">
        {String(value).slice(0, 12)}…{String(value).slice(-8)}
      </span>
      <button
        type="button"
        onClick={copy}
        title="Copy full cryptographic SHA-256 hash"
        className="text-zinc-400 hover:text-white transition-colors p-0.5 cursor-pointer"
      >
        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      </button>
    </div>
  );
}

/* ── Sovereign Institutional Corpus Provenance KPI Strip ─────────────────── */
function CorpusBadge({ status }) {
  if (!status) return null;
  const live = status.database_configured;

  return (
    <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* Tile 1 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5 relative overflow-hidden group hover:border-slate-300 transition-all">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          live ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
        }`}>
          <Database size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
            Corpus Repository
          </div>
          <div className="text-sm font-extrabold text-gov-navy font-heading truncate flex items-center gap-1.5 mt-0.5">
            <span>{live ? 'PostgreSQL Core' : 'In-Memory Bootstrap'}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          </div>
          <div className="text-[10.5px] text-slate-500 font-mono truncate">
            {live ? 'Live ACID Database' : 'Read-Only CSV Snapshot'}
          </div>
        </div>
      </div>

      {/* Tile 2 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5 relative overflow-hidden group hover:border-slate-300 transition-all">
        <div className="w-10 h-10 rounded-lg bg-slate-100 text-gov-navy border border-slate-200 flex items-center justify-center shrink-0">
          <ShieldCheck size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
            Write Security
          </div>
          <div className={`text-sm font-extrabold mt-0.5 font-heading truncate ${live ? 'text-emerald-700' : 'text-amber-800'}`}>
            {live ? 'Ledger Active (202)' : 'Read-Only Mode (503)'}
          </div>
          <div className="text-[10.5px] text-slate-500 font-mono truncate">
            Role Gated · allocate_capital
          </div>
        </div>
      </div>

      {/* Tile 3 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5 relative overflow-hidden group hover:border-slate-300 transition-all">
        <div className="w-10 h-10 rounded-lg bg-slate-100 text-gov-navy border border-slate-200 flex items-center justify-center shrink-0">
          <Layers size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
            Batch Threshold
          </div>
          <div className="text-sm font-extrabold text-gov-navy font-mono mt-0.5">
            {status.max_rows_per_batch?.toLocaleString('en-IN') || '10,000'} <span className="text-xs font-normal text-slate-500">Rows</span>
          </div>
          <div className="text-[10.5px] text-slate-500 font-mono truncate">
            Atomic Fail-Closed Invariant
          </div>
        </div>
      </div>

      {/* Tile 4 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5 relative overflow-hidden group hover:border-slate-300 transition-all">
        <div className="w-10 h-10 rounded-lg bg-slate-100 text-gov-navy border border-slate-200 flex items-center justify-center shrink-0">
          <HashIcon size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
            Integrity Protocol
          </div>
          <div className="text-sm font-extrabold text-gov-navy font-mono mt-0.5">
            RFC 6962 Merkle Tree
          </div>
          <div className="text-[10.5px] text-slate-500 font-mono truncate">
            SHA-256 Content Addressed
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Validation report, rendered identically wherever it appears ─────────── */
function ValidationReport({ report }) {
  if (!report) return null;
  const unresolved = Object.entries(report.unresolved_entities || {});

  if (report.valid || (report.accepted_rows > 0 && report.rejected_rows === 0)) {
    return (
      <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-start gap-3 shadow-2xs">
        <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 leading-relaxed font-sans">
          <div className="font-extrabold text-[13px] text-emerald-950">
            Pre-Flight Validation Successful
          </div>
          <span className="font-bold">{report.accepted_rows}</span> row{report.accepted_rows === 1 ? ' satisfies' : 's satisfy'} all statutory schema constraints and entity resolution checks.
          {report.checked_against_corpus === false && (
            <span className="block text-[11px] text-emerald-700 mt-1">
              (Note: Duplicate-ID verification is skipped under CSV bootstrap).
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 flex items-start gap-3 shadow-2xs">
        <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
        <div className="text-xs text-rose-950 leading-relaxed font-sans">
          <div className="font-extrabold text-[13px] text-rose-950">
            Batch Rejected — {report.rejected_rows} Offending Row{report.rejected_rows === 1 ? '' : 's'} Detected
          </div>
          <span>
            Atomic invariant triggered: zero rows written. The transaction is refused in its entirety to prevent partial corpus corruption.
          </span>
        </div>
      </div>

      {unresolved.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 shadow-2xs">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950 leading-relaxed font-sans">
            <div className="font-extrabold text-[13px] text-amber-950">
              Unresolved Executing Agencies ({unresolved.length})
            </div>
            <span>
              The following agencies could not be mapped to known corporate entities and were queued for human triage. Rows are <strong>strictly refused</strong> rather than defaulted to prevent downstream bias:
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {unresolved.map(([n, c]) => (
                <span key={n} className="bg-white border border-amber-300 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-amber-900 shadow-2xs">
                  {n} ({c})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {(report.errors || []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-gov-navy">
              Specific Validation Failures
            </span>
            <span className="text-[11px] font-mono text-slate-500 font-bold">
              {report.error_count || report.errors.length} Total Errors
            </span>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 text-[10.5px] uppercase font-mono font-bold">
                <tr>
                  <th className="py-2.5 px-3.5">Row</th>
                  <th className="py-2.5 px-3.5">Project ID</th>
                  <th className="py-2.5 px-3.5">Failed Field</th>
                  <th className="py-2.5 px-3.5">Rejection Cause</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.errors.slice(0, 50).map((e, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3.5 font-mono text-slate-600">#{e.row_index + 1}</td>
                    <td className="py-2 px-3.5 font-mono font-bold text-gov-navy">{e.project_id ?? '—'}</td>
                    <td className="py-2 px-3.5">
                      <span className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[10.5px] font-bold">
                        {e.field}
                      </span>
                    </td>
                    <td className="py-2 px-3.5 text-slate-700">{e.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {report.error_count > 50 && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 font-mono">
              Showing first 50 of {report.error_count} errors.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Geocode precision preview card ───────────────────────────────────────── */
function GeocodePreview({ geo }) {
  if (!geo) return null;

  if (!geo.valid) {
    return (
      <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 flex items-start gap-2.5 shadow-2xs">
        <ShieldAlert size={16} className="text-rose-600 shrink-0 mt-0.5" />
        <span className="text-xs text-rose-900 font-sans">{geo.error}</span>
      </div>
    );
  }

  const km = geo.error_radius_m >= 1000
    ? `±${Math.round(geo.error_radius_m / 1000)} km`
    : `±${geo.error_radius_m} m`;

  return (
    <div className={`p-4 rounded-xl border shadow-2xs flex items-start gap-3 ${
      geo.serve_imagery
        ? 'bg-slate-50 border-slate-300 text-slate-900'
        : 'bg-amber-50 border-amber-200 text-amber-950'
    }`}>
      <MapPin size={18} className={`shrink-0 mt-0.5 ${geo.serve_imagery ? 'text-gov-navy' : 'text-amber-600'}`} />
      <div className="text-xs font-sans space-y-1">
        <div className="font-extrabold text-[13px] flex items-center gap-2 flex-wrap">
          <span className="text-gov-navy">Geocoded Resolution: {geo.geocode_class}</span>
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-800">
            Precision {km}
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono font-bold uppercase text-gov-navy">
            Tier {geo.tier}
          </span>
        </div>
        <p className="text-[12px] text-slate-600">{geo.display_note}</p>
        {!geo.counts_toward_ner_floor && (
          <p className="text-[11px] font-bold text-amber-900 bg-amber-100/70 p-1.5 rounded border border-amber-300/60 mt-1">
            ⚠️ Operator-entered coordinate: Excluded from statutory 10% NER funding floor calculations.
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Job result: the sealed corpus version and its Merkle root ───────────── */
function JobResult({ job }) {
  if (!job) return null;

  if (job.state === 'running' || job.state === 'queued') {
    return (
      <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 flex items-center gap-3 shadow-2xs">
        <Loader2 size={18} className="animate-spin text-gov-navy" />
        <span className="text-xs font-bold text-gov-navy font-sans">
          Appending batch to ledger, sealing Merkle tree &amp; refreshing RAM cache…
        </span>
      </div>
    );
  }

  if (job.state === 'failed') {
    return (
      <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 flex items-start gap-3 shadow-2xs">
        <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
        <div className="text-xs text-rose-950">
          <div className="font-bold text-[13px]">Ingest Job Failed</div>
          <div className="font-mono text-[11.5px] mt-1 bg-white p-2 rounded border border-rose-200">
            {job.error}
          </div>
        </div>
      </div>
    );
  }

  const d = job.detail || {};
  return (
    <div className="bg-gradient-to-br from-gov-navy via-slate-900 to-gov-navy text-white rounded-xl border border-slate-700/60 p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-300 font-bold">
              Ledger Sealed
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white font-mono">
              Corpus Snapshot Version v{d.corpus_version}
            </h3>
          </div>
        </div>
        <span className="px-3 py-1 rounded bg-white/10 text-amber-300 border border-amber-400/30 font-mono text-xs font-bold">
          Immutable Status · Sealed
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
          <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">Rows Ingested</div>
          <div className="text-xl font-bold font-mono text-white mt-0.5">{d.rows_written}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
          <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">Total Monitored</div>
          <div className="text-xl font-bold font-mono text-white mt-0.5">
            {d.row_count?.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
          <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">Seal Duration</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
            {job.duration_s ?? '—'}s
          </div>
        </div>
      </div>

      {d.imagery_fetched > 0 && (
        <div className="bg-emerald-950/40 rounded-lg p-3 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <Sparkles size={15} className="text-emerald-400" />
          <span><strong>Auto-Fetched EO Imagery:</strong> {d.imagery_fetched} project(s) received dual-epoch Sentinel tiles for ground-truth audit.</span>
        </div>
      )}

      <div className="pt-2 border-t border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
          <span className="text-slate-400 font-bold">RFC 6962 Merkle Root:</span>
          <Hash value={d.corpus_root} />
        </div>
        <span className="text-[10.5px] text-amber-300/80 font-mono">
          Cryptographically Grounded
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */

function AdminIngestInner() {
  const session = useSession();
  const [tab, setTab] = useState('onboard');
  const [status, setStatus] = useState(null);
  const [vocab, setVocab] = useState({ sectors: [], agencies: [], states: [] });
  const [loadError, setLoadError] = useState(null);

  const canWrite = !!session?.permissions?.includes('allocate_capital');

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await apiFetch('/api/ingest/status');
      if (alive && s.ok) setStatus(s.data);
      const v = await apiFetch('/api/ingest/vocabulary');
      if (alive) {
        if (v.ok) setVocab(v.data);
        else setLoadError(v.error);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 font-sans pb-16 max-w-7xl mx-auto text-slate-900"
    >
      {/* ── Sovereign Institutional Telemetry Strip ───────────────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-lg bg-[#071320] text-[11px] font-mono text-slate-300 shadow-2xs border border-[#102A40]"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex items-center gap-1.5 text-white font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            CORPUS ADMIN TERMINAL
          </span>
          <span className="text-[#24425C] font-bold">/</span>
          <span className="text-slate-400 font-semibold">APPEND-ONLY GOVERNANCE</span>
          <span className="text-[#24425C] font-bold">/</span>
          <span className="text-white font-bold">RFC 6962 MERKLE SEALED</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/90 px-2.5 py-0.5 rounded border border-slate-700/80 text-xs">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">SESSION:</span>
          <span className="font-bold text-amber-400 font-mono">{session?.user || 'admin'}</span>
        </div>
      </motion.div>

      {/* ── Sovereign Institutional Command Header ───────────────────── */}
      <motion.header
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gov-navy via-slate-900 to-gov-navy border border-slate-700/60 shadow-xl text-white p-6 sm:p-8 z-20"
      >
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none rounded-2xl overflow-hidden"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-extrabold tracking-institutional uppercase text-amber-400 border-l-2 border-amber-400">
              <ClipboardList className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>CORPUS ADMINISTRATION &amp; LEDGER INGESTION</span>
            </div>
            <h1 className="font-extrabold text-2xl sm:text-3xl lg:text-[32px] tracking-tight font-heading text-white leading-tight">
              Project Onboarding &amp; Monthly CUF Returns
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              Autonomous write surface for the national mega-project repository. Every ingested return undergoes server-side schema verification, agency canonicalization, and is sealed into a content-addressed Merkle tree snapshot.
            </p>
          </div>

          {/* Quick Authority Badge Card */}
          <div className="bg-black/40 border border-white/20 rounded-xl p-4 text-xs text-slate-200 shrink-0 space-y-1.5 min-w-[250px] backdrop-blur-md shadow-inner relative z-10">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-amber-400" />
              <span>Authority &amp; Role Gate</span>
            </div>
            <div className="font-bold text-white text-sm font-heading">
              {session?.user || 'Official Reviewer'}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono">
              <span>Capability:</span>
              <span className={`px-2 py-0.5 rounded font-bold font-mono ${
                canWrite ? 'bg-white/10 text-white border border-white/30' : 'bg-white/10 text-slate-300 border border-white/20'
              }`}>
                {canWrite ? 'allocate_capital (Full Write)' : 'Read-Only Verification'}
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ── 4 KPI Tiles ───────────────────────────────────────────────── */}
      <CorpusBadge status={status} />

      {/* Warning Notice for CSV Bootstrap Mode */}
      {status && !status.database_configured && (
        <motion.div variants={itemVariants} className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3 shadow-2xs">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950 leading-relaxed font-sans">
            <span className="font-bold text-[13px] block">Read-Only Bootstrap Environment Active</span>
            The platform is running from the pre-bundled offline CSV bootstrap. Live submission requests will return HTTP 503 Service Unavailable, though full schema validation, agency resolution, and geocoding previews function identically.
          </div>
        </motion.div>
      )}

      {!canWrite && (
        <motion.div variants={itemVariants} className="bg-slate-100 border border-slate-300 p-4 rounded-xl flex items-start gap-3 shadow-2xs">
          <ShieldAlert size={18} className="text-slate-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed font-sans">
            <span className="font-bold text-slate-900 text-[13px] block">Statutory Permission Notice</span>
            Your current login role enables validation previews but forbids modifying the corpus ledger. Changing the project denominator alters statutory CCEA and PIB thresholds across all 2,207 projects.
          </div>
        </motion.div>
      )}

      {loadError && (
        <motion.div variants={itemVariants} className="bg-rose-50 border border-rose-300 p-4 rounded-xl flex items-start gap-3 shadow-2xs">
          <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 font-sans font-bold">{loadError}</div>
        </motion.div>
      )}

      {/* ── Sovereign Institutional Segmented Navigation Tabs ─────────── */}
      <motion.nav
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
        role="tablist"
        aria-label="Ingestion views"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`flex items-start gap-3.5 p-4 rounded-xl transition-all cursor-pointer text-left border ${
                active
                  ? 'bg-gov-navy text-white border-gov-navy shadow-md ring-1 ring-amber-400/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                active ? 'bg-white/15 text-amber-400 border border-white/20 font-bold' : 'bg-slate-100 text-gov-navy border border-slate-200'
              }`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-bold tracking-tight font-heading ${active ? 'text-white' : 'text-gov-navy'}`}>
                    {t.label}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                    active ? 'bg-amber-400/20 text-amber-300 border-amber-400/30' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {t.badge}
                  </span>
                </div>
                <p className={`text-[11px] leading-snug mt-1 truncate ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                  {t.desc}
                </p>
              </div>
            </button>
          );
        })}
      </motion.nav>

      {/* ── Active Tab Switcher Panel ─────────────────────────────────── */}
      <div id={`ingest-panel-${tab}`} role="tabpanel">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
          >
            {tab === 'onboard' && <OnboardTab vocab={vocab} canWrite={canWrite} />}
            {tab === 'cuf' && <CufTab canWrite={canWrite} />}
            {tab === 'history' && <HistoryTab enabled={!!status?.database_configured} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Tab 1: Single Project Onboarding ─────────────────────────────────────── */
function OnboardTab({ vocab, canWrite }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const payload = useMemo(() => ({
    ProjectId: Number(form.ProjectId) || 0,
    ProjectName: form.ProjectName.trim(),
    SectorName: form.SectorName,
    LineMinistry: form.LineMinistry.trim(),
    COMPANYNAME: form.COMPANYNAME.trim(),
    OriginalCost: Number(form.OriginalCost) || 0,
    SanctionDate: form.SanctionDate || null,
    OriginalEndDate: form.OriginalEndDate || null,
    StateName: form.StateName || null,
    Latitude: form.Latitude === '' ? null : Number(form.Latitude),
    Longitude: form.Longitude === '' ? null : Number(form.Longitude),
    StateSource: 'operator_entered',
  }), [form]);

  const complete = form.ProjectId && form.ProjectName && form.SectorName
    && form.LineMinistry && form.COMPANYNAME && form.OriginalCost;

  useEffect(() => {
    if (!complete) { setPreview(null); return; }
    let alive = true;
    setChecking(true);
    const t = setTimeout(async () => {
      const r = await apiFetch('/api/ingest/validate', {
        method: 'POST', body: JSON.stringify({ projects: [payload] }),
      });
      if (!alive) return;
      setChecking(false);
      setPreview(r.ok ? r.data : null);
    }, 450);
    return () => { alive = false; clearTimeout(t); };
  }, [payload, complete]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setSubmitError(null); setJob(null);

    const r = await apiFetch('/api/ingest/projects', {
      method: 'POST', body: JSON.stringify({ projects: [payload] }),
    });

    if (!r.ok) {
      setBusy(false);
      const detail = r.data?.detail;
      if (detail && typeof detail === 'object' && detail.errors) setPreview(detail);
      setSubmitError(detail?.reason || r.error);
      return;
    }

    const jobId = r.data.job_id;
    for (let i = 0; i < 60; i += 1) {
      const j = await apiFetch(`/api/ingest/jobs/${jobId}`);
      if (j.ok) {
        setJob(j.data);
        if (j.data.state === 'succeeded' || j.data.state === 'failed') break;
      }
      await new Promise((res) => setTimeout(res, 500));
    }
    setBusy(false);
    setForm(EMPTY_FORM);
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-6 p-6 sm:p-8">
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-gov-navy font-bold uppercase tracking-wider">
            <PlusCircle size={14} className="text-amber-500" />
            <span>Interactive Onboarding Form</span>
          </div>
          <h2 className="text-xl font-bold font-heading text-gov-navy">
            Register Mega-Project into the Central Ledger
          </h2>
          <p className="text-xs text-slate-500 font-sans">
            All fields marked with an asterisk (<span className="text-rose-500 font-bold">*</span>) are enforced server-side.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Database size={13} className="text-gov-navy" />
          <span>{vocab.sectors.length} Sectors · {vocab.agencies.length} Resolvable Entities</span>
        </div>
      </div>

      {/* Fieldsets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ── Group 1: Identity & Mandate ── */}
        <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-gov-navy uppercase tracking-wider border-b border-slate-200 pb-2">
            <Building2 size={14} className="text-gov-navy" />
            <span>1. Project Identity &amp; Sector</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-gov-navy mb-1">
                Project ID (MoSPI / OCMS) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                inputMode="numeric"
                value={form.ProjectId}
                onChange={set('ProjectId')}
                placeholder="e.g. 706719"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:border-gov-navy focus:ring-1 focus:ring-gov-navy outline-none shadow-2xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gov-navy mb-1">
                Sector Name <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={form.SectorName}
                onChange={set('SectorName')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-gov-navy focus:ring-1 focus:ring-gov-navy outline-none shadow-2xs font-sans cursor-pointer text-slate-900"
              >
                <option value="">Select Controlled Sector…</option>
                {vocab.sectors.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gov-navy mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={500}
              value={form.ProjectName}
              onChange={set('ProjectName')}
              placeholder="e.g. Guwahati Ring Road Package 3 (Four-Laning)"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-gov-navy focus:ring-1 focus:ring-gov-navy outline-none shadow-2xs text-slate-900 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gov-navy mb-1">
              Line Ministry <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={300}
              value={form.LineMinistry}
              onChange={set('LineMinistry')}
              placeholder="e.g. Ministry of Road Transport and Highways"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-gov-navy focus:ring-1 focus:ring-gov-navy outline-none shadow-2xs text-slate-900 font-sans"
            />
          </div>
        </div>

        {/* ── Group 2: Agency & Entity Resolution ── */}
        <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-gov-navy uppercase tracking-wider border-b border-slate-200 pb-2">
            <ShieldCheck size={14} className="text-gov-navy" />
            <span>2. Executing Agency &amp; Resolution</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gov-navy mb-1">
              Executing Agency (COMPANYNAME) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              list="known-agencies"
              maxLength={300}
              value={form.COMPANYNAME}
              onChange={set('COMPANYNAME')}
              placeholder="Start typing e.g. NHAI, RVNL, NTPC, BHEL..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-gov-navy focus:ring-1 focus:ring-gov-navy outline-none shadow-2xs font-sans text-slate-900"
            />
            <datalist id="known-agencies">
              {vocab.agencies.map((a) => <option key={a} value={a} />)}
            </datalist>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              Unresolved agencies are <strong>rejected &amp; queued for triage</strong> to avoid biased predictions. {vocab.agencies.length} canonical spellings loaded.
            </p>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-gov-navy mb-1">
              Original Sanctioned Capex (₹ Crore) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">₹</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={form.OriginalCost}
                onChange={set('OriginalCost')}
                placeholder="1250.00"
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-gov-navy focus:border-gov-navy focus:ring-1 focus:ring-gov-navy outline-none shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* ── Group 3: Lifecycle Dates ── */}
        <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-gov-navy uppercase tracking-wider border-b border-slate-200 pb-2">
            <Calendar size={14} className="text-gov-navy" />
            <span>3. Sanction &amp; Milestone Target Dates</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-gov-navy mb-1">
                Sanction Date (CCEA / PIB)
              </label>
              <input
                type="date"
                value={form.SanctionDate}
                onChange={set('SanctionDate')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:border-gov-navy focus:ring-1 focus:ring-gov-navy outline-none shadow-2xs cursor-pointer text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gov-navy mb-1">
                Original Target Completion Date
              </label>
              <input
                type="date"
                value={form.OriginalEndDate}
                onChange={set('OriginalEndDate')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:border-gov-navy focus:ring-1 focus:ring-gov-navy outline-none shadow-2xs cursor-pointer text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* ── Group 4: Geospatial & Coordinates ── */}
        <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-gov-navy uppercase tracking-wider border-b border-slate-200 pb-2">
            <Compass size={14} className="text-gov-navy" />
            <span>4. State &amp; Geospatial Coordinates</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gov-navy mb-1">
              State / Union Territory
            </label>
            <select
              value={form.StateName}
              onChange={set('StateName')}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-gov-navy focus:ring-1 focus:ring-gov-navy outline-none shadow-2xs font-sans cursor-pointer text-slate-900"
            >
              <option value="">Not Specified (Multi-State / Linear)</option>
              {(vocab.states || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-gov-navy mb-1">
                Latitude (°N)
              </label>
              <input
                type="number"
                step="0.000001"
                min="-90"
                max="90"
                value={form.Latitude}
                onChange={set('Latitude')}
                placeholder="e.g. 26.144517"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:border-gov-navy focus:ring-1 focus:ring-gov-navy outline-none shadow-2xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gov-navy mb-1">
                Longitude (°E)
              </label>
              <input
                type="number"
                step="0.000001"
                min="-180"
                max="180"
                value={form.Longitude}
                onChange={set('Longitude')}
                placeholder="e.g. 91.736236"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:border-gov-navy focus:ring-1 focus:ring-gov-navy outline-none shadow-2xs text-slate-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Real-time Pre-Flight Validation Preview ── */}
      {checking && (
        <div className="bg-slate-100 border border-slate-300 rounded-xl p-3.5 flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-gov-navy" />
          <span className="text-xs text-slate-900 font-mono">Running live server validator and geocode resolution engine…</span>
        </div>
      )}

      {!checking && <ValidationReport report={preview} />}
      {!checking && <GeocodePreview geo={preview?.geocode} />}

      {submitError && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-950 font-sans">
            <span className="font-bold block">Submission Rejected:</span>
            {typeof submitError === 'string' ? submitError : JSON.stringify(submitError)}
          </div>
        </div>
      )}

      <JobResult job={job} />

      {/* ── Submit & Action Buttons ── */}
      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 font-mono">
          {complete ? '✓ All required fields satisfied' : '⚠️ Complete all required fields (*) to enable submission'}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => { setForm(EMPTY_FORM); setPreview(null); setJob(null); setSubmitError(null); }}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer w-full sm:w-auto text-center shadow-2xs"
          >
            Reset Form
          </button>

          <button
            type="submit"
            disabled={!complete || busy || !canWrite}
            className="px-6 py-2.5 rounded-lg bg-gov-navy hover:bg-[#0060B6] text-white text-xs font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-2 border border-sky-900 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer w-full sm:w-auto transition-colors"
          >
            {busy ? <Loader2 size={15} className="animate-spin text-white" /> : <PlusCircle size={15} />}
            <span>{busy ? 'Sealing into Merkle Tree…' : 'Onboard Project'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}

/* ── Tab 2: Monthly CUF Upload ────────────────────────────────────────────── */
function CufTab({ canWrite }) {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const take = useCallback((f) => {
    setFile(f || null); setReport(null); setJob(null); setError(null);
  }, []);

  const upload = async () => {
    if (!file) return;
    setBusy(true); setError(null); setReport(null); setJob(null);

    const fd = new FormData();
    fd.append('file', file, file.name);
    const r = await apiUpload('/api/ingest/upload-cuf', fd);

    if (!r.ok) {
      setBusy(false);
      const detail = r.data?.detail;
      if (detail && typeof detail === 'object' && detail.errors) setReport(detail);
      setError(detail?.reason || r.error);
      return;
    }

    setReport({ accepted_rows: r.data.rows_accepted, rejected_rows: 0, valid: true });
    const jobId = r.data.job_id;
    for (let i = 0; i < 120; i += 1) {
      const j = await apiFetch(`/api/ingest/jobs/${jobId}`);
      if (j.ok) {
        setJob(j.data);
        if (j.data.state === 'succeeded' || j.data.state === 'failed') break;
      }
      await new Promise((res) => setTimeout(res, 500));
    }
    setBusy(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-gov-navy font-bold uppercase tracking-wider">
            <UploadCloud size={14} />
            <span>Monthly Flash Report Ingest</span>
          </div>
          <h2 className="text-xl font-bold text-gov-navy">
            Bulk MoSPI Common Upload Form (CUF) Ingestion
          </h2>
          <p className="text-xs text-slate-500 font-sans">
            Accepts official CSV / XLSX monthly returns. Header names are normalized case-insensitively.
          </p>
        </div>
      </div>

      {/* Dropzone Container */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
          drag
            ? 'border-gov-navy bg-slate-100/60 ring-4 ring-gov-navy/10'
            : file
            ? 'border-emerald-500 bg-emerald-50/20'
            : 'border-slate-300 hover:border-gov-navy bg-slate-50/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files?.[0]); }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="sr-only"
          aria-label="Choose a Common Upload Form file"
          onChange={(e) => take(e.target.files?.[0])}
        />

        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-2xs transition-transform ${
          file ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-gov-navy group-hover:scale-105'
        }`}>
          {file ? <FileCheck size={24} /> : <FileUp size={24} />}
        </div>

        <div className="space-y-1.5 max-w-md">
          <h3 className="font-bold text-sm text-gov-navy">
            {file ? file.name : 'Drag and Drop Common Upload Form (CSV / XLSX)'}
          </h3>
          <p className="text-xs text-slate-500 font-sans leading-relaxed">
            {file
              ? `${(file.size / 1024).toFixed(1)} KB · File ready for batch validation`
              : 'Drop your monthly return file here or click to browse from local computer.'}
          </p>
        </div>

        {!file && (
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-gov-navy text-xs font-bold hover:bg-slate-100 shadow-2xs"
          >
            Select CUF File
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-950 font-sans font-bold">
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </div>
        </div>
      )}

      <ValidationReport report={report} />
      <JobResult job={job} />

      <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
        <button
          type="button"
          disabled={!file || busy || !canWrite}
          onClick={upload}
          className="px-8 py-3 rounded-lg bg-gov-navy hover:bg-[#0060B6] text-white text-xs font-bold tracking-wide uppercase flex items-center gap-2 border border-sky-900 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {busy ? <Loader2 size={16} className="animate-spin text-white" /> : <UploadCloud size={16} />}
          <span>{busy ? 'Validating & Rebuilding Snapshot…' : 'Validate & Ingest CUF Return'}</span>
        </button>
      </div>
    </div>
  );
}

/* ── Tab 3: History & Unresolved Agency Queue ─────────────────────────────── */
function HistoryTab({ enabled }) {
  const [jobs, setJobs] = useState([]);
  const [queue, setQueue] = useState([]);
  const [queueError, setQueueError] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const j = await apiFetch('/api/ingest/jobs?limit=25');
    if (j.ok) setJobs(j.data.jobs || []);
    const q = await apiFetch('/api/ingest/unresolved?limit=100');
    if (q.ok) { setQueue(q.data.unresolved || []); setQueueError(null); }
    else setQueueError(q.error);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="space-y-6">
      {/* Table 1: Ingest Jobs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-bold text-base text-gov-navy">
              Recent Ledger Ingestion Transactions
            </h3>
            <p className="text-xs text-slate-500">
              Audit trail of content-addressed corpus versions and Merkle roots
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-gov-navy text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          {jobs.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-mono text-xs">
              No jobs recorded this session. (In-process audit log resets on container restart).
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 text-[10.5px] uppercase font-mono font-bold">
                <tr>
                  <th className="py-3 px-4">Job ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4">Officer</th>
                  <th className="py-3 px-4">Corpus Version</th>
                  <th className="py-3 px-4">RFC 6962 Merkle Root</th>
                  <th className="py-3 px-4">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((j) => (
                  <tr key={j.job_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gov-navy">{j.job_id.slice(0, 8)}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{j.kind}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold uppercase ${
                        j.state === 'succeeded' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : j.state === 'failed' ? 'bg-rose-50 text-rose-800 border border-rose-300'
                        : 'bg-slate-100 text-slate-800 border border-slate-300'
                      }`}>
                        {j.state}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{j.submitted_by || 'admin'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-gov-navy">
                      {j.detail?.corpus_version ? `v${j.detail.corpus_version}` : '—'}
                    </td>
                    <td className="py-3 px-4"><Hash value={j.detail?.corpus_root} /></td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {j.duration_s != null ? `${j.duration_s}s` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Table 2: Unresolved Agencies Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-bold text-base text-gov-navy">
              Unresolved Executing Agency Triage Queue
            </h3>
            <p className="text-xs text-slate-500">
              Raw entity strings from rejected rows awaiting canonical resolution mapping
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-x-auto">
          {!enabled ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs font-sans">
              The persistent mapping queue is stored in PostgreSQL and is unavailable in offline CSV bootstrap mode.
            </div>
          ) : queueError ? (
            <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl flex items-center gap-3 text-xs text-amber-900 font-sans">
              <AlertTriangle size={16} className="text-amber-600" />
              <span>{queueError}</span>
            </div>
          ) : queue.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl flex items-center gap-3 text-xs text-emerald-900 font-sans">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span><strong>All executing agencies clean &amp; resolved:</strong> 100% of submitted entities match canonical company names in the vocabulary.</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 text-[10.5px] uppercase font-mono font-bold">
                <tr>
                  <th className="py-2.5 px-3.5">Raw Agency Name</th>
                  <th className="py-2.5 px-3.5">Occurrence Count</th>
                  <th className="py-2.5 px-3.5">First Seen Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((q) => (
                  <tr key={q.raw_name} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3.5 font-bold text-gov-navy">{q.raw_name}</td>
                    <td className="py-2.5 px-3.5 font-mono font-bold text-amber-800">{q.occurrences}</td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-500">{String(q.first_seen_at).slice(0, 19)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminIngestView() {
  return (
    <LoginGate>
      <AdminIngestInner />
    </LoginGate>
  );
}
