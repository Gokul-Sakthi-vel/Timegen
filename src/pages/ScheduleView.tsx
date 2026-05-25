import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, Button, Badge, cn, ErrorModal } from '../components/UI';
import { ArrowLeft, Save, RotateCcw, Download, MessageCircle } from 'lucide-react';
import { ScheduleSlot } from '../types';
import { buildTimeline, formatTimeRange, TimelineEntry } from '../utils/schedule';
import { motion, AnimatePresence } from 'framer-motion';


const TIMETABLE_COLORS = [
  { bg: "rgba(59, 130, 246, 0.12)", border: "rgba(59, 130, 246, 0.3)", text: "#60A5FA" }, // Blue
  { bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.3)", text: "#34D399" }, // Green
  { bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)", text: "#FBBF24" }, // Orange
  { bg: "rgba(139, 92, 246, 0.12)", border: "rgba(139, 92, 246, 0.3)", text: "#A78BFA" }, // Purple
  { bg: "rgba(6, 182, 212, 0.12)",  border: "rgba(6, 182, 212, 0.3)",  text: "#22D3EE" }, // Cyan
  { bg: "rgba(236, 72, 153, 0.12)", border: "rgba(236, 72, 153, 0.3)", text: "#F472B6" }, // Pink
  { bg: "rgba(20, 184, 166, 0.12)", border: "rgba(20, 184, 166, 0.3)", text: "#2DD4BF" }, // Teal
  { bg: "rgba(99, 102, 241, 0.12)", border: "rgba(99, 102, 241, 0.3)", text: "#818CF8" }, // Indigo
  { bg: "rgba(107, 114, 128, 0.12)", border: "rgba(107, 114, 128, 0.3)", text: "#9CA3AF" }, // Slate
  { bg: "rgba(244, 63, 94, 0.12)",  border: "rgba(244, 63, 94, 0.3)",  text: "#FB7185" }, // Rose
];

const getSubjectStyles = (id: string = '') => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TIMETABLE_COLORS[hash % TIMETABLE_COLORS.length];
};


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
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [hoveredPos, setHoveredPos] = useState<{ day: string; time: string } | null>(null);
  const timetableRef = useRef<HTMLDivElement>(null);

  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'error' | 'offline' | 'session';
    onRetry?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  const handleError = (err: any, retryFn?: () => void) => {
    const isOffline = !navigator.onLine || err.message?.toLowerCase().includes('failed to fetch');
    const isUnauthorized = err.message?.includes('401') || err.message?.toLowerCase().includes('unauthorized');

    if (isOffline) {
      setErrorModal({
        isOpen: true,
        title: "You're offline",
        message: "Please check your internet connection and try again.",
        type: 'offline',
        onRetry: retryFn
      });
    } else if (isUnauthorized) {
      setErrorModal({
        isOpen: true,
        title: "Session expired",
        message: "Your session has expired. Please login again to continue.",
        type: 'session',
        onRetry: () => navigate('/login')
      });
    } else {
      setErrorModal({
        isOpen: true,
        title: "Something went wrong",
        message: "We encountered an unexpected error. Please try again later.",
        type: 'error',
        onRetry: retryFn
      });
    }
  };

  useEffect(() => {
    if (timetable) {
      setEditableSchedule(Array.isArray(timetable.schedule) ? timetable.schedule : []);
      setHasChanges(false);
    }
  }, [timetable]);

  if (!timetable) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 16 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Timetable not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/view-timetable')}>Back to List</button>
      </div>
    );
  }

  const activeSettings = timetable.settingsSnapshot ?? settings;
  const { workingDays, startTime, endTime, periodDuration } = activeSettings;
  const timeline = useMemo(() => buildTimeline(activeSettings), [activeSettings]);

  const periodEntries = timeline.filter(e => e.type === 'period') as Extract<TimelineEntry, { type: 'period' }>[];

  const getSlot = (classId: string, day: string, time: string) =>
    editableSchedule.find(s => s.classId === classId && s.day === day && s.time === time);

  const conflictsMap = useMemo(() => {
    const res: Record<string, string[]> = {}; 
    editableSchedule.forEach(s => {
      const key = `${s.day}-${s.time}`;
      if (!res[key]) {
        const sameTimeSlots = editableSchedule.filter(ts => ts.day === s.day && ts.time === s.time);
        const counts: Record<string, number> = {};
        sameTimeSlots.forEach(ts => counts[ts.facultyId] = (counts[ts.facultyId] || 0) + 1);
        res[key] = Object.keys(counts).filter(fid => counts[fid] > 1);
      }
    });
    return res;
  }, [editableSchedule]);

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
    } catch (err: any) {
      handleError(err, handleSave);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setEditableSchedule(Array.isArray(timetable.schedule) ? timetable.schedule : []);
    setHasChanges(false);
  };

  const getExportBackground = () => {
    const color = getComputedStyle(document.documentElement).getPropertyValue('--timetable-bg').trim();
    return color || '#ffffff';
  };

  const captureTimetableCanvas = async (element: HTMLElement) => {
    await document.fonts?.ready;

    const html2canvas = (await import('html2canvas')).default;
    const width = Math.ceil(element.scrollWidth);
    const height = Math.ceil(element.scrollHeight);
    const exportHeight = Math.ceil(height * 1.2);

    return html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: getExportBackground(),
      width,
      height: exportHeight,
      windowWidth: width,
      windowHeight: exportHeight,
      scrollX: 0,
      scrollY: 0,
      onclone: clonedDocument => {
        const clonedExport = clonedDocument.getElementById('timetable-export') as HTMLElement | null;
        if (!clonedExport) return;

        clonedExport.style.width = `${width}px`;
        clonedExport.style.minWidth = `${width}px`;
        clonedExport.style.height = 'auto';
        clonedExport.style.minHeight = `${height}px`;
        clonedExport.style.background = getExportBackground();
        clonedExport.style.transform = 'none';

        clonedExport.querySelectorAll<HTMLElement>('*').forEach(node => {
          if (getComputedStyle(node).position === 'sticky') {
            node.style.position = 'static';
          }
        });

        clonedExport.querySelectorAll<HTMLElement>('.timetable-slot-cell').forEach(node => {
          node.style.padding = '8px';
          node.style.height = '112px';
          node.style.minHeight = '112px';
          node.style.verticalAlign = 'top';
        });

        clonedExport.querySelectorAll<HTMLElement>('.timetable-slot-card').forEach(node => {
          node.style.minHeight = '94px';
          node.style.height = 'auto';
          node.style.overflow = 'visible';
          node.style.justifyContent = 'flex-start';
          node.style.gap = '8px';
        });

        clonedExport.querySelectorAll<HTMLElement>('.timetable-slot-meta').forEach(node => {
          node.style.marginTop = '6px';
          node.style.paddingTop = '6px';
          node.style.lineHeight = '1.25';
          node.style.overflow = 'visible';
        });
      }
    });
  };

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDownload = async () => {
    const element = document.getElementById("timetable-export");
    if (!element) return;
    setIsDownloading(true);
    try {
      const canvas = await captureTimetableCanvas(element);
      downloadDataUrl(canvas.toDataURL('image/png'), `${timetable.name}.png`);
    } catch (err) {
      console.error('Image Export Failed:', err);
      handleError(err, handleDownload);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("timetable-export");
    if (!element) return;
    setIsDownloadingPDF(true);

    try {
      const { jsPDF } = await import('jspdf');
      const canvas = await captureTimetableCanvas(element);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${timetable.name}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      handleError(err, handleDownloadPDF);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const containerRef = React.useRef<HTMLDivElement>(null);
  const scaledWrapperRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  React.useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const exportEl = document.getElementById('timetable-export');
        if (exportEl) {
          const contentWidth = exportEl.scrollWidth;
          const containerWidth = containerRef.current.offsetWidth - 32; // padding
          const newScale = contentWidth > containerWidth ? containerWidth / contentWidth : 1;
          setScale(newScale);
          const rawHeight = exportEl.scrollHeight;
          setContentHeight(rawHeight * newScale);
        }
      }
    };

    const raf = requestAnimationFrame(() => updateScale());
    window.addEventListener('resize', updateScale);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateScale);
    };
  }, [editableSchedule]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/view-timetable')}
            style={{ width: 34, height: 34, borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{timetable.name}</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '1px 0 0' }}>
              {formatTimeRange(startTime, endTime)} &nbsp;·&nbsp; {periodDuration}m
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Button variant="outline" size="sm" style={{ borderRadius: 999 }} onClick={handleDownload} disabled={isDownloading}>
            <Download style={{ width: 14, height: 14 }} /> PNG
          </Button>
          <Button variant="outline" size="sm" style={{ borderRadius: 999 }} onClick={handleDownloadPDF} disabled={isDownloadingPDF}>
            <Download style={{ width: 14, height: 14 }} /> PDF
          </Button>
          <Button variant="outline" size="sm" style={{ borderRadius: 999 }} onClick={handleReset} disabled={!hasChanges || isSaving}>
            <RotateCcw style={{ width: 14, height: 14 }} /> Reset
          </Button>
          <Button variant="primary" size="sm" style={{ borderRadius: 999 }} onClick={handleSave} disabled={!hasChanges || isSaving}>
            <Save style={{ width: 14, height: 14 }} /> {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </header>

      <div 
        ref={containerRef}
        style={{ 
          width: '100%', 
          overflow: 'hidden', 
          background: 'var(--surface-2)',
          borderRadius: 16,
          border: '1.5px solid var(--border)',
          padding: '12px',
          height: contentHeight ? contentHeight + 36 : 'auto'
        }}
      >
        <div 
          ref={scaledWrapperRef}
          style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'top left',
            width: scale < 1 ? `${100 / scale}%` : 'max-content',
          }}
        >
          <div 
            id="timetable-export" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 20, 
              background: 'var(--timetable-bg)', 
              width: 'max-content',
              minWidth: 700,
              padding: '24px',
              borderRadius: 14,
            }}
          >
            {classes
              .filter(cls => editableSchedule.some(s => s.classId === cls.id))
              .map(cls => {
          const classSlots = editableSchedule.filter(s => s.classId === cls.id);
          const usedSubjectIds = [...new Set(classSlots.map(s => s.subjectId))];
          const usedSubjects = usedSubjectIds.map(sid => subjects.find(s => s.id === sid)).filter(Boolean) as typeof subjects;

          return (
            <div key={cls.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 4, height: 28, borderRadius: 999, background: 'var(--accent)', flexShrink: 0 }} />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Class {cls.name}</h2>
              </div>

              <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm" style={{ minWidth: '700px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid var(--border)', background: 'var(--surface-2)' }}>
                        <th style={{ 
                          padding: '8px 10px', 
                          textAlign: 'left', 
                          borderRight: '1.5px solid var(--border)', 
                          minWidth: 80, 
                          background: 'var(--surface-2)',
                          position: 'sticky',
                          left: 0,
                          zIndex: 10
                        }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>TIMELINE</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-placeholder)', marginTop: 2 }}>Days \ Periods</div>
                        </th>

                        {timeline.map((entry, idx) => {
                          const isBreak = entry.type === 'break';
                          const isHoveredCol = hoveredPos?.time === entry.start;
                          return (
                            <th
                              key={`th-${idx}`}
                              style={{
                                padding: isBreak ? '8px 6px' : '8px 10px',
                                textAlign: 'center',
                                borderRight: '1.5px solid var(--border)',
                                background: isHoveredCol ? 'var(--accent-muted)' : isBreak ? 'var(--break-bg)' : 'var(--surface-2)',
                                minWidth: isBreak ? 70 : 115,
                                transition: 'background 0.2s',
                              }}
                            >
                              {isBreak ? (
                                <>
                                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    {entry.name}
                                  </div>
                                  <div style={{ fontSize: '0.65rem', color: '#92400E', marginTop: 1, opacity: 0.7 }}>
                                    {formatTimeRange(entry.start, entry.end)}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    {(entry as Extract<TimelineEntry, { type: 'period' }>).order}
                                  </div>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 1 }}>
                                    {formatTimeRange(entry.start, entry.end)}
                                  </div>
                                </>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>

                    <tbody>
                      {workingDays.map((day, dayIdx) => {
                        const cells: React.ReactNode[] = [];
                        let i = 0;

                        while (i < timeline.length) {
                          const entry = timeline[i];

                          if (entry.type === 'break') {
                            cells.push(
                              <td
                                key={`${day}-brk-${i}`}
                                style={{ borderRight: '1.5px solid var(--border)', background: 'var(--break-bg)', textAlign: 'center', padding: '6px 4px' }}
                              >
                                <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--break-text)', background: 'var(--break-tag-bg)', border: '1px solid var(--break-tag-border)' }}>
                                  {entry.name}
                                </span>
                              </td>
                            );
                            i++;
                            continue;
                          }

                          const slot = getSlot(cls.id, day, entry.start);
                          const subject = subjects.find(s => s.id === slot?.subjectId);
                          const isLab = subject?.subjectType === 'Laboratory';

                          const isConflict = slot && (conflictsMap[`${day}-${entry.start}`] || []).includes(slot.facultyId);

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
                          const styles = getSubjectStyles(subject?.id);
                          const isHoveredRow = hoveredPos?.day === day;
                          const isHoveredCol = hoveredPos?.time === entry.start;
                          const isCurrentlyHovered = isHoveredRow && isHoveredCol;

                          cells.push(
                            <td
                              key={`${day}-${entry.start}`}
                              colSpan={colSpan}
                              className="timetable-slot-cell"
                              style={{ 
                                borderRight: '1px solid var(--border)', 
                                padding: 6, 
                                verticalAlign: 'top',
                                background: isCurrentlyHovered ? 'var(--accent-muted)' : (isHoveredRow || isHoveredCol) ? 'rgba(0,0,0,0.02)' : 'transparent',
                                transition: 'all 0.15s ease',
                              }}
                              onDragOver={e => e.preventDefault()}
                              onDrop={() => !isMerged && moveOrSwapSlot(cls.id, day, entry.start)}
                              onMouseEnter={() => setHoveredPos({ day, time: entry.start })}
                              onMouseLeave={() => setHoveredPos(null)}
                            >
                              {slot && subject ? (
                                <div
                                  className="timetable-slot-card"
                                  draggable
                                  onDragStart={() => setDragSource({ classId: cls.id, day, time: entry.start })}
                                  onDragEnd={() => setDragSource(null)}
                                  title={`Subject: ${subject.name}\nFaculty: ${prof?.name ?? 'Unassigned'}\nRoom: ${room?.name ?? 'Unassigned'}${isConflict ? '\n⚠️ CONFLICT: Faculty double-booked!' : ''}`}
                                  style={{
                                    border: isConflict ? '2px solid #ef4444' : `1.5px solid ${styles.border}`,
                                    borderLeftWidth: isConflict ? 2 : 5,
                                    background: isConflict ? '#fef2f2' : (isCurrentlyHovered ? styles.bg : 'var(--surface)'),
                                    borderRadius: 12,
                                    padding: '8px',
                                    cursor: 'move',
                                    minHeight: 70,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow: isCurrentlyHovered ? '0 8px 16px rgba(0,0,0,0.1)' : 'none',
                                    transform: isCurrentlyHovered ? 'scale(1.02)' : 'scale(1)',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    opacity: isCurrentlyHovered ? 1 : 0.9,
                                  }}
                                >
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
                                      <span style={{ fontSize: '0.75rem', fontWeight: 900, color: isConflict ? '#b91c1c' : styles.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        {subject.code || subject.name.slice(0, 8)}
                                      </span>
                                      {isLab && (
                                        <Badge variant="info" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>LAB</Badge>
                                      )}
                                    </div>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0 }}>{subject.name}</h4>
                                  </div>
                                  <div className="timetable-slot-meta" style={{ marginTop: 8, padding: 0, borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '8px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prof?.name ?? '—'}</p>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-placeholder)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room?.name ?? '—'}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="timetable-slot-card" style={{ minHeight: 70, borderRadius: 10, border: '1.5px dashed var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-placeholder)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Free</span>
                                </div>
                              )}
                            </td>
                          );

                          i += isMerged ? 2 : 1;
                        }

                        return (
                          <tr
                            key={`${cls.id}-${day}`}
                            style={{ 
                              borderBottom: '1px solid var(--border)', 
                              background: hoveredPos?.day === day ? 'var(--accent-muted)' : (dayIdx % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)'),
                              transition: 'background 0.2s',
                            }}
                          >
                            <td style={{ 
                              padding: '8px 10px', 
                              borderRight: '1.5px solid var(--border)', 
                              background: hoveredPos?.day === day ? 'var(--accent-muted)' : 'var(--surface-2)',
                              position: 'sticky',
                              left: 0,
                              zIndex: 10,
                              transition: 'background 0.2s'
                            }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>{day.slice(0, 3).toUpperCase()}</span>
                              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Day {dayIdx + 1}</span>
                            </td>
                            {cells}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {usedSubjects.length > 0 && (
                <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1.5px solid var(--border)', background: 'var(--surface-2)' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Subject Index — Class {cls.name}</h3>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          {['ABB', 'Course Code', 'Course Name', 'Credits', 'Periods', 'Category', 'Faculty'].map(h => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {usedSubjects.map(subject => {
                          const styles = getSubjectStyles(subject.id);
                          const facList = faculty.filter(f => f.subjects.includes(subject.id));
                          const weeklyCount = classSlots.filter(s => s.subjectId === subject.id).length;

                          return (
                            <tr key={subject.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontWeight: 900, color: styles.text, textTransform: 'uppercase', fontSize: '0.8rem', background: styles.bg, padding: '2px 6px', borderRadius: 4, border: `1px solid ${styles.border}` }}>
                                    {subject.code || subject.name.slice(0, 4).toUpperCase()}
                                  </span>
                                </div>
                              </td>
                              <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{subject.code || '—'}</td>
                              <td style={{ fontWeight: 500 }}>{subject.name}</td>
                              <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{subject.credits ?? 0}</td>
                              <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{weeklyCount}</td>
                              <td>
                                <Badge
                                  variant={
                                    subject.subjectType === 'Laboratory' ? 'info'
                                      : subject.subjectType === 'Tutorial' ? 'warning'
                                        : 'neutral'
                                  }
                                >
                                  {subject.subjectType === 'Laboratory' ? 'Practical' : subject.subjectType === 'Tutorial' ? 'Tutorial' : 'Theory'}
                                </Badge>
                              </td>
                              <td style={{ color: 'var(--text-secondary)' }}>
                                {facList.length > 0 ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    {facList.map((f, i) => (
                                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {f.name}
                                        {f.phone && (
                                          <a
                                            href={`https://wa.me/${f.phone.replace(/[^0-9]/g, '')}`}
                                            target="_blank" rel="noopener noreferrer"
                                            title={`Message ${f.name} on WhatsApp`}
                                            style={{ color: '#25D366', display: 'flex', alignItems: 'center' }}
                                          >
                                            <MessageCircle style={{ width: 14, height: 14 }} />
                                          </a>
                                        )}
                                        {i < facList.length - 1 && <span>,</span>}
                                      </div>
                                    ))}
                                  </div>
                                ) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--surface-2)', borderRadius: 12, border: '1.5px solid var(--border)' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.04em' }}>
                      Subject Color Legend
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                      {usedSubjects.map(subject => {
                        const styles = getSubjectStyles(subject.id);
                        return (
                          <div key={subject.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 12, height: 12, borderRadius: 3, background: styles.bg, border: `1px solid ${styles.border}` }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{subject.code || subject.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
            <div style={{ marginTop: 12, textAlign: 'center', opacity: 0.5, paddingBottom: 8 }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Generated timetable • Optimized using constraints
              </p>
            </div>
          </div>
        </div>
      </div>

      <ErrorModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        type={errorModal.type}
        onRetry={errorModal.onRetry}
        onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
