import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Subject,
  SubjectType,
  FacultyMember,
  ClassSection,
  Room,
  TimetableEntry,
  AppState,
  User,
  CollegeSettings,
  ScheduleSlot
} from '../types';
import { generateTimetable as runEngine } from '../utils/timetableEngine';
import { supabase as supabaseClient } from '../lib/supabase';

interface AppContextType extends AppState {
  addSubject: (s: Omit<Subject, 'id'>) => Promise<void>;
  updateSubject: (id: string, s: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  addFaculty: (f: Omit<FacultyMember, 'id'>) => Promise<void>;
  updateFaculty: (id: string, f: Partial<FacultyMember>) => Promise<void>;
  deleteFaculty: (id: string) => Promise<void>;

  addClass: (c: Omit<ClassSection, 'id'>) => Promise<void>;
  updateClass: (id: string, c: Partial<ClassSection>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;

  addRoom: (r: Omit<Room, 'id'>) => Promise<void>;
  updateRoom: (id: string, r: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;

  generateTimetable: (name: string) => Promise<void>;
  updateTimetable: (id: string, schedule: ScheduleSlot[]) => Promise<void>;
  deleteTimetable: (id: string) => Promise<void>;

  updateSettings: (settings: CollegeSettings) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  authLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'timetable_ai_data_v6';
const STORAGE_KEY_LEGACY = 'timetable_ai_data_v5';
const STORAGE_KEY_LEGACY2 = 'timetable_ai_data_v4';
const API_BASE_URL = '';

type ApiSubject = {
  id: string;
  name: string;
  code: string;
  hours: number;
  credits?: number | null;
  priority?: string | null;
  color?: string | null;
  subject_type?: string | null;
};

type ApiUser = {
  id: string;
  name: string;
  email: string;
};

type ApiRoom = {
  id: string;
  name: string;
  capacity: number;
  type: 'Classroom' | 'Lab';
};

type ApiClass = {
  id: string;
  name: string;
  studentsCount: number;
  subjects: string[];
};

type ApiFaculty = {
  id: string;
  name: string;
  email: string;
  subjects: string[];
  availability: string[];
};

type ApiTimetable = {
  id: string;
  name: string;
  createdAt: string;
  schedule: ScheduleSlot[];
  settingsSnapshot?: CollegeSettings | null;
};

const normalizePriority = (priority?: string | null): Subject['priority'] => {
  if (priority === 'High' || priority === 'Medium' || priority === 'Low') {
    return priority;
  }
  return 'Medium';
};

const VALID_SUBJECT_TYPES: SubjectType[] = ['Theory', 'Laboratory', 'Tutorial', 'Theory with Laboratory'];

const mapSubjectFromApi = (subject: ApiSubject): Subject => ({
  id: subject.id,
  name: subject.name,
  code: subject.code || '',
  hours: Number(subject.hours),
  credits: subject.credits ? Number(subject.credits) : undefined,
  priority: normalizePriority(subject.priority),
  color: subject.color || 'bg-blue-500',
  subjectType: VALID_SUBJECT_TYPES.includes(subject.subject_type as SubjectType)
    ? (subject.subject_type as SubjectType)
    : 'Theory',
});

const initialState: AppState = {
  subjects: [],
  faculty: [],
  classes: [],
  rooms: [],
  timetables: [],
  user: null,
  isAuthenticated: false,
  settings: {
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '09:15',
    endTime: '15:45',
    periodDuration: 55,
    breaks: [
      { id: 'b1', name: 'Short Break', startTime: '11:05', endTime: '11:20' },
      { id: 'b2', name: 'Lunch Break', startTime: '12:15', endTime: '13:00' },
    ]
  },
  theme: 'system'
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const savedV6 = localStorage.getItem(STORAGE_KEY);
    // Check both legacy keys
    const savedLegacy = !savedV6
      ? (localStorage.getItem(STORAGE_KEY_LEGACY) ?? localStorage.getItem(STORAGE_KEY_LEGACY2))
      : null;
    const rawSaved = savedV6 || savedLegacy;

    if (!rawSaved) return initialState;

    const parsed = JSON.parse(rawSaved) as AppState;
    const VALID_SUBJECT_TYPES_SET = new Set<string>(['Theory', 'Laboratory', 'Tutorial', 'Theory with Laboratory']);

    // Any migration from a legacy key → always reset settings to correct defaults.
    // For v6 (current) → trust stored settings BUT guard against bad endTime:
    //   if endTime is before 14:30 there can be no afternoon periods, force defaults.
    let settings = initialState.settings;
    if (savedV6) {
      const stored = parsed.settings ?? initialState.settings;
      const endHour = parseInt((stored.endTime ?? '00:00').split(':')[0], 10);
      settings = endHour >= 14 ? stored : initialState.settings;
    }

    // Clean up all legacy keys
    if (savedLegacy) {
      try { localStorage.removeItem(STORAGE_KEY_LEGACY); } catch { /* ignore */ }
      try { localStorage.removeItem(STORAGE_KEY_LEGACY2); } catch { /* ignore */ }
    }

    return {
      ...initialState,
      ...parsed,
      settings,
      subjects: (parsed.subjects || []).map(item => ({
        ...item,
        code: item.code || '',
        subjectType: VALID_SUBJECT_TYPES_SET.has(item.subjectType)
          ? item.subjectType
          : 'Theory',
      })),
    };
  });
  const [authLoading, setAuthLoading] = useState(true); // true until session check completes

  // Always holds the latest state — used by async callbacks to avoid stale closures
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const [subjectsRes, roomsRes, classesRes, facultyRes, timetablesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/subjects`),
          fetch(`${API_BASE_URL}/api/rooms`),
          fetch(`${API_BASE_URL}/api/classes`),
          fetch(`${API_BASE_URL}/api/faculty`),
          fetch(`${API_BASE_URL}/api/timetables`),
        ]);

        if (!subjectsRes.ok || !roomsRes.ok || !classesRes.ok || !facultyRes.ok || !timetablesRes.ok) {
          throw new Error('Failed to load initial data from backend.');
        }

        const [subjectsData, roomsData, classesData, facultyData, timetablesData] = await Promise.all([
          subjectsRes.json() as Promise<ApiSubject[]>,
          roomsRes.json() as Promise<ApiRoom[]>,
          classesRes.json() as Promise<ApiClass[]>,
          facultyRes.json() as Promise<ApiFaculty[]>,
          timetablesRes.json() as Promise<ApiTimetable[]>,
        ]);

        if (!isMounted) {
          return;
        }

        setState(prev => ({
          ...prev,
          subjects: subjectsData.map(mapSubjectFromApi),
          rooms: roomsData.map(room => ({
            id: room.id,
            name: room.name,
            capacity: Number(room.capacity),
            type: room.type,
          })),
          classes: classesData.map(cls => ({
            id: cls.id,
            name: cls.name,
            studentsCount: Number(cls.studentsCount),
            subjects: Array.isArray(cls.subjects) ? cls.subjects : [],
          })),
          faculty: facultyData.map(item => ({
            id: item.id,
            name: item.name,
            email: item.email,
            subjects: Array.isArray(item.subjects) ? item.subjects : [],
            availability: Array.isArray(item.availability) ? item.availability : [],
          })),
          timetables: timetablesData.map(item => ({
            id: item.id,
            name: item.name,
            createdAt: item.createdAt,
            schedule: Array.isArray(item.schedule) ? item.schedule : [],
            settingsSnapshot: item.settingsSnapshot ?? null,
          })),
        }));
      } catch (error) {
        console.error('Could not load backend data, using local cache.', error);
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // ── Supabase OAuth callback + session restore handler ────────────────────
  // 1. On mount: check if there's already an active session (returning user
  //    or OAuth callback with #access_token in the URL).
  // 2. onAuthStateChange: fires whenever the session changes — covers the
  //    Google redirect-back event automatically.
  // authLoading stays true until getSession() resolves — this prevents
  // ProtectedRoute from redirecting to /login before the session is known.
  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: {
            id: u.id,
            name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'User',
            email: u.email ?? '',
          },
        }));
      }
      // Always mark auth check as done, whether session exists or not
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const u = session.user;
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: {
              id: u.id,
              name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'User',
              email: u.email ?? '',
            },
          }));
        } else {
          setState(prev => ({ ...prev, isAuthenticated: false, user: null }));
        }
        setAuthLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = state.theme === 'dark' ||
      (state.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    setState(prev => ({ ...prev, theme }));
  };

  const updateSettings = (settings: CollegeSettings) => {
    setState(prev => ({ ...prev, settings }));
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Login failed (${response.status})`);
    }

    const user = (await response.json()) as ApiUser;
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      user,
    }));
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Signup failed (${response.status})`);
    }
  };

  const loginWithGoogle = async () => {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw new Error(error.message);
    // The browser will redirect to Google — no further action needed here.
  };

  const logout = () => {
    supabaseClient.auth.signOut().catch(() => { });
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      user: null
    }));
  };

  const addSubject = async (s: Omit<Subject, 'id'>) => {
    const response = await fetch(`${API_BASE_URL}/api/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: s.name,
        code: s.code,
        hours: s.hours,
        credits: s.credits,
        weeklyPeriods: s.weeklyPeriods,
        isFixed: s.isFixed,
        priority: s.priority,
        color: s.color,
        subjectType: s.subjectType,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to create subject (${response.status})`);
    }

    const created = mapSubjectFromApi((await response.json()) as ApiSubject);
    setState(prev => ({ ...prev, subjects: [...prev.subjects, created] }));
  };

  const updateSubject = async (id: string, s: Partial<Subject>) => {
    const response = await fetch(`${API_BASE_URL}/api/subjects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: s.name,
        code: s.code,
        hours: s.hours,
        credits: s.credits,
        weeklyPeriods: s.weeklyPeriods,
        isFixed: s.isFixed,
        priority: s.priority,
        color: s.color,
        subjectType: s.subjectType,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to update subject (${response.status})`);
    }

    const updated = mapSubjectFromApi((await response.json()) as ApiSubject);
    setState(prev => ({
      ...prev,
      subjects: prev.subjects.map(item => (item.id === id ? updated : item))
    }));
  };

  const deleteSubject = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/subjects/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to delete subject (${response.status})`);
    }

    setState(prev => ({ ...prev, subjects: prev.subjects.filter(item => item.id !== id) }));
  };

  const addFaculty = async (f: Omit<FacultyMember, 'id'>) => {
    const response = await fetch(`${API_BASE_URL}/api/faculty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(f),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to create faculty (${response.status})`);
    }

    const created = (await response.json()) as ApiFaculty;
    setState(prev => ({
      ...prev,
      faculty: [
        ...prev.faculty,
        {
          id: created.id,
          name: created.name,
          email: created.email,
          subjects: created.subjects || [],
          availability: created.availability || [],
        },
      ],
    }));
  };

  const updateFaculty = async (id: string, f: Partial<FacultyMember>) => {
    const response = await fetch(`${API_BASE_URL}/api/faculty/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(f),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to update faculty (${response.status})`);
    }

    const updated = (await response.json()) as ApiFaculty;
    setState(prev => ({
      ...prev,
      faculty: prev.faculty.map(item =>
        item.id === id
          ? {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            subjects: updated.subjects || [],
            availability: updated.availability || [],
          }
          : item
      )
    }));
  };

  const deleteFaculty = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/faculty/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to delete faculty (${response.status})`);
    }

    setState(prev => ({ ...prev, faculty: prev.faculty.filter(item => item.id !== id) }));
  };

  const addClass = async (c: Omit<ClassSection, 'id'>) => {
    const response = await fetch(`${API_BASE_URL}/api/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to create class (${response.status})`);
    }

    const created = (await response.json()) as ApiClass;
    setState(prev => ({
      ...prev,
      classes: [
        ...prev.classes,
        {
          id: created.id,
          name: created.name,
          studentsCount: Number(created.studentsCount),
          subjects: created.subjects || [],
        },
      ],
    }));
  };

  const updateClass = async (id: string, c: Partial<ClassSection>) => {
    const response = await fetch(`${API_BASE_URL}/api/classes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to update class (${response.status})`);
    }

    const updated = (await response.json()) as ApiClass;
    setState(prev => ({
      ...prev,
      classes: prev.classes.map(item =>
        item.id === id
          ? {
            id: updated.id,
            name: updated.name,
            studentsCount: Number(updated.studentsCount),
            subjects: updated.subjects || [],
          }
          : item
      )
    }));
  };

  const deleteClass = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/classes/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to delete class (${response.status})`);
    }

    setState(prev => ({ ...prev, classes: prev.classes.filter(item => item.id !== id) }));
  };

  const addRoom = async (r: Omit<Room, 'id'>) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to create room (${response.status})`);
    }

    const created = (await response.json()) as ApiRoom;
    setState(prev => ({
      ...prev,
      rooms: [
        ...prev.rooms,
        {
          id: created.id,
          name: created.name,
          capacity: Number(created.capacity),
          type: created.type,
        },
      ],
    }));
  };

  const updateRoom = async (id: string, r: Partial<Room>) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to update room (${response.status})`);
    }

    const updated = (await response.json()) as ApiRoom;
    setState(prev => ({
      ...prev,
      rooms: prev.rooms.map(item =>
        item.id === id
          ? {
            id: updated.id,
            name: updated.name,
            capacity: Number(updated.capacity),
            type: updated.type,
          }
          : item
      )
    }));
  };

  const deleteRoom = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to delete room (${response.status})`);
    }

    setState(prev => ({ ...prev, rooms: prev.rooms.filter(item => item.id !== id) }));
  };

  const generateTimetable = async (name: string) => {
    // Always read from ref to guarantee latest settings (avoids stale closure)
    const current = stateRef.current;

    // ── Run the constraint-satisfaction engine ────────────────────────────────
    const result = runEngine({
      subjects: current.subjects,
      faculty: current.faculty,
      classes: current.classes,
      rooms: current.rooms,
      settings: current.settings,
    });

    if (result.warnings.length > 0) {
      console.warn('[TimetableEngine] Warnings:', result.warnings);
    }

    console.info(
      `[TimetableEngine] Generated ${result.stats.totalSlotsFilled} / ${result.stats.totalSlotsAvailable} slots.`
    );
    console.info('[TimetableEngine] Settings used:', current.settings);

    const { schedule } = result;

    const response = await fetch(`${API_BASE_URL}/api/timetables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        createdAt: new Date().toISOString(),
        schedule,
        settingsSnapshot: current.settings,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to create timetable (${response.status})`);
    }

    const created = (await response.json()) as ApiTimetable;
    const newTimetable: TimetableEntry = {
      id: created.id,
      name: created.name,
      createdAt: created.createdAt,
      schedule: Array.isArray(created.schedule) ? created.schedule : [],
      settingsSnapshot: created.settingsSnapshot ?? current.settings,
    };

    setState(prev => ({ ...prev, timetables: [newTimetable, ...prev.timetables] }));
  };

  const updateTimetable = async (id: string, schedule: ScheduleSlot[]) => {
    const existing = state.timetables.find(item => item.id === id);
    const response = await fetch(`${API_BASE_URL}/api/timetables/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schedule,
        settingsSnapshot: existing?.settingsSnapshot ?? state.settings,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to update timetable (${response.status})`);
    }

    const updated = (await response.json()) as ApiTimetable;
    setState(prev => ({
      ...prev,
      timetables: prev.timetables.map(item =>
        item.id === id
          ? {
            id: updated.id,
            name: updated.name,
            createdAt: updated.createdAt,
            schedule: Array.isArray(updated.schedule) ? updated.schedule : [],
            settingsSnapshot: updated.settingsSnapshot ?? item.settingsSnapshot ?? null,
          }
          : item
      ),
    }));
  };

  const deleteTimetable = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/timetables/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to delete timetable (${response.status})`);
    }

    setState(prev => ({ ...prev, timetables: prev.timetables.filter(item => item.id !== id) }));
  };

  return (
    <AppContext.Provider value={{
      ...state,
      addSubject, updateSubject, deleteSubject,
      addFaculty, updateFaculty, deleteFaculty,
      addClass, updateClass, deleteClass,
      addRoom, updateRoom, deleteRoom,
      generateTimetable, updateTimetable, deleteTimetable,
      updateSettings, setTheme,
      login, loginWithGoogle, signup, logout,
      authLoading
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
