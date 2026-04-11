import React, { useState, useEffect } from 'react';
import { Badge, EmptyState, Modal, BulkActionBar, ConfirmModal, ErrorModal } from '../components/UI';
import { BookOpen, Plus, Edit2, Trash2, Search, Minus, Lock, MoreVertical, Check, Square, CheckSquare, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useSelection } from '../hooks/useSelection';
import { Subject, Priority, SubjectType } from '../types';

const FIXED_KEYWORDS = ['library', 'nptel', 'tws', 'placement'];
const isAutoFixed = (name: string) => FIXED_KEYWORDS.some(kw => name.toLowerCase().includes(kw));

function StepperInput({
  value, onChange, min = 1, max = 20, name
}: { value: number; onChange: (v: number) => void; min?: number; max?: number; name?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button type="button" className="stepper-btn" onClick={() => onChange(Math.max(min, value - 1))}>
        <Minus style={{ width: 14, height: 14 }} />
      </button>
      <input
        name={name}
        type="number" min={min} max={max}
        value={value}
        onChange={e => onChange(Math.max(min, Number(e.target.value) || min))}
        className="field-input"
        style={{ textAlign: 'center', flex: 1 }}
      />
      <button type="button" className="stepper-btn" onClick={() => onChange(Math.min(max, value + 1))}>
        <Plus style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}

export default function Subjects() {
  const { subjects, addSubject, updateSubject, deleteSubject, deleteSubjects } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const {
    selectedIds, isSelected, toggleItem,
    selectAll, deselectAll, count,
    isSelectionMode, exitSelectionMode, selectSingle
  } = useSelection(subjects);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
    title: string;
    message: string;
  }>({
    isOpen: false,
    onConfirm: () => { },
    title: '',
    message: ''
  });

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

  const navigate = useNavigate();

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
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenuId(null);
        exitSelectionMode();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (activeMenuId && !(e.target as HTMLElement).closest('.subject-menu-container')) {
        setActiveMenuId(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuId, exitSelectionMode]);

  const [searchQuery, setSearchQuery] = useState('');
  const [hoursValue, setHoursValue] = useState(4);
  const [creditsValue, setCreditsValue] = useState(3);
  const [weeklyPeriodsValue, setWeeklyPeriodsValue] = useState(4);
  const [isFixedValue, setIsFixedValue] = useState(false);
  const [subjectTypeFilter, setSubjectTypeFilter] = useState<string>('all');
  
  const filteredSubjects = subjects.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.code || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = subjectTypeFilter === 'all' || s.subjectType === subjectTypeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleAdd = () => {
    setEditingSubject(null);
    setHoursValue(4); setCreditsValue(3); setWeeklyPeriodsValue(4); setIsFixedValue(false);
    setIsModalOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setHoursValue(subject.hours);
    setCreditsValue(subject.credits ?? 0);
    setWeeklyPeriodsValue(subject.weeklyPeriods ?? subject.hours);
    setIsFixedValue(subject.isFixed ?? isAutoFixed(subject.name));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = {
      name: formData.get('name') as string,
      code: (formData.get('code') as string || '').toUpperCase(),
      hours: weeklyPeriodsValue,
      credits: creditsValue,
      weeklyPeriods: weeklyPeriodsValue,
      isFixed: isFixedValue,
      priority: (formData.get('priority') as Priority) || 'Medium',
      color: 'bg-blue-500',
      subjectType: (formData.get('subjectType') as SubjectType) || 'Theory',
    };
    try {
      if (editingSubject) { await updateSubject(editingSubject.id, data); }
      else { await addSubject(data); }
      setIsModalOpen(false);
    } catch (err: any) {
      handleError(err, () => {
        console.log("Retrying save...");
      });
    }
  };

  const handleBulkDelete = async () => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Subjects',
      message: `Are you sure you want to delete ${selectedIds.length} subjects? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteSubjects(selectedIds);
          exitSelectionMode();
          setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          handleError(err, handleBulkDelete);
        }
      }
    });
  };

  const priorityBadge = (p: string) =>
    p === 'High' ? 'warning' : p === 'Medium' ? 'accent' : 'neutral';
  const typeBadge = (t: string) =>
    t === 'Laboratory' ? 'accent' : t === 'Theory with Laboratory' ? 'warning' : t === 'Tutorial' ? 'neutral' : 'neutral';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'center' }}>
        <BulkActionBar
          selectedCount={count}
          onDelete={handleBulkDelete}
          onCancel={exitSelectionMode}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          itemName="subject"
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Subjects</h1>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Manage subject configurations and priorities</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!isSelectionMode && subjects.length > 0 && (
            <button
              className="btn btn-outline"
              style={{ borderRadius: 999, fontSize: '0.825rem' }}
              onClick={selectAll}
            >
              Select All
            </button>
          )}
          <button className="btn btn-primary" style={{ borderRadius: 999 }} onClick={handleAdd}>
            <Plus style={{ width: 16, height: 16 }} /> Add Subject
          </button>
        </div>
      </div>

      {subjects.length > 0 && (
        <div className="search-filter-container">
          <div className="search-input-wrapper">
            <Search style={{ width: 18, height: 18, color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search subjects by name or code…" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="filter-select"
            value={subjectTypeFilter}
            onChange={e => setSubjectTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="Theory">Theory</option>
            <option value="Laboratory">Laboratory</option>
            <option value="Theory with Laboratory">Theory + Lab</option>
            <option value="Tutorial">Tutorial</option>
          </select>
        </div>
      )}

      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          description="Add subjects to your curriculum to define requirements before generating the timetable."
          actionLabel="Add First Subject"
          onAction={handleAdd}
        />
      ) : filteredSubjects.length === 0 ? (
        <div style={{ padding: '60px 0' }}>
          <EmptyState 
            icon={Search} 
            title="No results found" 
            description="We couldn't find any subjects matching your current search or filter." 
            actionLabel="Clear Search" 
            onAction={() => { setSearchQuery(''); setSubjectTypeFilter('all'); }} 
          />
        </div>
      ) : (
        <>
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16, overflow: 'visible', display: 'block' }}
            className="desktop-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'center' }}>Credits</th>
                  <th style={{ textAlign: 'center' }}>Periods/wk</th>
                  <th>Priority</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map(subject => (
                  <tr
                    key={subject.id}
                    className={isSelected(subject.id) ? 'selected-row' : ''}
                    onClick={() => { if (isSelectionMode) toggleItem(subject.id); }}
                    style={{
                      cursor: isSelectionMode ? 'pointer' : 'default',
                      background: isSelected(subject.id) ? 'var(--accent-muted)' : 'transparent',
                      transition: 'all 0.2s ease',
                      borderLeft: isSelected(subject.id) ? '4px solid var(--accent)' : '4px solid transparent',
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isSelectionMode && isSelected(subject.id) && (
                          <div style={{
                            width: 20, height: 20, borderRadius: 10,
                            background: 'var(--accent)', color: 'var(--accent-text)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Check style={{ width: 12, height: 12, strokeWidth: 3 }} />
                          </div>
                        )}
                        <span style={{ fontWeight: 600 }}>{subject.name}</span>
                      </div>
                    </td>
                    <td><span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{subject.code || '—'}</span></td>
                    <td><Badge variant={typeBadge(subject.subjectType) as any}>{subject.subjectType}</Badge></td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{subject.credits || 0}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                        <Clock style={{ width: 12, height: 12 }} />
                        {subject.weeklyPeriods}
                      </div>
                    </td>
                    <td><Badge variant={priorityBadge(subject.priority) as any}>{subject.priority}</Badge></td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="subject-menu-container" style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === subject.id ? null : subject.id);
                          }}
                          className="icon-btn"
                        >
                          <MoreVertical style={{ width: 18, height: 18 }} />
                        </button>
                        <AnimatePresence>
                          {activeMenuId === subject.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              transition={{ duration: 0.15, ease: 'easeOut' }}
                              className="faculty-card-dropdown"
                              style={{
                                position: 'absolute', top: '100%', right: 0,
                                width: 160, background: 'var(--surface)',
                                border: '1.5px solid var(--border)', borderRadius: 12,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                                padding: 6, zIndex: 100,
                                marginTop: 4,
                                textAlign: 'left',
                              }}
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                className="menu-item"
                                onClick={() => {
                                  if (isSelectionMode) toggleItem(subject.id);
                                  else selectSingle(subject.id);
                                  setActiveMenuId(null);
                                }}
                              >
                                {isSelected(subject.id) ? (
                                  <><CheckSquare className="menu-icon" /> Deselect</>
                                ) : (
                                  <><Square className="menu-icon" /> Select</>
                                )}
                              </button>
                              <button
                                className="menu-item"
                                onClick={() => { handleEdit(subject); setActiveMenuId(null); }}
                              >
                                <Edit2 className="menu-icon" /> Edit
                              </button>
                              <button
                                className="menu-item menu-item-danger"
                                onClick={async () => {
                                  setDeleteConfirm({
                                    isOpen: true,
                                    title: 'Delete Subject',
                                    message: `Are you sure you want to delete ${subject.name}? This action cannot be undone.`,
                                    onConfirm: async () => {
                                      try {
                                        await deleteSubject(subject.id);
                                        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
                                      } catch (err: any) {
                                        handleError(err, () => {
                                            deleteSubject(subject.id);
                                            setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
                                        });
                                      }
                                    }
                                  });
                                  setActiveMenuId(null);
                                }}
                              >
                                <Trash2 className="menu-icon" /> Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mobile-cards" style={{ display: 'none', flexDirection: 'column', gap: 12 }}>
            {filteredSubjects.map(subject => (
              <motion.div
                key={subject.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => { if (isSelectionMode) toggleItem(subject.id); }}
                style={{
                  background: isSelected(subject.id) ? 'var(--accent-muted)' : 'var(--surface)',
                  border: isSelected(subject.id) ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                  borderRadius: 12, padding: 14,
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700 }}>{subject.name}</h4>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{subject.code}</p>
                  </div>
                  <div className="subject-menu-container" style={{ position: 'relative' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === subject.id ? null : subject.id);
                      }}
                      className="icon-btn"
                    >
                      <MoreVertical style={{ width: 18, height: 18 }} />
                    </button>
                    <AnimatePresence>
                      {activeMenuId === subject.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="faculty-card-dropdown"
                          style={{
                            position: 'absolute', top: '100%', right: 0,
                            width: 160, background: 'var(--surface)',
                            border: '1.5px solid var(--border)', borderRadius: 12,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                            padding: 6, zIndex: 100,
                            marginTop: 4,
                            textAlign: 'left',
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            className="menu-item"
                            onClick={() => {
                              if (isSelectionMode) toggleItem(subject.id);
                              else selectSingle(subject.id);
                              setActiveMenuId(null);
                            }}
                          >
                            {isSelected(subject.id) ? (
                              <><CheckSquare className="menu-icon" /> Deselect</>
                            ) : (
                              <><Square className="menu-icon" /> Select</>
                            )}
                          </button>
                          <button
                            className="menu-item"
                            onClick={() => { handleEdit(subject); setActiveMenuId(null); }}
                          >
                            <Edit2 className="menu-icon" /> Edit
                          </button>
                          <button
                            className="menu-item menu-item-danger"
                            onClick={async () => {
                              setDeleteConfirm({
                                isOpen: true,
                                title: 'Delete Subject',
                                message: `Are you sure you want to delete ${subject.name}? This action cannot be undone.`,
                                onConfirm: async () => {
                                  try {
                                    await deleteSubject(subject.id);
                                    setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
                                  } catch (err: any) {
                                    handleError(err, () => {
                                        deleteSubject(subject.id);
                                        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
                                    });
                                  }
                                }
                              });
                              setActiveMenuId(null);
                            }}
                          >
                            <Trash2 className="menu-icon" /> Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <Badge variant={typeBadge(subject.subjectType) as any}>{subject.subjectType}</Badge>
                  <Badge variant={priorityBadge(subject.priority) as any}>{subject.priority}</Badge>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    <Clock style={{ width: 12, height: 12 }} />
                    {subject.weeklyPeriods}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSubject ? 'Edit Subject' : 'Add New Subject'}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">Subject Name</label>
              <input name="name" defaultValue={editingSubject?.name} required placeholder="e.g. Advanced Mathematics" className="field-input" style={{ width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">Subject Code</label>
              <input name="code" defaultValue={editingSubject?.code} placeholder="Optional" className="field-input" style={{ width: '100%' }} />
            </div>
            <div>
              <label className="field-label">Weekly Hours</label>
              <StepperInput value={hoursValue} onChange={setHoursValue} name="hours" min={1} max={20} />
            </div>
            <div>
              <label className="field-label">Credits</label>
              <StepperInput value={creditsValue} onChange={setCreditsValue} min={0} max={10} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">Weekly Periods <span style={{ fontWeight: 400, color: 'var(--text-placeholder)' }}>(engine quota)</span></label>
              <StepperInput value={weeklyPeriodsValue} onChange={setWeeklyPeriodsValue} min={1} max={20} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button
                type="button"
                onClick={() => setIsFixedValue(v => !v)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderRadius: 10,
                  background: isFixedValue ? 'var(--warning-bg)' : 'var(--surface-2)',
                  border: `1.5px solid ${isFixedValue ? 'var(--warning-border)' : 'var(--border)'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Lock style={{ width: 15, height: 15, color: isFixedValue ? 'var(--warning-text)' : 'var(--text-secondary)' }} />
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: isFixedValue ? 'var(--warning-text)' : 'var(--text-primary)', margin: 0 }}>Fixed / Non-flexible Slot</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Pre-allocated before other subjects</p>
                  </div>
                </div>
                <div className={`toggle-track ${isFixedValue ? 'on' : 'off'}`}>
                  <div className="toggle-thumb" />
                </div>
              </button>
            </div>
            <div>
              <label className="field-label">Subject Type</label>
              <select name="subjectType" defaultValue={editingSubject?.subjectType || 'Theory'} className="field-input" style={{ width: '100%', appearance: 'none', cursor: 'pointer' }}>
                <option value="Theory">Theory</option>
                <option value="Laboratory">Laboratory</option>
                <option value="Theory with Laboratory">Theory with Laboratory</option>
                <option value="Tutorial">Tutorial</option>
              </select>
            </div>
            <div>
              <label className="field-label">Priority</label>
              <select name="priority" defaultValue={editingSubject?.priority || 'Medium'} className="field-input" style={{ width: '100%', appearance: 'none', cursor: 'pointer' }}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1, borderRadius: 10 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, borderRadius: 10 }}>
              {editingSubject ? 'Save Changes' : 'Add Subject'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.onConfirm}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        type={errorModal.type}
        onRetry={errorModal.onRetry}
        onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
      />

      <style>{`
        @media (min-width: 640px) {
          .desktop-table { display: block !important; }
          .mobile-cards { display: none !important; }
        }
        @media (max-width: 639px) {
          .desktop-table { display: none !important; }
          .mobile-cards { display: grid !important; }
        }
      `}</style>
    </div>
  );
}
