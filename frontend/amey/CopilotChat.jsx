import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ShieldCheck, ShieldAlert, Cpu, Loader2, Database, Fingerprint, Sparkles, MessageSquare, BookOpen } from 'lucide-react';
import { apiFetch } from './authClient';

/**
 * PMO Copilot — conversational surface over the Fact layer.
 *
 * Every figure carries a SHA-256 Merkle inclusion proof.
 * Grounded strictly on verified project facts.
 */

const SUGGESTIONS = [
  { label: 'Timeline forecast & delay causes', q: 'What is the timeline forecast and what is driving the delay?' },
  { label: 'CCEA 20% anti-gaming audit', q: 'Is the cost overrun within the statutory CCEA limit?' },
  { label: 'Monsoon work-window contraction', q: 'What is the monsoon impact on this project?' },
  { label: 'Satellite change-detection verdict', q: 'Give me the satellite ground-truth verdict.' },
];

const MODE_META = {
  llm_phrasing_over_verified_facts: {
    badgeCls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    Icon: ShieldCheck,
    label: 'Verified · phrased',
    help: 'Generated prose. Every figure was matched against the cryptographically verified fact set before display.',
  },
  deterministic: {
    badgeCls: 'bg-slate-500/10 text-slate-300 border border-slate-500/20',
    Icon: Database,
    label: 'Verified · offline',
    help: 'Assembled directly from Merkle-signed facts. No outbound request was made.',
  },
  deterministic_fallback: {
    badgeCls: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    Icon: Database,
    label: 'Verified · offline (fallback)',
    help: 'The language model was unreachable, so the fact-assembled answer is shown instead.',
  },
  deterministic_guard_tripped: {
    badgeCls: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
    Icon: ShieldAlert,
    label: 'Generation rejected',
    help: 'The model produced a figure absent from the verified facts. It was discarded and the fact answer shown.',
  },
  // General-knowledge answers carry NO Merkle provenance. The badge has to say
  // so plainly: an amber "advisory" chip next to a statutory citation is the
  // difference between guidance and a claim this system is vouching for.
  llm_conversational: {
    badgeCls: 'bg-violet-500/10 text-violet-300 border border-violet-500/20',
    Icon: MessageSquare,
    label: 'Conversational',
    help: 'A greeting or capability question. No project figures are asserted and none are claimed to be verified.',
  },
  llm_general_knowledge: {
    badgeCls: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
    Icon: BookOpen,
    label: 'General guidance · not provenanced',
    help: 'Domain knowledge, not drawn from the MoSPI corpus and carrying no Merkle proof. Verify statutory citations before acting on them.',
  },
  general_guard_tripped: {
    badgeCls: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
    Icon: ShieldAlert,
    label: 'Answer rejected',
    help: 'A general answer asserted project-specific figures, which carry no provenance here. It was discarded.',
  },
};

// Query-mode chip, shown alongside the provenance badge so a reviewer can see
// WHY an answer was or was not grounded in the corpus.
const QUERY_MODE_META = {
  PROJECT_FACT_QUERY: { label: 'Project facts', cls: 'text-emerald-300/90 border-emerald-500/20' },
  HYBRID_ANALYTICAL_QUERY: { label: 'Facts + statute', cls: 'text-amber-300/90 border-amber-500/20' },
  GENERAL_QUERY: { label: 'General domain', cls: 'text-sky-300/90 border-sky-500/20' },
  CONVERSATIONAL_QUERY: { label: 'Chat', cls: 'text-violet-300/90 border-violet-500/20' },
};

export default function CopilotChat({ projectId }) {
  const [turns, setTurns] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { setTurns([]); }, [projectId]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [turns, busy]);

  // Prior turns, oldest first, in the shape the API expects. Only the text the
  // user actually saw is replayed -- never the fact payload, which would balloon
  // the request and re-send figures the server already holds.
  const historyFor = (transcript) =>
    transcript
      .filter((t) => t.role === 'user' || t.role === 'copilot')
      .map((t) => ({
        role: t.role === 'user' ? 'user' : 'assistant',
        content: t.role === 'user'
          ? t.text
          : (t.payload?.answer_llm || t.payload?.answer || ''),
      }))
      .filter((m) => m.content)
      .slice(-8);

  const send = async (question) => {
    const q = (question ?? draft).trim();
    if (!q || busy) return;
    setDraft('');
    setBusy(true);

    // Snapshot BEFORE appending this turn, so the history sent is the
    // conversation that preceded the question rather than including it.
    const history = historyFor(turns);
    setTurns((t) => [...t, { role: 'user', text: q }]);

    const res = await apiFetch('/api/amey/ask', {
      method: 'POST',
      body: JSON.stringify({
        question: q,
        project_id: String(projectId),
        history,
      }),
    });

    setTurns((t) => [...t, res.ok
      ? { role: 'copilot', payload: res.data }
      : { role: 'error', text: res.error }]);
    setBusy(false);
  };

  return (
    <div className="space-y-3.5 font-sans">
      {/* Copilot Header Strip */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-400 font-mono">
            PMO Decision Copilot
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/10">
          Fact Grounded #{projectId}
        </span>
      </div>

      {/* Suggestion Prompt Chips */}
      {turns.length === 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
            Suggested Queries:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => send(s.q)}
                disabled={busy}
                className="text-[10.5px] font-medium px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:border-amber-400/40 hover:text-amber-300 transition-all text-left disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transcript Conversation Flow */}
      {turns.length > 0 && (
        <div data-lenis-prevent className="space-y-3 max-h-72 overflow-y-auto pr-1 text-slate-200 scrollbar-thin scrollbar-thumb-slate-700">
          <AnimatePresence initial={false}>
            {turns.map((t, i) => {
              if (t.role === 'user') {
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex justify-end"
                  >
                    <div className="text-[12px] text-slate-100 bg-amber-500/20 border border-amber-500/30 rounded-xl rounded-tr-xs px-3.5 py-2 max-w-[85%] shadow-xs">
                      {t.text}
                    </div>
                  </motion.div>
                );
              }
              if (t.role === 'error') {
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[11.5px] text-rose-200 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2"
                  >
                    {t.text}
                  </motion.div>
                );
              }

              const d = t.payload || {};
              const meta = MODE_META[d.llm?.mode] || MODE_META.deterministic;
              const { Icon } = meta;
              const prose = d.answer_llm || d.answer;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.24 }}
                  className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5 space-y-2.5 shadow-sm"
                >
                  {/* The model is asked for LABELLED lines (DIRECT ANSWER, EVIDENCE,
                      STATUTORY BASIS...). Render those labels as headings so an
                      executive can scan rather than read. */}
                  <div
                    dir={d.llm?.language?.rtl ? 'rtl' : 'ltr'}
                    lang={d.llm?.language?.code || 'en'}
                    className={`text-[12.5px] text-slate-100 font-sans space-y-1.5 ${
                      d.llm?.language?.code && d.llm.language.code !== 'en'
                        ? 'leading-[1.85]' : 'leading-relaxed'
                    }`}
                  >
                    {String(prose || '').split('\n').filter((ln) => ln.trim()).map((line, li) => {
                      const m = line.match(/^\s*\*{0,2}([A-Z][A-Z /&]{3,30})\*{0,2}\s*[—:-]\s*(.*)$/);
                      return m ? (
                        <p key={li}>
                          <span className="text-[9.5px] font-mono font-bold tracking-wider text-amber-300/90 uppercase mr-1.5">
                            {m[1].trim()}
                          </span>
                          {m[2]}
                        </p>
                      ) : <p key={li}>{line.replace(/^\s*[-*]\s+/, '· ')}</p>;
                    })}
                  </div>

                  {/* An un-provenanced answer says so in the body, not only in a
                      chip. A judge reading a statutory citation must not have to
                      infer from a badge colour that nothing vouches for it. */}
                  {d.llm?.provenanced === false && prose && (
                    <p className="text-[10.5px] text-sky-300/80 bg-sky-500/[0.07] border border-sky-500/20 rounded-lg px-2.5 py-1.5 leading-snug">
                      General domain guidance — not drawn from the MoSPI corpus and
                      not Merkle-signed. Verify any statutory citation before acting.
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/10">
                    <span className={`inline-flex items-center gap-1 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded ${meta.badgeCls}`} title={meta.help}>
                      <Icon className="w-3 h-3" />
                      {meta.label}
                    </span>

                    {d.llm?.language && d.llm.language.code !== 'en' && (
                      <span
                        title={`Detected: ${d.llm.language.name} — ${d.llm.language.basis || ''}`}
                        className="text-[9.5px] font-mono px-1.5 py-0.5 rounded border border-white/10 bg-black/20 text-slate-300"
                      >
                        {d.llm.language.native || d.llm.language.name}
                      </span>
                    )}

                    {QUERY_MODE_META[d.routing?.mode] && (
                      <span
                        title={`Routed as ${d.routing.mode}`}
                        className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border bg-black/20 ${QUERY_MODE_META[d.routing.mode].cls}`}
                      >
                        {QUERY_MODE_META[d.routing.mode].label}
                      </span>
                    )}

                    {d.llm?.model && (
                      <span className="text-[9.5px] font-mono text-slate-400 bg-black/20 px-1.5 py-0.5 rounded border border-white/5">{d.llm.model}</span>
                    )}

                    {/* Merkle fact badges */}
                    {(d.cited_fact_ids || []).slice(0, 4).map((fid) => (
                      <span
                        key={fid}
                        title={`Fact ${fid} carries a SHA-256 Merkle inclusion proof`}
                        className="inline-flex items-center gap-1 text-[9.5px] font-mono text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded cursor-help"
                      >
                        <Fingerprint className="w-2.5 h-2.5" />
                        {String(fid).replace(/^fact_/, '').slice(0, 18)}
                      </span>
                    ))}
                  </div>

                  {d.llm?.mode === 'deterministic_guard_tripped' && (
                    <p className="text-[10px] text-rose-300/90 leading-snug font-sans">
                      Blocked unverified figures: <span className="font-mono text-rose-200">{(d.llm.unverified_figures || []).join(', ')}</span>. Fact fallback rendered.
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          {busy && (
            <div className="flex items-center gap-2 text-[11.5px] text-amber-300 px-3 py-2 bg-amber-400/5 rounded-lg border border-amber-400/10">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Retrieving cryptographic facts &amp; evaluating proofs…
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      {/* Input Composer */}
      <div className="flex items-center gap-2 pt-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder={`Ask anything about project #${projectId}…`}
          className="flex-1 min-w-0 text-[12px] bg-black/40 text-white border border-white/15 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 placeholder:text-slate-400 font-sans"
        />
        <button
          onClick={() => send()}
          disabled={busy || !draft.trim()}
          className="shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed py-2 px-3.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </div>
    </div>
  );
}
