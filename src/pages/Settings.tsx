import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Layout, 
  Settings as SettingsIcon, 
  Database, 
  Info, 
  LogOut, 
  ChevronDown, 
  ChevronRight, 
  Save, 
  Trash2, 
  Download, 
  Upload, 
  Palette, 
  Zap, 
  Clock, 
  Minus, 
  Plus, 
  Check, 
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Moon,
  Sun,
  Monitor,
  Search,
  BookOpen,
  Users,
  Building,
  CalendarDays,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CollegeSettings, Break, AppearanceSettings, AcademicPreferences, TimetableRules, NotificationSettings, AppState } from '../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const THEMES = [
  { id: 'light', icon: Sun, label: 'Light' },
  { id: 'dark', icon: Moon, label: 'Dark' },
  { id: 'system', icon: Monitor, label: 'System' }
] as const;


interface SectionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
  isDanger?: boolean;
}

const SettingsSection: React.FC<SectionProps> = ({ title, description, icon: Icon, children, isOpen, onToggle, badge, isDanger }) => (
  <div style={{
    background: 'var(--surface)',
    border: `1.5px solid ${isDanger ? 'var(--danger-border)' : 'var(--border)'}`,
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: 'var(--shadow-card)',
    transition: 'all 0.2s',
  }}>
    <button 
      onClick={onToggle}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ 
          width: 44, height: 44, 
          borderRadius: 12, 
          background: isDanger ? 'var(--danger-bg)' : 'var(--surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isDanger ? 'var(--danger-text)' : 'var(--accent)',
        }}>
          <Icon size={22} />
        </div>
        <div>
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: 700, 
            color: isDanger ? 'var(--danger-text)' : 'var(--text-primary)', 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            {title}
            {badge && (
              <span style={{ 
                fontSize: '0.7rem', 
                padding: '2px 8px', 
                borderRadius: 99, 
                background: isDanger ? 'var(--danger-bg)' : 'var(--accent-muted)',
                color: isDanger ? 'var(--danger-text)' : 'var(--accent-text)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {badge}
              </span>
            )}
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{description}</p>
        </div>
      </div>
      <div style={{ color: 'var(--text-placeholder)' }}>
        {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </div>
    </button>
    
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ 
            padding: '4px 24px 24px', 
            borderTop: '1.5px solid var(--border)',
            background: 'var(--surface-2)' 
          }}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; sublabel?: string }> = ({ checked, onChange, label, sublabel }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
      {sublabel && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sublabel}</span>}
    </div>
    <div 
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24,
        borderRadius: 24,
        background: checked ? 'var(--accent)' : 'var(--text-placeholder)',
        opacity: checked ? 1 : 0.4,
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <motion.div 
        animate={{ x: checked ? 22 : 4 }}
        initial={false}
        style={{
          width: 18, height: 18,
          borderRadius: 18,
          background: '#fff',
          position: 'absolute',
          top: 3,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      />
    </div>
  </div>
);

export default function Settings() {
  const { 
    settings, updateSettings, 
    theme, setTheme, restoreSettingsDefaults,
    user, logout, updateProfile, resetPassword,
    subjects, faculty, classes, rooms,
    importData, resetData,
    showNotification, clearNotification
  } = useApp();
  
  const [openSection, setOpenSection] = useState<string>('profile');
  const [isReseting, setIsReseting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [profileName, setProfileName] = useState(user?.name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isRequestingPW, setIsRequestingPW] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (id: string) => setOpenSection(openSection === id ? '' : id);


  const patch = (changes: Partial<CollegeSettings>) => {
    updateSettings({ ...settings, ...changes });
  };


  const patchAcademic = (changes: Partial<AcademicPreferences>) => {
    patch({ academic: { ...settings.academic, ...changes } });
  };

  const patchRules = (changes: Partial<TimetableRules>) => {
    patch({ rules: { ...settings.rules, ...changes } });
  };

  const patchNotifications = (changes: Partial<NotificationSettings>) => {
    patch({ notifications: { ...settings.notifications, ...changes } });
  };

  const patchAppearance = (changes: Partial<AppearanceSettings>) => {
    patch({ appearance: { ...settings.appearance, ...changes } });
  };

  const toggleDay = (day: string) => {
    const workingDays = settings.workingDays.includes(day)
      ? settings.workingDays.filter(d => d !== day)
      : [...settings.workingDays, day];
    patch({ workingDays });
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      subjects, faculty, classes, rooms, settings
    }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `timegen_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showNotification({ title: 'Backup Exported', message: 'Your workspace data has been saved to a JSON file.', type: 'success' });
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        importData(json);
        showNotification({ title: 'Data Imported', message: 'Your workspace assets have been restored successfully.', type: 'success' });
      } catch (err) {
        showNotification({ title: 'Import Failed', message: 'Please ensure it is a valid Timegen backup file.', type: 'error' });
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleResetAction = async () => {
    if (resetConfirmText.toLowerCase() !== 'reset') {
      showNotification({ title: 'Action Required', message: 'Please type RESET to confirm data deletion.', type: 'error' });
      return;
    }
    await resetData();
    setIsReseting(false);
    setResetConfirmText('');
    showNotification({ title: 'Workspace Wiped', message: 'All subjects, faculty and classes have been removed.', type: 'success' });
  };

  const handleUpdateProfile = async () => {
    if (!profileName) return;
    setIsSavingProfile(true);
    try {
      await updateProfile(profileName);
      showNotification({ title: 'Profile Updated', message: 'Your display name has been saved.', type: 'success' });
    } catch (err) {
      showNotification({ title: 'Update Failed', message: 'Could not save profile changes.', type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    setIsRequestingPW(true);
    try {
      await resetPassword(user.email);
      showNotification({ title: 'Password Reset Email Sent', message: 'We\'ve sent a password reset link to your email. Please check your inbox.', type: 'success' });
    } catch (err: any) {
      console.error('Password reset error:', err);
      showNotification({ title: 'Failed to send email', message: err.message || 'Please check your connection and try again.', type: 'error' });
    } finally {
      setIsRequestingPW(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 1000, 
      margin: '0 auto', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 24,
      paddingBottom: 40 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.04em' }}>Settings</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Manage your workspace preferences and account details</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => { restoreSettingsDefaults(); showNotification({ title: 'Success', message: 'Settings restored to defaults', type: 'success' }); }}
            className="btn btn-outline btn-sm"
          >
            <RefreshCw size={14} style={{ marginRight: 6 }} /> Restore Defaults
          </button>
          
          {settings.notifications.autoSaveIndicator && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px',
              background: 'var(--success-bg)', border: '1.5px solid var(--success-border)', borderRadius: 999,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success-text)', display: 'inline-block', animation: 'premium-pulse 2s infinite' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success-text)' }}>Cloud Sync Active</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Profile & Account */}
        <SettingsSection 
          title="Profile & Account" 
          description="Manage your personal information and account security" 
          icon={User}
          isOpen={openSection === 'profile'}
          onToggle={() => toggleSection('profile')}
        >
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ 
                width: 72, height: 72, 
                borderRadius: 24, 
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-text)',
                boxShadow: '0 8px 16px var(--accent-muted)'
              }}>
                {user?.name?.[0] || 'U'}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>{user?.name || 'User Name'}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  <Mail size={14} /> {user?.email || 'user@example.com'}
                </div>
              </div>
              <button 
                className="btn btn-primary btn-sm" 
                style={{ marginLeft: 'auto' }}
                disabled={isSavingProfile || profileName === user?.name}
                onClick={handleUpdateProfile}
              >
                {isSavingProfile ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                Save Profile
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="field-label" style={{ fontSize: '0.7rem' }}>Full Name</label>
                <input 
                  type="text" className="field-input" 
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  style={{ width: '100%' }} 
                />
              </div>
              <div>
                <label className="field-label" style={{ fontSize: '0.7rem' }}>Email Address</label>
                <input type="email" className="field-input" defaultValue={user?.email} disabled style={{ width: '100%', opacity: 0.6 }} />
              </div>
            </div>

            <div style={{ borderTop: '1.5px solid var(--border)', paddingTop: 20 }}>
              <h5 style={{ margin: '0 0 12px', fontSize: '0.875rem', fontWeight: 700 }}>Security Actions</h5>
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={handleChangePassword}
                  className="btn btn-outline" 
                  disabled={isRequestingPW}
                  style={{ display: 'flex', gap: 8, fontSize: '0.8125rem', minWidth: 180 }}
                >
                  {isRequestingPW ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />} 
                  {isRequestingPW ? 'Sending Link...' : 'Request Password Reset'}
                </button>
                <button 
                  onClick={logout}
                  className="btn btn-outline" 
                  style={{ display: 'flex', gap: 8, fontSize: '0.8125rem', color: 'var(--danger-text)' }}
                >
                  <LogOut size={16} /> Sign Out from This Device
                </button>
              </div>
            </div>
          </div>
        </SettingsSection>



        {/* Timetable Rules */}
        <SettingsSection 
          title="Scheduling Engine Rules" 
          description="Configure how the AI prioritizes and validates your timetable" 
          icon={Zap}
          isOpen={openSection === 'rules'}
          onToggle={() => toggleSection('rules')}
          badge="Advanced"
        >
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Toggle 
              label="Strict Conflict Prevention" 
              sublabel="Engine will fail rather than allowed overlapped faculty or rooms"
              checked={settings.rules.strictScheduling}
              onChange={v => patchRules({ strictScheduling: v })}
            />
            <Toggle 
              label="Prioritize Morning Sessions" 
              sublabel="Favor placement of core subjects in early periods (1-4)"
              checked={settings.rules.prioritizeMorning}
              onChange={v => patchRules({ prioritizeMorning: v })}
            />
            <Toggle 
              label="Flexible Interval Mapping" 
              sublabel="Allow slight adjustments to break times to fit complex sessions"
              checked={settings.rules.flexibleBreaks}
              onChange={v => patchRules({ flexibleBreaks: v })}
            />
            
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Faculty Workload Balance</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent)' }}>{settings.rules.facultyWorkloadBalance}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={settings.rules.facultyWorkloadBalance}
                onChange={e => patchRules({ facultyWorkloadBalance: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-placeholder)', marginTop: 4 }}>
                <span>Maximize Efficiency</span>
                <span>Prioritize Fairness</span>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Working Days & Hours */}
        <SettingsSection 
          title="Working Days & Hours" 
          description="Define the global calendar and timeline for your college" 
          icon={Clock}
          isOpen={openSection === 'hours'}
          onToggle={() => toggleSection('hours')}
        >
           <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 20 }}>
              <label className="field-label">Active Working Days</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`day-pill ${settings.workingDays.includes(day) ? 'selected' : ''}`}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1.5px solid var(--border)',
                      background: settings.workingDays.includes(day) ? 'var(--accent)' : 'transparent',
                      color: settings.workingDays.includes(day) ? 'var(--accent-text)' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label className="field-label">Start Time</label>
                <input
                  type="time" value={settings.startTime}
                  onChange={e => patch({ startTime: e.target.value })}
                  placeholder="Select start time"
                  className="field-input" style={{ width: '100%' }}
                />
              </div>
              <div>
                <label className="field-label">End Time</label>
                <input
                  type="time" value={settings.endTime}
                  onChange={e => patch({ endTime: e.target.value })}
                  placeholder="Select end time"
                  className="field-input" style={{ width: '100%' }}
                />
              </div>
              <div>
                <label className="field-label">Periods / Day</label>
                <input
                  type="number" min={1} max={12}
                  value={settings.academic.maxPeriodsPerDay}
                  onChange={e => patchAcademic({ maxPeriodsPerDay: parseInt(e.target.value, 10) || 1 })}
                  className="field-input" style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label className="field-label">Default Period Duration (minutes)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button" className="stepper-btn"
                  onClick={() => patch({ periodDuration: Math.max(30, settings.periodDuration - 5) })}
                  style={{ width: 40, height: 40, borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number" min={30} step={5} value={settings.periodDuration}
                  onChange={e => patch({ periodDuration: Math.max(30, parseInt(e.target.value || '30', 10)) })}
                  placeholder="Enter duration (minutes)"
                  className="field-input" style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}
                />
                <button
                  type="button" className="stepper-btn"
                  onClick={() => patch({ periodDuration: Math.min(180, settings.periodDuration + 5) })}
                  style={{ width: 40, height: 40, borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection 
          title="Appearance" 
          description="Customize the interface and design of your dashboard" 
          icon={Palette}
          isOpen={openSection === 'appearance'}
          onToggle={() => toggleSection('appearance')}
        >
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label className="field-label">Active Theme Mode</label>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
                padding: 6, background: 'var(--surface-3)', borderRadius: 12
              }}>
                {THEMES.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => setTheme(t.id)}
                    style={{
                      padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: theme === t.id ? 'var(--accent)' : 'transparent',
                      color: theme === t.id ? 'var(--accent-text)' : 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      fontSize: '0.8125rem', fontWeight: 600, transition: 'all 0.1s'
                    }}
                  >
                    <t.icon size={16} /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            <Toggle 
              label="Modern Interface Animations" 
              sublabel="Enable smooth transitions and micro-interactions"
              checked={settings.appearance.animations}
              onChange={v => patchAppearance({ animations: v })}
            />
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection 
          title="Notifications" 
          description="Control how the system communicates updates and alerts" 
          icon={Bell}
          isOpen={openSection === 'notifications'}
          onToggle={() => toggleSection('notifications')}
        >
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Toggle 
              label="Success Alerts" 
              sublabel="Show confirmation when data is saved or updated"
              checked={settings.notifications.successAlerts}
              onChange={v => patchNotifications({ successAlerts: v })}
            />
            <Toggle 
              label="Conflict & Error Warnings" 
              sublabel="Pop-up notifications for scheduling conflicts or system errors"
              checked={settings.notifications.errorAlerts}
              onChange={v => patchNotifications({ errorAlerts: v })}
            />
            <Toggle 
              label="Auto-save Status Indicator" 
              sublabel="Show the cloud sync badge in the top navigation bar"
              checked={settings.notifications.autoSaveIndicator}
              onChange={v => patchNotifications({ autoSaveIndicator: v })}
            />
          </div>
        </SettingsSection>

        {/* Data Management */}
        <SettingsSection 
          title="Data Management" 
          description="Backup, restore, or securely wipe your workspace data" 
          icon={Database}
          isOpen={openSection === 'data'}
          onToggle={() => toggleSection('data')}
        >
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <button 
                onClick={handleExport}
                className="btn btn-outline" 
                style={{ width: '100%', height: 90, display: 'flex', flexDirection: 'column', gap: 10, borderRadius: 16 }}
              >
                <Download size={24} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Export JSON</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Download full workspace backup</div>
                </div>
              </button>
              <button 
                onClick={handleImportClick}
                className="btn btn-outline" 
                style={{ width: '100%', height: 90, display: 'flex', flexDirection: 'column', gap: 10, borderRadius: 16 }}
              >
                <Upload size={24} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Import Data</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Restore from external file</div>
                </div>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".json"
                onChange={handleImportFile}
              />
            </div>

            <div style={{ 
              background: 'var(--danger-bg)', 
              border: '1.5px solid var(--danger-border)', 
              borderRadius: 16, 
              padding: 24 
            }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ color: 'var(--danger-text)' }}><AlertTriangle size={24} /></div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--danger-text)' }}>Danger Zone</h4>
                  <p style={{ margin: '0 0 20px', fontSize: '0.75rem', color: 'var(--danger-text)', opacity: 0.8 }}>
                    Deleting your workspace data is permanent. You will lose all subjects, faculty, classes and generated timetables.
                  </p>
                  
                  {isReseting ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                    >
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger-text)' }}>Type "RESET" to confirm deletion</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input 
                          type="text" 
                          className="field-input" 
                          placeholder="RESET"
                          value={resetConfirmText}
                          onChange={e => setResetConfirmText(e.target.value)}
                          style={{ flex: 1, borderColor: 'var(--danger-border)', color: 'var(--danger-text)' }}
                        />
                        <button 
                          onClick={handleResetAction}
                          className="btn btn-danger"
                          disabled={resetConfirmText !== 'RESET'}
                        >
                          Confirm Wipe
                        </button>
                        <button 
                          onClick={() => { setIsReseting(false); setResetConfirmText(''); }}
                          className="btn btn-outline btn-sm"
                          style={{ borderColor: 'var(--danger-border)', color: 'var(--danger-text)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <button 
                      onClick={() => setIsReseting(true)}
                      className="btn btn-danger" 
                      style={{ fontSize: '0.8125rem', padding: '10px 16px' }}
                    >
                      Reset All Data Assets
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* System Status */}
        <SettingsSection 
          title="System Status" 
          description="Technical overview and workspace insights" 
          icon={Info}
          isOpen={openSection === 'status'}
          onToggle={() => toggleSection('status')}
        >
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {[
                { label: 'Subjects', value: subjects.length, icon: BookOpen },
                { label: 'Faculty', value: faculty.length, icon: Users },
                { label: 'Classes', value: classes.length, icon: Building },
                { label: 'Rooms', value: rooms.length, icon: CalendarDays },
              ].map(stat => (
                <div key={stat.label} style={{ padding: '16px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    <stat.icon size={14} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>{stat.label}</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px', background: 'var(--surface-3)', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Application Version</span>
                <span style={{ fontWeight: 700 }}>v{settings.version}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Environment</span>
                <span style={{ color: 'var(--success-text)', fontWeight: 700 }}>Production / Stable</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Database Host</span>
                <span style={{ fontWeight: 700 }}>Supabase (Cloud)</span>
              </div>
            </div>
          </div>
        </SettingsSection>

      </div>

      <style>{`
        @keyframes premium-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
        .day-pill.selected {
          box-shadow: 0 4px 12px var(--accent-muted);
          transform: translateY(-1px);
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid var(--accent);
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          cursor: pointer;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
