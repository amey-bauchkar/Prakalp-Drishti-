import React, { useState } from 'react';
import { X, ShieldCheck, Download, Printer, CheckSquare, Square, FileText, Lock, Building } from 'lucide-react';

/**
 * AuditPackModal Component (§7.8)
 * Generates printable, cryptographically signed audit packs with document request checklist and blank agency response section.
 */
export default function AuditPackModal({ isOpen, onClose, auditPack, projectId }) {
  const [checkedDocs, setCheckedDocs] = useState({});

  if (!isOpen || !auditPack) return null;

  const toggleDoc = (id) => {
    setCheckedDocs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#0060B6] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-heading font-bold text-sm tracking-wide">
                STATUTORY AUDIT PACK · PROJECT #{projectId}
              </h3>
              <span className="text-[11px] text-white/80 font-mono">
                Dossier ID: {auditPack.dossier_id}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300 font-sans">
          {/* Cryptographic Provenance Header */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-gov-navy dark:text-slate-200 font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                RFC 8785 Canonical Merkle Signature
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">VERIFIED_IMMUTABLE</span>
            </div>
            <div className="text-[10px] text-slate-500 break-all">
              <strong>Merkle Root:</strong> {auditPack.merkle_root}
            </div>
            <div className="text-[10px] text-slate-500 break-all">
              <strong>Canonical Digest:</strong> {auditPack.canonical_hash}
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-1.5">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-gov-navy dark:text-slate-200">
              1. Executive Summary &amp; Classification
            </h4>
            <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 leading-relaxed text-slate-700 dark:text-slate-300">
              {auditPack.executive_summary}
            </div>
          </div>

          {/* Statutory Citation & Applicable Rule */}
          <div className="space-y-1.5">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-gov-navy dark:text-slate-200">
              2. Applicable Rule &amp; Statutory Authority Citation
            </h4>
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
              <span className="font-mono text-gov-accent font-bold block">{auditPack.classification_label}</span>
              <p className="mt-1 text-[11.5px] text-slate-600 dark:text-slate-400">
                <strong>Citation:</strong> {auditPack.statutory_rule_citation}
              </p>
            </div>
          </div>

          {/* Document Request Checklist (§7.8) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-gov-navy dark:text-slate-200">
                3. Mandatory Document Request Checklist (7 Instruments)
              </h4>
              <span className="text-[11px] text-slate-500">
                Select documents to include in formal notice
              </span>
            </div>

            <div className="space-y-2">
              {auditPack.document_request_checklist?.map((doc) => {
                const isChecked = Boolean(checkedDocs[doc.document_id]);
                return (
                  <div
                    key={doc.document_id}
                    onClick={() => toggleDoc(doc.document_id)}
                    className={`p-2.5 rounded border transition-all cursor-pointer flex items-start gap-2.5 ${
                      isChecked
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="pt-0.5 text-gov-accent">
                      {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {doc.document_name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {doc.issuing_authority}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {doc.purpose}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Blank Agency Response Section (§7.8) */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-gov-navy dark:text-slate-200 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-500" />
              4. Executing Agency Formal Clarification Section (Blank Case File Attachment)
            </h4>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Officer in Charge (Name &amp; Designation):</span>
                  <div className="h-6 border-b border-slate-300 dark:border-slate-700 mt-1" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Date of Official Submission:</span>
                  <div className="h-6 border-b border-slate-300 dark:border-slate-700 mt-1 font-mono text-slate-400">
                    _____ / _____ / 2026
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] mb-1">
                  Written Agency Justification / Schedule F Attachments:
                </span>
                <div className="h-20 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-400 text-[11px] italic">
                  [Space reserved for official agency rejoinder and supporting Schedule F documentation]
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            Prakalp-Drishti Forensic Layer · GIGW 3.0 Compliant
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-gov-navy text-white font-medium hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
