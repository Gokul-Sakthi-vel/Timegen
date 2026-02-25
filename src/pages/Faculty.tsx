import React, { useState } from 'react';
import { Card, Button, EmptyState, Modal, Badge } from '../components/UI';
import { Users, Plus, Edit2, Trash2, Mail, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FacultyMember } from '../types';

export default function Faculty() {
  const { faculty, subjects, addFaculty, updateFaculty, deleteFaculty } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyMember | null>(null);

  const handleAdd = () => {
    setEditingFaculty(null);
    setIsModalOpen(true);
  };

  const handleEdit = (f: FacultyMember) => {
    setEditingFaculty(f);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedSubjects = Array.from(formData.getAll('subjects')) as string[];
    const selectedAvailability = Array.from(formData.getAll('availability')) as string[];
    
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subjects: selectedSubjects,
      availability: selectedAvailability,
    };

    try {
      if (editingFaculty) {
        await updateFaculty(editingFaculty.id, data);
      } else {
        await addFaculty(data);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save faculty', error);
      window.alert('Could not save faculty to backend.');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-text-header">Faculty</h1>
          <p className="text-sm md:text-base text-slate-500 font-medium">Manage faculty members and their availability</p>
        </div>
        <Button icon={Plus} onClick={handleAdd} className="w-full md:w-auto whitespace-nowrap shadow-xl shadow-brand-500/20">
          Add Faculty
        </Button>
      </header>

      {faculty.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faculty.map((f) => (
            <div key={f.id}>
              <Card className="group hover:border-brand-500/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-400 border border-brand-500/20 shadow-lg font-bold text-xl">
                      {f.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-text-header text-lg">{f.name}</h3>
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mt-1">
                        <Mail className="w-3 h-3" />
                        {f.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button onClick={() => handleEdit(f)} className="p-2.5 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-xl transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await deleteFaculty(f.id);
                        } catch (error) {
                          console.error('Failed to delete faculty', error);
                          window.alert('Could not delete faculty from backend.');
                        }
                      }}
                      className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Specializations</p>
                    <div className="flex flex-wrap gap-2">
                      {f.subjects.map(sid => {
                        const s = subjects.find(sub => sub.id === sid);
                        return s ? <span key={sid}><Badge variant="info" className="bg-blue-500/5 border-blue-500/10">{s.name}</Badge></span> : null;
                      })}
                      {f.subjects.length === 0 && <span className="text-xs text-slate-600 italic">No subjects assigned</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Availability</p>
                    <div className="flex flex-wrap gap-2">
                      {f.availability.map(day => (
                        <span key={day}><Badge variant="neutral">{day}</Badge></span>
                      ))}
                      {f.availability.length === 0 && <span className="text-xs text-slate-600 italic">No availability set</span>}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState 
            icon={Users}
            title="No faculty members yet"
            description="Add faculty members with their subjects and scheduling preferences."
            actionLabel="Add First Faculty"
            onAction={handleAdd}
          />
        </Card>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-text-main mb-2">Full Name</label>
              <input 
                name="name"
                defaultValue={editingFaculty?.name}
                required
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-main mb-2">Email Address</label>
              <input 
                name="email"
                type="email"
                defaultValue={editingFaculty?.email}
                required
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-main mb-2">Subjects Expertise</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-dark-bg rounded-xl border border-dark-border">
                {subjects.map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-sm text-text-main cursor-pointer hover:text-brand-600">
                    <input 
                      type="checkbox" 
                      name="subjects" 
                      value={s.id} 
                      defaultChecked={editingFaculty?.subjects.includes(s.id)}
                      className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-text-main mb-2">Availability Days</label>
              <div className="flex flex-wrap gap-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                  <label key={day} className="flex items-center gap-2 text-sm text-text-main cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="availability" 
                      value={day} 
                      defaultChecked={editingFaculty?.availability.includes(day)}
                      className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">{editingFaculty ? 'Save Changes' : 'Add Faculty'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
