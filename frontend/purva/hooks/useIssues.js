import { useState, useEffect, useCallback } from 'react';
import { getAuthHeaders, getToken } from '../../tanmay/utils/auth';

export const useIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/issues?limit=100');
      if (!response.ok) {
        throw new Error(`Failed to fetch issues: ${response.statusText}`);
      }
      const data = await response.json();
      if (data && data.success && Array.isArray(data.data)) {
        setIssues(data.data);
      } else {
        setIssues([]);
        setError('No issues data received from server.');
      }
    } catch (err) {
      console.error('[useIssues] Fetch error:', err.message);
      setIssues([]);
      setError('Unable to connect to the backend server. Please ensure it is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const updateIssueStatus = async (issueId, newStatus) => {
    // Optimistic UI update
    setIssues((prevIssues) =>
      prevIssues.map((issue) =>
        issue._id === issueId ? { ...issue, status: newStatus } : issue
      )
    );

    try {
      const token = getToken();
      if (!token) {
        setError('Authentication required to update issue status.');
        return false;
      }

      const response = await fetch(`/api/issues/${issueId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setIssues((prevIssues) =>
            prevIssues.map((issue) =>
              issue._id === issueId ? { ...issue, ...result.data } : issue
            )
          );
        }
        return true;
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        return false;
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || 'Failed to update status.');
        return false;
      }
    } catch (err) {
      console.error('[useIssues] Status update error:', err.message);
      setError('Network error. Please check your connection.');
      return false;
    }
  };

  return {
    issues,
    loading,
    error,
    refetch: fetchIssues,
    updateIssueStatus,
  };
};

export default useIssues;
