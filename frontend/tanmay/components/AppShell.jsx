import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from '../../src/components/ui/Footer';

export const AppShell = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gov-surface text-gov-text-body antialiased selection:bg-gov-accent selection:text-gov-navy font-sans">
      {/* Top Global Corporate Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {children || <Outlet />}
      </main>

      {/* 4-Column Corporate Government Footer */}
      <Footer />
    </div>
  );
};

export default AppShell;
