import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle2, AlertCircle, Building2, Shield, RefreshCw } from 'lucide-react';
import { Card } from '../../src/components/ui';
import { getAuthHeaders } from '../../tanmay/utils/auth';
import { useLanguage } from '../../tanmay/i18n/LanguageContext';

export default function TrendAnalytics() {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/issues/analytics/dashboard', {
        headers: {
          ...headers,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load analytics data.');
      }

      const data = await res.json();
      if (data.success && data.data) {
        setAnalytics(data.data);
      } else {
        throw new Error('Invalid analytics response.');
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Unable to fetch analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3 bg-gov-surface rounded-xl border border-gov-border font-sans">
        <RefreshCw className="w-6 h-6 text-gov-navy animate-spin" />
        <span className="text-xs font-bold uppercase tracking-wider text-gov-muted">Computing SLA & Resolution Analytics...</span>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3 font-sans">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <p className="text-xs font-bold text-rose-800">{error || 'Failed to load analytics.'}</p>
        <button
          onClick={fetchAnalytics}
          className="text-xs font-bold text-rose-900 underline hover:text-rose-950 cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Support both nested `overview` or flat properties
  const totalIssues = analytics.overview?.totalIssues ?? analytics.totalIssues ?? 0;
  const resolutionRate = analytics.overview?.resolutionRate ?? analytics.resolutionRate ?? 0;
  const resolvedIssues = analytics.overview?.resolvedIssues ?? analytics.statusBreakdown?.resolved ?? 0;
  const pendingIssues = analytics.overview?.pendingIssues ?? analytics.statusBreakdown?.pending ?? 0;
  const inProgressIssues = analytics.overview?.inProgressIssues ?? analytics.statusBreakdown?.inProgress ?? 0;
  const avgTurnaround = analytics.overview?.avgResolutionTimeHours ?? analytics.avgResolutionHours ?? 0;

  // Normalized department array
  const rawDepts = analytics.departmentBreakdown || analytics.categoryBreakdown || [];
  const departmentBreakdown = Array.isArray(rawDepts)
    ? rawDepts.map((d) => ({
        name: d._id || d.category || d.name || 'General',
        count: Number(d.count) || 0,
      }))
    : [];

  // Normalized severity array
  const rawSevs = analytics.severityBreakdown || [];
  const severityBreakdown = Array.isArray(rawSevs)
    ? rawSevs.map((s) => ({
        name: s._id || s.severity || s.name || 'Medium',
        count: Number(s.count) || 0,
      }))
    : [];

  const maxDeptCount = Math.max(...departmentBreakdown.map((d) => d.count), 1);
  const maxSevCount = Math.max(...severityBreakdown.map((s) => s.count), 1);

  return (
    <div className="space-y-6 font-sans">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gov-surface p-4 rounded-xl border border-gov-border">
          <span className="text-[10px] font-bold text-gov-muted uppercase tracking-wider block">Total Complaints</span>
          <div className="text-2xl font-black text-gov-navy mt-1 font-mono">{totalIssues}</div>
          <span className="text-[10px] text-gov-muted font-medium">100% indexed in DB</span>
        </div>

        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Resolution Rate</span>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">{resolutionRate}%</div>
          <span className="text-[10px] text-emerald-700 font-medium">{resolvedIssues} of {totalIssues} fixed</span>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Avg Turnaround</span>
          <div className="text-2xl font-black text-blue-700 mt-1 font-mono">{avgTurnaround} hrs</div>
          <span className="text-[10px] text-blue-700 font-medium">SLA Target: &lt; 24h</span>
        </div>

        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Active Pipeline</span>
          <div className="text-2xl font-black text-amber-700 mt-1 font-mono">{pendingIssues + inProgressIssues}</div>
          <span className="text-[10px] text-amber-700 font-medium">{inProgressIssues} in progress</span>
        </div>
      </div>

      {/* Breakdown Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-gov-border shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gov-border">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gov-navy" />
              <h4 className="text-xs font-bold text-gov-navy uppercase tracking-wider">Departmental Workload</h4>
            </div>
            <span className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">Reports</span>
          </div>

          <div className="space-y-3">
            {departmentBreakdown.length === 0 ? (
              <p className="text-xs text-gov-muted">No department data recorded yet.</p>
            ) : (
              departmentBreakdown.map((dept) => {
                const pct = Math.round((dept.count / maxDeptCount) * 100);
                return (
                  <div key={dept.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gov-navy">{dept.name}</span>
                      <span className="font-mono text-gov-muted">{dept.count}</span>
                    </div>
                    <div className="w-full bg-gov-surface h-2 rounded-full overflow-hidden border border-gov-border">
                      <div
                        className="h-full bg-gov-navy rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-gov-border shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gov-border">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gov-navy" />
              <h4 className="text-xs font-bold text-gov-navy uppercase tracking-wider">Severity Distribution</h4>
            </div>
            <span className="text-[10px] font-bold text-gov-muted uppercase tracking-wider">Triage Level</span>
          </div>

          <div className="space-y-3">
            {severityBreakdown.length === 0 ? (
              <p className="text-xs text-gov-muted">No severity data recorded yet.</p>
            ) : (
              severityBreakdown.map((sev) => {
                const pct = Math.round((sev.count / maxSevCount) * 100);
                const barColor =
                  sev.name === 'High' ? 'bg-red-500' :
                  sev.name === 'Medium' ? 'bg-amber-500' : 'bg-blue-500';

                return (
                  <div key={sev.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gov-navy">{sev.name} Priority</span>
                      <span className="font-mono text-gov-muted">{sev.count}</span>
                    </div>
                    <div className="w-full bg-gov-surface h-2 rounded-full overflow-hidden border border-gov-border">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
