import React, { useState } from 'react';
import {
  Search, Scale, ChevronRight, ChevronLeft, ArrowUpDown, Filter,
  Eye, ShieldAlert, ChevronDown, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { Card, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@tremor/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FlaggedProjectsTable({ flaggedProjects = [], onSelectProject }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [sortField, setSortField] = useState('suspicion_score');
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
              CCEA THRESHOLD PROXIMITY & CLAUSE 10CC AUDIT DIRECTORY
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-sans">
            Showing {sorted.length} projects identified in the 18.0% – 19.99% proximity zone. Click any project row to open the complete forensic revision dossier.
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
              placeholder="Search projects, agencies, states…"
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
                {s === 'ALL' ? 'All Sectors' : s}
              </option>
            ))}
          </select>

          {/* Rows per page */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <span>Show:</span>
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
                  <span>Project & Agency</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </TableHeaderCell>
              <TableHeaderCell
                onClick={() => handleSort('original_cost_cr')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Original Cost</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </TableHeaderCell>
              <TableHeaderCell
                onClick={() => handleSort('revised_cost_cr')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Revised Cost</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </TableHeaderCell>
              <TableHeaderCell
                onClick={() => handleSort('overrun_pct')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Overrun %</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </TableHeaderCell>
              <TableHeaderCell
                onClick={() => handleSort('distance_to_boundary_pp')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Dist. to 20%</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-3 text-right">
                Statutory 10CC Cap
              </TableHeaderCell>
              <TableHeaderCell
                onClick={() => handleSort('suspicion_score')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Suspicion Score</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-3 text-center">
                Action
              </TableHeaderCell>
            </TableRow>
          </TableHead>

          <TableBody className="divide-y divide-slate-100 font-sans">
            {paginatedProjects.map((p, idx) => {
              const isHighSuspicion = (p.suspicion_score || 0) >= 65;
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
                      <span className="text-slate-900 font-semibold line-clamp-1 block text-xs">
                        {p.project_name}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {p.agency && p.agency !== 'None' ? p.agency : p.sector} • {p.state || 'National'}
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
                      to CCEA limit
                    </span>
                  </TableCell>

                  {/* 10CC Cap */}
                  <TableCell className="py-3.5 px-3 text-right font-mono">
                    <span className="font-bold text-emerald-700 block">
                      ₹{(p.total_allowed_10cc_cost_cr || p.statutory_10cc_cap_cr)?.toLocaleString('en-IN')} Cr
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      (+{p.statutory_10cc_cap_pct}% allowed)
                    </span>
                  </TableCell>

                  {/* Suspicion Score */}
                  <TableCell className="py-3.5 px-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono inline-block border ${
                          p.suspicion_score >= 70
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : p.suspicion_score >= 40
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {p.suspicion_score ?? 'N/A'}/100
                      </span>
                      {p.suspicion_driver && (
                        <span className="text-[9.5px] text-slate-500 max-w-[120px] truncate" title={p.suspicion_driver}>
                          {p.suspicion_driver}
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
                      <span>Inspect</span>
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
          Showing <strong>{sorted.length > 0 ? startIndex + 1 : 0}–{endIndex}</strong> of <strong>{sorted.length}</strong> flagged projects
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-sans flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
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
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
