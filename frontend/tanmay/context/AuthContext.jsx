import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getToken,
  setToken,
  getUser,
  setUser,
  clearAuth,
} from '../utils/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on initial mount
  useEffect(() => {
    try {
      const storedToken = getToken();
      const storedUser = getUser();

      if (storedToken) {
        setTokenState(storedToken);
        setUserState(storedUser || { role: 'admin', email: 'admin@jharkhand.gov' });
      }
    } catch (err) {
      console.error('Failed to restore auth session:', err);
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Log in user with received JWT token and user info
   * @param {string} newToken
   * @param {object} [newUserData]
   */
  const login = (newToken, newUserData = null) => {
    const userData = newUserData || { role: 'admin', email: 'admin@jharkhand.gov' };
    setToken(newToken);
    setUser(userData);
    setTokenState(newToken);
    setUserState(userData);
  };

  /**
   * Log out current user and clear local credentials
   */
  const logout = () => {
    clearAuth();
    setTokenState(null);
    setUserState(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to access auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
