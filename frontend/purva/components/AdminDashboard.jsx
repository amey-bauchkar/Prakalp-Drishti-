import React, { useState } from 'react';
import { RefreshCw, LayoutDashboard, MapPin, Filter, Layers, Clock, CheckCircle2, AlertCircle, BarChart3, Users, Download, ShieldAlert } from 'lucide-react';
import useIssues from '../hooks/useIssues';
import KanbanBoard from './KanbanBoard';
import MapView from './MapView';
import IssueModal from './IssueModal';
import TrendAnalytics from './TrendAnalytics';
import { Card, Button, Badge } from '../../src/components/ui';
import { useLanguage } from '../../tanmay/i18n/LanguageContext';

export const AdminDashboard = () => {
  const { t } = useLanguage();
  const { issues, loading, error, refetch, updateIssueStatus } = useIssues();
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban' | 'map' | 'analytics' | 'both'
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleCardClick = (issue) => {
    setSelectedIssue(issue);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedIssue(null);
    setIsModalOpen(false);
  };

  // Export filtered issues to CSV
  const handleExportCSV = () => {
    if (!filteredIssues || filteredIssues.length === 0) return;

    const headers = [
      'Tracking ID',
      'Category',
      'Severity',
      'Department',
      'Status',
      'Description',
      'Upvotes',
      'Latitude',
      'Longitude',
      'Reported Date',
      'Resolved Date',
      'SLA Status',
    ];

    const rows = filteredIssues.map((issue) => {
      const lat = issue.location?.coordinates?.[1] || '';
      const lng = issue.location?.coordinates?.[0] || '';
      const reported = issue.createdAt ? new Date(issue.createdAt).toISOString() : '';
      const resolved = issue.resolvedAt ? new Date(issue.resolvedAt).toISOString() : '';
      const isBreached = issue.slaBreached || (issue.status !== 'Resolved' && issue.slaDeadline && new Date() > new Date(issue.slaDeadline));
      const slaStatus = issue.status === 'Resolved' ? 'Completed' : isBreached ? 'Breached' : 'Within SLA';

      return [
        `"${issue.trackingId || issue._id}"`,
        `"${issue.category || ''}"`,
        `"${issue.severity || 'Medium'}"`,
        `"${issue.department || ''}"`,
        `"${issue.status || 'Pending'}"`,
        `"${(issue.description || '').replace(/"/g, '""')}"`,
        issue.upvotes || 1,
        lat,
        lng,
        `"${reported}"`,
        `"${resolved}"`,
        `"${slaStatus}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Jharkhand_Municipal_Grievances_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter issues by category
  const filteredIssues = issues.filter((issue) => {
    if (selectedCategory === 'All') return true;
    return issue.category === selectedCategory;
  });

  // Calculate statistics
  const pendingCount = issues.filter((i) => (i.status || 'Pending') === 'Pending').length;
  const inProgressCount = issues.filter((i) => i.status === 'In Progress').length;
  const resolvedCount = issues.filter((i) => i.status === 'Resolved').length;
  const slaBreachedCount = issues.filter((i) => {
    return i.slaBreached || (i.status !== 'Resolved' && i.slaDeadline && new Date() > new Date(i.slaDeadline));
  }).length;

  return (
    <div className="w-full text-gov-text-body font-sans">
      {/* Top Controls Header */}
      <div className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gov-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gov-navy animate-pulse" />
              <h3 className="text-base sm:text-lg font-black text-gov-navy tracking-tight uppercase">
                {t('admin.dashboard')}
              </h3>
            </div>
            <p className="text-xs text-gov-muted mt-0.5 font-medium">
              {t('admin.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredIssues.length === 0}
              className="px-3 py-2 text-xs font-bold bg-white text-gov-navy border border-gov-border hover:bg-gov-surface rounded-md flex items-center gap-1.5 shadow-soft transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              loading={loading}
              icon={RefreshCw}
              className="text-xs font-bold"
            >
              {t('kanban.refresh')}
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4">
          <div className="bg-gov-surface p-3 rounded-lg border border-gov-border">
            <span className="text-[10px] font-bold text-gov-muted uppercase tracking-wider block">{t('admin.totalIssues')}</span>
            <div className="text-xl font-black text-gov-navy mt-0.5 font-mono">{issues.length}</div>
          </div>

          <div className="bg-gov-surface p-3 rounded-lg border border-gov-border border-l-3 border-l-amber-500">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">{t('common.pending')}</span>
            <div className="text-xl font-black text-gov-navy mt-0.5 font-mono">{pendingCount}</div>
          </div>

          <div className="bg-gov-surface p-3 rounded-lg border border-gov-border border-l-3 border-l-blue-500">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">{t('common.inProgress')}</span>
            <div className="text-xl font-black text-gov-navy mt-0.5 font-mono">{inProgressCount}</div>
          </div>

          <div className="bg-gov-surface p-3 rounded-lg border border-gov-border border-l-3 border-l-emerald-600">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">{t('common.resolved')}</span>
            <div className="text-xl font-black text-gov-navy mt-0.5 font-mono">{resolvedCount}</div>
          </div>

          <div className="bg-gov-surface p-3 rounded-lg border border-gov-border border-l-3 border-l-red-600 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">SLA Breaches</span>
            <div className="text-xl font-black text-red-700 mt-0.5 font-mono flex items-center gap-1.5">
              <span>{slaBreachedCount}</span>
              {slaBreachedCount === 0 && (
                <span className="text-[10px] text-emerald-700 bg-emerald-100 font-sans font-bold px-1.5 py-0.5 rounded">
                  100% OK
                </span>
              )}
            </div>
          </div>
        </div>


        {/* View Mode Tabs & Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 bg-gov-surface p-2.5 rounded-lg border border-gov-border">
          {/* Tabs */}
          <div className="flex items-center bg-white p-1 rounded-md border border-gov-border shadow-soft flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                activeTab === 'kanban'
                  ? 'bg-gov-navy text-gov-accent shadow-soft'
                  : 'text-gov-muted hover:text-gov-navy'
              }`}
            >
              {t('admin.kanban')}
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-gov-navy text-gov-accent shadow-soft'
                  : 'text-gov-muted hover:text-gov-navy'
              }`}
            >
              {t('admin.mapView')}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-gov-navy text-gov-accent shadow-soft'
                  : 'text-gov-muted hover:text-gov-navy'
              }`}
            >
              {t('admin.analytics')}
            </button>
            <button
              onClick={() => setActiveTab('both')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                activeTab === 'both'
                  ? 'bg-gov-navy text-gov-accent shadow-soft'
                  : 'text-gov-muted hover:text-gov-navy'
              }`}
            >
              {t('admin.dualView')}
            </button>
          </div>

          {/* Department Filter (Only for Kanban/Map) */}
          {activeTab !== 'analytics' && (
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-gov-muted" />
              <label className="text-xs font-bold uppercase tracking-wider text-gov-navy whitespace-nowrap">{t('kanban.filter')}</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-gov-border text-gov-navy text-xs font-bold rounded-md focus:ring-gov-navy focus:border-gov-navy block p-1.5"
              >
                <option value="All">{t('dept.all')}</option>
                <option value="Roads">{t('dept.roads')}</option>
                <option value="Water">{t('dept.water')}</option>
                <option value="Sanitation">{t('dept.sanitation')}</option>
                <option value="Electricity">{t('dept.electricity')}</option>
                <option value="Other">{t('dept.other')}</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {loading && issues.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-gov-muted bg-gov-surface rounded-xl border border-gov-border">
            <RefreshCw className="animate-spin h-6 w-6 text-gov-navy mb-2.5" />
            <p className="text-xs font-bold uppercase tracking-wider text-gov-navy">{t('kanban.connecting')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* View 1: Kanban Board */}
            {activeTab === 'kanban' && (
              <KanbanBoard issues={filteredIssues} onCardClick={handleCardClick} />
            )}

            {/* View 2: Map Only */}
            {activeTab === 'map' && (
              <MapView issues={filteredIssues} onMarkerClick={handleCardClick} />
            )}

            {/* View 3: Analytics */}
            {activeTab === 'analytics' && <TrendAnalytics />}

            {/* View 4: Dual View */}
            {activeTab === 'both' && (
              <div className="space-y-6">
                <KanbanBoard issues={filteredIssues} onCardClick={handleCardClick} />
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-gov-navy" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gov-navy">{t('kanban.heatmap')}</h4>
                  </div>
                  <MapView issues={filteredIssues} onMarkerClick={handleCardClick} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail & Status Modal with Worker Assignment */}
      <IssueModal
        issue={selectedIssue}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdateStatus={async (id, status) => {
          await updateIssueStatus(id, status);
          refetch();
        }}
      />
    </div>
  );
};

export default AdminDashboard;
