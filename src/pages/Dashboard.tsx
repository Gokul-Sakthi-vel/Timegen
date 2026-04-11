import React from 'react';
import { Card, Button, Badge } from '../components/UI';
import {
  BookOpen,
  Users,
  School,
  DoorOpen,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Lightbulb,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const { subjects, faculty, classes, rooms, timetables, user } = useApp();
  const navigate = useNavigate();

  const stats = [
    { label: 'Subjects',  value: subjects.length, icon: BookOpen,  accent: 'var(--accent-muted)', iconColor: 'var(--accent)', path: '/subjects' },
    { label: 'Faculty',   value: faculty.length,  icon: Users,     accent: 'var(--accent-muted)', iconColor: 'var(--accent)', path: '/faculty' },
    { label: 'Classes',   value: classes.length,  icon: School,    accent: 'var(--accent-muted)', iconColor: 'var(--accent)', path: '/classes' },
    { label: 'Rooms',     value: rooms.length,    icon: DoorOpen,  accent: 'var(--accent-muted)', iconColor: 'var(--accent)', path: '/rooms' },
  ];

  const missingData = [
    { condition: subjects.length === 0, label: 'Add Subjects',         path: '/subjects' },
    { condition: faculty.length === 0,  label: 'Add Faculty Members',  path: '/faculty' },
    { condition: classes.length === 0,  label: 'Add Classes / Sections', path: '/classes' },
  ].filter(item => item.condition);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const insights = React.useMemo(() => {
    const list = [];
    if (classes.length === 0) {
      list.push({ message: 'You have not added any classes yet', icon: AlertCircle, color: 'var(--warning-text)', bg: 'var(--warning-bg)' });
    }
    if (faculty.length > 0 && faculty.length < 3) {
      list.push({ message: 'Add more faculty for better scheduling flexibility', icon: Lightbulb, color: 'var(--accent-text)', bg: 'var(--accent)' });
    }
    if (rooms.length > classes.length + 3 && classes.length > 0) {
      list.push({ message: 'Rooms are currently underutilized', icon: Info, color: 'var(--text-secondary)', bg: 'var(--surface-2)' });
    }
    if (subjects.length > 0 && faculty.length > 0 && classes.length > 0 && timetables.length === 0) {
      list.push({ message: 'System is ready! Generate your first timetable.', icon: Sparkles, color: 'var(--success-text)', bg: 'var(--success-bg)' });
    }
    if (list.length === 0) {
      list.push({ message: 'Your scheduling data looks perfectly balanced.', icon: CheckCircle2, color: 'var(--success-text)', bg: 'var(--success-bg)' });
    }
    return list.slice(0, 3);
  }, [classes.length, faculty.length, rooms.length, subjects.length, timetables.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24, height: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {greeting()}
          </p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            {user?.name ? user.name.split(' ')[0] : 'Dashboard'} 👋
          </h1>
        </div>
        <button
          className="btn btn-primary"
          style={{ borderRadius: 999, padding: '10px 20px', fontWeight: 700 }}
          onClick={() => navigate('/generate')}
        >
          <Sparkles style={{ width: 16, height: 16 }} />
          Generate Timetable
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            onClick={() => navigate(stat.path)}
            style={{
              background: 'var(--surface)',
              border: '1.5px solid var(--border)',
              borderRadius: 16,
              padding: '18px 20px',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s, transform 0.2s',
              animation: `fadeUp 0.3s ease ${i * 0.07}s forwards`,
              opacity: 0,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(26,23,16,0.1)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = '';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '';
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: stat.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14,
            }}>
              <stat.icon style={{ width: 20, height: 20, color: stat.iconColor }} />
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {stat.value}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Body Grid */}
      <div className="dash-body">
        {/* Main Content (Recent) */}
        <div className="dash-main" style={{ minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Setup warning */}
          {missingData.length > 0 && (
            <div style={{
              background: 'var(--warning-bg)',
              border: '1.5px solid var(--warning-border)',
              borderRadius: 16,
              padding: '16px 20px',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <AlertCircle style={{ width: 18, height: 18, color: 'var(--warning-text)', flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: 'var(--warning-text)', margin: '0 0 8px', fontSize: '0.9rem' }}>Setup Required</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {missingData.map(item => (
                      <Link
                        key={item.label}
                        to={item.path}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 14px', borderRadius: 999,
                          background: 'var(--warning-bg)', border: '1.5px solid var(--warning-border)',
                          color: 'var(--warning-text)', fontWeight: 600, fontSize: '0.8rem',
                          textDecoration: 'none', transition: 'background 0.15s',
                        }}
                      >
                        <ArrowRight style={{ width: 13, height: 13 }} />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Timetables */}
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1.5px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', margin: 0 }}>Recent Timetables</h3>
              </div>
              <Link to="/view-timetable" style={{
                fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                View All <ChevronRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
            <div style={{ padding: '8px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              {timetables.length > 0 ? (
                timetables.slice(0, 4).map((t, i) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 20px',
                      borderBottom: i < Math.min(timetables.length, 4) - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.12s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                    onClick={() => navigate('/view-timetable')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'var(--accent-muted)',
                        border: '1.5px solid var(--accent-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Calendar style={{ width: 16, height: 16, color: 'var(--accent-text)' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>{t.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, marginTop: 1 }}>
                          {new Date(t.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      View <ChevronRight style={{ width: 13, height: 13 }} />
                    </span>
                  </div>
                ))
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '48px 24px', textAlign: 'center', flex: 1,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: 'var(--accent-muted)',
                    border: '1.5px solid var(--accent-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 14,
                  }}>
                    <Sparkles style={{ width: 22, height: 22, color: 'var(--accent-text)' }} />
                  </div>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px', fontSize: '0.9rem' }}>No timetables yet</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 18px' }}>Generate your first timetable to get started</p>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/generate')}>
                    <Sparkles style={{ width: 14, height: 14 }} /> Generate Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Panel (Quick Actions & Insights) */}
        <div className="dash-side" style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', justifyContent: 'flex-start' }}>
          {/* Quick Actions */}
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16, padding: '16px 20px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', margin: '0 0 14px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Add Subject', icon: BookOpen, path: '/subjects' },
                { label: 'Add Faculty', icon: Users,    path: '/faculty' },
                { label: 'Add Class',   icon: School,   path: '/classes' },
                { label: 'Add Room',    icon: DoorOpen, path: '/rooms' },
                { label: 'Generate Timetable', icon: Sparkles, path: '/generate' },
              ].map(action => (
                <button
                  key={action.label}
                  className="btn btn-outline"
                  style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 10, padding: '9px 14px', gap: 10 }}
                  onClick={() => navigate(action.path)}
                >
                  <action.icon style={{ width: 15, height: 15 }} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16, padding: '16px 20px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles style={{ width: 14, height: 14, color: 'var(--accent-text)' }} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', margin: 0 }}>AI Insights</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {insights.map((insight, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px', background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: insight.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <insight.icon style={{ width: 15, height: 15, color: insight.color }} />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {insight.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dash-body {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: stretch;
        }
        @media (min-width: 1024px) {
          .dash-body { grid-template-columns: repeat(3, 1fr); }
          .dash-main { grid-column: span 2; }
          .dash-side { grid-column: span 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
