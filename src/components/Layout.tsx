import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
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
            padding: '0 12px',
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

        <main style={{ padding: '12px 16px 12px', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 56px)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', flex: 1, width: '100%' }}>
            <Outlet />
          </div>
          
          <footer style={{ 
            maxWidth: 1200, 
            margin: '24px auto 0', 
            padding: '16px 0', 
            borderTop: '1.5px solid var(--border)',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/terms" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }} className="footer-link">Terms</Link>
              <Link to="/privacy" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }} className="footer-link">Privacy</Link>
              <a href="mailto:support@timegen.app" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }} className="footer-link">Support</a>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-placeholder)', margin: 0 }}>
              © 2026 Timetable AI. Built for smarter education.
            </p>
          </footer>
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
          .mobile-header { height: 56px !important; }
          main { min-height: calc(100vh - 56px) !important; }
        }
        .footer-link:hover {
          color: var(--accent) !important;
        }
      `}</style>
    </div>
  );
}
