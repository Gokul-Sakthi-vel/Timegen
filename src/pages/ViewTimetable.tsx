import React, { useState, useEffect } from 'react';
import { Badge, EmptyState, Modal, BulkActionBar, ConfirmModal } from '../components/UI';
import { CalendarDays, Sparkles, Trash2, Calendar as CalendarIcon, ExternalLink, MoreVertical, Check, Square, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useSelection } from '../hooks/useSelection';
import { motion, AnimatePresence } from 'motion/react';

export default function ViewTimetable() {
  const navigate = useNavigate();
  const { timetables, deleteTimetable } = useApp();
  const {
    selectedIds, setSelectedIds, isSelected, toggleItem,
    isAllSelected, toggleSelectAll, selectAll, deselectAll, count,
    isSelectionMode, setIsSelectionMode, exitSelectionMode, selectSingle
  } = useSelection(timetables);
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
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

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenuId(null);
        exitSelectionMode();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (activeMenuId && !(e.target as HTMLElement).closest('.timetable-menu-container')) {
        setActiveMenuId(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuId]);

  const handleBulkDelete = async () => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Timetables',
      message: `Are you sure you want to delete ${selectedIds.length} timetables? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          for (const id of selectedIds) { await deleteTimetable(id); }
          setSelectedIds([]);
          exitSelectionMode();
          setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        } catch {
          setDeleteConfirm({
            isOpen: true,
            title: 'Error',
            message: 'Could not delete some timetables.',
            onConfirm: () => setDeleteConfirm(prev => ({ ...prev, isOpen: false })),
          });
        }
      }
    });
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'center' }}>
        <BulkActionBar
          selectedCount={count}
          onDelete={handleBulkDelete}
          onCancel={exitSelectionMode}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          itemName="timetable"
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>View Timetable</h1>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Browse and manage generated schedules</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!isSelectionMode && timetables.length > 0 && (
            <button
              className="btn btn-outline"
              style={{ borderRadius: 999, fontSize: '0.825rem' }}
              onClick={selectAll}
            >
              Select All
            </button>
          )}
          <button className="btn btn-primary" style={{ borderRadius: 999 }} onClick={() => navigate('/generate')}>
            <Sparkles style={{ width: 16, height: 16 }} /> Generate New
          </button>
        </div>
      </div>

      {timetables.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {timetables.map(t => (
            <motion.div
              layout
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: isSelected(t.id) ? 'var(--accent-muted)' : 'var(--surface)',
                border: isSelected(t.id) ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                borderRadius: 16, padding: '20px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                cursor: isSelectionMode ? 'pointer' : 'default',
                boxShadow: isSelected(t.id) ? '0 10px 25px rgba(0,0,0,0.1)' : 'none',
              }}
              onClick={() => { if (isSelectionMode) toggleItem(t.id); }}
            >
              {isSelectionMode && isSelected(t.id) && (
                <div style={{
                  position: 'absolute', top: -10, right: -10,
                  width: 24, height: 24, borderRadius: 12,
                  background: 'var(--accent)', color: 'var(--accent-text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 2,
                }}>
                  <Check style={{ width: 14, height: 14, strokeWidth: 3 }} />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: 'var(--accent-muted)',
                    border: '1.5px solid var(--accent-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CalendarIcon style={{ width: 22, height: 22, color: 'var(--accent-text)' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', margin: 0 }}>{t.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="timetable-menu-container" style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === t.id ? null : t.id);
                    }}
                    style={{
                      background: 'none', border: 'none', color: 'var(--text-secondary)',
                      cursor: 'pointer', padding: 4, borderRadius: 6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <MoreVertical style={{ width: 18, height: 18 }} />
                  </button>

                  <AnimatePresence>
                    {activeMenuId === t.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                          position: 'absolute', top: '100%', right: 0,
                          width: 160, background: 'var(--surface)',
                          border: '1.5px solid var(--border)', borderRadius: 12,
                          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                          padding: 6, zIndex: 50, marginTop: 4,
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          className="menu-item"
                          onClick={() => {
                            if (isSelectionMode) toggleItem(t.id);
                            else selectSingle(t.id);
                            setActiveMenuId(null);
                          }}
                        >
                          {isSelected(t.id) ? (
                            <><CheckSquare className="menu-icon" /> Deselect</>
                          ) : (
                            <><Square className="menu-icon" /> Select</>
                          )}
                        </button>
                        <div style={{ height: 1.5, background: 'var(--border)', margin: '4px 0', opacity: 0.5 }} />
                        <button
                          className="menu-item"
                          onClick={() => { navigate(`/view-timetable/${t.id}`); setActiveMenuId(null); }}
                        >
                          <ExternalLink className="menu-icon" /> Open
                        </button>
                        <button
                          className="menu-item menu-item-danger"
                          onClick={async () => {
                            setDeleteConfirm({
                              isOpen: true,
                              title: 'Delete Timetable',
                              message: `Are you sure you want to delete ${t.name}? This action cannot be undone.`,
                              onConfirm: async () => {
                                try {
                                  await deleteTimetable(t.id);
                                  setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
                                } catch {
                                  setDeleteConfirm({
                                    isOpen: true,
                                    title: 'Error',
                                    message: 'Could not delete the timetable.',
                                    onConfirm: () => setDeleteConfirm(prev => ({ ...prev, isOpen: false })),
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

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', background: 'var(--surface-2)',
                borderRadius: 10, border: '1.5px solid var(--border)',
                marginBottom: 12,
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</span>
                <Badge variant="success">Optimized</Badge>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', borderRadius: 10, justifyContent: 'center' }}
                onClick={() => navigate(`/view-timetable/${t.id}`)}
              >
                <ExternalLink style={{ width: 15, height: 15 }} />
                Open Schedule View
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={CalendarDays} 
          title="No timetable generated yet" 
          description="Generate your first AI-optimized timetable using your available data." 
          actionLabel="Generate Timetable" 
          onAction={() => navigate('/generate')} 
        />
      )}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.onConfirm}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
      />
    </div>
  );
}
