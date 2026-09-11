import React, { useState, useEffect } from 'react';
import { GitBranch, Layers, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2, DollarSign, Activity } from 'lucide-react';

export default function SetuGraphView({ selectedProjectId = "618402" }) {
  const [projectId, setProjectId] = useState(selectedProjectId);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [kHops, setKHops] = useState(2);

  const fetchDependencies = async (id, k) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/amey/dependencies/${id}?k=${k}`);
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

  useEffect(() => {
    fetchDependencies(projectId, kHops);
  }, [projectId, kHops]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl border border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <GitBranch className="w-48 h-48 text-amber-500" />
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 pl-2 pr-2.5 py-0.5 rounded-sm bg-white/10 text-[10px] font-extrabold tracking-institutional uppercase text-amber-400 border-l-2 border-amber-400 font-mono">
              <GitBranch className="w-3.5 h-3.5" />
              <span>PROJECT DEPENDENCY CONTAGION</span>
            </div>
            <h2 className="font-heading font-extrabold text-[21px] sm:text-[25px] tracking-[-0.025em] text-white leading-[1.12]">
              SETU-GRAPH: Connected Projects &amp; Delay Ripple
            </h2>
            <p className="text-[12.5px] text-ink-200 leading-relaxed max-w-2xl">
              Discover which projects depend on this one, and calculate how much capital gets stuck if delays ripple downstream.
            </p>
          </div>

          {/* K-Hop Selector */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-sm bg-black/30 border border-white/15 shrink-0 self-start lg:self-center">
            <span className="text-[10px] text-ink-200 font-bold px-2 font-mono uppercase tracking-wider">Contagion Depth:</span>
            {[1, 2, 3].map((k) => (
              <button
                key={k}
                onClick={() => setKHops(k)}
                className={`px-3 py-1 text-[11px] font-bold rounded-xs transition-all cursor-pointer ${
                  kHops === k
                    ? 'bg-gov-accent text-slate-900 font-black shadow-xs'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {k === 1 ? 'Level 1: Direct' : k === 2 ? 'Level 2: Ripple' : 'Level 3: Cascade'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="panel p-8 text-center text-gov-muted font-bold text-xs">
          <Activity className="w-6 h-6 text-gov-accent animate-spin mx-auto mb-2" />
          Analyzing Project Connections &amp; Delay Buffers...
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          {/* Top KPI Cards in Standard Hairgrid */}
          <div className="hairgrid hairgrid-4">
            <div className="metric-cell">
              <span className="metric-label">Connected Projects</span>
              <span className="metric-value">{data.nodes.length} <span className="text-xs font-normal text-gov-muted">Projects</span></span>
              <span className="metric-sub metric-pos font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Clean Dependency Flow
              </span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Supply Chain Links</span>
              <span className="metric-value">{data.edges.length} <span className="text-xs font-normal text-gov-muted">Links</span></span>
              <span className="metric-sub">Physical &amp; Strategic Nodes</span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Contagion Capital (P50)</span>
              <span className="metric-value metric-warn">₹{data.total_cascade_locked_p50_cr.toLocaleString('en-IN')} <span className="text-xs font-normal text-gov-muted">Cr</span></span>
              <span className="metric-sub">Likely Capital Exposure</span>
            </div>
            <div className="metric-cell panel-critical">
              <span className="metric-label">Tail Capital Exposure (P95)</span>
              <span className="metric-value metric-neg">₹{data.total_cascade_locked_p95_cr.toLocaleString('en-IN')} <span className="text-xs font-normal text-gov-muted">Cr</span></span>
              <span className="metric-sub">Severe Contagion Bound</span>
            </div>
          </div>

          {/* Subgraph Nodes & Float Table */}
          <div className="panel overflow-hidden p-4 sm:p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-border-default pb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-gov-saffron" />
                <h3 className="text-[17px] font-extrabold text-gov-navy uppercase tracking-wider font-heading">
                  Connected Projects &amp; Delay Buffer Breakdown
                </h3>
              </div>
              <span className="text-[12.5px] text-text-muted font-mono font-medium">
                Showing <strong>{data.nodes.length}</strong> related projects in supply chain
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Sector &amp; Agency</th>
                    <th className="num">Sanctioned Cost</th>
                    <th>Critical Path Float Buffer</th>
                    <th className="text-center">Contagion Propagation State</th>
                    <th className="num">Cascade Capital Exposure (P50)</th>
                    <th className="text-center">Network Impact Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.nodes.map((node) => (
                    <tr key={node.project_id} className="hover:bg-slate-50/80 transition-colors">
                      <td>
                        <div className="font-bold text-gov-navy">{node.project_name}</div>
                        <span className="text-[10.5px] font-mono text-text-muted">#{node.project_id} · {node.state}</span>
                      </td>
                      <td>
                        <span className="font-medium text-gov-navy">{node.sector}</span>
                        <div className="text-[10.5px] text-text-muted font-bold">{node.canonical_entity}</div>
                      </td>
                      <td className="num font-mono font-bold text-gov-navy">
                        ₹{node.cost_cr.toLocaleString('en-IN')} Cr
                      </td>
                      <td>
                        <span className="note note-ok font-mono">
                          {node.free_float_months.toFixed(1)} mo Buffer
                        </span>
                      </td>
                      <td className="text-center">
                        {node.propagated_delay_months > 0 ? (
                          <span className="note note-critical font-mono">
                            +{node.propagated_delay_months.toFixed(1)} Mo Propagated Delay
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-emerald-800 border border-emerald-300 font-mono">
                            Absorbed within Float Buffer (Zero Spillover)
                          </span>
                        )}
                      </td>
                      <td className="num font-mono font-bold text-amber-700">
                        ₹{node.locked_capital_p50_cr.toLocaleString('en-IN')} Cr
                      </td>
                      <td className="text-center">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-gov-navy text-gov-saffron-light font-mono">
                          {node.shapley_criticality_phi.toFixed(1)} / 100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
