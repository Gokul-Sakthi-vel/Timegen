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
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useApp } from '../context/AppContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: BookOpen, label: 'Subjects', path: '/subjects' },
  { icon: Users, label: 'Faculty', path: '/faculty' },
  { icon: School, label: 'Classes', path: '/classes' },
  { icon: DoorOpen, label: 'Rooms', path: '/rooms' },
  { icon: Sparkles, label: 'Generate', path: '/generate' },
  { icon: CalendarDays, label: 'View Timetable', path: '/view-timetable' },
  { icon: Calendar, label: 'Settings', path: '/settings' },
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-screen bg-dark-bg text-text-muted flex flex-col border-r border-dark-border z-50 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Toggle Button (Desktop) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-brand-500 rounded-full hidden lg:flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform z-50"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Close Button (Mobile) */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="absolute right-4 top-4 lg:hidden text-slate-400 hover:text-text-header"
        >
          <X className="w-6 h-6" />
        </button>

        <div className={cn("p-8 flex items-center gap-4 overflow-hidden", isCollapsed && "justify-center px-0")}>
          <div className="w-10 h-10 bg-brand-500 rounded-2xl flex items-center justify-center shadow-xl shadow-brand-500/30 shrink-0">
            <Calendar className="text-white w-6 h-6" />
          </div>
          {!isCollapsed && (
            <div className="whitespace-nowrap">
              <h1 className="text-text-header text-lg font-display font-bold leading-tight">TimeTable AI</h1>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Smart Scheduling</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                isActive 
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" 
                  : "hover:bg-brand-500/10 hover:text-brand-600",
                isCollapsed && "justify-center px-0"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors shrink-0",
                    isActive ? "text-white" : "text-text-muted group-hover:text-brand-600"
                  )} />
                  {!isCollapsed && <span className="whitespace-nowrap font-medium">{item.label}</span>}
                  {isCollapsed && isActive && (
                    <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={cn("p-4 mt-auto border-t border-dark-border", isCollapsed && "px-2")}>
          {user && (
            <div className={cn(
              "flex items-center gap-3 mb-4 p-3 rounded-2xl bg-dark-surface border border-dark-border",
              isCollapsed && "justify-center px-0"
            )}>
              <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-400 text-sm font-bold shrink-0 border border-brand-500/20">
                {user.name.charAt(0)}
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-bold text-text-header truncate">{user.name}</p>
                  <p className="text-[10px] text-text-muted truncate font-medium">{user.email}</p>
                </div>
              )}
            </div>
          )}
          <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-text-muted hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform shrink-0" />
            {!isCollapsed && <span className="font-bold text-sm uppercase tracking-wider">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
