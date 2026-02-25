import React from 'react';
import { useApp } from '../context/AppContext';
import { Card, Button } from '../components/UI';
import { Plus, Trash2, Clock, Minus } from 'lucide-react';
import { CollegeSettings, Break } from '../types';

// Helper: patch settings and save directly to context
function patch(
  settings: CollegeSettings,
  updateSettings: (s: CollegeSettings) => void,
  changes: Partial<CollegeSettings>
) {
  updateSettings({ ...settings, ...changes });
}

export default function Settings() {
  const { settings, updateSettings, theme, setTheme } = useApp();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // ── Working days ──────────────────────────────────────────────────────────
  const toggleDay = (day: string) => {
    const workingDays = settings.workingDays.includes(day)
      ? settings.workingDays.filter(d => d !== day)
      : [...settings.workingDays, day];
    patch(settings, updateSettings, { workingDays });
  };

  // ── Breaks ────────────────────────────────────────────────────────────────
  const addBreak = () => {
    const newBreak: Break = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Break',
      startTime: '12:00',
      endTime: '13:00',
    };
    patch(settings, updateSettings, { breaks: [...settings.breaks, newBreak] });
  };

  const removeBreak = (id: string) => {
    patch(settings, updateSettings, { breaks: settings.breaks.filter(b => b.id !== id) });
  };

  const updateBreak = (id: string, field: keyof Break, value: string) => {
    patch(settings, updateSettings, {
      breaks: settings.breaks.map(b => b.id === id ? { ...b, [field]: value } : b),
    });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-text-header">College Settings</h1>
          <p className="text-sm md:text-base text-slate-500 font-medium">
            Changes are saved automatically as you edit
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-bold text-emerald-400">Auto-saved</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Working Days & Hours ── */}
        <Card title="Working Days & Hours" subtitle="Define when the college is active">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                Working Days
              </label>
              <div className="flex flex-wrap gap-3">
                {days.map(day => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border ${settings.workingDays.includes(day)
                      ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20'
                      : 'bg-dark-bg text-slate-500 border-dark-border hover:border-slate-600'
                      }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Start Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="time"
                    value={settings.startTime}
                    onChange={e => patch(settings, updateSettings, { startTime: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-dark-bg border border-dark-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-text-main font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                  End Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="time"
                    value={settings.endTime}
                    onChange={e => patch(settings, updateSettings, { endTime: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-dark-bg border border-dark-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-text-main font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Period Duration (minutes)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    patch(settings, updateSettings, {
                      periodDuration: Math.max(30, settings.periodDuration - 5),
                    })
                  }
                  className="w-11 h-11 rounded-xl border border-dark-border bg-dark-bg text-text-main flex items-center justify-center hover:bg-dark-border/50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={30}
                  step={5}
                  value={settings.periodDuration}
                  onChange={e =>
                    patch(settings, updateSettings, {
                      periodDuration: Math.max(30, parseInt(e.target.value || '30', 10)),
                    })
                  }
                  className="w-full px-5 py-4 bg-dark-bg border border-dark-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-text-main font-medium text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    patch(settings, updateSettings, {
                      periodDuration: Math.min(180, settings.periodDuration + 5),
                    })
                  }
                  className="w-11 h-11 rounded-xl border border-dark-border bg-dark-bg text-text-main flex items-center justify-center hover:bg-dark-border/50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Breaks ── */}
        <Card
          title="Intervals & Lunch Breaks"
          subtitle="Add non-teaching slots to the schedule"
          headerAction={
            <Button variant="outline" size="sm" icon={Plus} onClick={addBreak}>
              Add Break
            </Button>
          }
        >
          <div className="space-y-4">
            {settings.breaks.map(b => (
              <div key={b.id} className="p-5 bg-dark-bg/50 rounded-2xl border border-dark-border space-y-4">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={b.name}
                    onChange={e => updateBreak(b.id, 'name', e.target.value)}
                    className="bg-transparent font-bold text-text-main focus:outline-none border-b border-transparent focus:border-brand-500 placeholder:text-slate-700"
                    placeholder="Break Name"
                  />
                  <button onClick={() => removeBreak(b.id)} className="text-slate-600 hover:text-red-400 p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Start</span>
                    <input
                      type="time"
                      value={b.startTime}
                      onChange={e => updateBreak(b.id, 'startTime', e.target.value)}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-text-main text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">End</span>
                    <input
                      type="time"
                      value={b.endTime}
                      onChange={e => updateBreak(b.id, 'endTime', e.target.value)}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-text-main text-sm font-medium"
                    />
                  </div>
                </div>
              </div>
            ))}
            {settings.breaks.length === 0 && (
              <div className="text-center py-12 bg-dark-bg/30 rounded-2xl border border-dashed border-dark-border">
                <p className="text-slate-600 text-sm font-medium italic">No breaks configured</p>
              </div>
            )}
          </div>
        </Card>

        {/* ── Theme ── */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Theme</label>
          <div className="flex w-full p-1.5 gap-1.5 rounded-2xl bg-dark-bg border border-dark-border">
            {(['light', 'dark', 'system'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 py-2.5 rounded-[1.2rem] text-sm font-bold transition-all ${theme === t
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'text-slate-500 hover:bg-white/5'
                  }`}
              >
                <span className="capitalize">{t}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
