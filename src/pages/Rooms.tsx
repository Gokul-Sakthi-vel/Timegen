import React, { useState, useEffect } from 'react';
import { Badge, EmptyState, Modal, BulkActionBar, ConfirmModal, ErrorModal } from '../components/UI';
import { DoorOpen, Plus, Edit2, Trash2, Check, MoreVertical, Square, CheckSquare, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useSelection } from '../hooks/useSelection';
import { Room } from '../types';

export default function Rooms() {
  const { rooms, addRoom, updateRoom, deleteRoom, deleteRoomsBatch } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const {
    selectedIds, isSelected, toggleItem,
    selectAll, deselectAll, count,
    isSelectionMode, exitSelectionMode, selectSingle
  } = useSelection(rooms);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
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
      if (activeMenuId && !(e.target as HTMLElement).closest('.room-menu-container')) {
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

  const handleAdd = () => { setEditingRoom(null); setIsModalOpen(true); };
  const handleEdit = (r: Room) => { setEditingRoom(r); setIsModalOpen(true); };


  const handleBulkDelete = async () => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Rooms',
      message: `Are you sure you want to delete ${selectedIds.length} rooms? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteRoomsBatch(selectedIds);
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
      capacity: parseInt(formData.get('capacity') as string),
      type: formData.get('type') as 'Classroom' | 'Lab',
    };
    try {
      if (editingRoom) { await updateRoom(editingRoom.id, data); }
      else { await addRoom(data); }
      setIsModalOpen(false);
    } catch (err: any) { 
      handleError(err, () => {
          console.log("Retrying save...");
      });
    }
  };

  const filteredRooms = rooms.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = typeFilter === 'all' || r.type === typeFilter;
    return matchesSearch && matchesFilter;
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
          itemName="room"
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Rooms</h1>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Manage classroom and laboratory availability</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!isSelectionMode && rooms.length > 0 && (
            <button
              className="btn btn-outline"
              style={{ borderRadius: 999, fontSize: '0.825rem' }}
              onClick={selectAll}
            >
              Select All
            </button>
          )}
          <button className="btn btn-primary" style={{ borderRadius: 999 }} onClick={handleAdd}>
            <Plus style={{ width: 16, height: 16 }} /> Add Room
          </button>
        </div>
      </div>

      {rooms.length > 0 && (
        <div className="search-filter-container">
          <div className="search-input-wrapper">
            <Search style={{ width: 18, height: 18, color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search by room name…" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="filter-select"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="Classroom">Classroom</option>
            <option value="Lab">Laboratory</option>
          </select>
        </div>
      )}

      {rooms.length === 0 ? (
        <EmptyState 
          icon={DoorOpen} 
          title="No rooms yet" 
          description="Add classrooms and laboratories to assign them during the schedule generation process." 
          actionLabel="Add First Room" 
          onAction={handleAdd} 
        />
      ) : filteredRooms.length === 0 ? (
        <div style={{ padding: '60px 0' }}>
          <EmptyState 
            icon={Search} 
            title="No matches found" 
            description="We couldn't find any rooms matching your current search or filter." 
            actionLabel="Clear Search" 
            onAction={() => { setSearchQuery(''); setTypeFilter('all'); }} 
          />
        </div>
      ) : (
        <div className="rooms-grid">
          {filteredRooms.map(r => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, boxShadow: 'var(--shadow-elevated)', borderColor: 'var(--border-2)' }}
              style={{
                background: isSelected(r.id) ? 'var(--accent-muted)' : 'var(--surface)',
                border: isSelected(r.id) ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                borderRadius: 16, padding: '18px 20px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                cursor: isSelectionMode ? 'pointer' : 'default',
                outline: 'none',
                boxShadow: isSelected(r.id) ? '0 10px 25px rgba(0,0,0,0.1)' : 'none'
              }}
              tabIndex={0}
              onClick={() => {
                if (isSelectionMode) {
                  toggleItem(r.id);
                }
              }}
              onKeyDown={e => {
                if (isSelectionMode && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  toggleItem(r.id);
                }
              }}
            >
              {isSelectionMode && isSelected(r.id) && (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: r.type === 'Lab' ? 'var(--info-bg)' : 'var(--accent-muted)',
                    border: `1.5px solid ${r.type === 'Lab' ? 'var(--info-border)' : 'var(--accent-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <DoorOpen style={{ width: 18, height: 18, color: r.type === 'Lab' ? 'var(--info-text)' : 'var(--accent-text)' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontSize: '0.9375rem' }}>{r.name}</p>
                    <Badge variant={r.type === 'Lab' ? 'info' : 'neutral'} className="badge" style={{ marginTop: 4 }}>{r.type}</Badge>
                  </div>
                </div>
                <div className="room-menu-container" style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === r.id ? null : r.id);
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
                    {activeMenuId === r.id && (
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
                          padding: 6, zIndex: 50,
                          marginTop: 4,
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          className="menu-item"
                          onClick={() => {
                            if (isSelectionMode) toggleItem(r.id);
                            else selectSingle(r.id);
                            setActiveMenuId(null);
                          }}
                        >
                          {isSelected(r.id) ? (
                            <><CheckSquare className="menu-icon" /> Deselect</>
                          ) : (
                            <><Square className="menu-icon" /> Select</>
                          )}
                        </button>
                        <div style={{ height: 1.5, background: 'var(--border)', margin: '4px 0', opacity: 0.5 }} />
                        <button
                          className="menu-item"
                          onClick={() => { handleEdit(r); setActiveMenuId(null); }}
                        >
                          <Edit2 className="menu-icon" /> Edit
                        </button>
                        <button
                          className="menu-item menu-item-danger"
                          onClick={async () => {
                            setDeleteConfirm({
                              isOpen: true,
                              title: 'Delete Room',
                              message: `Are you sure you want to delete ${r.name}? This action cannot be undone.`,
                              onConfirm: async () => {
                                try {
                                  await deleteRoom(r.id);
                                  setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
                                } catch (err: any) {
                                  handleError(err, () => {
                                      deleteRoom(r.id);
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

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: 14, borderTop: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Capacity</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{r.capacity} Seats</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRoom ? 'Edit Room' : 'Add New Room'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="field-label">Room Name / Number</label>
            <input name="name" defaultValue={editingRoom?.name} required placeholder="e.g. Room 302 or Physics Lab" className="field-input" style={{ width: '100%' }} />
          </div>
          <div>
            <label className="field-label">Capacity</label>
            <input name="capacity" type="number" defaultValue={editingRoom?.capacity || 40} required className="field-input" style={{ width: '100%' }} />
          </div>
          <div>
            <label className="field-label">Room Type</label>
            <select name="type" defaultValue={editingRoom?.type || 'Classroom'} className="field-input" style={{ width: '100%', appearance: 'none', cursor: 'pointer' }}>
              <option value="Classroom">Classroom</option>
              <option value="Lab">Laboratory</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1, borderRadius: 10 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, borderRadius: 10 }}>
              {editingRoom ? 'Save Changes' : 'Add Room'}
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
        .rooms-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .rooms-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1100px) {
          .rooms-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
          .search-filter-container { flex-direction: column; align-items: stretch; gap: 8px; }
          .filter-select { width: 100%; min-width: 0; }
        }
      `}</style>
    </div>
  );
}
