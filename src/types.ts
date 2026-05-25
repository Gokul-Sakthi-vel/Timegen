export type Priority = 'Low' | 'Medium' | 'High';
export type SubjectType = 'Theory' | 'Laboratory' | 'Tutorial' | 'Theory with Laboratory';

export interface Subject {
  id: string;
  name: string;
  code: string;
  hours: number;
  credits?: number;            // credit points (e.g. 3, 4)
  weeklyPeriods?: number;
  isFixed?: boolean;
  priority: Priority;
  color: string;
  subjectType: SubjectType;
}

export interface FacultyMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subjects: string[]; // IDs of subjects
  availability: string[]; // e.g., ["Monday", "Tuesday"]
}

export interface ClassSection {
  id: string;
  name: string;
  subjects: string[]; // IDs of subjects
  studentsCount: number;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  type: 'Classroom' | 'Lab';
}

export interface ScheduleSlot {
  day: string;
  time: string;
  subjectId: string;
  facultyId: string;
  roomId: string;
  classId: string;
}

export interface TimetableEntry {
  id: string;
  name: string;
  createdAt: string;
  schedule: ScheduleSlot[];
  settingsSnapshot?: CollegeSettings | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isNewUser?: boolean;
  onboardingCompleted?: boolean;
  lastLogin?: string;
  location?: string;
  jobTitle?: string;
}

export interface Break {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface AcademicPreferences {
  defaultClassStrength: number;
  maxPeriodsPerDay: number;
  preferredSubjectsPerDay: number;
  allowConsecutiveSubjects: boolean;
}

export interface TimetableRules {
  strictScheduling: boolean;
  flexibleBreaks: boolean;
  prioritizeMorning: boolean;
  facultyWorkloadBalance: number; // 0 to 100
}

export interface NotificationSettings {
  successAlerts: boolean;
  errorAlerts: boolean;
  autoSaveIndicator: boolean;
}

export interface AppearanceSettings {
  primaryColor: string;
  density: 'compact' | 'comfortable';
  animations: boolean;
}

export interface CollegeSettings {
  workingDays: string[];
  startTime: string;
  endTime: string;
  periodDuration: number; // in minutes
  breaks: Break[];
  academic: AcademicPreferences;
  rules: TimetableRules;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  version: string;
}

export interface AppState {
  subjects: Subject[];
  faculty: FacultyMember[];
  classes: ClassSection[];
  rooms: Room[];
  timetables: TimetableEntry[];
  user: User | null;
  isAuthenticated: boolean;
  settings: CollegeSettings;
  theme: 'light' | 'dark' | 'system';
}
