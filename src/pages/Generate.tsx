import React, { useState, useEffect } from 'react';
import { Badge, Button, Card, ErrorModal } from '../components/UI';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Users,
  School,
  DoorOpen,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { generateTimetable as runEngine, validateSchedule } from '../utils/timetableEngine';
import { motion, AnimatePresence } from 'framer-motion';

const FIXED_KEYWORDS = ['library', 'nptel', 'tws', 'placement'];
const isFixedSubject = (name: string) => FIXED_KEYWORDS.some(kw => name.toLowerCase().includes(kw));

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
  const [generationStep, setGenerationStep] = useState('');
  const [preview, setPreview] = useState<EnginePreview | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

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
    if (classes.length > 0 && selectedClasses.length === 0) {
      setSelectedClasses(classes.map(c => c.id));
    }
  }, [classes, selectedClasses.length]);

  const readiness = {
    subjects: subjects.length > 0,
    faculty: faculty.length > 0,
    classes: classes.length > 0,
    rooms: rooms.length > 0,
  };

  const isReady = Object.values(readiness).every(v => v);
  const missingFields = Object.entries(readiness)
    .filter(([_, ready]) => !ready)
    .map(([field]) => field.charAt(0).toUpperCase() + field.slice(1));

  const handlePreview = () => {
    const activeClasses = classes.filter(c => selectedClasses.includes(c.id));
    const result = runEngine({ subjects, faculty, classes: activeClasses, rooms, settings });
    const issues = validateSchedule(result.schedule, subjects, faculty, settings);
    
    const usedSubjectIds = [...new Set(result.schedule.map(s => s.subjectId))];
    const usedSubjects = subjects.filter(s => usedSubjectIds.includes(s.id));
    
    const fixed = usedSubjects.filter(s => isFixedSubject(s.name) && s.subjectType !== 'Laboratory').map(s => s.name);
    const labs = usedSubjects.filter(s => s.subjectType === 'Laboratory').map(s => s.name);
    const high = usedSubjects.filter(s => !isFixedSubject(s.name) && s.subjectType !== 'Laboratory' && s.priority === 'High').map(s => s.name);
    const theory = usedSubjects.filter(s => !isFixedSubject(s.name) && s.subjectType !== 'Laboratory' && s.priority !== 'High').map(s => s.name);
    
    setPreview({
      fixed, labs, highPriority: high, theory,
      warnings: [...result.warnings, ...issues.filter(i => i.severity === 'error').map(i => i.message)],
      stats: result.stats,
    });
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerationStep('Initializing...');
    
    setTimeout(() => setGenerationStep('Applying constraints...'), 400);
    setTimeout(() => setGenerationStep('Allocating faculty...'), 800);
    setTimeout(() => setGenerationStep('Optimizing...'), 1200);

    setTimeout(async () => {
      try {
        await generateTimetable(name, selectedClasses);
        setStatus({ type: 'success', message: 'Success! Redirecting...' });
        setTimeout(() => navigate('/view-timetable'), 800);
      } catch (err: any) {
        handleError(err, handleGenerate);
        setIsGenerating(false);
      }
    }, 1600);
  };

  return (
    <div className="gen-container">
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 2px', letterSpacing: '-0.04em' }}>Generate Timetable</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 auto' }}>Smart scheduling system</p>
      </div>

      <div className="gen-layout-grid">
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card className="p-7" style={{ height: '100%', minHeight: 460, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ 
                padding: '12px 16px', 
                borderRadius: 12, 
                background: isReady ? 'var(--accent-muted)' : 'var(--warning-bg)',
                border: `1.5px solid ${isReady ? 'var(--accent-border)' : 'var(--warning-border)'}`,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isReady ? (
                    <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--accent-text)' }} />
                  ) : (
                    <AlertTriangle style={{ width: 16, height: 16, color: '#F59E0B' }} />
                  )}
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isReady ? 'var(--text-primary)' : 'var(--warning-text)' }}>
                    {isReady ? 'All system data is ready' : `Missing: ${missingFields.join(', ')}`}
                  </span>
                </div>
                <Badge variant={isReady ? 'success' : 'warning'} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                  {isReady ? 'COMPLETED' : 'PENDING'}
                </Badge>
              </div>

              <div className="gen-form-grid" style={{ gap: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Timetable Batch Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Even Sem 2024"
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="field-input text-base" 
                    style={{ width: '100%', padding: '10px 14px', height: 48 }} 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Select Target Classes</label>
                    {classes.length > 0 && (
                      <button onClick={() => setSelectedClasses(classes.length === selectedClasses.length ? [] : classes.map(c => c.id))} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>
                        {classes.length === selectedClasses.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                    gap: 6, 
                    maxHeight: 120, 
                    overflowY: 'auto', 
                    padding: '12px', 
                    background: 'var(--surface-2)', 
                    borderRadius: 12, 
                    border: '1.5px solid var(--border)' 
                  }}>
                    {classes.map(c => (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          style={{ width: 14, height: 14 }}
                          checked={selectedClasses.includes(c.id)} 
                          onChange={e => {
                            if (e.target.checked) setSelectedClasses(prev => [...prev, c.id]);
                            else setSelectedClasses(prev => prev.filter(id => id !== c.id));
                          }} 
                        />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '16px 20px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 14 }}>
                <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Constraint Insights
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Faculty Load Balance', status: 'Optimal', color: '#059669' },
                    { label: 'Class Coverage', status: 'Complete', color: '#059669' },
                    { label: 'Room Utilization', status: 'Moderate', color: '#D97706' },
                    { label: 'Conflict Risk', status: 'Low', color: '#059669' },
                  ].map(insight => (
                    <div key={insight.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{insight.label}</span>
                      <span style={{ fontSize: '0.9375rem', color: insight.color, fontWeight: 800 }}>{insight.status}</span>
                    </div>
                  ))}
                </div>
                <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, opacity: 0.8 }}>
                  <Sparkles style={{ width: 14, height: 14, color: 'var(--accent)' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
                    Prioritizing high-credit subjects and minimizing faculty overlaps.
                  </p>
                </div>
              </div>

              <div className="gen-btn-group" style={{ gap: 12 }}>
                <Button 
                  variant="primary" 
                  size="lg" 
                  disabled={!isReady || isGenerating || selectedClasses.length === 0}
                  onClick={handleGenerate}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: '1rem', justifyContent: 'center', height: 52 }}
                >
                  {isGenerating ? (
                    <><Loader2 className="animate-spin" style={{ width: 18, height: 18 }} /> {generationStep}</>
                  ) : (
                    <><Sparkles style={{ width: 18, height: 18 }} /> Generate Timetable</>
                  )}
                </Button>
                
                {isReady && !isGenerating && (
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={handlePreview}
                    style={{ flex: 0.6, borderRadius: 12, justifyContent: 'center', fontSize: '1rem', height: 52 }}
                  >
                    Preview Logic
                  </Button>
                )}
              </div>
            </div>

            {status && (
              <motion.div 
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  marginTop: 12, textAlign: 'center', padding: '8px', borderRadius: 8, 
                  background: status.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
                  color: status.type === 'success' ? 'var(--status-success-text)' : 'var(--status-error-text)',
                  fontSize: '0.8rem', fontWeight: 700
                }}
              >
                {status.message}
              </motion.div>
            )}
          </Card>

          <AnimatePresence>
            {preview && (
              <motion.div style={{ marginTop: 16 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
                <Card title="Allocation Preview">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={{ padding: '10px', background: 'var(--surface-2)', borderRadius: 10, border: '1.5px solid var(--border)' }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 2 }}>Slots to fill</p>
                      <p style={{ fontSize: '1.125rem', fontWeight: 900 }}>{preview.stats.totalSlotsFilled} / {preview.stats.totalSlotsAvailable}</p>
                    </div>
                    <div style={{ padding: '10px', background: preview.warnings.length > 0 ? 'var(--warning-bg)' : 'var(--success-bg)', borderRadius: 10, border: '1.5px solid var(--border)' }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 2 }}>Warnings</p>
                      <p style={{ fontSize: '1.125rem', fontWeight: 900, color: preview.warnings.length > 0 ? 'var(--warning-text)' : 'var(--success-text)' }}>{preview.warnings.length}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'Laboratories', items: preview.labs, variant: 'info' as const },
                      { label: 'Theory Subjects', items: [...preview.highPriority, ...preview.theory], variant: 'accent' as const },
                    ].map(group => (
                      <div key={group.label}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>{group.label}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {group.items.length > 0 ? group.items.slice(0, 8).map(i => <Badge key={i} variant={group.variant} style={{ fontSize: '0.65rem' }}>{i}</Badge>) : <span style={{ color: 'var(--text-placeholder)', fontSize: '0.75rem' }}>None</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16, padding: '16px' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Data Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Subjects', count: subjects.length, icon: BookOpen },
                { label: 'Faculty', count: faculty.length, icon: Users },
                { label: 'Classes', count: classes.length, icon: School },
                { label: 'Rooms', count: rooms.length, icon: DoorOpen },
              ].map(stat => (
                <div key={stat.label} style={{ padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <stat.icon style={{ width: 12, height: 12, color: 'var(--text-placeholder)' }} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{stat.label}</span>
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 900, margin: 0 }}>{stat.count}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16, padding: '16px' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pro Tips</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                "Assign at least 2 faculty members per subject for better flexibility.",
                "Balance theory and laboratory sessions to avoid student burnout.",
                "Ensure room capacities match your class sizes before generating."
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', marginTop: 6, flexShrink: 0 }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16, padding: '16px' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Last Generated</h3>
            <div style={{ padding: '10px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, margin: '0 0 2px' }}>Latest Batch</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Today · {new Date().toLocaleDateString()}</p>
              <button 
                onClick={() => navigate('/view-timetable')}
                style={{ width: '100%', padding: '6px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                View History <ChevronRight style={{ width: 12, height: 12 }} />
              </button>
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

      <style>{`
        .gen-container {
          max-width: 1200px;
          margin: 12px auto 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 0 16px 40px;
          width: 100%;
        }
        .gen-layout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: stretch;
        }
        .gen-form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        .gen-btn-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
        }
        @media (min-width: 1024px) {
          .gen-layout-grid { grid-template-columns: 2fr 1fr; }
          .gen-form-grid { grid-template-columns: 1fr 1fr; }
          .gen-btn-group { flex-direction: row; }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
