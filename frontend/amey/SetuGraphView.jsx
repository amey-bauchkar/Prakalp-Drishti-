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
    <div className="space-y-8 font-sans">
      {/* Top Banner */}
      <section className="bg-white border border-border-default rounded-3xl p-7 sm:p-9 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gov-saffron-light text-gov-saffron-dark border border-gov-gold-border text-[11px] font-bold uppercase tracking-wider font-mono">
              <GitBranch className="w-3.5 h-3.5 text-gov-saffron" />
              <span>Module 2 · Project Dependencies</span>
            </div>
            <h2 className="font-heading font-extrabold text-[26px] sm:text-[32px] tracking-tight text-gov-navy leading-tight">
              SETU-GRAPH: Connected Projects &amp; Delay Ripple
            </h2>
            <p className="text-text-secondary text-[14.5px] max-w-2xl font-sans leading-relaxed">
              Discover which projects depend on this one, and calculate how much capital gets stuck if delays ripple downstream.
            </p>
          </div>

          {/* K-Hop Selector */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-border-default shadow-sm shrink-0">
            <span className="text-xs text-text-muted font-bold px-2 font-mono">Supply Chain Contagion Depth (K-Hops):</span>
            {[1, 2, 3].map((k) => (
              <button
                key={k}
                onClick={() => setKHops(k)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  kHops === k
                    ? 'bg-gov-navy text-white shadow-sm'
                    : 'text-text-secondary hover:text-gov-navy hover:bg-slate-200/60'
                }`}
              >
                {k === 1 ? 'Level 1: Direct Dependencies' : k === 2 ? 'Level 2: Secondary Ripple' : 'Level 3: Systemic Cascade'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading && (
        <div className="p-12 text-center text-text-muted font-bold text-sm bg-white rounded-3xl border border-border-default shadow-card">
          <Activity className="w-8 h-8 text-gov-saffron animate-spin mx-auto mb-2" />
          Analyzing Project Connections &amp; Delay Buffers...
        </div>
      )}

      {data && !loading && (
        <div className="space-y-8">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-border-default shadow-card">
              <span className="text-[11.5px] font-bold text-text-muted uppercase tracking-wider font-mono">Connected Projects</span>
              <p className="text-[30px] font-black text-gov-navy mt-1 tracking-tight font-mono">{data.nodes.length} Projects</p>
              <span className="text-[11.5px] text-emerald-800 font-bold flex items-center gap-1 mt-1 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Clean Dependency Flow
              </span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-border-default shadow-card">
              <span className="text-[11.5px] font-bold text-text-muted uppercase tracking-wider font-mono">Supply Chain Links</span>
              <p className="text-[30px] font-black text-gov-navy mt-1 tracking-tight font-mono">{data.edges.length} Connections</p>
              <span className="text-[11.5px] text-text-muted font-medium mt-1 block font-sans">Physical &amp; Strategic Links</span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-border-default shadow-card">
              <span className="text-[11.5px] font-bold text-text-muted uppercase tracking-wider font-mono">Likely Contagion Capital Exposure (P50)</span>
              <p className="text-[30px] font-black text-amber-600 mt-1 tracking-tight font-mono">₹{data.total_cascade_locked_p50_cr.toLocaleString()} Cr</p>
              <span className="text-[11.5px] text-amber-800 font-bold mt-1 block font-sans">Likely Contagion Capital at Risk</span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-rose-300 bg-rose-50/40 shadow-card">
              <span className="text-[11.5px] font-black text-rose-700 uppercase tracking-wider font-mono">Stress-Tested Tail Capital Exposure (P95)</span>
              <p className="text-[30px] font-black text-rose-700 mt-1 tracking-tight font-mono">₹{data.total_cascade_locked_p95_cr.toLocaleString()} Cr</p>
              <span className="text-[11.5px] text-rose-700 font-bold mt-1 block font-sans">Severe Contagion Exposure Bound</span>
            </div>
          </div>

          {/* Subgraph Nodes & Float Table */}
          <div className="bg-white rounded-3xl border border-border-default shadow-card overflow-hidden p-7 sm:p-9 space-y-6">
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
                        ₹{node.cost_cr.toLocaleString()} Cr
                      </td>
                      <td>
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono">
                          {node.free_float_months.toFixed(1)} mo Buffer
                        </span>
                      </td>
                      <td className="text-center">
                        {node.propagated_delay_months > 0 ? (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300 font-mono">
                            +{node.propagated_delay_months.toFixed(1)} Mo Propagated Delay
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-emerald-800 border border-emerald-300 font-mono">
                            Absorbed within Float Buffer (Zero Spillover)
                          </span>
                        )}
                      </td>
                      <td className="num font-mono font-bold text-amber-700">
                        ₹{node.locked_capital_p50_cr.toLocaleString()} Cr
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
