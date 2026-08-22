import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Building2,
  Brain,
  Calendar,
  FileText,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';

import { useLanguage } from '../../tanmay/i18n/LanguageContext';
import { BeforeAfterSlider } from '../../src/components/ui/BeforeAfterSlider';

export default function TrackComplaint() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';
  const [trackingId, setTrackingId] = useState(initialId);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const STATUS_STYLES = {
    Pending: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock, labelKey: 'kanban.pending' },
    'In Progress': { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: AlertTriangle, labelKey: 'kanban.inProgress' },
    Resolved: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2, labelKey: 'kanban.resolved' },
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!trackingId.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/issues/track/${trackingId.trim()}`);
      const data = await res.json();

      if (!data.success) {
        setError(data.message || t('track.notFound'));
      } else {
        setResult(data.data);
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-search if ID is in URL
  React.useEffect(() => {
    if (initialId) {
      handleSearch();
    }
  }, []);

  const statusStyle = result ? STATUS_STYLES[result.status] || STATUS_STYLES.Pending : null;

  return (
    <div className="min-h-[calc(100vh-14rem)] bg-gov-surface py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gov-muted hover:text-gov-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('track.back')}</span>
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gov-navy bg-gov-accent/20 px-2.5 py-1 rounded border border-gov-accent-dark/30">
            {t('track.badge')}
          </span>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl p-6 shadow-card border border-gov-border mb-6">
          <h1 className="text-xl font-black text-gov-navy tracking-tight mb-1">
            {t('track.title')}
          </h1>
          <p className="text-xs text-gov-muted font-medium mb-5">
            {t('track.subtitle')}
          </p>

          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder={t('track.placeholder')}
              className="flex-1 px-4 py-3 text-sm font-mono border border-gov-border rounded-lg bg-gov-surface focus:outline-none focus:ring-2 focus:ring-gov-navy/20 focus:border-gov-navy"
            />
            <button
              type="submit"
              disabled={loading || !trackingId.trim()}
              className="px-5 py-3 bg-gov-navy text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gov-navy/90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              {loading ? t('track.searching') : t('track.search')}
            </button>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-xl shadow-card border border-gov-border overflow-hidden animate-fadeIn">
            {/* Status Banner */}
            <div className={`px-6 py-4 ${statusStyle.bg} ${statusStyle.border} border-b flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <statusStyle.icon className={`w-5 h-5 ${statusStyle.color}`} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gov-muted">{t('track.status')}</p>
                  <p className={`text-sm font-black ${statusStyle.color}`}>{t(statusStyle.labelKey)}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-gov-navy bg-white px-3 py-1.5 rounded-lg border border-gov-border">
                #{result.trackingId}
              </span>
            </div>

            {/* Details Grid */}
            <div className="p-6 space-y-5">
              {/* Interactive Before & After Visual Proof */}
              {result.imageUrl && (
                <div>
                  <BeforeAfterSlider
                    beforeImage={result.imageUrl}
                    afterImage={result.resolutionImageUrl}
                    beforeLabel="Citizen Evidence (Before)"
                    afterLabel="Field Repair Proof (After)"
                    verifiedDistance={result.resolutionDistanceMeters != null ? result.resolutionDistanceMeters : null}
                  />
                </div>
              )}

              {/* Category + Severity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gov-muted mb-1">{t('track.category')}</p>
                  <p className="text-sm font-bold text-gov-navy">{result.category}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gov-muted mb-1">{t('track.severity')}</p>
                  <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded ${
                    result.severity === 'High' ? 'bg-red-100 text-red-700' :
                    result.severity === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {result.severity} Priority
                  </span>
                </div>
              </div>

              {/* Department */}
              {result.department && (
                <div className="flex items-start gap-2.5 p-3 bg-gov-surface rounded-lg border border-gov-border">
                  <Building2 className="w-4 h-4 text-gov-navy mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gov-muted">{t('track.department')}</p>
                    <p className="text-sm font-bold text-gov-navy">{result.department}</p>
                  </div>
                </div>
              )}

              {/* AI Summary */}
              {result.aiSummary && (
                <div className="flex items-start gap-2.5 p-3 bg-gov-surface rounded-lg border border-gov-border">
                  <Brain className="w-4 h-4 text-gov-navy mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gov-muted">{t('track.aiAnalysis')}</p>
                    <p className="text-sm text-gov-text font-medium">{result.aiSummary}</p>
                    {result.aiConfidence > 0 && (
                      <span className="text-[10px] text-gov-muted mt-1 inline-block">
                        Statistical Confidence: {Math.round(result.aiConfidence * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="flex items-start gap-2.5 p-3 bg-gov-surface rounded-lg border border-gov-border">
                <FileText className="w-4 h-4 text-gov-navy mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gov-muted">{t('track.citizenDesc')}</p>
                  <p className="text-sm text-gov-text font-medium">{result.description}</p>
                </div>
              </div>

              {/* Resolution Notes */}
              {result.resolutionNotes && (
                <div className="border-t border-gov-border pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gov-muted mb-2">{t('track.resolutionNotes')}</p>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-sm text-emerald-800 font-medium">{result.resolutionNotes}</p>
                  </div>
                </div>
              )}

              {/* Governance & Notification Milestones Timeline */}
              <div className="border-t border-gov-border pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gov-navy mb-3 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-gov-navy" />
                  <span>Citizen Notification & Governance Timeline</span>
                </p>
                <div className="space-y-3 relative pl-4 border-l-2 border-gov-border ml-1">
                  {/* Step 1: Registered */}
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gov-navy" />
                    <div className="text-xs">
                      <p className="font-bold text-gov-navy">Report Registered in Jharkhand Municipal Database</p>
                      <p className="text-[11px] text-gov-muted mt-0.5">
                        {new Date(result.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Assigned */}
                  {result.assignedAt && (
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <div className="text-xs">
                        <p className="font-bold text-blue-900">
                          Dispatched to {result.assignedTo?.name || 'Field Officer'} ({result.department || 'Operations'})
                        </p>
                        <p className="text-[11px] text-gov-muted mt-0.5">
                          {new Date(result.assignedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Resolved */}
                  {result.resolvedAt && (
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600" />
                      <div className="text-xs">
                        <p className="font-bold text-emerald-800">
                          Physical Resolution Completed & Verified On-Site
                        </p>
                        <p className="text-[11px] text-gov-muted mt-0.5">
                          {new Date(result.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Community Stats */}
              <div className="border-t border-gov-border pt-4 flex items-center justify-between text-xs">
                <span className="text-gov-muted font-medium">{t('track.communityVotes')}</span>
                <span className="font-bold text-gov-navy bg-gov-surface px-3 py-1 rounded-full border border-gov-border">
                  👍 {result.upvotes || 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

