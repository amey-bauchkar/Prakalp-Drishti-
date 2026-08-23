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
      <div 
        className="p-6 rounded-2xl text-white shadow-elevated border border-gov-border"
        style={{ backgroundColor: '#1E2A45', color: '#FFFFFF' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-gov-accent text-gov-navy text-[11px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
                Module 2 · Project Dependencies
              </span>
              <span className="bg-white/10 text-white/90 text-[11px] font-bold px-2 py-0.5 rounded border border-white/20">
                Connected Projects & Delay Ripple Effect
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-gov-accent" />
              <span>SETU-GRAPH: Connected Projects & Delay Ripple Effect</span>
            </h1>
            <p className="text-gray-300 text-xs mt-1 max-w-2xl font-normal">
              Shows how projects depend on one another. If one project has buffer time (slack), minor delays are absorbed safely; only severe delays spread to connected projects.
            </p>
          </div>

          {/* K-Hop Selector */}
          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20">
            <span className="text-xs text-white/70 font-bold px-2">Connection Level:</span>
            {[1, 2, 3].map((k) => (
              <button
                key={k}
                onClick={() => setKHops(k)}
                className={`px-3 py-1 text-xs font-black rounded-lg transition-colors ${
                  kHops === k
                    ? 'bg-gov-accent text-gov-navy shadow-soft'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {k === 1 ? 'Direct Links' : `${k}-Step Chain`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-gov-muted font-bold text-sm bg-white rounded-xl border border-gov-border">
          <Activity className="w-8 h-8 text-gov-accent animate-spin mx-auto mb-2" />
          Analyzing Project Connections & Delay Buffers...
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gov-border shadow-card">
              <span className="text-[10px] font-bold text-gov-muted uppercase">Connected Projects</span>
              <p className="text-xl font-black text-gov-navy mt-1">{data.nodes.length} Projects</p>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> Clean Dependency Flow
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gov-border shadow-card">
              <span className="text-[10px] font-bold text-gov-muted uppercase">Supply Chain Links</span>
              <p className="text-xl font-black text-gov-navy mt-1">{data.edges.length} Connections</p>
              <span className="text-[10px] text-gov-muted">Physical & Strategic</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gov-border shadow-card">
              <span className="text-[10px] font-bold text-gov-muted uppercase">Money at Risk (Most Likely)</span>
              <p className="text-xl font-black text-amber-700 mt-1">₹{data.total_cascade_locked_p50_cr.toLocaleString()} Cr</p>
              <span className="text-[10px] text-amber-800 font-bold">Likely Stuck Due to Delays</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/50 shadow-card">
              <span className="text-[10px] font-black text-rose-700 uppercase">Worst-Case Money at Risk</span>
              <p className="text-xl font-black text-rose-900 mt-1">₹{data.total_cascade_locked_p95_cr.toLocaleString()} Cr</p>
              <span className="text-[10px] text-rose-700 font-bold">In Severe Delay Scenarios</span>
            </div>
          </div>

          {/* Subgraph Nodes & Float Table */}
          <div className="bg-white rounded-xl border border-gov-border shadow-card overflow-hidden">
            <div className="p-4 bg-gov-surface border-b border-gov-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-gov-navy" />
                <h3 className="text-xs font-black text-gov-navy uppercase tracking-wider">
                  Connected Projects & Delay Buffer Breakdown
                </h3>
              </div>
              <span className="text-[11px] text-gov-muted">
                Showing <strong>{data.nodes.length}</strong> related projects in supply chain
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gov-surface text-gov-muted font-bold border-b border-gov-border">
                  <tr>
                    <th className="p-3">Project Name</th>
                    <th className="p-3">Sector & Agency</th>
                    <th className="p-3">Sanctioned Cost</th>
                    <th className="p-3">Delay Buffer (Slack)</th>
                    <th className="p-3">Delay Status</th>
                    <th className="p-3">Money at Risk (Likely)</th>
                    <th className="p-3">Network Impact Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gov-border">
                  {data.nodes.map((node) => (
                    <tr key={node.project_id} className="hover:bg-gov-surface/50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-gov-navy">{node.project_name}</div>
                        <span className="text-[10px] font-mono text-gov-muted">#{node.project_id} · {node.state}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-gov-navy">{node.sector}</span>
                        <div className="text-[10px] text-gov-muted font-bold">{node.canonical_entity}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-gov-navy">
                        ₹{node.cost_cr.toLocaleString()} Cr
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {node.free_float_months.toFixed(1)} mo Buffer
                        </span>
                      </td>
                      <td className="p-3">
                        {node.propagated_delay_months > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            +{node.propagated_delay_months.toFixed(1)} mo Spreading
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gov-surface text-emerald-800 border border-emerald-200">
                            Delay Absorbed (Safe)
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-700">
                        ₹{node.locked_capital_p50_cr.toLocaleString()} Cr
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-black bg-gov-navy text-gov-accent">
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
