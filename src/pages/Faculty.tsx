import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Badge, EmptyState, Modal, BulkActionBar, ConfirmModal, ErrorModal, Select } from '../components/UI';
import { Users, Plus, Edit2, Trash2, Mail, Phone, MessageCircle, MoreVertical, Check, Square, CheckSquare, Search, BookOpen, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useSelection } from '../hooks/useSelection';
import { FacultyMember } from '../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Faculty() {
  const { faculty, subjects, addFaculty, updateFaculty, deleteFaculty, deleteFacultyBatch } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyMember | null>(null);
  const {
    selectedIds, isSelected, toggleItem,
    selectAll, deselectAll, count,
    isSelectionMode, exitSelectionMode, selectSingle
  } = useSelection(faculty);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
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
    console.error('Faculty error:', err);
    const isOffline = !navigator.onLine || err.message?.toLowerCase().includes('failed to fetch');
    const isUnauthorized = err.message?.includes('401') || err.message?.toLowerCase().includes('unauthorized');
    const message = err.message && err.message !== 'Failed to fetch'
      ? err.message
      : "We encountered an unexpected error. Please try again later.";

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
        message,
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
      const target = e.target as HTMLElement;
      const clickedInsideCard = !!target.closest('.faculty-menu-container');
      const clickedInsidePortal = !!target.closest('.faculty-menu-portal');
      if (activeMenuId && !clickedInsideCard && !clickedInsidePortal) {
        setActiveMenuId(null);
        setMenuPosition(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuId, exitSelectionMode]);

  const handleAdd = () => { setEditingFaculty(null); setIsModalOpen(true); };
  const handleEdit = (f: FacultyMember) => { setEditingFaculty(f); setIsModalOpen(true); };


  const handleBulkDelete = async () => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Faculty',
      message: `Are you sure you want to delete ${selectedIds.length} faculty members? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteFacultyBatch(selectedIds);
          exitSelectionMode();
          setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          handleError(err, handleBulkDelete);
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      subjects: Array.from(formData.getAll('subjects')) as string[],
      availability: Array.from(formData.getAll('availability')) as string[],
    };
    try {
      if (editingFaculty) { await updateFaculty(editingFaculty.id, data); }
      else { await addFaculty(data as any); }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Faculty save failed', err);
      handleError(err, () => {
        if (editingFaculty) updateFaculty(editingFaculty.id, data).catch(console.error);
        else addFaculty(data as any).catch(console.error);
      });
    }
  };

  const filteredFaculty = faculty.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || f.subjects.includes(subjectFilter);
    return matchesSearch && matchesSubject;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'center' }}>
        <BulkActionBar
          selectedCount={count}
          onDelete={handleBulkDelete}
          onCancel={exitSelectionMode}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          itemName="faculty"
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Faculty</h1>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Manage faculty profiles, specialization, and availability</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!isSelectionMode && faculty.length > 0 && (
            <button
              className="btn btn-outline"
              style={{ borderRadius: 999, fontSize: '0.825rem' }}
              onClick={selectAll}
            >
              Select All
            </button>
          )}
          <button className="btn btn-primary" style={{ borderRadius: 999 }} onClick={handleAdd}>
            <Plus style={{ width: 16, height: 16 }} /> Add Faculty
          </button>
        </div>
      </div>

      {faculty.length > 0 && (
        <div className="search-filter-container">
          <div className="search-input-wrapper">
            <Search style={{ width: 18, height: 18, color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ width: 220 }}>
            <Select
              value={subjectFilter}
              onChange={setSubjectFilter}
              options={[
                { value: 'all', label: 'All Specialties' },
                ...subjects.map(s => ({ value: s.id, label: s.name }))
              ]}
            />
          </div>
        </div>
      )}

      {faculty.length === 0 ? (
        <EmptyState 
          icon={Users} 
          title="No faculty members yet" 
          description="Add teachers and professors to build your academic team. You can assign subjects and set availability after adding them." 
          actionLabel="Add First Member" 
          onAction={handleAdd} 
        />
      ) : filteredFaculty.length === 0 ? (
        <div style={{ padding: '60px 0' }}>
          <EmptyState 
            icon={Search} 
            title="No matches found" 
            description="We couldn't find any faculty members matching your search query or subject filter." 
            actionLabel="Clear Filters" 
            onAction={() => { setSearchQuery(''); setSubjectFilter('all'); }} 
          />
        </div>
      ) : (
        <div className="faculty-grid">
          {filteredFaculty.map(f => (
            <motion.div
              key={f.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, boxShadow: 'var(--shadow-elevated)', borderColor: 'var(--border-2)' }}
              style={{
                background: isSelected(f.id) ? 'var(--accent-muted)' : 'var(--surface)',
                border: isSelected(f.id) ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                borderRadius: 20, padding: '20px',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                cursor: isSelectionMode ? 'pointer' : 'default',
                outline: 'none',
                boxShadow: isSelected(f.id) ? '0 10px 25px rgba(0,0,0,0.1)' : 'none',
                overflow: 'visible'
              }}
              tabIndex={0}
              onClick={() => {
                if (isSelectionMode) {
                  toggleItem(f.id);
                }
              }}
              onKeyDown={e => {
                if (isSelectionMode && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  toggleItem(f.id);
                }
              }}
            >
              {isSelectionMode && isSelected(f.id) && (
                <div style={{
                  position: 'absolute', top: -10, right: -10,
                  width: 24, height: 24, borderRadius: 12,
                  background: 'var(--accent)', color: 'var(--accent-text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 2,
                }}>
                  <Check style={{ width: 14, height: 14, strokeWidth: 3 }} />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: 'var(--accent)', color: 'var(--accent-text)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    flexShrink: 0,
                  }}>
                    {f.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 750, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{f.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Phone style={{ width: 12, height: 12, color: 'var(--text-placeholder)' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{f.phone || 'No phone'}</span>
                    </div>
                  </div>
                </div>
                <div className="faculty-menu-container" style={{ position: 'relative', overflow: 'visible', zIndex: 0 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const btn = e.currentTarget as HTMLElement;
                      const rect = btn.getBoundingClientRect();
                      const newId = activeMenuId === f.id ? null : f.id;
                      if (newId) {
                        setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.right + window.scrollX });
                      } else {
                        setMenuPosition(null);
                      }
                      setActiveMenuId(newId);
                    }}
                    style={{
                      background: 'none', border: 'none', color: 'var(--text-secondary)',
                      cursor: 'pointer', padding: 6, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <MoreVertical style={{ width: 20, height: 20 }} />
                  </button>

                  <AnimatePresence>
                      {activeMenuId === f.id && menuPosition && createPortal(
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 6 }}
                          transition={{ duration: 0.12, ease: 'easeOut' }}
                          className="faculty-card-dropdown faculty-menu-portal"
                          style={{
                            position: 'fixed', top: menuPosition.top, left: menuPosition.left - 170,
                            width: 170, background: 'var(--surface)',
                            border: '1.5px solid var(--border)', borderRadius: 14,
                            boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
                            padding: 6, zIndex: 9999,
                            marginTop: 6,
                            overflow: 'visible'
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            className="menu-item"
                            onClick={() => {
                              if (isSelectionMode) toggleItem(f.id);
                              else selectSingle(f.id);
                              setActiveMenuId(null);
                            }}
                          >
                            {isSelected(f.id) ? (
                              <><CheckSquare className="menu-icon" /> Deselect</>
                            ) : (
                              <><Square className="menu-icon" /> Select</>
                            )}
                          </button>
                          <div style={{ height: 1.5, background: 'var(--border)', margin: '4px 0', opacity: 0.5 }} />
                          <button
                            className="menu-item"
                            onClick={() => {
                              const link = `https://wa.me/${f.phone?.replace(/[^0-9]/g, '')}`;
                              window.open(link, '_blank');
                              setActiveMenuId(null);
                            }}
                          >
                            <MessageCircle className="menu-icon" /> WhatsApp
                          </button>
                          <button
                            className="menu-item"
                            onClick={() => { handleEdit(f); setActiveMenuId(null); }}
                          >
                            <Edit2 className="menu-icon" /> Edit Profile
                          </button>
                          <button
                            className="menu-item menu-item-danger"
                            onClick={async () => {
                              setDeleteConfirm({
                                isOpen: true,
                                title: 'Delete Faculty',
                                message: `Are you sure you want to delete ${f.name}? This action cannot be undone.`,
                                onConfirm: async () => {
                                  try {
                                    await deleteFaculty(f.id);
                                    setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
                                  } catch (err: any) {
                                    handleError(err, () => {
                                        deleteFaculty(f.id);
                                        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
                                    });
                                  }
                                }
                              });
                            }}
                          >
                            <Trash2 className="menu-icon" /> Remove
                          </button>
                        </motion.div>,
                        document.body
                      )}
                    </AnimatePresence>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, minHeight: 24 }}>
                {f.subjects.slice(0, 3).map(sid => {
                  const s = subjects.find(sub => sub.id === sid);
                  return s ? (
                    <Badge key={sid} variant="accent" style={{ fontSize: '0.7rem' }}>{s.name}</Badge>
                  ) : null;
                })}
                {f.subjects.length > 3 && (
                  <Badge variant="neutral" style={{ fontSize: '0.7rem' }}>+{f.subjects.length - 3} more</Badge>
                )}
                {f.subjects.length === 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-placeholder)', fontStyle: 'italic' }}>No specializations</span>
                )}
              </div>

              <div style={{ borderTop: '1.5px solid var(--border)', paddingTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Mail style={{ width: 14, height: 14, color: 'var(--text-secondary)' }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.email}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">Full Name</label>
              <input name="name" defaultValue={editingFaculty?.name} required placeholder="Enter faculty name" className="field-input" style={{ width: '100%' }} />
            </div>
            <div>
              <label className="field-label">Email Address</label>
              <input name="email" type="email" defaultValue={editingFaculty?.email} required placeholder="you@institution.edu" className="field-input" style={{ width: '100%' }} />
            </div>
            <div>
              <label className="field-label">Phone Number</label>
              <input name="phone" defaultValue={editingFaculty?.phone} placeholder="Enter phone number" className="field-input" style={{ width: '100%' }} />
            </div>
          </div>
          <div>
            <label className="field-label">Subject Specializations</label>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
              maxHeight: 180, overflowY: 'auto', padding: '12px',
              background: 'var(--surface-2)', borderRadius: 12, border: '1.5px solid var(--border)'
            }}>
              {subjects.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <input type="checkbox" name="subjects" value={s.id} defaultChecked={editingFaculty?.subjects.includes(s.id)} style={{ accentColor: 'var(--accent)' }} />
                  {s.name}
                </label>
              ))}
              {subjects.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '10px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  Please add subjects first in the Subjects page.
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="field-label">Working Days Availability</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {DAYS.map(day => (
                <label key={day} className={`day-chip ${editingFaculty?.availability.includes(day) ? 'selected' : ''}`} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                  background: 'var(--surface-2)', border: '1.5px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                }}>
                  <input type="checkbox" name="availability" value={day} defaultChecked={editingFaculty ? editingFaculty.availability.includes(day) : true} style={{ display: 'none' }} />
                  {day.slice(0, 3)}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1, borderRadius: 12 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, borderRadius: 12 }}>
              {editingFaculty ? 'Save Profile' : 'Add Faculty'}
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
        .faculty-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .faculty-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1200px) {
          .faculty-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .day-chip:has(input:checked) {
          background: var(--accent) !important;
          color: var(--accent-text) !important;
          border-color: var(--accent-border) !important;
        }
        @media (max-width: 640px) {
          .search-filter-container { flex-direction: column; align-items: stretch; gap: 8px; }
          .filter-select { width: 100%; }
        }
      `}</style>
    </div>
  );
}
