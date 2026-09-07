import React from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * Severity-based visual configurations.
 * - CRITICAL: 5% opacity red background (bg-red-50) and red-500 left accent border
 * - HIGH: 5% opacity amber background (bg-amber-50) and amber-500 left accent border
 * - MEDIUM: 5% opacity yellow background (bg-yellow-50/50) and yellow-500 left accent border
 * - LOW: 5% opacity blue background (bg-blue-50/40) and blue-500 left accent border
 */
const SEVERITY_CONFIG = {
  CRITICAL: {
    badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/60',
    itemBorder: 'border-red-200 dark:border-red-900/50',
    contentBg: 'bg-red-50 dark:bg-red-950/20',
    headerBorder: 'border-red-100 dark:border-red-900/40',
    extractBorder: 'border-l-red-500 dark:border-l-red-400',
  },
  HIGH: {
    badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60',
    itemBorder: 'border-amber-200 dark:border-amber-900/50',
    contentBg: 'bg-amber-50 dark:bg-amber-950/20',
    headerBorder: 'border-amber-100 dark:border-amber-900/40',
    extractBorder: 'border-l-amber-500 dark:border-l-amber-400',
  },
  MEDIUM: {
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-900/60',
    itemBorder: 'border-yellow-200 dark:border-yellow-900/50',
    contentBg: 'bg-yellow-50/50 dark:bg-yellow-950/15',
    headerBorder: 'border-yellow-100 dark:border-yellow-900/40',
    extractBorder: 'border-l-yellow-500 dark:border-l-yellow-400',
  },
  LOW: {
    badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/60',
    itemBorder: 'border-blue-200 dark:border-blue-900/50',
    contentBg: 'bg-blue-50/40 dark:bg-blue-950/15',
    headerBorder: 'border-blue-100 dark:border-blue-900/40',
    extractBorder: 'border-l-blue-500 dark:border-l-blue-400',
  },
};

/**
 * Derives a concise, one-sentence actionable fix for any clause.
 */
function getClauseFix(clause) {
  if (clause.suggested_amendment) return clause.suggested_amendment;
  if (clause.recommended_amendment) return clause.recommended_amendment;
  if (clause.prevention_recommendation) return clause.prevention_recommendation;
  if (clause.fix) return clause.fix;

  const text = `${clause.clause_title || ''} ${clause.category || ''} ${clause.snippet || ''}`.toLowerCase();
  if (text.includes('escalation') || text.includes('10cc') || text.includes('price')) {
    return 'Incorporate standard CPWD Clause 10CC formula-based price indexation linked to published RBI/WPI indices without arbitrary percentage caps.';
  }
  if (text.includes('land') || text.includes('possession') || text.includes('encumbrance')) {
    return 'Require at least 80% contiguous, unencumbered Right of Way (RoW) handover prior to declaring the appointed date and commencing milestones.';
  }
  if (text.includes('penalty') || text.includes('liquidated') || text.includes('damages')) {
    return 'Institute a Joint Dispute Avoidance Board review with mandatory 30-day show-cause period before any unilateral penalty deductions.';
  }
  if (text.includes('variation') || text.includes('scope')) {
    return 'Cap provisional variations at 10% of total contract value and require bilateral rate finalization within 30 days of issuance.';
  }
  if (text.includes('force majeure') || text.includes('statutory') || text.includes('clearance')) {
    return 'Explicitly categorize statutory clearance delays and administrative stay orders as compensable excusable events under GCC Clause 5.';
  }
  return 'Amend clause terms to conform to standard CPWD GCC and FIDIC dispute-avoidance guidelines before final execution.';
}

/**
 * FlaggedContractClauses Component for the NIVARAN Module
 *
 * Requirements:
 * - Every flagged contract clause is fully open and displayed by default.
 * - No down arrows or collapse triggers.
 * - Clean header row with only Severity Badge and Plain-English Title.
 * - Three distinct sections:
 *   1. The Extract (blockquote with light grey bg, italic text, thick left accent border)
 *   2. The Risk (paragraph starting with bolded "**The Risk:**")
 *   3. The Fix (one-sentence paragraph starting with bolded "**The Fix:**")
 * - Severity-based background tinting (CRITICAL: bg-red-50, HIGH: bg-amber-50).
 */
export default function FlaggedContractClauses({
  clauses = [],
  className = '',
}) {
  if (!clauses || clauses.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50/70 dark:bg-slate-900/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
        <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-500 mx-auto mb-2" />
        <p className="font-semibold text-slate-800 dark:text-slate-200">No High-Risk Clauses Flagged</p>
        <p className="text-xs text-slate-500 mt-1">
          Current contract language complies with standard institutional dispute-prevention norms.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3.5 ${className}`}>
      {clauses.map((clause, idx) => {
        const severity = (clause.severity || 'HIGH').toUpperCase();
        const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.HIGH;

        const title = clause.clause_title || clause.title || 'Standard Contract Provision';
        const extractText =
          clause.snippet ||
          clause.detected_text ||
          clause.wording ||
          clause.text ||
          'Contract clause excerpt not available.';
        const riskText =
          clause.risk_reason ||
          clause.legal_risk_reason ||
          clause.reason ||
          clause.dispute_trigger_condition ||
          'Ambiguity in this clause exposes the project to delayed payments, cost disputes, or contractor arbitration.';
        const fixText = getClauseFix(clause);

        return (
          <div
            key={clause.id || clause.clause_id || idx}
            className={`rounded-lg border ${config.itemBorder} overflow-hidden bg-white dark:bg-slate-900 shadow-xs`}
          >
            {/* 1. Clean Header Row: Severity Badge & Plain-English Title (No Down Arrow) */}
            <div className={`px-4 py-3 sm:px-5 sm:py-3.5 flex items-center gap-3 bg-white dark:bg-slate-900 border-b ${config.headerBorder}`}>
              {/* Severity Badge */}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold tracking-wider uppercase border shrink-0 ${config.badge}`}
              >
                {severity}
              </span>

              {/* Plain-English Title (Zero backend enum identifiers) */}
              <h4
                className="font-semibold text-sm sm:text-[14.5px] text-slate-900 dark:text-slate-100 truncate"
                title={title}
              >
                {title}
              </h4>
            </div>

            {/* 2. Structured Three Distinct Sections with Severity Background Tint */}
            <div
              className={`px-4 pb-4 pt-3.5 sm:px-5 sm:pb-5 sm:pt-4 space-y-3.5 ${config.contentBg} transition-colors`}
            >
              {/* Section 1: The Extract */}
              <blockquote
                className={`p-3.5 sm:p-4 rounded-r-md bg-gray-50 dark:bg-slate-900/70 border-l-4 ${config.extractBorder} text-xs sm:text-[13.5px] italic text-slate-700 dark:text-slate-300 leading-relaxed shadow-xs`}
              >
                &ldquo;{extractText}&rdquo;
              </blockquote>

              {/* Section 2: The Risk */}
              <p className="text-xs sm:text-[13.5px] text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="font-semibold text-slate-900 dark:text-white">The Risk: </strong>
                {riskText}
              </p>

              {/* Section 3: The Fix */}
              <p className="text-xs sm:text-[13.5px] text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="font-semibold text-slate-900 dark:text-white">The Fix: </strong>
                {fixText}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
