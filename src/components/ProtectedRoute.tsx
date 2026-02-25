import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Calendar } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authLoading } = useApp();
  const location = useLocation();

  // Wait for Supabase session check before making any routing decision.
  // Without this, Google OAuth redirects back to "/" → ProtectedRoute sees
  // isAuthenticated=false and immediately redirects to /login before
  // onAuthStateChange has a chance to fire.
  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-500/30 animate-pulse">
          <Calendar className="text-white w-7 h-7" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:300ms]" />
        </div>
        <p className="text-slate-500 text-sm font-medium">Verifying session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
