import React, { useState, useEffect } from 'react';
import NivaranCard from './NivaranCard';
import AnumatiCard from './AnumatiCard';
import { ShieldAlert, Layers } from 'lucide-react';

/**
 * PRAKALP-DRISHTI Combined Governance Executive Dashboard Component
 */
export default function CombinedDashboard({ projectId = "PRJ-NH-2026-089" }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/governance/combined-risk-profile/${projectId}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching combined risk profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [projectId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-mono">Loading PRAKALP-DRISHTI Intelligence Engines...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-400 font-mono">Failed to load risk profile data.</div>;
  }

  const { project_metadata, overall_administrative_risk_score, governance_risk_category, nivaran_assessment, anumati_assessment, executive_summary_directive } = data;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 bg-slate-950 min-h-screen text-slate-100 font-sans">
      
      {/* HEADER HERO */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 relative overflow-hidden space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3">
              <span className="tag tag-info">{project_metadata.sector}</span>
              <span className="text-xs font-mono text-slate-400">{project_metadata.mospi_monitoring_code}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-1">{project_metadata.project_name}</h2>
            <p className="text-xs text-slate-400 mt-1">Executing Agency: {project_metadata.executing_agency}</p>
          </div>

          <div className="flex items-center space-x-6 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div className="text-center">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Sanctioned Cost</p>
              <p className="text-xl font-bold text-white font-mono mt-0.5">₹{project_metadata.total_sanctioned_cost_cr.toLocaleString()} Cr</p>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="text-center">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Risk Rating</p>
              <p className="text-2xl font-black text-red-400 font-mono mt-0.5">{overall_administrative_risk_score.toFixed(1)} / 100</p>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="text-center">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Governance</p>
              <span className="inline-block mt-1 px-3 py-1 text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded-md">{governance_risk_category}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 border-t border-slate-800/80 pt-3 flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{executive_summary_directive}</span>
        </p>
      </div>

      {/* MODULES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <NivaranCard data={nivaran_assessment} />
        <AnumatiCard data={anumati_assessment} />
      </div>

    </div>
  );
}
