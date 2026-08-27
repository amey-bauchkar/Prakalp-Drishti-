import React, { useState, useRef, useEffect } from 'react';
import { Send, ShieldCheck, ShieldAlert, Cpu, Loader2, Database, Fingerprint } from 'lucide-react';
import { apiFetch } from './authClient';

/**
 * PMO Copilot — conversational surface over the Fact layer.
 *
 * The important part of this component is what it renders ALONGSIDE the answer.
 * The backend always retrieves deterministically and only optionally lets a
 * cloud model phrase the result, rejecting any generated text containing a
 * figure the retrieval layer did not vouch for. That distinction is a
 * governance property, not an implementation detail, so every reply states
 * which mode produced it:
 *
 *   verified + phrased  — LLM prose, every figure matched against the fact set
 *   verified (offline)  — assembled from facts, no outbound call made
 *   guard rejected      — a generation was discarded; showing the fact answer
 *
 * An officer must never have to guess whether the sentence in front of them
 * came from a model or from the ledger.
 */

const SUGGESTIONS = [
  { label: 'Timeline forecast & delay causes', q: 'What is the timeline forecast and what is driving the delay?' },
  { label: 'CCEA 20% anti-gaming audit', q: 'Is the cost overrun within the statutory CCEA limit?' },
  { label: 'Monsoon work-window contraction', q: 'What is the monsoon impact on this project?' },
  { label: 'Satellite change-detection verdict', q: 'Give me the satellite ground-truth verdict.' },
];

const MODE_META = {
  llm_phrasing_over_verified_facts: {
    cls: 'tag tag-ok', Icon: ShieldCheck, label: 'Verified · phrased',
    help: 'Generated prose. Every figure was matched against the cryptographically verified fact set before display.',
  },
  deterministic: {
    cls: 'tag', Icon: Database, label: 'Verified · offline',
    help: 'Assembled directly from Merkle-signed facts. No outbound request was made.',
  },
  deterministic_fallback: {
    cls: 'tag tag-warn', Icon: Database, label: 'Verified · offline (fallback)',
    help: 'The language model was unreachable, so the fact-assembled answer is shown instead.',
  },
  deterministic_guard_tripped: {
    cls: 'tag tag-critical', Icon: ShieldAlert, label: 'Generation rejected',
    help: 'The model produced a figure absent from the verified facts. It was discarded and the fact answer shown.',
  },
};

export default function CopilotChat({ projectId }) {
  const [turns, setTurns] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { setTurns([]); }, [projectId]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [turns, busy]);

  const send = async (question) => {
    const q = (question ?? draft).trim();
    if (!q || busy) return;
    setDraft('');
    setBusy(true);
    setTurns((t) => [...t, { role: 'user', text: q }]);

    const res = await apiFetch('/api/amey/ask', {
      method: 'POST',
      body: JSON.stringify({ question: q, project_id: String(projectId) }),
    });

    setTurns((t) => [...t, res.ok
      ? { role: 'copilot', payload: res.data }
      : { role: 'error', text: res.error }]);
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-institutional font-extrabold text-gov-accent flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5" />
          Ask the PMO Copilot
        </span>
        <span className="text-[9.5px] font-mono text-ink-200">
          grounded on project #{projectId}
        </span>
      </div>

      {/* Suggestion chips */}
      {turns.length === 0 && (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => send(s.q)}
              disabled={busy}
              className="text-[10px] font-semibold px-2 py-1 rounded-sm border border-white/20 bg-white/[0.06] text-ink-100 hover:bg-white/[0.12] hover:border-gov-accent transition-colors disabled:opacity-40"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Transcript */}
      {turns.length > 0 && (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {turns.map((t, i) => {
            if (t.role === 'user') {
              return (
                <div key={i} className="text-[12px] text-white bg-white/[0.09] border-l-2 border-gov-accent rounded-sm px-3 py-2">
                  {t.text}
                </div>
              );
            }
            if (t.role === 'error') {
              return (
                <div key={i} className="text-[11.5px] text-rose-200 bg-rose-500/10 border-l-2 border-rose-400 rounded-sm px-3 py-2">
                  {t.text}
                </div>
              );
            }

            const d = t.payload || {};
            const meta = MODE_META[d.llm?.mode] || MODE_META.deterministic;
            const { Icon } = meta;
            const prose = d.answer_llm || d.answer;

            return (
              <div key={i} className="bg-white/[0.05] border border-white/10 rounded-sm px-3 py-2.5 space-y-2">
                <p className="text-[12.5px] text-slate-100 leading-relaxed">{prose}</p>

                <div className="flex items-center gap-2 flex-wrap pt-1.5 border-t border-white/10">
                  <span className={meta.cls} title={meta.help}>
                    <Icon className="w-3 h-3" />
                    {meta.label}
                  </span>

                  {d.llm?.model && (
                    <span className="text-[9px] font-mono text-ink-200">{d.llm.model}</span>
                  )}

                  {/* Merkle fact badges: click to see the lineage behind a figure. */}
                  {(d.cited_fact_ids || []).slice(0, 4).map((fid) => (
                    <span
                      key={fid}
                      title={`Fact ${fid} carries a SHA-256 Merkle inclusion proof`}
                      className="tag tag-authority cursor-help"
                    >
                      <Fingerprint className="w-2.5 h-2.5" />
                      {String(fid).replace(/^fact_/, '').slice(0, 18)}
                    </span>
                  ))}
                </div>

                {/* When a generation is rejected, say so in the open rather than
                    quietly serving the fallback as if nothing happened. */}
                {d.llm?.mode === 'deterministic_guard_tripped' && (
                  <p className="text-[10px] text-rose-200/90 leading-snug">
                    Blocked figures: <span className="font-mono">{(d.llm.unverified_figures || []).join(', ')}</span>
                    {' — '}not present in the verified fact set. Showing the fact-assembled answer.
                  </p>
                )}
              </div>
            );
          })}
          {busy && (
            <div className="flex items-center gap-2 text-[11px] text-ink-200 px-3 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Retrieving verified facts…
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      {/* Composer */}
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder={`Ask anything about project #${projectId}…`}
          className="flex-1 min-w-0 text-[11.5px] bg-ink-900/70 text-white border border-white/20 rounded-sm px-2.5 py-1.5 focus:outline-none focus:border-gov-accent placeholder:text-ink-200"
        />
        <button
          onClick={() => send()}
          disabled={busy || !draft.trim()}
          className="shrink-0 bg-gov-accent text-gov-navy-dark hover:bg-gov-accent-hover disabled:opacity-40 disabled:cursor-not-allowed py-1.5 px-3 rounded-sm text-[10.5px] font-extrabold uppercase tracking-institutional flex items-center gap-1.5 transition-colors"
        >
          <Send className="w-3 h-3" />
          Send
        </button>
      </div>
    </div>
  );
}
