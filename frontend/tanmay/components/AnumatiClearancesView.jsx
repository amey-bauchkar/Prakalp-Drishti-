import React, { useState, useEffect } from 'react';
import { Card, Metric, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@tremor/react';
import { ShieldAlert, AlertTriangle, FileText, CheckCircle2, Trees, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AnumatiClearancesView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchClearances();
  }, []);

  const fetchClearances = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tanmay/anumati/clearances?limit=200');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const projects = data?.projects || [];
  const stalledCount = data?.stalled_count || 0;
  const escalateCount = data?.escalate_count || 0;
  const totalForestHa = data?.total_forest_ha || 0;

  const filtered = projects.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        p.project_id?.toLowerCase().includes(q) ||
        p.project_name?.toLowerCase().includes(q) ||
        p.state?.toLowerCase().includes(q) ||
        p.sector?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter === 'STALLED' && p.overall_clearance_status !== 'STALLED') return false;
    if (statusFilter === 'ESCALATE' && !p.pmo_escalation_flag) return false;
    return true;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const clampedPage = Math.min(currentPage, totalPages);
  const startIndex = (clampedPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filtered.length);
  const paginated = filtered.slice(startIndex, endIndex);

  return (
    <div className="space-y-5 font-sans">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <Card className="p-5 rounded-2xl border-t-4 border-t-slate-500 shadow-md bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">Clearances Pipeline</span>
          <Metric className="text-slate-900 font-heading font-black text-2xl mt-1">
            {projects.length} Projects
          </Metric>
          <span className="text-xs text-slate-500 block mt-1">PARIVESH Stage-I & Stage-II</span>
        </Card>

        <Card className="p-5 rounded-2xl border-t-4 border-t-rose-500 shadow-md bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 font-mono">Stalled Applications</span>
          <Metric className="text-rose-700 font-heading font-black text-2xl mt-1">
            {stalledCount}
          </Metric>
          <span className="text-xs text-slate-500 block mt-1">Overdue statutory benchmark SLAs</span>
        </Card>

        <Card className="p-5 rounded-2xl border-t-4 border-t-amber-500 shadow-md bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 font-mono">PMO Escalation Flags</span>
          <Metric className="text-amber-700 font-heading font-black text-2xl mt-1">
            {escalateCount}
          </Metric>
          <span className="text-xs text-slate-500 block mt-1">Excess query loopbacks / ADS raised</span>
        </Card>

        <Card className="p-5 rounded-2xl border-t-4 border-t-emerald-500 shadow-md bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 font-mono">Forest Diversion Area</span>
          <Metric className="text-emerald-700 font-heading font-black text-2xl mt-1">
            {totalForestHa.toLocaleString('en-IN')} ha
          </Metric>
          <span className="text-xs text-slate-500 block mt-1">MoEFCC Regional Office tracking</span>
        </Card>
      </div>

      {/* Directory Card */}
      <Card className="p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-md bg-white space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Trees className="w-4 h-4" />
              </span>
              <h3 className="font-heading font-extrabold text-lg text-slate-900 tracking-tight">
                PARIVESH INTER-MINISTERIAL CLEARANCE REGISTER
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Automated tracking of Forest (FCA 1980), Environment (EIA 2006), Wildlife, and Land Handover (RFCTLARR 2013).
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filter by project, state, sector…"
                className="pl-8 pr-3 py-1.5 bg-slate-50 text-xs rounded-lg border border-slate-200 text-slate-900 w-48 sm:w-60 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 text-xs rounded-lg border border-slate-200 text-slate-700 focus:outline-none font-medium"
            >
              <option value="ALL">All Status</option>
              <option value="STALLED">Stalled Only</option>
              <option value="ESCALATE">PMO Escalated Only</option>
            </select>
          </div>
        </div>

        {/* Clearances Table */}
        <div className="overflow-x-auto">
          <Table className="w-full text-left text-xs">
            <TableHead>
              <TableRow className="border-b border-slate-200 text-slate-500 uppercase font-mono text-[10.5px]">
                <TableHeaderCell className="py-3 px-3">Project & Location</TableHeaderCell>
                <TableHeaderCell className="py-3 px-3">Status</TableHeaderCell>
                <TableHeaderCell className="py-3 px-3 text-center">Stagnation Index (RSI)</TableHeaderCell>
                <TableHeaderCell className="py-3 px-3">Bottleneck Authority</TableHeaderCell>
                <TableHeaderCell className="py-3 px-3 text-right">Forest Area (ha)</TableHeaderCell>
                <TableHeaderCell className="py-3 px-3 text-center">PMO Escalation</TableHeaderCell>
              </TableRow>
            </TableHead>

            <TableBody className="divide-y divide-slate-100 font-sans">
              {paginated.map((p, idx) => {
                const isStalled = p.overall_clearance_status === 'STALLED';
                const rsi = p.regulatory_stagnation_index || 0;

                return (
                  <TableRow key={p.project_id || idx} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="py-3.5 px-3">
                      <div className="space-y-0.5 max-w-[260px]">
                        <span className="font-mono text-[10px] text-slate-400 block font-bold">#{p.project_id}</span>
                        <span className="font-semibold text-slate-900 block line-clamp-1">{p.project_name}</span>
                        <span className="text-[11px] text-slate-500 block">{p.sector} • {p.state}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[10.5px] font-bold border ${
                        isStalled
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}>
                        {p.overall_clearance_status || 'IN_PROGRESS'}
                      </span>
                    </TableCell>

                    <TableCell className="py-3.5 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`font-mono text-xs font-bold ${
                          rsi >= 0.85 ? 'text-rose-600' :
                          rsi >= 0.65 ? 'text-amber-600' :
                          'text-emerald-600'
                        }`}>
                          {(rsi * 100).toFixed(0)}%
                        </span>
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, rsi * 100)}%` }}
                            className={`h-full ${
                              rsi >= 0.85 ? 'bg-rose-600' :
                              rsi >= 0.65 ? 'bg-amber-500' :
                              'bg-emerald-500'
                            }`}
                          />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 px-3 text-slate-700">
                      <span className="block text-[11px] max-w-[200px] truncate font-medium" title={p.bottleneck_department}>
                        {p.bottleneck_department || 'Standard SLA Timeline'}
                      </span>
                    </TableCell>

                    <TableCell className="py-3.5 px-3 text-right font-mono text-slate-800 font-medium">
                      {p.total_forest_diversion_ha ? `${p.total_forest_diversion_ha} ha` : '—'}
                    </TableCell>

                    <TableCell className="py-3.5 px-3 text-center">
                      {p.pmo_escalation_flag ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-rose-50 border border-rose-300 text-rose-700 text-[10px] font-mono font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          ESCALATE
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">Normal</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs font-mono">
          <span className="text-slate-500">
            Showing <strong>{filtered.length > 0 ? startIndex + 1 : 0}–{endIndex}</strong> of <strong>{filtered.length}</strong> clearance records
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-sans flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
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
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-sans flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
