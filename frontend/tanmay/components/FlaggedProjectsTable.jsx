import React, { useState } from 'react';
import {
  Search, Scale, ChevronRight, ChevronLeft, ArrowUpDown, Filter,
  Eye, ShieldAlert, ChevronDown, CheckCircle2, AlertTriangle, Download
} from 'lucide-react';
import { Card, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@tremor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { translateProjectName, translateSector, translateState, translateAgency } from '../../src/lib/i18n';

export default function FlaggedProjectsTable({ flaggedProjects = [], onSelectProject, lang = 'en' }) {
  const isHi = lang === 'hi';
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [sortField, setSortField] = useState('review_priority_score');
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const exportToCSV = () => {
    if (!sorted || !sorted.length) return;
    const headers = ['Project ID', 'Project Name', 'Sector', 'Agency', 'State', 'Cost Overrun %', 'Review Priority (0-100)', 'Clause 10CC Escalation (₹ Cr)', 'Status'];
    const rows = sorted.map(p => [
      `"${p.project_id || ''}"`,
      `"${(p.project_name || '').replace(/"/g, '""')}"`,
      `"${(p.sector || '').replace(/"/g, '""')}"`,
      `"${(p.agency || '').replace(/"/g, '""')}"`,
      `"${(p.state || '').replace(/"/g, '""')}"`,
      p.cost_overrun_pct != null ? Number(p.cost_overrun_pct).toFixed(2) : '',
      p.review_priority_score != null ? Number(p.review_priority_score).toFixed(0) : '',
      p.clause_10cc_risk_cr != null ? Number(p.clause_10cc_risk_cr).toFixed(2) : '',
      `"${(p.status || 'FLAGGED').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ccea_flagged_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Extract unique sectors
  const sectors = ['ALL', ...new Set(flaggedProjects.map(p => p.sector).filter(Boolean))];

  // Filtering
  const filtered = flaggedProjects.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        p.project_id?.toLowerCase().includes(q) ||
        p.project_name?.toLowerCase().includes(q) ||
        p.agency?.toLowerCase().includes(q) ||
        p.state?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (sectorFilter !== 'ALL' && p.sector !== sectorFilter) return false;
    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortField] ?? 0;
    let valB = b[sortField] ?? 0;
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  // Pagination calculation
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const clampedPage = Math.min(currentPage, totalPages);
  const startIndex = (clampedPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sorted.length);
  const paginatedProjects = sorted.slice(startIndex, endIndex);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <Card className="p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-md bg-white space-y-5 font-sans">
      {/* Table Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 tracking-tight">
              {isHi ? "सीसीईए सीमांत निकटता एवं खंड १०सीसी लेखापरीक्षा निर्देशिका" : "CCEA THRESHOLD PROXIMITY & CLAUSE 10CC AUDIT DIRECTORY"}
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-sans">
            {isHi
              ? `कुल ${sorted.length} चिन्हित परियोजनाएं प्रदर्शित (18.0% – 19.99% निकटता क्षेत्र)। पूर्ण विधिक संशोधन दस्तावेज़ खोलने हेतु किसी भी पंक्ति पर क्लिक करें।`
              : `Showing ${sorted.length} projects identified in the 18.0% – 19.99% proximity zone. Click any project row to open the complete forensic revision dossier.`}
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={isHi ? "परियोजना, एजेंसी, राज्य खोजें…" : "Search projects, agencies, states…"}
              className="pl-8 pr-3 py-1.5 bg-slate-50 text-xs rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 w-48 sm:w-60 font-medium"
            />
          </div>

          {/* Sector Select */}
          <select
            value={sectorFilter}
            onChange={(e) => {
              setSectorFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 text-xs rounded-lg border border-slate-200 text-slate-700 focus:outline-none font-medium"
          >
            {sectors.map((s, i) => (
              <option key={i} value={s}>
                {s === 'ALL' ? (isHi ? 'सभी क्षेत्र' : 'All Sectors') : s}
              </option>
            ))}
          </select>

          {/* Rows per page */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <span>{isHi ? "प्रदर्शित:" : "Show:"}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-bold focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs rounded-lg border border-slate-300 font-bold transition-colors cursor-pointer shadow-xs"
            title={isHi ? "चिन्हित परियोजनाओं को सीएसवी में निर्यात करें" : "Export filtered flagged projects to CSV"}
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{isHi ? "सीएसवी निर्यात" : "CSV Export"}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table className="w-full text-left text-xs">
          <TableHead>
            <TableRow className="border-b border-slate-200 text-slate-500 uppercase font-mono text-[10.5px]">
              <TableHeaderCell
                onClick={() => handleSort('project_id')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>{isHi ? "परियोजना एवं एजेंसी" : "Project & Agency"}</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </TableHeaderCell>
              <TableHeaderCell
                onClick={() => handleSort('original_cost_cr')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>{isHi ? "मूल लागत" : "Original Cost"}</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </TableHeaderCell>
              <TableHeaderCell
                onClick={() => handleSort('revised_cost_cr')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>{isHi ? "संशोधित लागत" : "Revised Cost"}</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </TableHeaderCell>
              <TableHeaderCell
                onClick={() => handleSort('overrun_pct')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>{isHi ? "लागत वृद्धि %" : "Overrun %"}</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </TableHeaderCell>
              <TableHeaderCell
                onClick={() => handleSort('distance_to_boundary_pp')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>{isHi ? "20% सीमा से दूरी" : "Dist. to 20%"}</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-3 text-right">
                {isHi ? "सांविधिक 10सीसी सीमा" : "Statutory 10CC Cap"}
              </TableHeaderCell>
              <TableHeaderCell
                onClick={() => handleSort('review_priority_score')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{isHi ? "समीक्षा प्राथमिकता" : "Review Priority"}</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-3 text-center">
                {isHi ? "कार्रवाई" : "Action"}
              </TableHeaderCell>
            </TableRow>
          </TableHead>

          <TableBody className="divide-y divide-slate-100 font-sans">
            {paginatedProjects.map((p, idx) => {
              const score = p.review_priority_score ?? p.priority_score ?? p.suspicion_score ?? 0;
              const isHighSuspicion = score >= 65;
              const isUltraClose = (p.distance_to_boundary_pp || 0) <= 0.5;

              return (
                <TableRow
                  key={p.project_id || idx}
                  onClick={() => onSelectProject && onSelectProject(p.project_id)}
                  className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                    isHighSuspicion ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {/* Project & Agency */}
                  <TableCell className="py-3.5 px-3 font-medium">
                    <div className="space-y-0.5 max-w-[280px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-400 font-bold">
                          #{p.project_id}
                        </span>
                        {isUltraClose && (
                          <span className="px-1.5 py-0.2 rounded-xs bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-mono font-bold">
                            &lt;0.5pp to 20%
                          </span>
                        )}
                      </div>
                      <span className="text-slate-900 font-semibold line-clamp-1 block text-xs" title={translateProjectName(p.project_name, lang)}>
                        {translateProjectName(p.project_name, lang)}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {p.agency && p.agency !== 'None' ? translateAgency(p.agency, lang) : translateSector(p.sector, lang)} • {p.state ? translateState(p.state, lang) : (isHi ? 'राष्ट्रीय' : 'National')}
                      </span>
                    </div>
                  </TableCell>

                  {/* Original Cost */}
                  <TableCell className="py-3.5 px-3 text-right font-mono text-slate-700 font-medium">
                    ₹{p.original_cost_cr?.toLocaleString('en-IN')} Cr
                  </TableCell>

                  {/* Revised Cost */}
                  <TableCell className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                    ₹{p.revised_cost_cr?.toLocaleString('en-IN')} Cr
                  </TableCell>

                  {/* Overrun % */}
                  <TableCell className="py-3.5 px-3 text-right font-mono font-bold text-amber-600">
                    +{p.overrun_pct}%
                  </TableCell>

                  {/* Distance to Boundary */}
                  <TableCell className="py-3.5 px-3 text-right font-mono text-slate-600">
                    <span className="font-bold text-slate-800">
                      {p.distance_to_boundary_pp} pp
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {isHi ? "सीसीईए सीमा तक" : "to CCEA limit"}
                    </span>
                  </TableCell>

                  {/* 10CC Cap */}
                  <TableCell className="py-3.5 px-3 text-right font-mono">
                    <span className="font-bold text-emerald-700 block">
                      ₹{(p.total_allowed_10cc_cost_cr || p.statutory_10cc_cap_cr)?.toLocaleString('en-IN')} Cr
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {isHi ? `(+${p.statutory_10cc_cap_pct}% अनुमत)` : `(+${p.statutory_10cc_cap_pct}% allowed)`}
                    </span>
                  </TableCell>

                  {/* Review priority: a triage order with declared 60/40 weights, not a finding */}
                  <TableCell className="py-3.5 px-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono inline-block border ${
                          score >= 70
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : score >= 40
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {(p.review_priority_score ?? p.priority_score ?? p.suspicion_score) ?? 'N/A'}/100
                      </span>
                      {(p.review_priority_basis || p.priority_driver || p.suspicion_driver) && (
                        <span className="text-[9.5px] text-slate-500 max-w-[120px] truncate" title={p.review_priority_basis || p.priority_driver || p.suspicion_driver}>
                          {p.review_priority_basis || p.priority_driver || p.suspicion_driver}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Action */}
                  <TableCell className="py-3.5 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject && onSelectProject(p.project_id);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-[11px] font-semibold border border-slate-300 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>{isHi ? "निरीक्षण" : "Inspect"}</span>
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs font-mono">
        <span className="text-slate-500">
          {isHi
            ? <>कुल <strong>{sorted.length}</strong> में से <strong>{sorted.length > 0 ? startIndex + 1 : 0}–{endIndex}</strong> चिन्हित परियोजनाएं प्रदर्शित</>
            : <>Showing <strong>{sorted.length > 0 ? startIndex + 1 : 0}–{endIndex}</strong> of <strong>{sorted.length}</strong> flagged projects</>}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-sans flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{isHi ? "पिछला" : "Previous"}</span>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`w-7 h-7 rounded-md font-bold transition-colors ${
                currentPage === pageNum
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-sans flex items-center gap-1"
          >
            <span>{isHi ? "अगला" : "Next"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
