import React, { useState, useEffect } from 'react';
import { GitBranch, Layers, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2, DollarSign, Activity } from 'lucide-react';

export default function SetuGraphView({ selectedProjectId = "400188" }) {
  const [projectId, setProjectId] = useState(selectedProjectId);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [kHops, setKHops] = useState(2);

  const fetchDependencies = async (id, k) => {
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/amey/dependencies/${id}?k=${k}`);
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
      <div className="bg-gradient-to-r from-gov-navy via-gov-navy-light to-gov-navy p-6 rounded-2xl text-white shadow-elevated border border-gov-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-gov-accent text-gov-navy text-[11px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
                Module 2 · Graph Theory & Contagion
              </span>
              <span className="bg-white/10 text-white/90 text-[11px] font-bold px-2 py-0.5 rounded border border-white/20">
                Tarjan SCC DAG + Max-Plus Float
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-gov-accent" />
              SETU-GRAPH: Supply-Chain Dependency & Rupee Contagion
            </h1>
            <p className="text-gov-muted-light text-xs mt-1 max-w-2xl">
              Maps multi-modal infrastructure dependencies with explicit float and slack absorption. Delays only cascade when they exceed available free float.
            </p>
          </div>

          {/* K-Hop Selector */}
          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20">
            <span className="text-xs text-white/70 font-bold px-2">Sub-DAG Depth:</span>
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
                {k}-Hop
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-gov-muted font-bold text-sm bg-white rounded-xl border border-gov-border">
          <Activity className="w-8 h-8 text-gov-accent animate-spin mx-auto mb-2" />
          Computing Max-Plus Schedule Recursion & Shapley Criticality...
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gov-border shadow-card">
              <span className="text-[10px] font-bold text-gov-muted uppercase">Connected Sub-DAG Nodes</span>
              <p className="text-xl font-black text-gov-navy mt-1">{data.nodes.length} Projects</p>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> Acyclic DAG Verified
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gov-border shadow-card">
              <span className="text-[10px] font-bold text-gov-muted uppercase">Dependency Edges</span>
              <p className="text-xl font-black text-gov-navy mt-1">{data.edges.length} Cross-Links</p>
              <span className="text-[10px] text-gov-muted">Statutory & Spatial</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gov-border shadow-card">
              <span className="text-[10px] font-bold text-gov-muted uppercase">Locked Capex (P50 Median)</span>
              <p className="text-xl font-black text-amber-700 mt-1">₹{data.total_cascade_locked_p50_cr.toLocaleString()} Cr</p>
              <span className="text-[10px] text-amber-800 font-bold">Median Rupee Contagion</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/50 shadow-card">
              <span className="text-[10px] font-black text-rose-700 uppercase">Worst-Case Locked (P95)</span>
              <p className="text-xl font-black text-rose-900 mt-1">₹{data.total_cascade_locked_p95_cr.toLocaleString()} Cr</p>
              <span className="text-[10px] text-rose-700 font-bold">Tail Risk Exposure</span>
            </div>
          </div>

          {/* Subgraph Nodes & Float Table */}
          <div className="bg-white rounded-xl border border-gov-border shadow-card overflow-hidden">
            <div className="p-4 bg-gov-surface border-b border-gov-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-gov-navy" />
                <h3 className="text-xs font-black text-gov-navy uppercase tracking-wider">
                  Network Nodes & Float Absorption Breakdown
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
                    <th className="p-3">Project</th>
                    <th className="p-3">Sector & Entity</th>
                    <th className="p-3">Capex (Cr)</th>
                    <th className="p-3">Free Float (Slack)</th>
                    <th className="p-3">Delay Impact</th>
                    <th className="p-3">Locked Rupee (P50)</th>
                    <th className="p-3">Shapley φ</th>
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
                          {node.free_float_months.toFixed(1)} mo Slack
                        </span>
                      </td>
                      <td className="p-3">
                        {node.propagated_delay_months > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            +{node.propagated_delay_months.toFixed(1)} mo Active Cascade
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gov-surface text-gov-muted border border-gov-border">
                            Delay Absorbed
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-700">
                        ₹{node.locked_capital_p50_cr.toLocaleString()} Cr
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-black bg-gov-navy text-gov-accent">
                          {node.shapley_criticality_phi.toFixed(1)}
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
