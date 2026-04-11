import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Calendar } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg, #F4F1EC)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 24,
        fontFamily: 'var(--font-sans)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle Skeleton Backdrop */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          opacity: 0.1,
          pointerEvents: 'none',
          padding: '40px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: '24px'
        }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ background: 'var(--text-secondary)', borderRadius: '16px' }} />
          ))}
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div className="minimal-spinner" />
          <p style={{ 
            fontSize: '0.875rem', 
            fontWeight: 500, 
            color: 'var(--text-secondary, #6B6454)', 
            margin: 0,
            letterSpacing: '0.02em'
          }}>
            Loading your workspace...
          </p>
        </div>

        <style>{`
          .minimal-spinner {
            width: 28px;
            height: 28px;
            border: 2px solid rgba(242, 201, 76, 0.15);
            border-top: 2px solid var(--accent, #F2C94C);
            border-radius: 50%;
            animation: minimal-spin 0.8s linear infinite;
          }
          @keyframes minimal-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
