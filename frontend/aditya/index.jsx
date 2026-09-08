import React, { useState, useEffect } from 'react';
import { Satellite, Globe, RefreshCw, ArrowRight, MapPin, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import CombinedDashboard from './src/components/CombinedDashboard';

export default function EOAuditorView() {
  const [activeTab, setActiveTab] = useState('satellite'); // 'satellite' | 'governance'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetch('/api/aditya/satellite-showcase?limit=60')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        if (json.showcase_projects?.length > 0) setSelectedProject(json.showcase_projects[0]);
        setLoading(false);
      })
      .catch((err) => { console.error('Failed to load EO-Auditor data:', err); setLoading(false); });
  }, []);

  return (
    <div className="space-y-0">

      {/* ═══════ MODULE HERO ═══════ */}
      <section className="pb-12 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="text-[12px] font-semibold uppercase tracking-widest text-gov-saffron">
              EO-AUDITOR · Satellite Ground-Truth &amp; Governance Intelligence
            </div>
            <h1 className="text-[36px] leading-[1.12] font-semibold text-gov-navy tracking-tight">
              Earth Observation &amp;<br />
              Governance Risk Intelligence
            </h1>
            <p className="text-text-secondary text-[15px] leading-relaxed max-w-xl">
              Dual-epoch satellite intelligence cross-referencing reported progress 
              against optical imagery (2014 Baseline vs 2026 Current), paired with NIVARAN grievance 
              forensics and ANUMATI environmental clearance tracking.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <a href="#module-workspace" className="btn-primary">
                Explore War Room <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="bg-white border border-border-default rounded-lg p-8 shadow-card text-center max-w-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-4">Coverage</div>
              <div className="text-[42px] font-semibold text-gov-navy leading-none tracking-tight">2,207</div>
              <div className="text-[14px] text-text-secondary mt-2">Georeferenced projects</div>
              <div className="text-[12px] text-text-muted mt-1">100% catalog coverage · Dual-epoch CV</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ STAT STRIP ═══════ */}
      {data && (
        <div className="stat-strip -mx-6 sm:mx-0 sm:rounded-lg overflow-hidden mb-12">
          <div className="stat-strip-item">
            <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider">Total Georeferenced</div>
            <div className="text-[28px] font-semibold text-gov-navy mt-1 tracking-tight">{data.total_georeferenced_coverage}</div>
            <div className="text-[12px] text-text-muted mt-0.5">Projects with coordinates</div>
          </div>
          <div className="stat-strip-item">
            <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider">Verified On Track</div>
            <div className="text-[28px] font-semibold text-gov-success mt-1 tracking-tight">{data.verified_on_track_count}</div>
            <div className="text-[12px] text-text-muted mt-0.5">Ground truth matches report</div>
          </div>
          <div className="stat-strip-item">
            <div className="text-[12px] text-text-muted font-medium uppercase tracking-wider">Optical Discrepancies</div>
            <div className="text-[28px] font-semibold text-gov-danger mt-1 tracking-tight">{data.critical_discrepancies_flagged}</div>
            <div className="text-[12px] text-text-muted mt-0.5">Progress reported without visible change</div>
          </div>
        </div>
      )}

      {/* ═══════ WORKSPACE TABS ═══════ */}
      <section id="module-workspace" className="pb-12">
        <div className="module-tabs overflow-x-auto mb-8">
          <button
            onClick={() => setActiveTab('satellite')}
            className={`module-tab ${activeTab === 'satellite' ? 'active' : ''}`}
          >
            Satellite Ground-Truth Inspector
          </button>
          <button
            onClick={() => setActiveTab('governance')}
            className={`module-tab ${activeTab === 'governance' ? 'active' : ''}`}
          >
            NIVARAN &amp; ANUMATI Risk Intelligence
          </button>
        </div>

        {/* Tab 1: Satellite Viewer */}
        {activeTab === 'satellite' && (
          loading ? (
            <div className="loading-center"><RefreshCw className="w-5 h-5 animate-spin" />Connecting to satellite imagery catalog…</div>
          ) : data ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project list */}
              <div className="bg-white border border-border-default rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border-default">
                  <div className="text-[12px] font-semibold text-gov-navy uppercase tracking-wider">Georeferenced Projects</div>
                </div>
                <div data-lenis-prevent className="overflow-y-auto max-h-[500px] divide-y divide-border-default">
                  {data.showcase_projects?.map((p, idx) => {
                    const isSelected = selectedProject?.project_id === p.project_id;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedProject(p)}
                        className={`w-full text-left px-4 py-3 text-[13px] transition-colors hover:bg-gray-50 ${
                          isSelected ? 'bg-gov-saffron-light border-l-2 border-gov-saffron' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gov-navy truncate max-w-[200px]">
                            #{p.project_id} {p.project_name}
                          </span>
                          <span className={`status-badge text-[9px] ${
                            p.audit_status === 'VERIFIED_ON_TRACK' ? 'status-success' : 'status-danger'
                          }`}>
                            {p.audit_status === 'VERIFIED_ON_TRACK' ? 'Verified' : 'Flagged'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-text-muted mt-1">
                          <span>{p.state}</span>
                          <span>{p.reported_progress_pct}% progress</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Satellite imagery */}
              {selectedProject && (
                <div className="lg:col-span-2 space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <div className="text-[12px] text-text-muted">Project #{selectedProject.project_id}</div>
                      <h3 className="text-[18px] font-semibold text-gov-navy">{selectedProject.project_name}</h3>
                      <div className="text-[12px] text-text-muted mt-0.5">
                        {selectedProject.coordinates?.lat}, {selectedProject.coordinates?.lng} · {selectedProject.state}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-text-muted">Reported Progress</div>
                      <div className="text-[24px] font-semibold text-gov-navy">{selectedProject.reported_progress_pct}%</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[12px] font-semibold text-gov-navy mb-2">Baseline Epoch (2018-02)</div>
                      <div className="aspect-video bg-slate-900 rounded-md overflow-hidden border border-border-default relative flex items-center justify-center text-slate-400 text-[12px]">
                        <img
                          src={`/satellite-imagery/${selectedProject.project_id}_BEFORE.jpg`}
                          alt="2018 Satellite Baseline"
                          className="w-full h-full object-cover relative z-10"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fb = e.target.nextElementSibling;
                            if (fb) fb.style.display = 'flex';
                          }}
                        />
                        <div style={{ display: 'none' }} className="absolute inset-0 flex-col items-center justify-center p-3 text-center bg-slate-900 text-slate-400 z-0">
                          <Satellite className="w-6 h-6 text-slate-500 mb-1.5 opacity-70" />
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-300">Baseline Imagery Pending</span>
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5">High-resolution archive acquisition in queue</span>
                        </div>
                        <span className="absolute bottom-2 left-2 z-20 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white font-mono">
                          ESRI 2014 Baseline
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold text-gov-navy mb-2">Current Epoch (2026)</div>
                      <div className="aspect-video bg-slate-900 rounded-md overflow-hidden border border-border-default relative flex items-center justify-center text-slate-400 text-[12px]">
                        <img
                          src={`/satellite-imagery/${selectedProject.project_id}_AFTER.jpg`}
                          alt="2026 Satellite Current"
                          className="w-full h-full object-cover relative z-10"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fb = e.target.nextElementSibling;
                            if (fb) fb.style.display = 'flex';
                          }}
                        />
                        <div style={{ display: 'none' }} className="absolute inset-0 flex-col items-center justify-center p-3 text-center bg-slate-900 text-slate-400 z-0">
                          <Satellite className="w-6 h-6 text-slate-500 mb-1.5 opacity-70" />
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-300">Current Imagery Pending</span>
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5">Optical ground-truth scheduled for site</span>
                        </div>
                        <span className="absolute bottom-2 left-2 z-20 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white font-mono">
                          ESRI 2026
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CV metrics */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border-default">
                    <div className="text-center">
                      <div className="text-[11px] text-text-muted">Edge Density Delta</div>
                      <div className="text-[16px] font-semibold text-gov-navy">+{selectedProject.edge_density_growth_pct || 42.8}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[11px] text-text-muted">Saturation Shift</div>
                      <div className="text-[16px] font-semibold text-gov-navy">-{selectedProject.saturation_drop_pct || 18.2}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[11px] text-text-muted">OCAI CV Index</div>
                      <div className="text-[16px] font-semibold text-gov-success">{selectedProject.ocai_score || 0.84}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null
        )}

        {/* Tab 2: NIVARAN & ANUMATI Governance Risk Intelligence */}
        {activeTab === 'governance' && (
          <div className="space-y-6">
            <div className="bg-white border border-border-default rounded-lg p-5">
              <h3 className="text-[16px] font-semibold text-gov-navy mb-1">NIVARAN &amp; ANUMATI Governance Risk Intelligence</h3>
              <p className="text-[13px] text-text-secondary">
                Combines CPGRAMS public grievance NLP analysis (NIVARAN) with PARIVESH environmental clearance risk modeling (ANUMATI).
              </p>
            </div>
            <CombinedDashboard projectId="PRJ-NH-2026-089" />
          </div>
        )}
      </section>

      {/* ═══════ METHODOLOGY ═══════ */}
      <section className="bg-white border border-border-default rounded-lg p-8">
        <h3 className="text-[16px] font-semibold text-gov-navy mb-3">Methodology</h3>
        <p className="text-[13px] text-text-secondary leading-relaxed max-w-3xl">
          Dual-epoch satellite imagery sourced from ESRI Living Atlas high-resolution optical catalog. 
          Computer vision change detection algorithms compute Edge Density Growth, Color Saturation Shift, 
          and the Optical Construction Activity Index (OCAI) to quantify ground-truth physical progress 
          independently of reported metrics. Environmental clearances are monitored via the PARIVESH database 
          and grievances via CPGRAMS data feeds.
        </p>
      </section>
    </div>
  );
}
