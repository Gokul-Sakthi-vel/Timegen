import React, { useState } from 'react';
import { Card, Button, Badge, EmptyState, Modal } from '../components/UI';
import { BookOpen, Plus, Edit2, Trash2, Search, Minus, Plus as PlusSmall, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Subject, Priority, SubjectType } from '../types';

const FIXED_KEYWORDS = ['library', 'nptel', 'tws', 'placement'];
const isAutoFixed = (name: string) => FIXED_KEYWORDS.some(kw => name.toLowerCase().includes(kw));

export default function Subjects() {
  const { subjects, addSubject, updateSubject, deleteSubject } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoursValue, setHoursValue] = useState(4);
  const [creditsValue, setCreditsValue] = useState(3);
  const [weeklyPeriodsValue, setWeeklyPeriodsValue] = useState(4);
  const [isFixedValue, setIsFixedValue] = useState(false);

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setEditingSubject(null);
    setHoursValue(4);
    setCreditsValue(3);
    setWeeklyPeriodsValue(4);
    setIsFixedValue(false);
    setIsModalOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setHoursValue(subject.hours);
    setCreditsValue(subject.credits ?? 3);
    setWeeklyPeriodsValue(subject.weeklyPeriods ?? subject.hours);
    setIsFixedValue(subject.isFixed ?? isAutoFixed(subject.name));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      hours: parseInt(formData.get('hours') as string),
      credits: creditsValue,
      weeklyPeriods: weeklyPeriodsValue,
      isFixed: isFixedValue,
      priority: formData.get('priority') as Priority,
      color: formData.get('color') as string,
      subjectType: formData.get('subjectType') as SubjectType,
    };

    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, data);
      } else {
        await addSubject(data);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save subject', error);
      window.alert('Could not save subject to backend. Please verify backend and Supabase settings.');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-text-header">Subjects</h1>
          <p className="text-sm md:text-base text-slate-500 font-medium">Manage subject configurations and priorities</p>
        </div>
        <Button icon={Plus} onClick={handleAdd} className="w-full md:w-auto whitespace-nowrap shadow-xl shadow-brand-500/20">
          Add Subject
        </Button>
      </header>

      {subjects.length > 0 ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-dark-surface p-5 rounded-[2rem] border border-dark-border shadow-xl">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search subjects by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 bg-dark-bg/50 border border-dark-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main placeholder:text-slate-600 font-medium"
              />
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-dark-bg/50 border-b border-dark-border">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-8"></th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subject</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Code</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Credits</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Periods/wk</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Priority</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {filteredSubjects.map((subject) => (
                      <tr key={subject.id} className="hover:bg-white/[0.02] transition-colors group">
                        {/* colour dot */}
                        <td className="px-4 py-3">
                          <div className={`w-3 h-3 rounded-full ${subject.color}`} />
                        </td>
                        {/* name */}
                        <td className="px-4 py-3">
                          <span className="font-bold text-text-main">{subject.name}</span>
                        </td>
                        {/* code */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-slate-500">{subject.code || '—'}</span>
                        </td>
                        {/* type */}
                        <td className="px-4 py-3">
                          <Badge variant={
                            subject.subjectType === 'Laboratory' ? 'info'
                              : subject.subjectType === 'Theory with Laboratory' ? 'warning'
                                : subject.subjectType === 'Tutorial' ? 'success'
                                  : 'neutral'
                          }>
                            {subject.subjectType === 'Theory with Laboratory' ? 'Theory+Lab'
                              : subject.subjectType}
                          </Badge>
                        </td>
                        {/* credits */}
                        <td className="px-4 py-3 text-center text-slate-400 font-medium">
                          {subject.credits ?? '—'}
                        </td>
                        {/* periods */}
                        <td className="px-4 py-3 text-center text-slate-400 font-medium">
                          {subject.weeklyPeriods ?? subject.hours}
                        </td>
                        {/* priority + fixed badge */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Badge variant={
                              subject.priority === 'High' ? 'danger' :
                                subject.priority === 'Medium' ? 'warning' : 'info'
                            }>
                              {subject.priority}
                            </Badge>
                            {(subject.isFixed || isAutoFixed(subject.name)) && (
                              <Badge variant="neutral" className="flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Fixed
                              </Badge>
                            )}
                          </div>
                        </td>
                        {/* actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => handleEdit(subject)}
                              className="p-2 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-xl transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                try { await deleteSubject(subject.id); }
                                catch { window.alert('Could not delete subject from backend.'); }
                              }}
                              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredSubjects.map((subject) => (
              <div key={subject.id}>
                <Card className="p-6 border-dark-border hover:border-brand-500/30 transition-all">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full ${subject.color} shadow-lg shadow-${subject.color.split('-')[1]}-500/20`} />
                      <div>
                        <h3 className="font-bold text-text-header text-lg">{subject.name}</h3>
                        <p className="text-xs font-mono text-slate-500 font-bold mt-1 uppercase tracking-wider">{subject.code || 'N/A'}</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1 font-medium">{subject.subjectType}</p>
                      </div>
                    </div>
                    <Badge variant={
                      subject.priority === 'High' ? 'danger' :
                        subject.priority === 'Medium' ? 'warning' : 'info'
                    }>
                      {subject.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-5 border-t border-dark-border">
                    <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">{subject.hours}h / week</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="p-3 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await deleteSubject(subject.id);
                          } catch (error) {
                            console.error('Failed to delete subject', error);
                            window.alert('Could not delete subject from backend.');
                          }
                        }}
                        className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No subjects yet"
            description="Add subjects to your curriculum to start building your timetable."
            actionLabel="Add First Subject"
            onAction={handleAdd}
          />
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Subject Name</label>
              <input
                name="name"
                defaultValue={editingSubject?.name}
                required
                placeholder="e.g. Advanced Mathematics"
                className="w-full px-5 py-4 bg-dark-bg border border-dark-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main placeholder:text-slate-700 font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Subject Code</label>
              <input
                name="code"
                defaultValue={editingSubject?.code}
                placeholder="Optional (auto-generated if empty)"
                className="w-full px-5 py-4 bg-dark-bg border border-dark-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main placeholder:text-slate-700 font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Weekly Hours <span className="text-slate-600 normal-case">(total workload)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHoursValue(prev => Math.max(1, prev - 1))}
                  className="w-11 h-11 rounded-xl border border-dark-border bg-dark-bg text-text-main flex items-center justify-center hover:bg-dark-border/50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  name="hours"
                  type="number"
                  min={1}
                  max={20}
                  value={hoursValue}
                  onChange={(e) => setHoursValue(Math.max(1, Number(e.target.value) || 1))}
                  required
                  className="w-full px-5 py-4 bg-dark-bg border border-dark-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main font-medium text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setHoursValue(prev => Math.min(20, prev + 1))}
                  className="w-11 h-11 rounded-xl border border-dark-border bg-dark-bg text-text-main flex items-center justify-center hover:bg-dark-border/50 transition-colors"
                >
                  <PlusSmall className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* ── Credits ── */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Credits
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCreditsValue(prev => Math.max(0, prev - 1))}
                  className="w-11 h-11 rounded-xl border border-dark-border bg-dark-bg text-text-main flex items-center justify-center hover:bg-dark-border/50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={creditsValue}
                  onChange={(e) => setCreditsValue(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-5 py-4 bg-dark-bg border border-dark-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main font-medium text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setCreditsValue(prev => Math.min(10, prev + 1))}
                  className="w-11 h-11 rounded-xl border border-dark-border bg-dark-bg text-text-main flex items-center justify-center hover:bg-dark-border/50 transition-colors"
                >
                  <PlusSmall className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* ── Weekly Periods (engine quota) ── */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Weekly Periods <span className="text-slate-600 normal-case">(engine quota)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWeeklyPeriodsValue(prev => Math.max(1, prev - 1))}
                  className="w-11 h-11 rounded-xl border border-dark-border bg-dark-bg text-text-main flex items-center justify-center hover:bg-dark-border/50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={weeklyPeriodsValue}
                  onChange={(e) => setWeeklyPeriodsValue(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-5 py-4 bg-dark-bg border border-dark-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main font-medium text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setWeeklyPeriodsValue(prev => Math.min(20, prev + 1))}
                  className="w-11 h-11 rounded-xl border border-dark-border bg-dark-bg text-text-main flex items-center justify-center hover:bg-dark-border/50 transition-colors"
                >
                  <PlusSmall className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                How many timetable slots the engine allocates per week. Defaults to Weekly Hours if not set.
              </p>
            </div>
            {/* ── Fixed Slot toggle ── */}
            <div className="col-span-2">
              <button
                type="button"
                onClick={() => setIsFixedValue(v => !v)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${isFixedValue
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-dark-bg border-dark-border text-slate-400'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Lock className={`w-4 h-4 ${isFixedValue ? 'text-amber-400' : 'text-slate-500'}`} />
                  <div className="text-left">
                    <p className={`text-sm font-bold ${isFixedValue ? 'text-amber-300' : 'text-text-main'}`}>
                      Fixed / Non-flexible Slot
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Engine pre-allocates this subject first, before theory (e.g. Library, NPTEL, TWS, Placement).
                    </p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full flex items-center transition-all ${isFixedValue ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}>
                  <div className="w-4 h-4 rounded-full bg-white mx-1 shadow" />
                </div>
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Subject Type</label>
              <select
                name="subjectType"
                defaultValue={editingSubject?.subjectType || 'Theory'}
                className="w-full px-5 py-4 bg-dark-bg border border-dark-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main font-medium appearance-none cursor-pointer"
              >
                <option value="Theory">Theory</option>
                <option value="Laboratory">Laboratory</option>
                <option value="Theory with Laboratory">Theory with Laboratory</option>
                <option value="Tutorial">Tutorial</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Priority</label>
              <select
                name="priority"
                defaultValue={editingSubject?.priority || 'Medium'}
                className="w-full px-5 py-4 bg-dark-bg border border-dark-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main font-medium appearance-none cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Color Tag</label>
              <select
                name="color"
                defaultValue={editingSubject?.color || 'bg-blue-500'}
                className="w-full px-5 py-4 bg-dark-bg border border-dark-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-text-main font-medium appearance-none cursor-pointer"
              >
                <option value="bg-blue-500">Blue</option>
                <option value="bg-emerald-500">Emerald</option>
                <option value="bg-amber-500">Amber</option>
                <option value="bg-purple-500">Purple</option>
                <option value="bg-rose-500">Rose</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1 shadow-xl shadow-brand-500/20">{editingSubject ? 'Save Changes' : 'Add Subject'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
