import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, Button, Badge, cn } from '../components/UI';
import { ArrowLeft, Save, RotateCcw, Download } from 'lucide-react';
import { ScheduleSlot } from '../types';
import { buildTimeline, formatTimeRange, TimelineEntry } from '../utils/schedule';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Subject card colour → solid hex approximation for print/border */
const COLOR_MAP: Record<string, string> = {
  'bg-blue-500': '#3b82f6',
  'bg-emerald-500': '#10b981',
  'bg-amber-500': '#f59e0b',
  'bg-purple-500': '#a855f7',
  'bg-rose-500': '#f43f5e',
  'bg-slate-500': '#64748b',
};
const toHex = (cls: string) => COLOR_MAP[cls] ?? '#6366f1';

// ─── Component ────────────────────────────────────────────────────────────────

type DragSource = { classId: string; day: string; time: string };

export default function ScheduleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { timetables, subjects, faculty, rooms, classes, settings, updateTimetable } = useApp();
  const timetable = timetables.find(t => t.id === id);

  const [editableSchedule, setEditableSchedule] = useState<ScheduleSlot[]>([]);
  const [dragSource, setDragSource] = useState<DragSource | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const timetableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timetable) {
      setEditableSchedule(Array.isArray(timetable.schedule) ? timetable.schedule : []);
      setHasChanges(false);
    }
  }, [timetable]);

  if (!timetable) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <h2 className="text-2xl font-bold text-text-header">Timetable not found</h2>
        <Button onClick={() => navigate('/view-timetable')}>Back to List</Button>
      </div>
    );
  }

  const activeSettings = timetable.settingsSnapshot ?? settings;
  const { workingDays, startTime, endTime, periodDuration } = activeSettings;
  const timeline = useMemo(() => buildTimeline(activeSettings), [activeSettings]);

  // Only period entries (non-break)
  const periodEntries = timeline.filter(e => e.type === 'period') as Extract<TimelineEntry, { type: 'period' }>[];

  const getSlot = (classId: string, day: string, time: string) =>
    editableSchedule.find(s => s.classId === classId && s.day === day && s.time === time);

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  const moveOrSwapSlot = (classId: string, targetDay: string, targetTime: string) => {
    if (!dragSource || dragSource.classId !== classId) return;
    if (dragSource.day === targetDay && dragSource.time === targetTime) return;

    setEditableSchedule(prev => {
      const sourceSlot = prev.find(
        s => s.classId === classId && s.day === dragSource.day && s.time === dragSource.time
      );
      if (!sourceSlot) return prev;

      const targetSlot = prev.find(
        s => s.classId === classId && s.day === targetDay && s.time === targetTime
      );

      const base = prev.filter(
        s => !(
          s.classId === classId &&
          ((s.day === dragSource.day && s.time === dragSource.time) ||
            (s.day === targetDay && s.time === targetTime))
        )
      );

      const moved: ScheduleSlot = { ...sourceSlot, day: targetDay, time: targetTime };
      if (targetSlot) base.push({ ...targetSlot, day: dragSource.day, time: dragSource.time });
      base.push(moved);
      return base;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await updateTimetable(id, editableSchedule);
      setHasChanges(false);
      window.alert('Timetable saved successfully.');
    } catch {
      window.alert('Could not save timetable changes to backend.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setEditableSchedule(Array.isArray(timetable.schedule) ? timetable.schedule : []);
    setHasChanges(false);
  };

  const handleDownload = () => {
    if (!timetableRef.current) return;
    setIsDownloading(true);

    try {
      // Collect all <style> and <link rel="stylesheet"> from the current page
      const styleSheets = Array.from(document.styleSheets)
        .map(sheet => {
          try {
            return Array.from(sheet.cssRules).map(r => r.cssText).join('\n');
          } catch {
            // Cross-origin sheet — link to it instead
            return sheet.href ? `@import url('${sheet.href}');` : '';
          }
        })
        .join('\n');

      const html = timetableRef.current.outerHTML;

      const printWindow = window.open('', '_blank', 'width=1400,height=900');
      if (!printWindow) {
        alert('Pop-up blocked — please allow pop-ups for this site and try again.');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>${timetable.name}</title>
          <style>
            /* Capture all app styles */
            ${styleSheets}
            /* Print overrides */
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body {
              margin: 0;
              padding: 24px;
              background: #0f1117;
              color: #e2e8f0;
              font-family: Inter, system-ui, sans-serif;
            }
          </style>
        </head>
        <body>
          ${html}
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 500);
            };
          <\/script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error('Download failed:', err);
      // Ultimate fallback
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Render one timetable table per class ──────────────────────────────────
  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/view-timetable')}
            className="p-3 bg-dark-surface border border-dark-border hover:bg-white/5 rounded-2xl transition-all text-slate-400 hover:text-text-header"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-text-header">{timetable.name}</h1>
            <p className="text-sm text-slate-400">
              {new Date(timetable.createdAt).toLocaleDateString()} &nbsp;·&nbsp;
              {formatTimeRange(startTime, endTime)} &nbsp;·&nbsp; {periodDuration} min / period
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            icon={Download}
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? 'Generating…' : 'Download PNG'}
          </Button>
          <Button variant="outline" icon={RotateCcw} onClick={handleReset} disabled={!hasChanges || isSaving}>Reset</Button>
          <Button icon={Save} onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </header>

      {/* ── One grid per class — captured by html2canvas ── */}
      <div ref={timetableRef} className="space-y-8 bg-dark-bg p-6 rounded-3xl">
        {classes.map(cls => {
          // Collect all subjects used by this class in this timetable
          const classSlots = editableSchedule.filter(s => s.classId === cls.id);
          const usedSubjectIds = [...new Set(classSlots.map(s => s.subjectId))];
          const usedSubjects = usedSubjectIds.map(sid => subjects.find(s => s.id === sid)).filter(Boolean) as typeof subjects;

          return (
            <div key={cls.id} className="space-y-4">
              {/* ── Title bar ── */}
              <div className="flex items-center gap-3 px-1">
                <div className="h-8 w-1 rounded-full bg-brand-500" />
                <h2 className="text-xl font-bold text-text-header">Class {cls.name}</h2>
              </div>

              {/* ── Main timetable grid ── */}
              <div className="bg-dark-surface rounded-3xl border border-dark-border shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm" style={{ minWidth: '700px' }}>
                    {/* ── Column headers ── */}
                    <thead>
                      <tr className="border-b border-dark-border">
                        {/* Day label column */}
                        <th className="px-4 py-3 text-left border-r border-dark-border bg-dark-bg/60 min-w-[110px]">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Day</div>
                          <div className="text-[10px] text-slate-600 mt-0.5">Hour Order</div>
                        </th>

                        {/* Period + break columns */}
                        {timeline.map((entry, idx) => {
                          const isBreak = entry.type === 'break';
                          return (
                            <th
                              key={`th-${idx}`}
                              className={cn(
                                'border-r border-dark-border text-center',
                                isBreak
                                  ? 'bg-amber-950/50 px-2 py-3 min-w-[90px]'
                                  : 'bg-dark-bg/40 px-4 py-3 min-w-[140px]'
                              )}
                            >
                              {isBreak ? (
                                <>
                                  <div className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">
                                    {entry.name}
                                  </div>
                                  <div className="text-[10px] text-amber-500/70 mt-0.5">
                                    {formatTimeRange(entry.start, entry.end)}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="text-base font-bold text-text-header">
                                    {(entry as Extract<TimelineEntry, { type: 'period' }>).order}
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {formatTimeRange(entry.start, entry.end)}
                                  </div>
                                </>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>

                    {/* ── Rows (one per working day) ── */}
                    <tbody>
                      {workingDays.map((day, dayIdx) => {
                        // Build cells with lab merging logic
                        const cells: React.ReactNode[] = [];
                        let i = 0;

                        while (i < timeline.length) {
                          const entry = timeline[i];

                          // Break column
                          if (entry.type === 'break') {
                            cells.push(
                              <td
                                key={`${day}-brk-${i}`}
                                className="border-r border-dark-border bg-amber-950/20 text-center px-1 py-2"
                              >
                                <span className="inline-block px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20">
                                  {entry.name}
                                </span>
                              </td>
                            );
                            i++;
                            continue;
                          }

                          // Period entry — check for lab merge
                          const slot = getSlot(cls.id, day, entry.start);
                          const subject = subjects.find(s => s.id === slot?.subjectId);
                          const isLab = subject?.subjectType === 'Laboratory';

                          // Look ahead: next timeline entry is also a period with same lab subject?
                          const nextEntry = timeline[i + 1];
                          const nextIsTeachingPeriod = nextEntry?.type === 'period';
                          const nextSlot = nextIsTeachingPeriod
                            ? getSlot(cls.id, day, nextEntry.start)
                            : undefined;
                          const isMerged =
                            isLab &&
                            slot &&
                            nextSlot?.subjectId === slot.subjectId;

                          const colSpan = isMerged ? 2 : 1;
                          const prof = faculty.find(f => f.id === slot?.facultyId);
                          const room = rooms.find(r => r.id === slot?.roomId);
                          const color = subject?.color ?? 'bg-slate-500';
                          const hex = toHex(color);

                          cells.push(
                            <td
                              key={`${day}-${entry.start}`}
                              colSpan={colSpan}
                              className="border-r border-dark-border p-1.5 align-top"
                              onDragOver={e => e.preventDefault()}
                              onDrop={() => !isMerged && moveOrSwapSlot(cls.id, day, entry.start)}
                            >
                              {slot && subject ? (
                                <div
                                  draggable
                                  onDragStart={() => setDragSource({ classId: cls.id, day, time: entry.start })}
                                  onDragEnd={() => setDragSource(null)}
                                  style={{
                                    borderLeft: `3px solid ${hex}`,
                                    background: `${hex}18`,
                                  }}
                                  className="rounded-xl px-3 py-2.5 cursor-move min-h-[88px] flex flex-col justify-between hover:brightness-110 transition-all"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span
                                        className="text-[11px] font-black uppercase tracking-wide"
                                        style={{ color: hex }}
                                      >
                                        {subject.code || subject.name}
                                      </span>
                                      {isLab && (
                                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                                          style={{ background: `${hex}30`, color: hex }}>
                                          LAB
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-300 leading-snug">{subject.name}</p>
                                  </div>
                                  <div className="mt-2 space-y-0.5">
                                    <p className="text-[10px] text-slate-400 truncate">{prof?.name ?? '—'}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{room?.name ?? '—'}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="min-h-[88px] rounded-xl border border-dashed border-dark-border/60 bg-dark-bg/30 flex items-center justify-center">
                                  <span className="text-[11px] text-slate-600">Free</span>
                                </div>
                              )}
                            </td>
                          );

                          i += isMerged ? 2 : 1;
                        }

                        return (
                          <tr
                            key={`${cls.id}-${day}`}
                            className={cn(
                              'border-b border-dark-border/70',
                              dayIdx % 2 === 0 ? 'bg-dark-bg/10' : 'bg-dark-surface/60'
                            )}
                          >
                            {/* Day label cell */}
                            <td className="px-4 py-3 border-r border-dark-border bg-dark-bg/40">
                              <span className="text-sm font-bold text-text-main block">{day.slice(0, 3).toUpperCase()}</span>
                              <span className="text-[10px] text-slate-500">DAY {dayIdx + 1}</span>
                            </td>
                            {cells}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Subject Legend Table (matches reference picture) ── */}
              {usedSubjects.length > 0 && (
                <div className="bg-dark-surface rounded-3xl border border-dark-border shadow-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-dark-border bg-dark-bg/40">
                    <h3 className="text-sm font-bold text-text-header">Subject Index — Class {cls.name}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-dark-border bg-dark-bg/60">
                          {['ABB', 'Course Code', 'Course Name', 'Credit', 'Periods', 'Category', 'Faculty'].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-dark-border last:border-0">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-border">
                        {usedSubjects.map(subject => {
                          const hex = toHex(subject.color ?? 'bg-slate-500');
                          // Find faculty who teach this subject
                          const facList = faculty.filter(f => f.subjects.includes(subject.id));
                          const weeklyCount = classSlots.filter(s => s.subjectId === subject.id).length;

                          return (
                            <tr key={subject.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-5 py-3 border-r border-dark-border">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: hex }} />
                                  <span className="font-black text-text-header uppercase" style={{ color: hex }}>
                                    {subject.code || subject.name.slice(0, 4).toUpperCase()}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3 border-r border-dark-border font-mono text-slate-400">
                                {subject.code || '—'}
                              </td>
                              <td className="px-5 py-3 border-r border-dark-border text-text-main font-medium">
                                {subject.name}
                              </td>
                              <td className="px-5 py-3 border-r border-dark-border text-center text-slate-400">
                                {subject.hours}
                              </td>
                              <td className="px-5 py-3 border-r border-dark-border text-center text-slate-400">
                                {weeklyCount}
                              </td>
                              <td className="px-5 py-3 border-r border-dark-border">
                                <Badge
                                  variant={
                                    subject.subjectType === 'Laboratory' ? 'info'
                                      : subject.subjectType === 'Tutorial' ? 'warning'
                                        : 'neutral'
                                  }
                                >
                                  {subject.subjectType === 'Laboratory'
                                    ? 'Practical'
                                    : subject.subjectType === 'Tutorial'
                                      ? 'Tutorial'
                                      : 'Theory'}
                                </Badge>
                              </td>
                              <td className="px-5 py-3 text-slate-400">
                                {facList.length > 0
                                  ? facList.map(f => f.name).join(', ')
                                  : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
