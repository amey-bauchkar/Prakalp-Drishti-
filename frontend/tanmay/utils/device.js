const DEVICE_ID_KEY = 'jharkhand_civic_voter_id';
const UPVOTED_ISSUES_KEY = 'jharkhand_civic_upvoted_issues';

/**
 * Generate a pseudo-UUID if crypto.randomUUID is not available
 * @returns {string}
 */
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'voter_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

/**
 * Retrieve or generate a persistent unique anonymous device/voter ID
 * Allows citizens to upvote without full account login
 * @returns {string}
 */
export const getDeviceId = () => {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateUUID();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch (error) {
    console.warn('LocalStorage unavailable for device ID, using session fallback:', error);
    return 'temp_' + Date.now();
  }
};

/**
 * Get all issue IDs that this device has already upvoted
 * @returns {string[]}
 */
export const getUpvotedIssueIds = () => {
  try {
    const raw = localStorage.getItem(UPVOTED_ISSUES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Error reading upvoted issues:', error);
    return [];
  }
};

/**
 * Check if the user has already upvoted a specific issue
 * @param {string} issueId
 * @returns {boolean}
 */
export const hasUpvotedIssue = (issueId) => {
  if (!issueId) return false;
  const list = getUpvotedIssueIds();
  return list.includes(String(issueId));
};

/**
 * Save an issue ID as upvoted locally
 * @param {string} issueId
 */
export const recordUpvotedIssue = (issueId) => {
  if (!issueId) return;
  try {
    const list = getUpvotedIssueIds();
    const idStr = String(issueId);
    if (!list.includes(idStr)) {
      list.push(idStr);
      localStorage.setItem(UPVOTED_ISSUES_KEY, JSON.stringify(list));
    }
  } catch (error) {
    console.error('Error saving upvoted issue:', error);
  }
};

/**
 * Remove an issue from the upvoted list
 * @param {string} issueId
 */
export const removeUpvotedIssue = (issueId) => {
  if (!issueId) return;
  try {
    const list = getUpvotedIssueIds();
    const updated = list.filter((id) => id !== String(issueId));
    localStorage.setItem(UPVOTED_ISSUES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error removing upvoted issue:', error);
  }
};
