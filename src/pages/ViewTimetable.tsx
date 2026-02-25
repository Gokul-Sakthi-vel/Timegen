import React from 'react';
import { Card, Button, EmptyState, Badge } from '../components/UI';
import { CalendarDays, Sparkles, Trash2, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ViewTimetable() {
  const navigate = useNavigate();
  const { timetables, deleteTimetable } = useApp();

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-text-header">View Timetable</h1>
          <p className="text-sm md:text-base text-slate-500 font-medium">Browse and manage generated schedules</p>
        </div>
        <Button icon={Sparkles} onClick={() => navigate('/generate')} className="w-full md:w-auto whitespace-nowrap shadow-xl shadow-brand-500/20">
          Generate New
        </Button>
      </header>

      {timetables.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {timetables.map((t) => (
            <div key={t.id}>
              <Card className="group hover:border-brand-500/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-400 border border-brand-500/20 shadow-lg">
                      <CalendarIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-header">{t.name}</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Created on {new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button 
                      onClick={async () => {
                        try {
                          await deleteTimetable(t.id);
                        } catch (error) {
                          console.error('Failed to delete timetable', error);
                          window.alert('Could not delete timetable from backend.');
                        }
                      }}
                      className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-2xl border border-dark-border">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status</span>
                    <Badge variant="success">Optimized</Badge>
                  </div>
                  <Button 
                    variant="primary" 
                    className="w-full" 
                    icon={ExternalLink}
                    onClick={() => navigate(`/view-timetable/${t.id}`)}
                  >
                    Open Schedule View
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState 
            icon={CalendarDays}
            title="No timetables generated yet"
            description="Generate your first AI-optimized timetable to view it here."
            actionLabel="Generate Timetable"
            onAction={() => navigate('/generate')}
          />
        </Card>
      )}
    </div>
  );
}
