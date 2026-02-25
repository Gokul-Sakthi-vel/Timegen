import React, { useState } from 'react';
import { Card, Button, EmptyState, Modal, Badge } from '../components/UI';
import { DoorOpen, Plus, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Room } from '../types';

export default function Rooms() {
  const { rooms, addRoom, updateRoom, deleteRoom } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const handleAdd = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const handleEdit = (r: Room) => {
    setEditingRoom(r);
    setIsModalOpen(true);
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
      if (editingRoom) {
        await updateRoom(editingRoom.id, data);
      } else {
        await addRoom(data);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save room', error);
      window.alert('Could not save room to backend.');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-text-header">Rooms</h1>
          <p className="text-sm md:text-base text-slate-500 font-medium">Manage classroom and laboratory availability</p>
        </div>
        <Button icon={Plus} onClick={handleAdd} className="w-full md:w-auto whitespace-nowrap shadow-xl shadow-brand-500/20">
          Add Room
        </Button>
      </header>

      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((r) => (
            <div key={r.id}>
              <Card className="group hover:border-brand-500/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-400 border border-brand-500/20 shadow-lg">
                      <DoorOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-header text-lg">{r.name}</h3>
                      <Badge variant={r.type === 'Lab' ? 'info' : 'neutral'} className="mt-1">{r.type}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button onClick={() => handleEdit(r)} className="p-2.5 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-xl transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await deleteRoom(r.id);
                        } catch (error) {
                          console.error('Failed to delete room', error);
                          window.alert('Could not delete room from backend.');
                        }
                      }}
                      className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-dark-border">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Capacity</span>
                  <span className="text-sm font-bold text-text-header">{r.capacity} Seats</span>
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState 
            icon={DoorOpen}
            title="No rooms yet"
            description="Add rooms to optionally assign them during timetable generation."
            actionLabel="Add First Room"
            onAction={handleAdd}
          />
        </Card>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingRoom ? 'Edit Room' : 'Add New Room'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-text-main mb-2">Room Name / Number</label>
              <input 
                name="name"
                defaultValue={editingRoom?.name}
                required
                placeholder="e.g. Room 302 or Physics Lab"
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main placeholder:text-[var(--color-text-muted)]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-main mb-2">Capacity</label>
              <input 
                name="capacity"
                type="number"
                defaultValue={editingRoom?.capacity || 40}
                required
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-main mb-2">Room Type</label>
              <select 
                name="type"
                defaultValue={editingRoom?.type || 'Classroom'}
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main"
              >
                <option value="Classroom">Classroom</option>
                <option value="Lab">Laboratory</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">{editingRoom ? 'Save Changes' : 'Add Room'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
