import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute Guard Component
 * Guards admin and worker sensitive routes with RBAC verification.
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // If auth state is still restoring from localStorage, show a clean loader
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="w-8 h-8 text-gov-navy animate-spin" />
        <span className="text-sm font-bold uppercase tracking-wider text-gov-muted">Verifying session...</span>
      </div>
    );
  }

  // If user is not authenticated, bounce to /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user.role || 'admin';

  // If role-based constraint is specified and current role is not allowed
  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(userRole)) {
    if (userRole === 'worker') {
      return <Navigate to="/worker" replace />;
    }
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
