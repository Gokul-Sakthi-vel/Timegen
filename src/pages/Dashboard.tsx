import React from 'react';
import { Card, Button, Badge } from '../components/UI';
import { 
  BookOpen, 
  Users, 
  School, 
  DoorOpen, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const { subjects, faculty, classes, rooms, timetables } = useApp();
  const navigate = useNavigate();

  const stats = [
    { label: 'Subjects', value: subjects.length.toString(), icon: BookOpen, color: 'bg-blue-500', path: '/subjects' },
    { label: 'Faculty', value: faculty.length.toString(), icon: Users, color: 'bg-emerald-500', path: '/faculty' },
    { label: 'Classes', value: classes.length.toString(), icon: School, color: 'bg-amber-500', path: '/classes' },
    { label: 'Rooms', value: rooms.length.toString(), icon: DoorOpen, color: 'bg-purple-500', path: '/rooms' },
  ];

  const missingData = [
    { condition: subjects.length === 0, label: 'Add Subjects', path: '/subjects' },
    { condition: faculty.length === 0, label: 'Add Faculty Members', path: '/faculty' },
    { condition: classes.length === 0, label: 'Add Classes / Sections', path: '/classes' },
  ].filter(item => item.condition);

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-header">Dashboard</h1>
          <p className="text-slate-500 font-medium">System overview and readiness status</p>
        </div>
        <Button icon={Sparkles} onClick={() => navigate('/generate')} className="w-full sm:w-auto shadow-xl shadow-brand-500/20">
          Generate Timetable
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(stat.path)}
            className="cursor-pointer"
          >
            <Card className="hover:border-brand-500/50 transition-all duration-300 group">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-xl shadow-${stat.color.split('-')[1]}-500/30 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-3xl font-bold text-text-header mt-1">{stat.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {missingData.length > 0 && (
            <Card 
              title="Setup Required" 
              subtitle="Missing items needed for timetable generation"
              className="border-amber-500/20 bg-amber-500/5"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-5 bg-dark-bg/50 rounded-2xl border border-amber-500/10">
                  <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-text-header">Incomplete Configuration</p>
                    <p className="text-sm text-slate-400 mb-4 mt-1">Before generating a timetable, please add the following data:</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {missingData.map(item => (
                        <li key={item.label}>
                          <Link to={item.path} className="flex items-center gap-2 p-3 bg-dark-surface rounded-xl text-sm text-amber-500 hover:bg-amber-500/10 transition-colors border border-amber-500/10">
                            <ArrowRight className="w-4 h-4" />
                            <span className="font-bold">{item.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card 
            title="Recent Timetables"
            headerAction={<Link to="/view-timetable" className="text-sm font-bold text-brand-400 hover:text-brand-300 uppercase tracking-wider">View All</Link>}
          >
            {timetables.length > 0 ? (
              <div className="space-y-4">
                {timetables.slice(0, 3).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-5 bg-dark-bg/50 rounded-2xl border border-dark-border group hover:border-brand-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-dark-surface rounded-xl flex items-center justify-center text-brand-400 shadow-lg border border-dark-border">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-text-main">{t.name}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{new Date(t.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/view-timetable')}>View</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-dark-bg/50 rounded-2xl flex items-center justify-center mb-6 border border-dark-border">
                  <Sparkles className="w-8 h-8 text-slate-700" />
                </div>
                <p className="text-slate-500 font-medium">No timetables generated yet</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="System Status">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-xl border border-dark-border">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Database</span>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-xl border border-dark-border">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">AI Engine</span>
                <Badge variant="info">Ready</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-xl border border-dark-border">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Backup</span>
                <span className="text-xs font-mono text-slate-500">Just now</span>
              </div>
            </div>
          </Card>

          <Card title="Quick Actions">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" icon={BookOpen} onClick={() => navigate('/subjects')}>Add Subject</Button>
              <Button variant="outline" className="w-full justify-start" icon={Users} onClick={() => navigate('/faculty')}>Add Faculty</Button>
              <Button variant="outline" className="w-full justify-start" icon={School} onClick={() => navigate('/classes')}>Add Class</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
