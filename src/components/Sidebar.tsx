import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  School,
  DoorOpen,
  Sparkles,
  CalendarDays,
  LogOut,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ConfirmModal } from './UI';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',      path: '/' },
  { icon: BookOpen,        label: 'Subjects',        path: '/subjects' },
  { icon: Users,           label: 'Faculty',         path: '/faculty' },
  { icon: School,          label: 'Classes',         path: '/classes' },
  { icon: DoorOpen,        label: 'Rooms',           path: '/rooms' },
  { icon: Sparkles,        label: 'Generate',        path: '/generate' },
  { icon: CalendarDays,    label: 'View Timetable',  path: '/view-timetable' },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const { logout, user } = useApp();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {isMobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(26,23,16,0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
          }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        style={{
          position: 'fixed', top: 0, left: 0,
          height: '100vh',
          width: isCollapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)',
          background: 'var(--surface)',
          borderRight: '1.5px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          zIndex: 50,
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.25s',
          overflow: 'visible',
          transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        className="lg-sidebar"
      >
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1.5px solid var(--border)',
          minHeight: 68,
          padding: isCollapsed ? '0' : '0 16px',
        }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 12,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div className="logo-badge" style={{ margin: 0 }}>
              <Calendar style={{ width: 20, height: 20 }} />
            </div>
            {!isCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  Timegen
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                  Smart Scheduling
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              position: isCollapsed ? 'absolute' : 'relative',
              right: isCollapsed ? -12 : 'auto', // Push to the right edge when collapsed
              width: 26, height: 26,
              borderRadius: '50%',
              background: 'var(--accent)',
              border: '2px solid var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              color: 'var(--accent-text)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              zIndex: 10,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            className="desktop-only"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed
              ? <ChevronRight style={{ width: 14, height: 14 }} />
              : <ChevronLeft  style={{ width: 14, height: 14 }} />
            }
          </button>

          <button
            onClick={() => setIsMobileOpen(false)}
            style={{
              background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 8, cursor: 'pointer',
              color: 'var(--text-primary)', width: 28, height: 28, 
              display: 'none', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.1s ease',
              marginLeft: 'auto'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
            className="mobile-close-btn"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setIsMobileOpen(false)}
              style={({ isActive }) => ({
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                borderRadius: 10,
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-muted)' : 'transparent',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              })}
              className="nav-link-item"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div style={{
                      position: 'absolute', left: 0, top: '20%', height: '60%', width: 4,
                      background: 'var(--accent)', borderRadius: '0 4px 4px 0'
                    }} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, flexShrink: 0 }}>
                    <item.icon
                      style={{
                        width: 18, height: 18,
                        color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                        transition: 'color 0.15s ease'
                      }}
                    />
                  </div>
                  {!isCollapsed && <span style={{ transition: 'color 0.15s ease' }}>{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{
          padding: '10px',
          borderTop: '1.5px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <NavLink
            to="/settings"
            onClick={() => setIsMobileOpen(false)}
            style={({ isActive }) => ({
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              borderRadius: 10,
              textDecoration: 'none',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.875rem',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-muted)' : 'transparent',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            })}
            className="nav-link-item"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '20%', height: '60%', width: 4,
                    background: 'var(--accent)', borderRadius: '0 4px 4px 0'
                  }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, flexShrink: 0 }}>
                  <Settings style={{ width: 18, height: 18, color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)', transition: 'color 0.15s ease' }} />
                </div>
                {!isCollapsed && <span style={{ transition: 'color 0.15s ease' }}>Settings</span>}
              </>
            )}
          </NavLink>

          <button
            onClick={() => setIsLogoutModalOpen(true)}
            style={{
              position: 'relative',
              display: 'flex', alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              borderRadius: 10,
              background: 'transparent', border: 'none', cursor: 'pointer',
              width: '100%',
              fontWeight: 500, fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
            onMouseEnter={e => { 
              (e.currentTarget as HTMLElement).style.background = 'var(--danger-bg)'; 
              (e.currentTarget as HTMLElement).style.color = 'var(--danger-text)'; 
              const icon = e.currentTarget.querySelector('svg');
              if(icon) icon.style.color = 'inherit';
            }}
            onMouseLeave={e => { 
              (e.currentTarget as HTMLElement).style.background = 'transparent'; 
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; 
              const icon = e.currentTarget.querySelector('svg');
              if(icon) icon.style.color = 'var(--text-secondary)';
            }}
            className="nav-link-item logout-nav-item"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, flexShrink: 0 }}>
              <LogOut style={{ width: 18, height: 18, color: 'var(--text-secondary)', transition: 'color 0.15s ease' }} />
            </div>
            {!isCollapsed && <span style={{ transition: 'color 0.15s ease' }}>Log out</span>}
          </button>

          {user && !isCollapsed && (
            <div style={{
              marginTop: 4,
              padding: '10px 12px',
              background: 'var(--surface-2)',
              borderRadius: 10,
              border: '1.5px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 32, height: 32,
                background: 'var(--accent)',
                borderRadius: 999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.875rem', color: 'var(--accent-text)',
                flexShrink: 0,
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
              </div>
            </div>
          )}
        </div>

      </aside>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          handleLogout();
        }}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Log out"
        type="danger"
      />

      <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar { transform: translateX(0) !important; }
          .mobile-close-btn { display: none !important; }
          .desktop-only { display: flex !important; }
        }
        @media (max-width: 1023px) {
          .desktop-only { display: none !important; }
          .mobile-close-btn { display: flex !important; }
        }
        .nav-link-item:hover {
          background: var(--surface-2) !important;
          color: var(--text-primary) !important;
        }
      `}</style>
    </>
  );
}
