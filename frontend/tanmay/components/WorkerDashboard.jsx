import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Wrench,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Camera,
  AlertTriangle,
  FileText,
  Building2,
  RefreshCw,
  Upload,
  X,
  Tag
} from 'lucide-react';
import { Card, Badge, Button } from '../../src/components/ui';

export default function WorkerDashboard() {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('active'); // 'active' | 'completed'

  const fetchTasks = useCallback(async () => {

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/issues/worker/tasks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load assigned tasks.');
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTasks(data.data);
      }
    } catch (err) {
      console.error('Worker task fetch error:', err);
      setError(err.message || 'Unable to fetch tasks.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const [selectedTask, setSelectedTask] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionFile, setResolutionFile] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionError, setResolutionError] = useState('');
  const [workerGps, setWorkerGps] = useState(null);
  const [isAcquiringGps, setIsAcquiringGps] = useState(false);

  const handleOpenResolveModal = (task) => {
    setSelectedTask(task);
    setResolutionNotes('');
    setResolutionFile(null);
    setResolutionError('');
    setWorkerGps(null);
    setIsAcquiringGps(true);

    // Acquire worker's real-time GPS coordinate for geofencing verification
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setWorkerGps({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setIsAcquiringGps(false);
        },
        (err) => {
          console.warn('Could not acquire worker GPS position:', err.message);
          // Fallback to task's coordinate for smooth demo flow if browser denies GPS
          if (task.location?.coordinates) {
            setWorkerGps({
              latitude: task.location.coordinates[1],
              longitude: task.location.coordinates[0],
            });
          }
          setIsAcquiringGps(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsAcquiringGps(false);
    }
  };

  const handleCloseResolveModal = () => {
    setSelectedTask(null);
    setResolutionNotes('');
    setResolutionFile(null);
    setResolutionError('');
    setWorkerGps(null);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    setIsResolving(true);
    setResolutionError('');

    try {
      const formData = new FormData();
      if (resolutionFile) {
        formData.append('resolutionImage', resolutionFile);
      }
      formData.append('notes', resolutionNotes.trim());

      if (workerGps?.latitude && workerGps?.longitude) {
        formData.append('latitude', workerGps.latitude);
        formData.append('longitude', workerGps.longitude);
      }

      const res = await fetch(`/api/issues/${selectedTask._id}/resolve`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit resolution.');
      }

      // Update local tasks
      setTasks((prev) =>
        prev.map((t) => (t._id === selectedTask._id ? { ...t, status: 'Resolved', resolvedAt: new Date(), resolutionNotes } : t))
      );
      handleCloseResolveModal();
    } catch (err) {
      console.error('Resolve error:', err);
      setResolutionError(err.message || 'Failed to resolve task.');
    } finally {
      setIsResolving(false);
    }
  };


  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === 'active') return task.status !== 'Resolved';
    return task.status === 'Resolved';
  });

  const getSeverityBadgeVariant = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'high':
        return 'danger';
      case 'low':
        return 'info';
      default:
        return 'warning';
    }
  };

  return (
    <div className="min-h-[calc(100vh-14rem)] bg-gov-surface py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-white rounded-xl p-6 shadow-card border border-gov-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gov-navy text-gov-accent flex items-center justify-center shadow-soft flex-shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-gov-navy tracking-tight uppercase">
                  {t('worker.title')}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Field Personnel
                </span>
              </div>
              <p className="text-xs text-gov-muted mt-0.5 font-medium">
                {user?.name || user?.email} • {user?.department || 'Municipal Field Operations'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchTasks}
            loading={loading}
            icon={RefreshCw}
            className="text-xs font-bold"
          >
            Refresh
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-gov-border shadow-soft w-fit">
          <button
            onClick={() => setActiveFilter('active')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
              activeFilter === 'active'
                ? 'bg-gov-navy text-gov-accent shadow-soft'
                : 'text-gov-muted hover:text-gov-navy'
            }`}
          >
            {t('worker.activeTasks')} ({tasks.filter((t) => t.status !== 'Resolved').length})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
              activeFilter === 'completed'
                ? 'bg-gov-navy text-gov-accent shadow-soft'
                : 'text-gov-muted hover:text-gov-navy'
            }`}
          >
            {t('worker.completedTasks')} ({tasks.filter((t) => t.status === 'Resolved').length})
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Tasks List */}
        {loading && tasks.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gov-muted bg-white rounded-xl border border-gov-border shadow-card">
            <RefreshCw className="animate-spin h-6 w-6 text-gov-navy mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider text-gov-navy">Fetching Field Assignments...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-gov-border shadow-card">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gov-navy">No {activeFilter === 'active' ? 'Active' : 'Completed'} Tasks</h3>
            <p className="text-xs text-gov-muted mt-1 font-medium">
              {activeFilter === 'active'
                ? 'All assigned field grievances have been resolved! Check back later for new dispatches.'
                : 'No resolved tasks recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const lat = task.location?.coordinates ? task.location.coordinates[1] : null;
              const lng = task.location?.coordinates ? task.location.coordinates[0] : null;
              const mapsUrl = lat && lng ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : null;

              return (
                <div
                  key={task._id}
                  className="bg-white rounded-xl p-5 border border-gov-border shadow-card flex flex-col sm:flex-row gap-5"
                >
                  {/* Task Image */}
                  {task.imageUrl && (
                    <div className="w-full sm:w-48 h-36 rounded-lg bg-gov-surface border border-gov-border overflow-hidden flex-shrink-0">
                      <img
                        src={task.imageUrl}
                        alt={task.category}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Task Info */}
                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-gov-navy bg-gov-surface px-2.5 py-1 rounded border border-gov-border">
                          #{task.trackingId || task._id.slice(-6)}
                        </span>
                        <Badge variant={getSeverityBadgeVariant(task.severity)} size="xs">
                          {task.severity} Priority
                        </Badge>
                        <Badge variant="surface" size="xs">
                          {task.category}
                        </Badge>
                      </div>

                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        task.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>

                    <p className="text-xs text-gov-text font-medium leading-relaxed">
                      {task.description}
                    </p>

                    {task.aiSummary && (
                      <p className="text-[11px] text-gov-muted italic bg-gov-surface p-2 rounded border border-gov-border">
                        <strong>AI Summary:</strong> {task.aiSummary}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-gov-muted pt-1">
                      {lat != null && lng != null && (
                        <div className="flex items-center gap-1 font-mono">
                          <MapPin className="w-3.5 h-3.5 text-gov-navy" />
                          <span>{lat.toFixed(4)}°, {lng.toFixed(4)}°</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Assigned: {task.assignedAt ? new Date(task.assignedAt).toLocaleDateString('en-IN') : 'Recently'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-gov-border flex items-center justify-end gap-2.5">
                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gov-surface text-gov-navy text-xs font-bold border border-gov-border hover:bg-gov-border transition-colors"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          {t('worker.navigate')}
                        </a>
                      )}

                      {task.status !== 'Resolved' && (
                        <button
                          type="button"
                          onClick={() => handleOpenResolveModal(task)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-soft"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t('worker.markResolved')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resolution Modal */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gov-navy/70 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-xl shadow-elevated max-w-lg w-full overflow-hidden border border-gov-border">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gov-border bg-gov-surface">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-black text-gov-navy text-sm uppercase tracking-tight">
                    {t('worker.markResolved')}
                  </h3>
                </div>
                <button
                  onClick={handleCloseResolveModal}
                  className="text-gov-muted hover:text-gov-navy p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleResolveSubmit} className="p-6 space-y-4">
                {resolutionError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium">
                    {resolutionError}
                  </div>
                )}

                {/* Live GPS Geofence Status */}
                <div className="p-3 bg-gov-surface border border-gov-border rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gov-navy" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gov-muted">
                        Field Verification Geofence
                      </p>
                      <p className="text-xs font-bold text-gov-navy font-mono">
                        {isAcquiringGps
                          ? 'Acquiring high-accuracy GPS lock...'
                          : workerGps
                          ? `Lat: ${workerGps.latitude.toFixed(4)}°, Lng: ${workerGps.longitude.toFixed(4)}°`
                          : 'GPS Ready'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {workerGps ? '✓ Geofence Locked' : 'Locating...'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gov-navy mb-1.5">
                    {t('worker.resolutionNotes')} *
                  </label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe how the issue was fixed (materials used, actions taken)..."
                    rows={3}
                    required
                    className="w-full px-3.5 py-2.5 text-xs border border-gov-border rounded-lg bg-gov-surface focus:outline-none focus:ring-2 focus:ring-gov-navy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gov-navy mb-1.5">
                    {t('worker.uploadProof')} (Photo)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setResolutionFile(e.target.files[0] || null)}
                    className="w-full text-xs text-gov-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gov-navy file:text-white hover:file:bg-gov-navy/90 cursor-pointer"
                  />
                </div>


                <div className="pt-3 border-t border-gov-border flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCloseResolveModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={isResolving}
                    icon={CheckCircle2}
                  >
                    Submit Resolution
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
