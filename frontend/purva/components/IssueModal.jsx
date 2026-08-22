import React, { useState, useEffect } from 'react';
import { X, Tag, Clock, MapPin, CheckCircle2, UserCheck, Building2, Brain, ThumbsUp, FileText, Image as ImageIcon } from 'lucide-react';
import { Button, Badge, BeforeAfterSlider } from '../../src/components/ui';
import { getAuthHeaders, getToken } from '../../tanmay/utils/auth';

import { useLanguage } from '../../tanmay/i18n/LanguageContext';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved'];

const SEVERITY_BADGE_VARIANTS = {
  High: 'danger',
  Medium: 'warning',
  Low: 'info',
};

export const IssueModal = ({ issue, isOpen, onClose, onUpdateStatus, onAssignWorker }) => {
  const { t } = useLanguage();
  if (!isOpen || !issue) return null;

  const [selectedStatus, setSelectedStatus] = useState(issue.status || 'Pending');
  const [selectedWorkerId, setSelectedWorkerId] = useState(issue.assignedTo?._id || issue.assignedTo || '');
  const [workers, setWorkers] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState('');

  useEffect(() => {
    // Fetch available workers for assignment dropdown using reliable auth headers
    const fetchWorkers = async () => {
      try {
        const headers = getAuthHeaders();
        const res = await fetch('/api/issues/workers/list', {
          headers: {
            ...headers,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setWorkers(data.data);
          }
        } else {
          console.warn('Failed to load workers list, status:', res.status);
        }
      } catch (err) {
        console.warn('Failed to load workers list:', err);
      }
    };

    if (isOpen) {
      fetchWorkers();
      setSelectedStatus(issue.status || 'Pending');
      setSelectedWorkerId(issue.assignedTo?._id || issue.assignedTo || '');
      setAssignSuccess('');
    }
  }, [isOpen, issue]);

  const handleSaveStatus = async () => {
    if (selectedStatus === issue.status) {
      onClose();
      return;
    }
    setIsUpdating(true);
    await onUpdateStatus(issue._id || issue.id, selectedStatus);
    setIsUpdating(false);
    onClose();
  };

  const handleAssignWorker = async () => {
    if (!selectedWorkerId) return;
    setIsAssigning(true);
    setAssignSuccess('');
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/issues/${issue._id || issue.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ workerId: selectedWorkerId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAssignSuccess(data.message || 'Worker assigned successfully!');
        setSelectedStatus('In Progress');
        if (onUpdateStatus) {
          await onUpdateStatus(issue._id || issue.id, 'In Progress');
        }
        if (onAssignWorker) {
          onAssignWorker(data.data);
        }
      } else {
        alert(data.message || 'Failed to assign worker.');
      }
    } catch (err) {
      console.error('Assign worker error:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  const severityVariant = SEVERITY_BADGE_VARIANTS[issue.severity] || 'surface';
  const lat = issue.location?.coordinates ? issue.location.coordinates[1] : null;
  const lng = issue.location?.coordinates ? issue.location.coordinates[0] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gov-navy/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-150 font-sans">
      <div
        className="bg-white rounded-xl shadow-elevated max-w-2xl w-full overflow-hidden border border-gov-border flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gov-border bg-gov-surface">
          <div className="flex items-center gap-3">
            <span className="font-black text-gov-navy text-base tracking-tight uppercase">
              Grievance Detail
            </span>
            <span className="text-xs font-mono font-bold text-gov-navy bg-white px-2.5 py-1 rounded border border-gov-border">
              #{issue.trackingId || String(issue._id || issue.id).slice(-8)}
            </span>
            <Badge variant="surface" size="xs">
              {issue.category}
            </Badge>
            <Badge variant={severityVariant} size="xs">
              {issue.severity} Priority
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="text-gov-muted hover:text-gov-navy rounded-lg p-1 hover:bg-gov-border transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Image & Before/After Proof */}
          {issue.imageUrl && (
            <div>
              <BeforeAfterSlider
                beforeImage={issue.imageUrl}
                afterImage={issue.resolutionImageUrl}
                beforeLabel="Reported Evidence"
                afterLabel="Worker Resolution"
                verifiedDistance={issue.resolutionDistanceMeters != null ? issue.resolutionDistanceMeters : null}
              />
            </div>
          )}

          {/* Citizen Description */}
          <div>
            <h4 className="text-xs font-bold text-gov-navy uppercase tracking-wider mb-1.5">
              Citizen Description
            </h4>
            <p className="text-sm text-gov-text-body bg-gov-surface p-4 rounded-lg border border-gov-border leading-relaxed font-medium">
              {issue.description}
            </p>
          </div>


          {/* AI Triage & Department */}
          {(issue.aiSummary || issue.department) && (
            <div className="p-4 bg-gov-surface rounded-lg border border-gov-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gov-navy uppercase tracking-wider">
                <Brain className="w-4 h-4 text-gov-navy" />
                <span>AI Automated Triage Breakdown</span>
              </div>
              {issue.department && (
                <div className="flex items-center gap-2 text-xs">
                  <Building2 className="w-3.5 h-3.5 text-gov-muted" />
                  <span className="text-gov-muted font-medium">Routed Department:</span>
                  <span className="font-bold text-gov-navy">{issue.department}</span>
                </div>
              )}
              {issue.aiSummary && (
                <p className="text-xs text-gov-muted font-medium leading-relaxed">
                  {issue.aiSummary}
                </p>
              )}
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-gov-surface p-3 rounded-lg border border-gov-border">
              <span className="text-[10px] uppercase font-bold text-gov-muted block mb-0.5 tracking-wider">Reported</span>
              <span className="font-bold text-gov-navy text-[11px]">
                {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString('en-IN') : 'N/A'}
              </span>
            </div>

            <div className="bg-gov-surface p-3 rounded-lg border border-gov-border">
              <span className="text-[10px] uppercase font-bold text-gov-muted block mb-0.5 tracking-wider">Coordinates</span>
              <span className="font-mono font-bold text-gov-navy text-[11px]">
                {lat != null && lng != null ? `${lat.toFixed(3)}°, ${lng.toFixed(3)}°` : 'N/A'}
              </span>
            </div>

            <div className="bg-gov-surface p-3 rounded-lg border border-gov-border">
              <span className="text-[10px] uppercase font-bold text-gov-muted block mb-0.5 tracking-wider">Community Votes</span>
              <span className="font-bold text-gov-navy text-[11px] flex items-center gap-1">
                <ThumbsUp className="w-3 h-3 text-gov-navy" />
                {issue.upvotes || 1}
              </span>
            </div>
          </div>

          {/* Worker Assignment Section */}
          <div className="p-4 bg-gov-surface rounded-lg border border-gov-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-gov-navy uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-gov-navy" />
                <span>{t('admin.dispatch')}</span>
              </div>
              {issue.assignedTo && (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  Assigned ✓
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="flex-1 bg-white border border-gov-border rounded-lg px-3 py-2 text-xs font-bold text-gov-navy focus:outline-none focus:ring-2 focus:ring-gov-navy"
              >
                <option value="">{t('admin.selectWorker')}</option>
                {workers.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name || w.email} ({w.department || 'Field Ops'})
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleAssignWorker}
                disabled={!selectedWorkerId || isAssigning}
                loading={isAssigning}
                className="text-xs whitespace-nowrap font-bold"
              >
                {t('admin.assignWorker')}
              </Button>
            </div>

            {assignSuccess && (
              <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {assignSuccess}
              </p>
            )}
          </div>

          {/* Resolution Details (if resolved) */}
          {issue.status === 'Resolved' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Resolution Record</span>
              </div>
              {issue.resolutionNotes && (
                <p className="text-xs text-emerald-800 font-medium">
                  <strong>Notes:</strong> {issue.resolutionNotes}
                </p>
              )}
              {issue.resolutionImageUrl && (
                <div className="mt-2">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block mb-1">Resolution Photo Proof:</span>
                  <img
                    src={issue.resolutionImageUrl}
                    alt="Resolution proof"
                    className="w-48 h-32 object-cover rounded-lg border border-emerald-300"
                  />
                </div>
              )}
            </div>
          )}

          {/* Status Update Control */}
          <div className="pt-2 border-t border-gov-border">
            <label className="block text-xs font-bold text-gov-navy uppercase tracking-wider mb-2">
              Update Resolution Workflow Status
            </label>
            <div className="flex items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex-1 bg-white border border-gov-border rounded-lg px-3.5 py-2.5 text-sm font-bold text-gov-navy focus:outline-none focus:ring-2 focus:ring-gov-navy"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gov-surface border-t border-gov-border flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveStatus}
            loading={isUpdating}
            icon={CheckCircle2}
          >
            {t('admin.saveStatus')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IssueModal;
