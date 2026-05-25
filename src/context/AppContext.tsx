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
import { supabase as supabaseClient, isSupabaseConfigured } from '../lib/supabase';

export interface NotificationData {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

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

  generateTimetable: (name: string, selectedClassIds?: string[]) => Promise<void>;
  updateTimetable: (id: string, schedule: ScheduleSlot[]) => Promise<void>;
  deleteTimetable: (id: string) => Promise<void>;
  
  deleteSubjects: (ids: string[]) => Promise<void>;
  deleteFacultyBatch: (ids: string[]) => Promise<void>;
  deleteClassesBatch: (ids: string[]) => Promise<void>;
  deleteRoomsBatch: (ids: string[]) => Promise<void>;

  updateSettings: (settings: CollegeSettings) => void;
  restoreSettingsDefaults: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  importData: (data: Partial<AppState>) => void;
  resetData: () => Promise<void>;

  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (name: string, avatarUrl?: string) => Promise<void>;
  sendEmailOtp: (email: string, mode?: 'signup' | 'email', metadata?: Record<string, unknown>) => Promise<void>;
  verifyEmailOtp: (email: string, token: string, mode?: 'signup' | 'email') => Promise<void>;
  completeOnboarding: (name: string) => Promise<void>;
  authLoading: boolean;

  notification: NotificationData | null;
  showNotification: (data: NotificationData) => void;
  clearNotification: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'timetable_ai_data_v6';
const STORAGE_KEY_LEGACY = 'timetable_ai_data_v5';
const STORAGE_KEY_LEGACY2 = 'timetable_ai_data_v4';
const ONBOARDING_STORAGE_PREFIX = 'timegen_onboarding_completed_';
const API_BASE_URL = 'https://timegen-8zc7.onrender.com';

type ApiSubject = {
  id: string;
  name: string;
  code: string;
  hours: number;
  credits?: number | null;
  priority?: string | null;
  color?: string | null;
  subject_type?: string | null;
  weekly_periods?: number | null;
  is_fixed?: boolean | null;
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
  phone?: string | null;
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
  credits: subject.credits != null ? Number(subject.credits) : undefined,
  weeklyPeriods: subject.weekly_periods != null ? Number(subject.weekly_periods) : undefined,
  isFixed: !!subject.is_fixed,
  priority: normalizePriority(subject.priority),
  color: subject.color || 'bg-blue-500',
  subjectType: VALID_SUBJECT_TYPES.includes(subject.subject_type as SubjectType)
    ? (subject.subject_type as SubjectType)
    : 'Theory',
});

const getLocalOnboardingCompleted = (userId: string) => (
  localStorage.getItem(`${ONBOARDING_STORAGE_PREFIX}${userId}`) === 'true'
);

const setLocalOnboardingCompleted = (userId: string) => {
  localStorage.setItem(`${ONBOARDING_STORAGE_PREFIX}${userId}`, 'true');
};

const mapSupabaseUser = (u: any): User => {
  const metadata = u.user_metadata || {};
  const metadataCompleted = metadata.onboarding_completed === true;
  const localCompleted = getLocalOnboardingCompleted(u.id);
  const createdAt = u.created_at ? new Date(u.created_at).getTime() : 0;
  const lastSignInAt = u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : 0;
  const isFirstOAuthLogin = Boolean(createdAt && lastSignInAt && Math.abs(lastSignInAt - createdAt) < 120000);
  const isOAuth = Array.isArray(u.identities) && u.identities.some((identity: any) => identity.provider && identity.provider !== 'email');
  const mustOnboard = metadata.onboarding_completed === false || (!isOAuth && isFirstOAuthLogin && !metadataCompleted && !localCompleted);
  const onboardingCompleted = metadataCompleted || localCompleted || !mustOnboard;

  return {
    id: u.id,
    name: metadata.name || metadata.full_name || u.email?.split('@')[0] || 'User',
    email: u.email ?? '',
    avatarUrl: metadata.avatar_url,
    isNewUser: !onboardingCompleted,
    onboardingCompleted,
  };
};

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
    ],
    academic: {
      defaultClassStrength: 60,
      maxPeriodsPerDay: 7,
      preferredSubjectsPerDay: 4,
      allowConsecutiveSubjects: false,
    },
    rules: {
      strictScheduling: true,
      flexibleBreaks: false,
      prioritizeMorning: true,
      facultyWorkloadBalance: 50,
    },
    notifications: {
      successAlerts: true,
      errorAlerts: true,
      autoSaveIndicator: true,
    },
    appearance: {
      primaryColor: '#F2C94C',
      density: 'comfortable',
      animations: true,
    },
    version: '1.2.0'
  },
  theme: 'system'
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const savedV6 = localStorage.getItem(STORAGE_KEY);
    const savedLegacy = !savedV6
      ? (localStorage.getItem(STORAGE_KEY_LEGACY) ?? localStorage.getItem(STORAGE_KEY_LEGACY2))
      : null;
    const rawSaved = savedV6 || savedLegacy;

    if (!rawSaved) return initialState;

    const parsed = JSON.parse(rawSaved) as AppState;
    const VALID_SUBJECT_TYPES_SET = new Set<string>(['Theory', 'Laboratory', 'Tutorial', 'Theory with Laboratory']);

    let settings = {
      ...initialState.settings,
      ...(parsed.settings || {})
    };

    // Ensure deep objects are merged
    settings.academic = { ...initialState.settings.academic, ...(parsed.settings?.academic || {}) };
    settings.rules = { ...initialState.settings.rules, ...(parsed.settings?.rules || {}) };
    settings.notifications = { ...initialState.settings.notifications, ...(parsed.settings?.notifications || {}) };
    settings.appearance = { ...initialState.settings.appearance, ...(parsed.settings?.appearance || {}) };

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

  const stateRef = useRef(state);
  const [notification, setNotification] = useState<NotificationData | null>(null);

  useEffect(() => { stateRef.current = state; }, [state]);

  const clearNotification = () => setNotification(null);

  const showNotification = (data: NotificationData) => {
    const currentSettings = stateRef.current.settings;
    if (data.type === 'success' && !currentSettings.notifications.successAlerts) return;
    if (data.type === 'error' && !currentSettings.notifications.errorAlerts) return;

    setNotification(data);

    setTimeout(() => {
      setNotification(current => JSON.stringify(current) === JSON.stringify(data) ? null : current);
    }, 5000);
  };

  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers || {});

  if (
    !headers.has('Content-Type') &&
    options.method &&
    options.method !== 'GET' &&
    options.method !== 'DELETE'
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }


  return fetch(endpoint, { ...options, headers });
};

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    let isMounted = true;

    if (!state.user?.id) {
      if (state.subjects.length > 0 || state.faculty.length > 0 || state.rooms.length > 0 || state.classes.length > 0 || state.timetables.length > 0) {
        setState(prev => ({
          ...prev, subjects: [], rooms: [], classes: [], faculty: [], timetables: []
        }));
      }
      return;
    }

    const loadInitialData = async () => {
      try {
        const [subjectsRes, roomsRes, classesRes, facultyRes, timetablesRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/api/subjects`),
          apiFetch(`${API_BASE_URL}/api/rooms`),
          apiFetch(`${API_BASE_URL}/api/classes`),
          apiFetch(`${API_BASE_URL}/api/faculty`),
          apiFetch(`${API_BASE_URL}/api/timetables`),
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
            phone: item.phone ?? undefined,
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
  }, [state.user?.id, state.isAuthenticated]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    let isMounted = true;

    const loadSession = async () => {
      try {
        const { data } = await supabaseClient.auth.getSession();
        const session = data.session;
        if (!isMounted) return;
        if (session?.user) {
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: mapSupabaseUser(session.user),
          }));
        }
      } catch (error) {
        console.error('Failed to load auth session', error);
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    loadSession();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: mapSupabaseUser(session.user),
          }));
        } else {
          setState(prev => ({ ...prev, isAuthenticated: false, user: null }));
        }
        setAuthLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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

  useEffect(() => {
    if (!state.user || state.user.onboardingCompleted !== false) return;

    supabaseClient.auth.updateUser({
      data: { onboarding_completed: false, is_new_user: true }
    }).catch(error => {
      console.warn('Could not persist onboarding requirement', error);
    });
  }, [state.user?.id, state.user?.onboardingCompleted]);

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    setState(prev => ({ ...prev, theme }));
  };

  const updateSettings = (settings: CollegeSettings) => {
    setState(prev => ({ ...prev, settings }));
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: mapSupabaseUser(data.user),
      }));
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { name, onboarding_completed: false, is_new_user: true },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('Signup failed');
  };

  const loginWithGoogle = async () => {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw new Error(error.message);
  };

  const logout = () => {
    supabaseClient.auth.signOut().catch(() => { });
    localStorage.removeItem(STORAGE_KEY);
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      user: null,
      subjects: [],
      rooms: [],
      classes: [],
      faculty: [],
      timetables: []
    }));
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabaseClient.auth.updateUser({
      password: password
    });
    if (error) throw error;
  };

  const addSubject = async (s: Omit<Subject, 'id'>) => {
    const response = await apiFetch(`${API_BASE_URL}/api/subjects`, {
      method: 'POST',
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
    const response = await apiFetch(`${API_BASE_URL}/api/subjects/${id}`, {
      method: 'PUT',
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
    const response = await apiFetch(`${API_BASE_URL}/api/subjects/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to delete subject (${response.status})`);
    }

    setState(prev => ({ ...prev, subjects: prev.subjects.filter(item => item.id !== id) }));
  };

  const addFaculty = async (f: Omit<FacultyMember, 'id'>) => {
    const response = await apiFetch(`${API_BASE_URL}/api/faculty`, {
      method: 'POST',
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
          phone: created.phone ?? undefined,
          subjects: created.subjects || [],
          availability: created.availability || [],
        },
      ],
    }));
  };

  const updateFaculty = async (id: string, f: Partial<FacultyMember>) => {
    const response = await apiFetch(`${API_BASE_URL}/api/faculty/${id}`, {
      method: 'PUT',
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
            phone: updated.phone ?? undefined,
            subjects: updated.subjects || [],
            availability: updated.availability || [],
          }
          : item
      )
    }));
  };

  const deleteFaculty = async (id: string) => {
    const response = await apiFetch(`${API_BASE_URL}/api/faculty/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to delete faculty (${response.status})`);
    }

    setState(prev => ({ ...prev, faculty: prev.faculty.filter(item => item.id !== id) }));
  };

  const addClass = async (c: Omit<ClassSection, 'id'>) => {
    const response = await apiFetch(`${API_BASE_URL}/api/classes`, {
      method: 'POST',
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
    const response = await apiFetch(`${API_BASE_URL}/api/classes/${id}`, {
      method: 'PUT',
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
    const response = await apiFetch(`${API_BASE_URL}/api/classes/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to delete class (${response.status})`);
    }

    setState(prev => ({ ...prev, classes: prev.classes.filter(item => item.id !== id) }));
  };

  const addRoom = async (r: Omit<Room, 'id'>) => {
    const response = await apiFetch(`${API_BASE_URL}/api/rooms`, {
      method: 'POST',
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
    const response = await apiFetch(`${API_BASE_URL}/api/rooms/${id}`, {
      method: 'PUT',
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
    const response = await apiFetch(`${API_BASE_URL}/api/rooms/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to delete room (${response.status})`);
    }

    setState(prev => ({ ...prev, rooms: prev.rooms.filter(item => item.id !== id) }));
  };

  const deleteSubjects = async (ids: string[]) => {
    const response = await apiFetch(`${API_BASE_URL}/api/subjects?ids=${ids.join(',')}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Bulk delete subjects failed');
    setState(prev => ({ ...prev, subjects: prev.subjects.filter(item => !ids.includes(item.id)) }));
  };

  const deleteFacultyBatch = async (ids: string[]) => {
    const response = await apiFetch(`${API_BASE_URL}/api/faculty?ids=${ids.join(',')}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Bulk delete faculty failed');
    setState(prev => ({ ...prev, faculty: prev.faculty.filter(item => !ids.includes(item.id)) }));
  };

  const deleteClassesBatch = async (ids: string[]) => {
    const response = await apiFetch(`${API_BASE_URL}/api/classes?ids=${ids.join(',')}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Bulk delete classes failed');
    setState(prev => ({ ...prev, classes: prev.classes.filter(item => !ids.includes(item.id)) }));
  };

  const deleteRoomsBatch = async (ids: string[]) => {
    const response = await apiFetch(`${API_BASE_URL}/api/rooms?ids=${ids.join(',')}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Bulk delete rooms failed');
    setState(prev => ({ ...prev, rooms: prev.rooms.filter(item => !ids.includes(item.id)) }));
  };

  const generateTimetable = async (name: string, selectedClassIds?: string[]) => {
    const current = stateRef.current;

    const filteredClasses = selectedClassIds 
      ? current.classes.filter(c => selectedClassIds.includes(c.id))
      : current.classes;

    const result = runEngine({
      subjects: current.subjects,
      faculty: current.faculty,
      classes: filteredClasses,
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

    const response = await apiFetch(`${API_BASE_URL}/api/timetables`, {
      method: 'POST',
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
    const response = await apiFetch(`${API_BASE_URL}/api/timetables/${id}`, {
      method: 'PUT',
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
    const response = await apiFetch(`${API_BASE_URL}/api/timetables/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Failed to delete timetable (${response.status})`);
    }

    setState(prev => ({ ...prev, timetables: prev.timetables.filter(item => item.id !== id) }));
  };

  const restoreSettingsDefaults = () => {
    setState(prev => ({ ...prev, settings: initialState.settings }));
  };

  const importData = (data: Partial<AppState>) => {
    setState(prev => ({
      ...prev,
      ...data,
      settings: data.settings ? { ...initialState.settings, ...data.settings } : prev.settings
    }));
  };

  const resetData = async () => {
    setState(prev => ({
      ...initialState,
      user: prev.user,
      isAuthenticated: prev.isAuthenticated,
      theme: prev.theme
    }));
  };

  const updateProfile = async (name: string, avatarUrl?: string) => {
    if (state.isAuthenticated && state.user) {
      // 1. Update Supabase Auth metadata
      const { error: authError } = await supabaseClient.auth.updateUser({
        data: { name, full_name: name, avatar_url: avatarUrl }
      });
      if (authError) throw authError;

      // 2. Update public.users table directly
      const { error: dbError } = await supabaseClient
        .from('users')
        .update({ name })
        .eq('email', state.user.email);
      
      // If no record exists in public.users yet, we ignore the error or create it
      // Standard behavior: if it fails, we just rely on auth metadata
      if (dbError) {
         console.warn('Could not sync with public.users table', dbError);
      }
    }

    // 3. Update local state immediately
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, name, avatarUrl: avatarUrl || prev.user.avatarUrl } : null
    }));
  };

  const sendEmailOtp = async (email: string, mode: 'signup' | 'email' = 'email', metadata?: Record<string, unknown>) => {
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: mode === 'signup',
        data: metadata,
      },
    });
    if (error) throw error;
  };

  const verifyEmailOtp = async (email: string, token: string, mode: 'signup' | 'email' = 'email') => {
    const normalizedToken = token.trim();
    const { error } = await supabaseClient.auth.verifyOtp({
      email,
      token: normalizedToken,
      type: mode,
    });

    if (!error) return;

    if (mode === 'signup' || mode === 'email') {
      const emailFallback = await supabaseClient.auth.verifyOtp({
        email,
        token: normalizedToken,
        type: 'email',
      });
      if (!emailFallback.error) return;

      const magicLinkFallback = await supabaseClient.auth.verifyOtp({
        email,
        token: normalizedToken,
        type: 'magiclink',
      });
      if (!magicLinkFallback.error) return;
    }

    throw error;
  };

  const completeOnboarding = async (name: string) => {
    if (!state.user) return;

    const trimmedName = name.trim() || state.user.name;
    const { error: authError } = await supabaseClient.auth.updateUser({
      data: {
        name: trimmedName,
        full_name: trimmedName,
        onboarding_completed: true,
        is_new_user: false,
      }
    });
    if (authError) throw authError;

    setLocalOnboardingCompleted(state.user.id);

    const { error: dbError } = await supabaseClient
      .from('users')
      .update({ name: trimmedName })
      .eq('email', state.user.email);

    if (dbError) {
      const { error: insertError } = await supabaseClient
        .from('users')
        .insert([{ name: trimmedName, email: state.user.email }]);

      if (insertError) {
        console.warn('Could not sync onboarding profile with public.users table', insertError);
      }
    }

    setState(prev => ({
      ...prev,
      user: prev.user ? {
        ...prev.user,
        name: trimmedName,
        isNewUser: false,
        onboardingCompleted: true,
      } : null
    }));
  };

  return (
    <AppContext.Provider value={{
      ...state,
      addSubject, updateSubject, deleteSubject,
      addFaculty, updateFaculty, deleteFaculty,
      addClass, updateClass, deleteClass,
      addRoom, updateRoom, deleteRoom,
      deleteSubjects, deleteFacultyBatch, deleteClassesBatch, deleteRoomsBatch,
      generateTimetable, updateTimetable, deleteTimetable,
      updateSettings, restoreSettingsDefaults, setTheme,
      importData, resetData,
      login, loginWithGoogle, signup, logout, resetPassword, updatePassword, updateProfile, sendEmailOtp, verifyEmailOtp, completeOnboarding,
      authLoading,
      notification, showNotification, clearNotification
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
