const TOKEN_KEY = 'jharkhand_civic_auth_token';
const USER_KEY = 'jharkhand_civic_auth_user';

/**
 * Retrieve stored JWT from localStorage
 * @returns {string|null}
 */
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error reading token from localStorage:', error);
    return null;
  }
};

/**
 * Persist JWT to localStorage
 * @param {string} token
 */
export const setToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Error writing token to localStorage:', error);
  }
};

/**
 * Remove JWT from localStorage
 */
export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token from localStorage:', error);
  }
};

/**
 * Retrieve cached user data from localStorage
 * @returns {object|null}
 */
export const getUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Error reading user data from localStorage:', error);
    return null;
  }
};

/**
 * Persist user data to localStorage
 * @param {object} user
 */
export const setUser = (user) => {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch (error) {
    console.error('Error writing user to localStorage:', error);
  }
};

/**
 * Remove user data from localStorage
 */
export const removeUser = () => {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error removing user from localStorage:', error);
  }
};

/**
 * Clear all auth credentials
 */
export const clearAuth = () => {
  removeToken();
  removeUser();
};

/**
 * Return authorization headers for API requests
 * @returns {object}
 */
export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
