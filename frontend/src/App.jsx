import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from '../tanmay/context/AuthContext';
import { LanguageProvider } from '../tanmay/i18n/LanguageContext';
import AppShell from '../tanmay/components/AppShell';
import ProtectedRoute from '../tanmay/components/ProtectedRoute';
import AdminLogin from '../tanmay/components/AdminLogin';
import NearbyIssuesView from '../tanmay/components/nearby/NearbyIssuesView';
import CitizenPortal from '../janhavi/components/CitizenPortal';
import AdminDashboard from '../purva/components/AdminDashboard';
import WorkerDashboard from '../tanmay/components/WorkerDashboard';
import TrackComplaint from '../janhavi/components/TrackComplaint';
import UnifiedPortal from './UnifiedPortal';
import { ArrowLeft, Shield, Building2 } from 'lucide-react';

import { useLanguage } from '../tanmay/i18n/LanguageContext';

/**
 * Standalone Citizen Report Page with executive framing
 */
const StandaloneCitizenPage = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-[calc(100vh-14rem)] bg-gov-surface py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Top Breadcrumb Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gov-muted hover:text-gov-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('app.backToCommand')}</span>
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gov-navy bg-gov-accent/20 px-2.5 py-1 rounded border border-gov-accent-dark/30">
            {t('app.officialForm')}
          </span>
        </div>

        {/* Embedded Mobile Portal — uses Vite proxy, no hardcoded URL */}
        <CitizenPortal apiBaseUrl="" />
      </div>
    </div>
  );
};

/**
 * Standalone Admin Dashboard Page with executive framing
 */
const StandaloneAdminPage = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-[calc(100vh-14rem)] bg-gov-surface py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Top Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gov-muted hover:text-gov-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('app.backToCommand')}</span>
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-gov-navy px-2.5 py-1 rounded">
            {t('app.authorizedAdmin')}
          </span>
        </div>

        {/* Admin Dashboard Card */}
        <div className="bg-white rounded-xl p-6 sm:p-8 shadow-card border border-gov-border">
          <AdminDashboard />
        </div>
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Main App Layout Shell */}
            <Route path="/" element={<AppShell />}>
              {/* Complete Unified Command Center */}
              <Route index element={<UnifiedPortal />} />

              {/* Dedicated Standalone Sub-Routes */}
              <Route path="report" element={<StandaloneCitizenPage />} />
              <Route path="nearby" element={<NearbyIssuesView />} />
              <Route path="track" element={<TrackComplaint />} />
              <Route path="login" element={<AdminLogin />} />
              <Route
                path="worker"
                element={
                  <ProtectedRoute allowedRoles={['worker']}>
                    <WorkerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <StandaloneAdminPage />
                  </ProtectedRoute>
                }
              />

              {/* Wildcard / Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
