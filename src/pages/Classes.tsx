import React, { useState } from 'react';
import { Card, Button, EmptyState, Modal, Badge } from '../components/UI';
import { School, Plus, Edit2, Trash2, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ClassSection } from '../types';

export default function Classes() {
  const { classes, subjects, addClass, updateClass, deleteClass } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSection | null>(null);

  const handleAdd = () => {
    setEditingClass(null);
    setIsModalOpen(true);
  };

  const handleEdit = (c: ClassSection) => {
    setEditingClass(c);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedSubjects = Array.from(formData.getAll('subjects')) as string[];
    
    const data = {
      name: formData.get('name') as string,
      studentsCount: parseInt(formData.get('studentsCount') as string),
      subjects: selectedSubjects,
    };

    try {
      if (editingClass) {
        await updateClass(editingClass.id, data);
      } else {
        await addClass(data);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save class', error);
      window.alert('Could not save class to backend.');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-text-header">Classes / Sections</h1>
          <p className="text-sm md:text-base text-slate-500 font-medium">Manage class groups and their weekly schedules</p>
        </div>
        <Button icon={Plus} onClick={handleAdd} className="w-full md:w-auto whitespace-nowrap shadow-xl shadow-brand-500/20">
          Add Class
        </Button>
      </header>

      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((c) => (
            <div key={c.id}>
              <Card className="group hover:border-brand-500/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-400 border border-brand-500/20 shadow-lg">
                      <School className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-header text-lg">{c.name}</h3>
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mt-1">
                        <Users className="w-3 h-3" />
                        {c.studentsCount} Students
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button onClick={() => handleEdit(c)} className="p-2.5 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-xl transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await deleteClass(c.id);
                        } catch (error) {
                          console.error('Failed to delete class', error);
                          window.alert('Could not delete class from backend.');
                        }
                      }}
                      className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Curriculum</p>
                  <div className="flex flex-wrap gap-2">
                    {c.subjects.map(sid => {
                      const s = subjects.find(sub => sub.id === sid);
                      return s ? <span key={sid}><Badge variant="neutral">{s.name}</Badge></span> : null;
                    })}
                    {c.subjects.length === 0 && <span className="text-xs text-slate-600 italic">No subjects added</span>}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState 
            icon={School}
            title="No classes yet"
            description="Add classes with working days and subjects to schedule."
            actionLabel="Add First Class"
            onAction={handleAdd}
          />
        </Card>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingClass ? 'Edit Class' : 'Add New Class'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-text-main mb-2">Class Name</label>
              <input 
                name="name"
                defaultValue={editingClass?.name}
                required
                placeholder="e.g. Computer Science - Year 1"
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main placeholder:text-[var(--color-text-muted)]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-main mb-2">Number of Students</label>
              <input 
                name="studentsCount"
                type="number"
                defaultValue={editingClass?.studentsCount || 30}
                required
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-main mb-2">Subjects to Schedule</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-dark-bg rounded-xl border border-dark-border">
                {subjects.map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-sm text-text-main cursor-pointer hover:text-brand-600">
                    <input 
                      type="checkbox" 
                      name="subjects" 
                      value={s.id} 
                      defaultChecked={editingClass?.subjects.includes(s.id)}
                      className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">{editingClass ? 'Save Changes' : 'Add Class'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
