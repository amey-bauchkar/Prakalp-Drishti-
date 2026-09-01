import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, ClipboardList, Database, FileUp, History,
  Loader2, MapPin, PlusCircle, ShieldAlert, UploadCloud,
} from 'lucide-react';

import LoginGate, { useSession } from '../../amey/LoginGate.jsx';
import { apiFetch, apiUpload } from '../../amey/authClient.js';

/**
 * ADMIN INGEST — dynamic project onboarding and monthly CUF upload.
 *
 * This is the write surface for the corpus every other engine reads. Three principles
 * govern how it behaves, and each exists because of a defect this project already had:
 *
 *  1. THE SERVER OWNS THE VOCABULARY. Sectors and executing agencies are fetched from
 *     /api/ingest/vocabulary, never hardcoded here. A list duplicated into JSX is a
 *     second declaration of the same fact, and the two drift — which is precisely how
 *     nine of eleven hand-set sector keys came to match nothing in the corpus.
 *
 *  2. VALIDATION IS PREVIEWED, NOT GUESSED. The agency field checks against the real
 *     resolver via /api/ingest/validate before submit, so an officer learns their
 *     agency will be rejected while they can still fix it. The UI never decides
 *     admissibility itself; it renders what the server ruled.
 *
 *  3. AN UNRESOLVED AGENCY IS SHOWN AS A REJECTION, NOT A WARNING. A row whose
 *     COMPANYNAME does not resolve is refused and queued for a human. Presenting that
 *     as a soft warning would invite exactly the silent default the backend refuses.
 */

const TABS = [
  { id: 'onboard', label: 'Project Onboarding', icon: PlusCircle,
    desc: 'Register a single central-sector project into the ledger' },
  { id: 'cuf', label: 'Monthly CUF Upload', icon: UploadCloud,
    desc: 'Bulk MoSPI Common Upload Form (CSV)' },
  { id: 'history', label: 'Ingest History & Queue', icon: History,
    desc: 'Sealed corpus versions and agencies awaiting mapping' },
];

const EMPTY_FORM = {
  ProjectId: '', ProjectName: '', SectorName: '', LineMinistry: '',
  COMPANYNAME: '', OriginalCost: '', SanctionDate: '', OriginalEndDate: '',
  StateName: '', Latitude: '', Longitude: '',
};

function Hash({ value }) {
  if (!value) return <span className="text-text-muted">—</span>;
  return (
    <span className="font-mono text-[11px] break-all" title={value}>
      {String(value).slice(0, 16)}…{String(value).slice(-8)}
    </span>
  );
}

/* ── Corpus provenance strip ─────────────────────────────────────────────── */
function CorpusBadge({ status }) {
  if (!status) return null;
  const live = status.database_configured;
  return (
    <div className="stat-strip" role="status" aria-label="Corpus provenance">
      <div className="stat-strip-item">
        <div className="microlabel">Corpus Source</div>
        <div className="metric-value-sm flex items-center gap-1.5">
          <Database size={13} aria-hidden="true" />
          {live ? 'PostgreSQL' : 'CSV bootstrap'}
        </div>
      </div>
      <div className="stat-strip-item">
        <div className="microlabel">Ingestion</div>
        <div className={`metric-value-sm ${live ? 'metric-pos' : 'metric-warn'}`}>
          {live ? 'Enabled' : 'Read-only'}
        </div>
      </div>
      <div className="stat-strip-item">
        <div className="microlabel">Batch Limit</div>
        <div className="metric-value-sm">{status.max_rows_per_batch?.toLocaleString('en-IN')} rows</div>
      </div>
    </div>
  );
}

/* ── Validation report, rendered identically wherever it appears ─────────── */
function ValidationReport({ report }) {
  if (!report) return null;
  const unresolved = Object.entries(report.unresolved_entities || {});

  if (report.valid || (report.accepted_rows > 0 && report.rejected_rows === 0)) {
    return (
      <div className="note note-ok" role="status">
        <CheckCircle2 size={14} aria-hidden="true" />
        <span>
          <strong>{report.accepted_rows}</strong> row{report.accepted_rows === 1 ? ' passes' : 's pass'} validation.
          {report.checked_against_corpus === false &&
            ' Duplicate-ID checking is unavailable without a live corpus.'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="note note-critical" role="alert">
        <ShieldAlert size={14} aria-hidden="true" />
        <span>
          <strong>{report.rejected_rows}</strong> row{report.rejected_rows === 1 ? '' : 's'} rejected.
          Nothing was written — the whole batch is refused so the corpus never holds a
          partially-applied return.
        </span>
      </div>

      {unresolved.length > 0 && (
        <div className="note note-warn">
          <AlertTriangle size={14} aria-hidden="true" />
          <span>
            <strong>{unresolved.length}</strong> executing agenc{unresolved.length === 1 ? 'y' : 'ies'} did
            not resolve and {unresolved.length === 1 ? 'was' : 'were'} queued for mapping.
            These rows are <strong>rejected, not defaulted</strong> — a forecast computed
            against the pooled multiplier would be wrong in a way you could not detect.
            <span className="block mt-1 font-mono text-[11px]">
              {unresolved.map(([n, c]) => `${n} (${c})`).join(' · ')}
            </span>
          </span>
        </div>
      )}

      {(report.errors || []).length > 0 && (
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Rejected rows</span></div>
          <div className="panel-body-lg overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th scope="col">Row</th><th scope="col">Project ID</th>
                  <th scope="col">Field</th><th scope="col">Reason</th></tr>
              </thead>
              <tbody>
                {report.errors.slice(0, 50).map((e, i) => (
                  <tr key={i}>
                    <td className="font-mono">{e.row_index + 1}</td>
                    <td className="font-mono">{e.project_id ?? '—'}</td>
                    <td><span className="tag tag-critical">{e.field}</span></td>
                    <td>{e.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.error_count > 50 && (
              <p className="notation mt-2">
                Showing 50 of {report.error_count} errors.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Geocode precision, as the server ruled it ───────────────────────────── */
function GeocodePreview({ geo }) {
  if (!geo) return null;

  if (!geo.valid) {
    return (
      <div className="note note-critical" role="alert">
        <ShieldAlert size={14} aria-hidden="true" />
        <span>{geo.error}</span>
      </div>
    );
  }

  const km = geo.error_radius_m >= 1000
    ? `±${Math.round(geo.error_radius_m / 1000)} km`
    : `±${geo.error_radius_m} m`;

  return (
    <div className={`note ${geo.serve_imagery ? 'note-ok' : 'note-warn'}`} role="status">
      <MapPin size={14} aria-hidden="true" />
      <span>
        <strong>{geo.geocode_class}</strong> · {km} · tier <em>{geo.tier}</em>
        <span className="block mt-1">{geo.display_note}</span>
        {!geo.counts_toward_ner_floor && (
          <span className="block mt-1 microlabel-strong">
            Excluded from the statutory 10% NER capital floor — that constraint binds
            only on ministry-reported geography.
          </span>
        )}
      </span>
    </div>
  );
}

/* ── Job result: the sealed corpus version and its Merkle root ───────────── */
function JobResult({ job }) {
  if (!job) return null;

  if (job.state === 'running' || job.state === 'queued') {
    return (
      <div className="note note-info" role="status" aria-live="polite">
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        <span>Writing to the ledger and rebuilding the corpus snapshot…</span>
      </div>
    );
  }

  if (job.state === 'failed') {
    return (
      <div className="note note-critical" role="alert">
        <ShieldAlert size={14} aria-hidden="true" />
        <span>Ingest failed: <span className="font-mono">{job.error}</span></span>
      </div>
    );
  }

  const d = job.detail || {};
  return (
    <div className="panel panel-accent">
      <div className="panel-head">
        <span className="panel-title">Sealed into the corpus</span>
        <span className="tag tag-ok">corpus_version {d.corpus_version}</span>
      </div>
      <div className="panel-body-lg">
        <div className="hairgrid hairgrid-3">
          <div className="metric-cell">
            <div className="metric-label">Rows Written</div>
            <div className="metric-value">{d.rows_written}</div>
          </div>
          <div className="metric-cell">
            <div className="metric-label">Corpus Rows</div>
            <div className="metric-value">{d.row_count?.toLocaleString('en-IN')}</div>
          </div>
          <div className="metric-cell">
            <div className="metric-label">Sealed In</div>
            <div className="metric-value">{job.duration_s ?? '—'}s</div>
          </div>
        </div>
        <div className="hashline mt-3">
          <span className="microlabel-strong">RFC 6962 Merkle root</span>
          <Hash value={d.corpus_root} />
        </div>
        <p className="notation mt-2">
          This root is a content address over the canonical rows. Any briefing signed
          against version {d.corpus_version} can be re-verified against it.
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */

function AdminIngestInner() {
  const session = useSession();
  const [tab, setTab] = useState('onboard');
  const [status, setStatus] = useState(null);
  const [vocab, setVocab] = useState({ sectors: [], agencies: [] });
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
    <div className="space-y-5 font-sans">
      {/* .command-header is a dark navy panel that sets color:#FFFFFF, so its contents
          must be light. Nesting .panel-title here renders near-black on navy — the
          exact 1.3:1 unreadable pairing the a11y audit exists to catch. Padding and
          light text follow the convention already used by KAAL-CHAKRA and the other
          module headers. */}
      <header className="command-header p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/[0.07] text-[9.5px] font-extrabold tracking-institutional uppercase text-gov-accent border-l-2 border-gov-accent">
            <ClipboardList className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            <span>CORPUS ADMINISTRATION · WRITE SURFACE</span>
          </div>
          <h1 className="font-heading font-extrabold text-[21px] sm:text-[25px] tracking-[-0.025em] text-white leading-[1.12]">
            PROJECT ONBOARDING &amp; MONTHLY RETURNS
          </h1>
          <p className="text-[12.5px] text-ink-200 leading-relaxed font-sans max-w-xl">
            Writes to the append-only ledger every engine reads. Each accepted batch
            seals a new content-addressed corpus version whose Merkle root any auditor
            can re-verify.
          </p>
        </div>
      </header>

      <CorpusBadge status={status} />

      {status && !status.database_configured && (
        <div className="note note-warn" role="status">
          <AlertTriangle size={14} aria-hidden="true" />
          <span>
            The corpus is running from the read-only CSV bootstrap, so writes will be
            refused with 503. Validation still works — the rules are identical either way.
          </span>
        </div>
      )}

      {!canWrite && (
        <div className="note note-authority" role="status">
          <ShieldAlert size={14} aria-hidden="true" />
          <span>
            Your role can validate but not submit. Onboarding changes the denominator of
            every portfolio statistic, so it requires the <code>allocate_capital</code>{' '}
            capability. Enforcement is server-side; this notice only explains it.
          </span>
        </div>
      )}

      {loadError && (
        <div className="note note-critical" role="alert">
          <ShieldAlert size={14} aria-hidden="true" />
          <span>{loadError}</span>
        </div>
      )}

      <nav className="engine-rail" role="tablist" aria-label="Ingestion views">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls={`ingest-panel-${t.id}`}
              className={`engine-tab ${active ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <Icon size={15} className="engine-tab-icon" aria-hidden="true" />
              <span className="engine-tab-name">{t.label}</span>
              <span className="engine-tab-desc">{t.desc}</span>
            </button>
          );
        })}
      </nav>

      <div id={`ingest-panel-${tab}`} role="tabpanel">
        {tab === 'onboard' && <OnboardTab vocab={vocab} canWrite={canWrite} />}
        {tab === 'cuf' && <CufTab canWrite={canWrite} />}
        {tab === 'history' && <HistoryTab enabled={!!status?.database_configured} />}
      </div>
    </div>
  );
}

/* ── Tab 1 ───────────────────────────────────────────────────────────────── */
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
    // Always operator_entered from this form. A form cannot assert that the ministry
    // reported something, and that distinction gates a statutory funding floor.
    StateSource: 'operator_entered',
  }), [form]);

  const complete = form.ProjectId && form.ProjectName && form.SectorName
    && form.LineMinistry && form.COMPANYNAME && form.OriginalCost;

  // Preview against the REAL validator, debounced. The UI never rules on
  // admissibility itself — it shows what the server decided.
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

    // 202 accepted — poll the job until it settles.
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
    <form className="panel" onSubmit={submit}>
      <div className="panel-head">
        <span className="panel-title">Single Project Onboarding</span>
        <span className="panel-meta">All fields marked required are enforced server-side</span>
      </div>

      <div className="panel-body-lg space-y-4">
        <div className="hairgrid hairgrid-2 gap-4">
          <label className="block">
            <span className="microlabel-strong">Project ID *</span>
            <input className="field" type="number" min="1" required inputMode="numeric"
                   value={form.ProjectId} onChange={set('ProjectId')} placeholder="e.g. 706719" />
          </label>

          <label className="block">
            <span className="microlabel-strong">Original Capex (₹ Cr) *</span>
            <input className="field" type="number" min="0.01" step="0.01" required
                   value={form.OriginalCost} onChange={set('OriginalCost')} placeholder="e.g. 1250.00" />
          </label>
        </div>

        <label className="block">
          <span className="microlabel-strong">Project Name *</span>
          <input className="field" type="text" required maxLength={500}
                 value={form.ProjectName} onChange={set('ProjectName')}
                 placeholder="e.g. Guwahati Ring Road Package 3" />
        </label>

        <div className="hairgrid hairgrid-2 gap-4">
          <label className="block">
            <span className="microlabel-strong">Sector *</span>
            <select className="field" required value={form.SectorName} onChange={set('SectorName')}>
              <option value="">Select from controlled vocabulary…</option>
              {vocab.sectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="notation">
              {vocab.sectors.length} sectors, served by the API — not hardcoded here.
            </span>
          </label>

          <label className="block">
            <span className="microlabel-strong">Line Ministry *</span>
            <input className="field" type="text" required maxLength={300}
                   value={form.LineMinistry} onChange={set('LineMinistry')}
                   placeholder="e.g. Ministry of Road Transport and Highways" />
          </label>
        </div>

        <label className="block">
          <span className="microlabel-strong">Executing Agency *</span>
          <input className="field" type="text" required list="known-agencies" maxLength={300}
                 value={form.COMPANYNAME} onChange={set('COMPANYNAME')}
                 placeholder="Start typing — must resolve to a canonical entity" />
          <datalist id="known-agencies">
            {vocab.agencies.map((a) => <option key={a} value={a} />)}
          </datalist>
          <span className="notation">
            An agency that does not resolve is <strong>rejected and queued</strong>, never
            defaulted. {vocab.agencies.length} resolvable spellings are known.
          </span>
        </label>

        <div className="hairgrid hairgrid-2 gap-4">
          <label className="block">
            <span className="microlabel-strong">State</span>
            <select className="field" value={form.StateName} onChange={set('StateName')}>
              <option value="">Not specified</option>
              {(vocab.states || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="notation">
              Recorded as <code>operator_entered</code>. It will render on the map but
              will <strong>not</strong> count toward the statutory NER floor.
            </span>
          </label>

          <div className="hairgrid hairgrid-2 gap-3">
            <label className="block">
              <span className="microlabel-strong">Latitude</span>
              <input className="field" type="number" step="0.000001" min="-90" max="90"
                     value={form.Latitude} onChange={set('Latitude')} placeholder="e.g. 18.520430" />
            </label>
            <label className="block">
              <span className="microlabel-strong">Longitude</span>
              <input className="field" type="number" step="0.000001" min="-180" max="180"
                     value={form.Longitude} onChange={set('Longitude')} placeholder="e.g. 73.856744" />
            </label>
          </div>
        </div>

        <div className="hairgrid hairgrid-2 gap-4">
          <label className="block">
            <span className="microlabel-strong">Sanction Date</span>
            <input className="field" type="date" value={form.SanctionDate} onChange={set('SanctionDate')} />
          </label>
          <label className="block">
            <span className="microlabel-strong">Original Target Date</span>
            <input className="field" type="date" value={form.OriginalEndDate} onChange={set('OriginalEndDate')} />
          </label>
        </div>

        {checking && (
          <div className="note note-info" role="status" aria-live="polite">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            <span>Validating against the live resolver…</span>
          </div>
        )}
        {!checking && <ValidationReport report={preview} />}
        {!checking && <GeocodePreview geo={preview?.geocode} />}
        {submitError && (
          <div className="note note-critical" role="alert">
            <ShieldAlert size={14} aria-hidden="true" />
            <span>{typeof submitError === 'string' ? submitError : JSON.stringify(submitError)}</span>
          </div>
        )}
        <JobResult job={job} />

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary"
                  disabled={!complete || busy || !canWrite}>
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <PlusCircle size={14} aria-hidden="true" />}
            {busy ? 'Sealing…' : 'Onboard Project'}
          </button>
          <button type="button" className="btn-outline"
                  onClick={() => { setForm(EMPTY_FORM); setPreview(null); setJob(null); setSubmitError(null); }}>
            Reset
          </button>
        </div>
      </div>
    </form>
  );
}

/* ── Tab 2 ───────────────────────────────────────────────────────────────── */
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
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Monthly Common Upload Form</span>
        <span className="panel-meta">CSV · headers are matched case- and separator-insensitively</span>
      </div>

      <div className="panel-body-lg space-y-4">
        <div
          className={`dropzone ${drag ? 'is-dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files?.[0]); }}
        >
          <FileUp size={22} aria-hidden="true" />
          <p className="metric-value-sm mt-2">
            {file ? file.name : 'Drop the monthly CUF here'}
          </p>
          <p className="notation">
            {file
              ? `${(file.size / 1024).toFixed(1)} KB — ready to validate`
              : 'or choose a file. CSV is native; XLSX needs the optional openpyxl package.'}
          </p>
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="sr-only"
                 aria-label="Choose a Common Upload Form file"
                 onChange={(e) => take(e.target.files?.[0])} />
          <button type="button" className="btn-outline mt-3"
                  onClick={() => inputRef.current?.click()}>
            Choose file
          </button>
        </div>

        {error && (
          <div className="note note-critical" role="alert">
            <ShieldAlert size={14} aria-hidden="true" />
            <span>{typeof error === 'string' ? error : JSON.stringify(error)}</span>
          </div>
        )}

        <ValidationReport report={report} />
        <JobResult job={job} />

        <button type="button" className="btn-primary" disabled={!file || busy || !canWrite}
                onClick={upload}>
          {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <UploadCloud size={14} aria-hidden="true" />}
          {busy ? 'Processing…' : 'Validate & Ingest'}
        </button>
      </div>
    </div>
  );
}

/* ── Tab 3 ───────────────────────────────────────────────────────────────── */
function HistoryTab({ enabled }) {
  const [jobs, setJobs] = useState([]);
  const [queue, setQueue] = useState([]);
  const [queueError, setQueueError] = useState(null);

  const refresh = useCallback(async () => {
    const j = await apiFetch('/api/ingest/jobs?limit=25');
    if (j.ok) setJobs(j.data.jobs || []);
    const q = await apiFetch('/api/ingest/unresolved?limit=100');
    if (q.ok) { setQueue(q.data.unresolved || []); setQueueError(null); }
    else setQueueError(q.error);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="space-y-5">
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Recent Ingest Jobs</span>
          <button type="button" className="btn-outline" onClick={refresh}>Refresh</button>
        </div>
        <div className="panel-body-lg overflow-x-auto">
          {jobs.length === 0 ? (
            <p className="notation">
              No jobs this session. Job history is in-process and does not survive a restart.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Job</th><th scope="col">Kind</th><th scope="col">State</th>
                  <th scope="col">By</th><th scope="col">Version</th>
                  <th scope="col">Corpus Root</th><th scope="col">Duration</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.job_id}>
                    <td className="font-mono text-[11px]">{j.job_id.slice(0, 8)}</td>
                    <td>{j.kind}</td>
                    <td>
                      <span className={`tag ${j.state === 'succeeded' ? 'tag-ok'
                        : j.state === 'failed' ? 'tag-critical' : 'tag-info'}`}>
                        {j.state}
                      </span>
                    </td>
                    <td>{j.submitted_by || '—'}</td>
                    <td className="font-mono">{j.detail?.corpus_version ?? '—'}</td>
                    <td><Hash value={j.detail?.corpus_root} /></td>
                    <td className="font-mono">{j.duration_s != null ? `${j.duration_s}s` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Unresolved Executing Agencies</span>
          <span className="panel-meta">Rejected rows awaiting a canonical mapping</span>
        </div>
        <div className="panel-body-lg overflow-x-auto">
          {!enabled ? (
            <p className="notation">
              The queue lives in PostgreSQL and is unavailable under the CSV bootstrap.
            </p>
          ) : queueError ? (
            <div className="note note-warn"><AlertTriangle size={14} aria-hidden="true" /><span>{queueError}</span></div>
          ) : queue.length === 0 ? (
            <div className="note note-ok">
              <CheckCircle2 size={14} aria-hidden="true" />
              <span>Every submitted agency resolved. Nothing is awaiting mapping.</span>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th scope="col">Raw Agency Name</th><th scope="col">Occurrences</th>
                  <th scope="col">First Seen</th></tr>
              </thead>
              <tbody>
                {queue.map((q) => (
                  <tr key={q.raw_name}>
                    <td>{q.raw_name}</td>
                    <td className="font-mono">{q.occurrences}</td>
                    <td className="font-mono text-[11px]">{String(q.first_seen_at).slice(0, 19)}</td>
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
