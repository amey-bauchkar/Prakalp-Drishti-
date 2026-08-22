/**
 * offlineQueue.js
 * Zero-dependency IndexedDB storage for offline citizen complaint queuing and automatic synchronization.
 */

const DB_NAME = 'MumbaiCivicOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_reports';

/**
 * Open or initialize the IndexedDB instance
 */
const openDB = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

/**
 * Save an offline complaint payload to IndexedDB
 */
export const queueOfflineReport = async (reportData) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record = {
        ...reportData,
        queuedAt: new Date().toISOString(),
        status: 'queued_offline',
      };

      const request = store.add(record);
      request.onsuccess = () => {
        console.log('[Offline Queue] Complaint stored locally in IndexedDB.');
        resolve(request.result);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('[Offline Queue Save Error]:', err);
    throw err;
  }
};

/**
 * Retrieve all queued offline complaints
 */
export const getQueuedReports = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('[Offline Queue Fetch Warning]:', err);
    return [];
  }
};

/**
 * Delete a synced complaint from IndexedDB
 */
export const removeQueuedReport = async (id) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('[Offline Queue Delete Error]:', err);
  }
};

/**
 * Synchronize all queued offline reports to the live backend
 */
export const syncQueuedReports = async (onReportSynced) => {
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  const queued = await getQueuedReports();
  if (queued.length === 0) return { synced: 0, failed: 0 };

  let syncedCount = 0;
  let failedCount = 0;

  for (const item of queued) {
    try {
      const formData = new FormData();
      formData.append('description', item.description || '');
      formData.append('latitude', item.latitude || '');
      formData.append('longitude', item.longitude || '');
      if (item.category) formData.append('category', item.category);

      // Reconstruct file if stored as Blob
      if (item.imageBlob) {
        formData.append('image', item.imageBlob, item.imageFileName || 'evidence.jpg');
      }

      const res = await fetch('/api/issues', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await removeQueuedReport(item.id);
        syncedCount++;
        if (onReportSynced) onReportSynced(data.data);
      } else {
        failedCount++;
      }
    } catch (err) {
      console.warn(`[Sync Error on item ${item.id}]:`, err.message);
      failedCount++;
    }
  }

  return { synced: syncedCount, failed: failedCount };
};

/**
 * Register automatic background sync on network reconnection
 */
export const registerAutoSync = (onSyncComplete) => {
  if (typeof window === 'undefined') return;

  const handleOnline = async () => {
    console.log('[Network] Device came online. Triggering automatic background sync...');
    const result = await syncQueuedReports();
    if (result.synced > 0 && onSyncComplete) {
      onSyncComplete(result);
    }
  };

  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
};
