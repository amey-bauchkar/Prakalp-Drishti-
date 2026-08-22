import { getDeviceId, recordUpvotedIssue, hasUpvotedIssue } from '../utils/device';
import { extractCoordinates, getIssueDistance, formatDistance, sortIssuesByDistance } from '../utils/distance';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Fetch issues near a specific latitude and longitude
 *
 * @param {object} params
 * @param {number} params.lat Latitude
 * @param {number} params.lng Longitude
 * @param {number} [params.radius=2000] Radius in meters
 * @param {string} [params.category] Optional category filter
 * @returns {Promise<Array>} List of nearby issues with distance calculations
 */
export const fetchNearbyIssues = async ({ lat, lng, radius = 2000, category = null }) => {
  const userCoords = (lat !== undefined && lng !== undefined) ? [lat, lng] : null;

  if (!userCoords) {
    throw new Error('GPS coordinates are required to find nearby issues.');
  }

  // Try the dedicated nearby endpoint
  try {
    let url = `${API_BASE_URL}/api/issues/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
    if (category && category !== 'All') {
      url += `&category=${encodeURIComponent(category)}`;
    }

    const response = await fetch(url);
    if (response.ok) {
      const json = await response.json();
      const rawData = json.data || json.issues || json;
      if (Array.isArray(rawData)) {
        return sortIssuesByDistance(rawData, userCoords);
      }
    }
  } catch (err) {
    console.warn('Backend /api/issues/nearby not reachable:', err.message);
  }

  // Fallback: Try general GET /api/issues and compute proximity on client
  try {
    const fallbackResponse = await fetch(`${API_BASE_URL}/api/issues?limit=100`);
    if (fallbackResponse.ok) {
      const json = await fallbackResponse.json();
      const allIssues = json.data || json.issues || json;
      if (Array.isArray(allIssues) && allIssues.length > 0) {
        let filtered = allIssues.filter((item) => item.status !== 'Resolved');
        if (category && category !== 'All') {
          filtered = filtered.filter((item) => item.category?.toLowerCase() === category.toLowerCase());
        }

        const withDist = sortIssuesByDistance(filtered, userCoords);
        const withinRadius = withDist.filter((item) => item.distanceMeters <= radius);
        return withinRadius.length > 0 ? withinRadius : withDist.slice(0, 8);
      }
    }
  } catch (err) {
    console.error('Backend not reachable:', err.message);
  }

  // No data available — return empty array (no mock data)
  return [];
};

/**
 * Upvote an issue with backend sync and persistent local state
 *
 * @param {string} issueId ID of the issue to upvote
 * @returns {Promise<{ success: boolean, upvotes: number }>}
 */
export const upvoteIssue = async (issueId) => {
  const voterId = getDeviceId();

  // Optimistically record vote in local storage
  recordUpvotedIssue(issueId);

  try {
    const response = await fetch(`${API_BASE_URL}/api/issues/${issueId}/upvote`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ voterId }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        upvotes: data.data?.upvotes || data.upvotes,
      };
    } else {
      return { success: false };
    }
  } catch (err) {
    console.error('Upvote failed:', err.message);
    return { success: false };
  }
};
