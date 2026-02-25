import React, { useState } from 'react';
import { Card, Button, Badge } from '../components/UI';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lock,
  FlaskConical,
  CalendarDays,
  ShieldCheck,
  BookOpen,
  Users,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { generateTimetable as runEngine, validateSchedule } from '../utils/timetableEngine';

const FIXED_KEYWORDS = ['library', 'nptel', 'tws', 'placement'];
const isFixedSubject = (name: string) =>
  FIXED_KEYWORDS.some(kw => name.toLowerCase().includes(kw));

interface EnginePreview {
  fixed: string[];
  labs: string[];
  highPriority: string[];
  theory: string[];
  warnings: string[];
  stats: { totalSlotsFilled: number; totalSlotsAvailable: number };
}

export default function Generate() {
  const { subjects, faculty, classes, rooms, settings, generateTimetable } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(`Timetable ${new Date().toLocaleDateString()}`);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<EnginePreview | null>(null);
  const [showConstraints, setShowConstraints] = useState(false);

  const isReady = subjects.length > 0 && faculty.length > 0 && classes.length > 0;

  const handlePreview = () => {
    const result = runEngine({ subjects, faculty, classes, rooms, settings });
    const issues = validateSchedule(result.schedule, subjects, faculty, settings);

    const fixed = subjects.filter(s => isFixedSubject(s.name) && s.subjectType !== 'Laboratory').map(s => s.name);
    const labs = subjects.filter(s => s.subjectType === 'Laboratory').map(s => s.name);
    const high = subjects.filter(s => !isFixedSubject(s.name) && s.subjectType !== 'Laboratory' && s.priority === 'High').map(s => s.name);
    const theory = subjects.filter(s => !isFixedSubject(s.name) && s.subjectType !== 'Laboratory' && s.priority !== 'High').map(s => s.name);

    setPreview({
      fixed,
      labs,
      highPriority: high,
      theory,
      warnings: [...result.warnings, ...issues.filter(i => i.severity === 'error').map(i => i.message)],
      stats: result.stats,
    });
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(async () => {
      try {
        await generateTimetable(name);
        navigate('/view-timetable');
      } catch (error) {
        console.error('Failed to generate timetable', error);
        window.alert('Could not save generated timetable to backend.');
      } finally {
        setIsGenerating(false);
      }
    }, 800);
  };

  const CONSTRAINTS = [
    {
      icon: ShieldCheck,
      title: 'Weekly Period Quota',
      desc: 'Each subject is allocated exactly its defined weekly periods. Quotas are tracked per-class and never exceeded.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: Lock,
      title: 'Fixed Slot Pre-allocation',
      desc: 'Library, NPTEL, TWS, Placement are locked into slots before any theory allocation begins. These slots cannot be overwritten.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: FlaskConical,
      title: 'Lab Block Scheduling',
      desc: 'Labs are placed in 2-consecutive-period blocks on the same day. Labs are never split across days or break windows.',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      icon: CalendarDays,
      title: 'Day-wise Distribution',
      desc: 'A subject appears at most 2 times per day. Immediate same-subject adjacency is avoided wherever alternatives exist.',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      icon: Info,
      title: 'Break Handling',
      desc: 'Short Break and Lunch Break are non-teaching blocks. Period indexing skips these intervals entirely.',
      color: 'text-slate-400',
      bg: 'bg-slate-500/10 border-slate-500/20',
    },
    {
      icon: Users,
      title: 'Faculty Spacing Rule',
      desc: 'The engine avoids assigning the same faculty in back-to-back periods within a day. A relaxed pass is used only if no other option exists.',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      icon: Cpu,
      title: 'CSP Generation Strategy',
      desc: 'Allocation order: Fixed slots → Labs → High-credit theory → Low-credit theory. Priority-based candidate ranking drives each slot decision.',
      color: 'text-brand-400',
      bg: 'bg-brand-500/10 border-brand-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl text-text-header">Generate Timetable</h1>
        <p className="text-text-muted">
          Rule-based constraint-satisfaction engine — no random assignment
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left panel ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Data readiness */}
          <Card title="Data Readiness">
            <div className="space-y-4">
              {[
                { label: 'Subjects', count: subjects.length, href: '/subjects' },
                { label: 'Faculty', count: faculty.length, href: '/faculty' },
                { label: 'Classes', count: classes.length, href: '/classes' },
                { label: 'Rooms', count: rooms.length, href: '/rooms' },
              ].map(({ label, count, href }) => (
                <div
                  key={label}
                  className={`flex items-center justify-between p-4 rounded-xl border ${count > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {count > 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    )}
                    <span className={`font-semibold ${count > 0 ? 'text-emerald-900' : 'text-amber-900'}`}>
                      {label}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(href)}
                    className={`text-sm font-bold hover:underline ${count > 0 ? 'text-emerald-700' : 'text-amber-700'}`}
                  >
                    {count > 0 ? `${count} ready` : '— add data'}
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Configuration */}
          <Card title="Configuration">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-text-main mb-2">Timetable Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {isReady && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    icon={BookOpen}
                    onClick={handlePreview}
                    disabled={isGenerating}
                  >
                    Preview Engine Plan
                  </Button>
                )}
                <Button
                  className="flex-1 py-4 text-lg"
                  icon={Sparkles}
                  disabled={!isReady || isGenerating}
                  onClick={handleGenerate}
                >
                  {isGenerating ? 'Engine Processing...' : 'Generate Timetable'}
                </Button>
              </div>

              {!isReady && (
                <p className="text-center text-sm text-amber-600 font-medium">
                  Add at least one subject, faculty member, and class to enable generation.
                </p>
              )}
            </div>
          </Card>

          {/* Engine preview panel */}
          {preview && (
            <Card title="Engine Allocation Plan">
              <div className="space-y-5">
                {/* Stats bar */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[160px] p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
                    <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-1">Slots Filled</p>
                    <p className="text-2xl font-bold text-text-header">
                      {preview.stats.totalSlotsFilled}
                      <span className="text-sm text-slate-400 font-normal ml-1">/ {preview.stats.totalSlotsAvailable}</span>
                    </p>
                  </div>
                  <div className="flex-1 min-w-[160px] p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-1">Warnings</p>
                    <p className="text-2xl font-bold text-text-header">{preview.warnings.length}</p>
                  </div>
                </div>

                {/* Phase breakdown */}
                {[
                  { label: '① Fixed / Non-flexible (Phase 1)', items: preview.fixed, color: 'text-amber-400', badge: 'warning' as const },
                  { label: '② Lab Blocks (Phase 2)', items: preview.labs, color: 'text-purple-400', badge: 'info' as const },
                  { label: '③ High-credit Theory (Phase 3a)', items: preview.highPriority, color: 'text-emerald-400', badge: 'success' as const },
                  { label: '④ Standard Theory (Phase 3b)', items: preview.theory, color: 'text-slate-400', badge: 'neutral' as const },
                ].map(({ label, items, color, badge }) => (
                  <div key={label}>
                    <p className={`text-xs font-bold mb-2 ${color}`}>{label}</p>
                    {items.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">None</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {items.map(subjectName => (
                          <span key={subjectName}>
                            <Badge variant={badge}>{subjectName}</Badge>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Warnings */}
                {preview.warnings.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-amber-400">⚠ Constraint Issues</p>
                    {preview.warnings.map((w, i) => (
                      <div key={i} className="flex gap-2 p-3 bg-amber-950/30 border border-amber-500/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-300">{w}</p>
                      </div>
                    ))}
                  </div>
                )}

                {preview.warnings.length === 0 && (
                  <div className="flex gap-2 p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-300">All constraints satisfied — timetable is valid.</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="space-y-6">
          <Card title="Generation Phases">
            <div className="space-y-5">
              {[
                { n: 1, title: 'Fixed Slot Lock-in', desc: 'Library, NPTEL, TWS, Placement pre-assigned before anything else.' },
                { n: 2, title: 'Lab Block Allocation', desc: '2-period consecutive blocks placed on valid days within quota.' },
                { n: 3, title: 'Theory — High Priority', desc: 'High-credit subjects fill remaining slots first (max 2/day).' },
                { n: 4, title: 'Theory — Standard', desc: 'Remaining theory subjects fill gaps; all faculty spacing rules apply.' },
                { n: 5, title: 'Post-generation Audit', desc: 'Full constraint validation pass produces warnings for any violations.' },
              ].map(({ n, title, desc }) => (
                <div key={n} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold shrink-0 text-sm">
                    {n}
                  </div>
                  <div>
                    <p className="font-bold text-text-header text-sm">{title}</p>
                    <p className="text-xs text-text-muted mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Constraint details accordion */}
          <Card>
            <button
              onClick={() => setShowConstraints(v => !v)}
              className="w-full flex items-center justify-between"
            >
              <span className="font-bold text-text-header text-sm">7 Active Constraints</span>
              {showConstraints ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showConstraints && (
              <div className="mt-5 space-y-3">
                {CONSTRAINTS.map(({ icon: Icon, title, desc, color, bg }) => (
                  <div key={title} className={`p-3 rounded-xl border ${bg}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <p className={`text-xs font-bold ${color}`}>{title}</p>
                    </div>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
