import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ShieldCheck, ShieldAlert, Cpu, Loader2, Database, Fingerprint, Sparkles, MessageSquare, BookOpen } from 'lucide-react';
import { apiFetch } from './authClient';
import { getStoredLanguage, t } from '../src/lib/i18n';

/**
 * PMO Copilot — conversational surface over the Fact layer.
 *
 * Every figure carries a SHA-256 Merkle inclusion proof.
 * Grounded strictly on verified project facts.
 */

const getSuggestions = (isHi) => [
  { 
    label: isHi ? 'समयसीमा पूर्वानुमान एवं विलंब के कारण' : 'Timeline forecast & delay causes', 
    q: isHi ? 'परियोजना की समयसीमा का क्या पूर्वानुमान है और विलंब के मुख्य कारण क्या हैं?' : 'What is the timeline forecast and what is driving the delay?' 
  },
  { 
    label: isHi ? 'सीसीईए २०% सीमा सत्यापन' : 'CCEA 20% threshold check', 
    q: isHi ? 'क्या लागत वृद्धि सांविधिक सीसीईए सीमा के भीतर है?' : 'Is the cost overrun within the statutory CCEA limit?' 
  },
  { 
    label: isHi ? 'मानसून कार्य-अवधि संकुचन' : 'Monsoon work-window contraction', 
    q: isHi ? 'इस परियोजना पर मानसून का क्या प्रभाव है?' : 'What is the monsoon impact on this project?' 
  },
  { 
    label: isHi ? 'उपग्रह परिवर्तन-पहचान निष्कर्ष' : 'Satellite change-detection verdict', 
    q: isHi ? 'उपग्रह जमीनी-हकीकत सत्यापन निष्कर्ष प्रस्तुत करें।' : 'Give me the satellite ground-truth verdict.' 
  },
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
  const [lang, setLang] = useState(() => getStoredLanguage());

  useEffect(() => {
    const onLang = (e) => setLang(e.detail || getStoredLanguage());
    window.addEventListener('prakalp:languageChanged', onLang);
    return () => window.removeEventListener('prakalp:languageChanged', onLang);
  }, []);
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const isHi = lang === 'hi';
  const suggestions = getSuggestions(isHi);

  useEffect(() => { setTurns([]); }, [projectId]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [turns, busy]);

  // Prior turns, oldest first, in the shape the API expects. Only the text the
  // user actually saw is replayed -- never the fact payload, which would balloon
  // the context window on long sessions.
  const historyForApi = turns
    .filter((t) => t.role === 'user' || t.role === 'assistant')
    .map((t) => ({
      role: t.role,
      content: t.role === 'assistant' ? (t.payload?.answer_llm || t.payload?.answer || t.text) : t.text,
    }));

  const send = async (explicitText) => {
    const q = (explicitText || draft).trim();
    if (!q || busy) return;

    setTurns((prev) => [...prev, { role: 'user', text: q }]);
    setDraft('');
    setBusy(true);

    try {
      const res = await apiFetch(`/api/amey/copilot/${projectId}/ask`, {
        method: 'POST',
        body: JSON.stringify({
          question: q,
          prior_turns: historyForApi,
        }),
      });

      if (!res.ok) {
        setTurns((prev) => [
          ...prev,
          {
            role: 'error',
            text: res.error || (isHi ? 'प्रश्नोत्तरी सेवा उपलब्ध नहीं है।' : 'The query service was not available.'),
          },
        ]);
        return;
      }

      setTurns((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.data?.answer_llm || res.data?.answer || (isHi ? 'कोई विवरण नहीं लौटा।' : 'No narrative returned.'),
          payload: res.data,
        },
      ]);
    } catch (e) {
      setTurns((prev) => [
        ...prev,
        {
          role: 'error',
          text: isHi ? 'नेटवर्क अनुरोध असफल रहा। कृपया सर्वर कनेक्टिविटी की जांच करें।' : 'Network request failed. Check server connectivity.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col space-y-3 font-sans">
      {/* Mini Title HUD */}
      <div className="flex items-center justify-between pb-1 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">
            {isHi ? 'पीएमओ सह-पायलट' : 'PMO Copilot'}
          </span>
        </div>
        <span className="text-[9.5px] font-mono text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded font-bold">
          {isHi ? `तथ्य आधारित #${projectId}` : `Fact Grounded #${projectId}`}
        </span>
      </div>

      {/* Suggestion Prompt Chips */}
      {turns.length === 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
            {isHi ? 'सुझाए गए प्रश्न:' : 'Suggested Queries:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
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
        <div
          data-lenis-prevent
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          aria-label={t('copilot_transcript', lang)}
          className="relative space-y-3 max-h-72 overflow-y-auto pr-1 text-slate-200 scrollbar-thin scrollbar-thumb-slate-700"
        >
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
              {isHi ? "क्रिप्टोग्राफिक तथ्य प्राप्त किए जा रहे हैं एवं प्रमाणों का मूल्यांकन जारी है…" : "Retrieving cryptographic facts & evaluating proofs…"}
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      {/* Input Composer */}
      <div className="flex items-center gap-2 pt-1">
        <input
          id={`copilot-ask-${projectId}`}
          aria-label={`${t('copilot_input_label', lang)} (#${projectId})`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder={`${t('copilot_input_label', lang)} — #${projectId}`}
          className="flex-1 min-w-0 text-[12px] bg-black/40 text-white border border-white/15 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 placeholder:text-slate-400 font-sans"
        />
        <button
          onClick={() => send()}
          disabled={busy || !draft.trim()}
          className="shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed py-2 px-3.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{t('copilot_ask', lang)}</span>
        </button>
      </div>
    </div>
  );
}
