import React, { useState, useEffect } from 'react';
import { Card, Metric, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@tremor/react';
import { ShieldAlert, AlertTriangle, FileText, CheckCircle2, Trees, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Landmark, ChevronDown, ChevronUp, Clock, RotateCcw, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import ClearanceStagesInfoGuide from '../../src/components/ClearanceStagesInfoGuide';

export default function AnumatiClearancesView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedProjectId, setExpandedProjectId] = useState(null);

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

      {/* Institutional Clearance Stages Guide */}
      <ClearanceStagesInfoGuide />

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
                <TableHeaderCell className="py-3 px-3 text-center">Stage Checklist</TableHeaderCell>
              </TableRow>
            </TableHead>

            <TableBody className="divide-y divide-slate-100 font-sans">
              {paginated.map((p, idx) => {
                const isStalled = p.overall_clearance_status === 'STALLED';
                const rsi = p.regulatory_stagnation_index || 0;

                return (
                  <React.Fragment key={p.project_id || idx}>
                    <TableRow className="hover:bg-slate-50 transition-colors">
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

                    <TableCell className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setExpandedProjectId(expandedProjectId === p.project_id ? null : p.project_id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-[10.5px] font-bold inline-flex items-center gap-1 transition-colors border border-slate-200"
                        title="View detailed statutory clearance checklist"
                      >
                        <span>{p.stage_breakdown?.length || 0} Stages</span>
                        {expandedProjectId === p.project_id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </TableCell>
                  </TableRow>

                  {expandedProjectId === p.project_id && (
                    <TableRow className="bg-slate-50/80">
                      <TableCell colSpan={7} className="p-4 border-b border-slate-200">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                              STATUTORY STAGE CHECKLIST — #{p.project_id}
                            </span>
                            <span className="text-slate-500 font-normal">
                              PARIVESH SLA Benchmark vs Actual Elapsed Time
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {(p.stage_breakdown || []).map((st, sIdx) => {
                              const isStag = st.is_stagnated;
                              const ratio = Number(st.stagnation_ratio || (st.days_pending / Math.max(st.benchmark_days, 1))).toFixed(1);
                              const percent = Math.min(100, Math.round((st.days_pending / Math.max(st.benchmark_days, 1)) * 100));

                              return (
                                <div
                                  key={st.stage_code || sIdx}
                                  className={`p-3 rounded-xl border text-xs transition-all ${
                                    isStag ? 'bg-rose-50/80 border-rose-200 text-rose-950' : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <span className="font-bold text-[11px] block leading-tight text-slate-900">{st.stage_name}</span>
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold shrink-0 ${
                                      isStag ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      RSI {ratio}×
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 truncate mt-0.5" title={st.department}>{st.department}</p>
                                  
                                  <div className="flex items-center justify-between font-mono text-[10px] text-slate-700 mt-2">
                                    <span>{st.days_pending}d / {st.benchmark_days}d SLA</span>
                                    <span className={isStag ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                                      {isStag ? 'Stagnated' : 'On Track'}
                                    </span>
                                  </div>

                                  <div className="mt-1.5 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${isStag ? 'bg-rose-500' : percent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>

                                  {st.paperwork_loopback_detected && (
                                    <div className="mt-2 text-[9.5px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
                                      <RotateCcw className="w-2.5 h-2.5 shrink-0" />
                                      <span>Loopback: Central-State Query Bounce</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  </React.Fragment>
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
