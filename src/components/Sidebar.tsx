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

  React.useEffect(() => {
    const root = document.documentElement;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = root.style.overflow;

    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
      root.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalBodyOverflow;
      root.style.overflow = originalHtmlOverflow;
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      root.style.overflow = originalHtmlOverflow;
    };
  }, [isMobileOpen]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 flex h-[100dvh] w-[min(80vw,320px)] flex-col bg-surface border-r border-base shadow-xl transition-transform duration-300 ease-out lg:static lg:h-auto lg:w-[var(--sidebar-w)] ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b border-base px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="logo-badge" style={{ margin: 0 }}>
              <Calendar style={{ width: 20, height: 20 }} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col leading-none">
                <div className="text-[1.05rem] font-black text-[var(--text-primary)]">Timegen</div>
                <div className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] mt-1">Smart Scheduling</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="desktop-only inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] border-2 border-[var(--surface)] text-[var(--accent-text)] shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition hover:scale-110"
            >
              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={() => setIsMobileOpen(false)}
              className="mobile-close-btn inline-flex h-9 w-9 items-center justify-center rounded-xl border border-base bg-[var(--surface-2)] text-[var(--text-primary)] transition hover:bg-[var(--border)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 space-y-2 overscroll-contain touch-pan-y">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-[var(--accent-muted)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'} ${isCollapsed ? 'justify-center' : 'justify-start'}`}
            >
              <div className="flex h-6 w-6 items-center justify-center flex-shrink-0">
                <item.icon className="h-4.5 w-4.5 text-[var(--text-secondary)] group-active:text-[var(--accent-text)]" />
              </div>
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-base px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex flex-col gap-2">
            <NavLink
              to="/settings"
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-[var(--accent-muted)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'} ${isCollapsed ? 'justify-center' : 'justify-start'}`}
            >
              <Settings className="h-4.5 w-4.5 text-[var(--text-secondary)] group-active:text-[var(--accent-text)]" />
              {!isCollapsed && <span>Settings</span>}
            </NavLink>

            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--danger-bg)] hover:text-[var(--danger-text)] ${isCollapsed ? 'justify-center' : 'justify-start'}`}
            >
              <LogOut className="h-4.5 w-4.5" />
              {!isCollapsed && <span>Log out</span>}
            </button>

            {user && !isCollapsed && (
              <div className="mt-2 rounded-2xl border border-base bg-[var(--surface-2)] p-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-text)] font-black">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 overflow-hidden">
                  <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{user.name}</div>
                  <div className="truncate text-xs text-[var(--text-secondary)]">{user.email}</div>
                </div>
              </div>
            )}
          </div>
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
          .desktop-only { display: inline-flex !important; }
        }
        @media (max-width: 1023px) {
          .desktop-only { display: none !important; }
          .mobile-close-btn { display: inline-flex !important; }
        }
      `}</style>
    </>
  );
}

          return (
