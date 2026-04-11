import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Calendar } from 'lucide-react';
import GlobalNotification from './GlobalNotification';

export default function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div style={{ background: 'var(--bg)', minHeight: 'auto' }}>
      <GlobalNotification />
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div
        style={{
          flex: 1,
          paddingLeft: 0,
          transition: 'padding-left 0.25s',
          minHeight: 'auto',
        }}
        className={`main-area ${isCollapsed ? 'main-area-collapsed' : ''}`}
      >
        <header
          style={{
            height: 56,
            background: 'var(--surface)',
            borderBottom: '1.5px solid var(--border)',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
          className="mobile-header"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo-badge">
              <Calendar style={{ width: 18, height: 18 }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Timegen
            </span>
          </div>
          <button
            onClick={() => setIsMobileOpen(true)}
            style={{
              background: 'var(--surface-2)',
              border: '1.5px solid var(--border)',
              borderRadius: 8,
              padding: '6px 8px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center',
            }}
          >
            <Menu style={{ width: 18, height: 18 }} />
          </button>
        </header>

        <main style={{ padding: '20px 24px 12px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .mobile-header { display: none !important; }
          .main-area { padding-left: var(--sidebar-w) !important; }
          .main-area-collapsed { padding-left: var(--sidebar-w-collapsed) !important; }
        }
        @media (max-width: 1023px) {
          .main-area { padding-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
