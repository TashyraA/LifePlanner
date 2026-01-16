import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { indexedDB } from '../lib/indexedDB';
import { compressImage, storeImageInIndexedDB, retrieveImageFromIndexedDB, removeImageFromIndexedDB } from '../lib/imageCompression';

export interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  time?: string;
  description?: string;
  completed?: boolean;
}

export interface DailyActivity {
  id: string;
  date: Date;
  title: string;
  time?: string;
  description?: string;
  completed?: boolean;
}

export interface Habit {
  id: string;
  name: string;
  completedDays: Date[];
  goal: number;
}

export interface Note {
  id: string;
  content: string;
  createdAt: Date;
  completed: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  completed: boolean;
}

export interface MonthData {
  month: number;
  year: number;
  coverImage?: string; // External URL or undefined
  coverImageKey?: string; // IndexedDB key reference for stored base64
  coverPosition?: { x: number; y: number };
  events: CalendarEvent[];
  dailyActivities: DailyActivity[];
  habits: Habit[];
  notes: Note[];
  shoppingList: ShoppingItem[];
}

interface PlannerContextType {
  monthsData: MonthData[];
  plannerBorderImage: string;
  getMonthData: (month: number, year: number) => MonthData;  getMonthCoverImage: (month: number, year: number) => Promise<string | undefined>;  updateMonthCover: (month: number, year: number, imageUrl: string, position?: { x: number; y: number }) => void;
  updatePlannerBorderImage: (image: string) => void;
  addEvent: (month: number, year: number, event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (month: number, year: number, eventId: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (month: number, year: number, eventId: string) => void;
  toggleEventComplete: (month: number, year: number, eventId: string) => void;
  addDailyActivity: (month: number, year: number, activity: Omit<DailyActivity, 'id'>) => void;
  updateDailyActivity: (month: number, year: number, activityId: string, updates: Partial<DailyActivity>) => void;
  deleteDailyActivity: (month: number, year: number, activityId: string) => void;
  toggleDailyActivityComplete: (month: number, year: number, activityId: string) => void;
  clearAllDailyActivities: (month: number, year: number) => void;
  addHabit: (month: number, year: number, habit: Omit<Habit, 'id' | 'completedDays'>) => void;
  updateHabit: (month: number, year: number, habitId: string, updates: Partial<Omit<Habit, 'id' | 'completedDays'>>) => void;
  deleteHabit: (month: number, year: number, habitId: string) => void;
  toggleHabitDay: (month: number, year: number, habitId: string, date: Date) => void;
  addNote: (month: number, year: number, content: string) => void;
  toggleNoteComplete: (month: number, year: number, noteId: string) => void;
  deleteNote: (month: number, year: number, noteId: string) => void;
  addShoppingItem: (month: number, year: number, name: string) => void;
  toggleShoppingItem: (month: number, year: number, itemId: string) => void;
  deleteShoppingItem: (month: number, year: number, itemId: string) => void;
}

const PlannerContext = createContext<PlannerContextType | null>(null);

const STORAGE_KEY = 'planner_data';

const createEmptyMonthData = (month: number, year: number): MonthData => ({
  month,
  year,
  coverImage: '',
  coverPosition: { x: 50, y: 50 },
  events: [],
  dailyActivities: [],
  habits: [],
  notes: [],
  shoppingList: [],
});

const coerceDate = (value: any): Date => {
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? new Date() : date;
};

const normalizeMonthData = (data: Partial<MonthData>): MonthData => {
  const month = typeof data.month === 'number' ? data.month : 0;
  const year = typeof data.year === 'number' ? data.year : new Date().getFullYear();
  const base = createEmptyMonthData(month, year);

  const coverPosition = data.coverPosition || { x: 50, y: 50 };
  const normalizedPosition = {
    x: typeof coverPosition.x === 'number' ? coverPosition.x : 50,
    y: typeof coverPosition.y === 'number' ? coverPosition.y : 50,
  };

  return {
    ...base,
    ...data,
    coverImage: data.coverImage ?? '',
    coverPosition: normalizedPosition,
    events: (data.events ?? []).map(e => ({
      ...e,
      date: coerceDate(e.date),
      completed: e.completed ?? false,
    })),
    dailyActivities: (data.dailyActivities ?? []).map(a => ({
      ...a,
      date: coerceDate(a.date),
      completed: a.completed ?? false,
    })),
    habits: (data.habits ?? []).map(h => ({
      ...h,
      completedDays: (h.completedDays ?? []).map(coerceDate),
      goal: h.goal ?? 0,
    })),
    notes: (data.notes ?? []).map(n => ({
      ...n,
      createdAt: coerceDate(n.createdAt),
      completed: n.completed ?? false,
    })),
    shoppingList: (data.shoppingList ?? []).map(i => ({
      ...i,
      completed: i.completed ?? false,
    })),
  };
};

const serializeMonthData = (data: MonthData[]): any => {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }));
};

const deserializeMonthData = (data: any): MonthData[] => {
  if (!data) return [];
  return JSON.parse(JSON.stringify(data), (key, value) => {
    if (value && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  });
};

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [monthsData, setMonthsData] = useState<MonthData[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = deserializeMonthData(JSON.parse(stored));
        return data.map(normalizeMonthData);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [plannerBorderImage, setPlannerBorderImage] = useState<string>('');

  // Load border image from IndexedDB on mount
  useEffect(() => {
    const loadBorderImage = async () => {
      try {
        const stored = localStorage.getItem('planner_border_image');
        if (stored) {
          setPlannerBorderImage(stored);
          return;
        }
        const fromDB = await indexedDB.getItem('planner_border_image');
        if (fromDB) setPlannerBorderImage(fromDB);
      } catch (error) {
        console.warn('Failed to load border image:', error);
      }
    };
    loadBorderImage();
  }, []);

  useEffect(() => {
    try {
      const serialized = serializeMonthData(monthsData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
      // Notify data sync that data changed
      window.dispatchEvent(new CustomEvent('localDataSaved'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('QuotaExceededError')) {
        console.error('localStorage quota exceeded. Please clear some data.');
      } else {
        console.error('Error saving planner data:', error);
      }
    }
  }, [monthsData]);

  useEffect(() => {
    // Border image stored in localStorage as fallback
    if (plannerBorderImage && plannerBorderImage.startsWith('data:')) {
      try {
        localStorage.setItem('planner_border_image', plannerBorderImage);
      } catch (error) {
        console.warn('Failed to cache border image in localStorage:', error);
      }
    }
  }, [plannerBorderImage]);

  const getMonthData = (month: number, year: number): MonthData => {
    const existing = monthsData.find(m => m.month === month && m.year === year);
    if (existing) return normalizeMonthData(existing);

    const newMonthData = createEmptyMonthData(month, year);
    setMonthsData(prev => {
      const already = prev.find(m => m.month === month && m.year === year);
      if (already) return prev;
      return [...prev, newMonthData];
    });
    return newMonthData;
  };

  const updateMonthCover = async (month: number, year: number, imageUrl: string, position?: { x: number; y: number }) => {
    try {
      const imageKey = `cover_${month}_${year}`;

      // If clearing image, remove from IndexedDB
      if (!imageUrl) {
        await removeImageFromIndexedDB(imageKey);
        setMonthsData(prev => prev.map(m =>
          m.month === month && m.year === year
            ? { ...m, coverImage: undefined, coverImageKey: undefined }
            : m
        ));
        return;
      }

      let shouldStoreInDB = false;

      // Compress if it's a base64 data URL
      if (imageUrl.startsWith('data:')) {
        shouldStoreInDB = true;
        const finalImage = await compressImage(imageUrl);
        await storeImageInIndexedDB(imageKey, finalImage);
      }

      // Store only the key reference and position in state/localStorage
      setMonthsData(prev => prev.map(m =>
        m.month === month && m.year === year
          ? {
              ...m,
              coverImage: shouldStoreInDB ? undefined : imageUrl,
              coverImageKey: shouldStoreInDB ? imageKey : undefined,
              coverPosition: position ?? m.coverPosition ?? { x: 50, y: 50 },
            }
          : m
      ));
    } catch (error) {
      console.error('Error updating month cover:', error);
      throw error;
    }
  };

  const addEvent = (month: number, year: number, event: Omit<CalendarEvent, 'id'>) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month && m.year === year
        ? { ...m, events: [...(m.events ?? []), { ...event, id: uuidv4(), completed: false }] }
        : m
    ));
  };

  const updateEvent = (month: number, year: number, eventId: string, updates: Partial<CalendarEvent>) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month && m.year === year
        ? { ...m, events: (m.events ?? []).map(e => e.id === eventId ? { ...e, ...updates } : e) }
        : m
    ));
  };

  const deleteEvent = (month: number, year: number, eventId: string) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month && m.year === year
        ? { ...m, events: (m.events ?? []).filter(e => e.id !== eventId) }
        : m
    ));
  };

  const toggleEventComplete = (month: number, year: number, eventId: string) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month && m.year === year
        ? { ...m, events: (m.events ?? []).map(e => e.id === eventId ? { ...e, completed: !e.completed } : e) }
        : m
    ));
  };

  const addDailyActivity = (month: number, year: number, activity: Omit<DailyActivity, 'id'>) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month && m.year === year
        ? { ...m, dailyActivities: [...(m.dailyActivities ?? []), { ...activity, id: uuidv4(), completed: false }] }
        : m
    ));
  };

  const updateDailyActivity = (month: number, year: number, activityId: string, updates: Partial<DailyActivity>) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month && m.year === year
        ? { ...m, dailyActivities: (m.dailyActivities ?? []).map(a => a.id === activityId ? { ...a, ...updates } : a) }
        : m
    ));
  };

  const deleteDailyActivity = (month: number, year: number, activityId: string) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month && m.year === year
        ? { ...m, dailyActivities: (m.dailyActivities ?? []).filter(a => a.id !== activityId) }
        : m
    ));
  };

  const toggleDailyActivityComplete = (month: number, year: number, activityId: string) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month && m.year === year
        ? { ...m, dailyActivities: (m.dailyActivities ?? []).map(a => a.id === activityId ? { ...a, completed: !a.completed } : a) }
        : m
    ));
  };

  const clearAllDailyActivities = (month: number, year: number) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month && m.year === year
        ? { ...m, dailyActivities: [] }
        : m
    ));
  };

  const addHabit = (month: number, year: number, habit: Omit<Habit, 'id' | 'completedDays'>) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month && m.year === year
        ? { ...m, habits: [...(m.habits ?? []), { ...habit, id: uuidv4(), completedDays: [] }] }
        : m
    ));
  };

  const updateHabit = (month: number, year: number, habitId: string, updates: Partial<Omit<Habit, 'id' | 'completedDays'>>) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month && m.year === year
        ? { ...m, habits: (m.habits ?? []).map(h => h.id === habitId ? { ...h, ...updates } : h) }
        : m
    ));
  };

  const deleteHabit = (month: number, year: number, habitId: string) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month && m.year === year
        ? { ...m, habits: (m.habits ?? []).filter(h => h.id !== habitId) }
        : m
    ));
  };

  const toggleHabitDay = (month: number, year: number, habitId: string, date: Date) => {
    setMonthsData(prev => prev.map(m => {
      if (m.month === month && m.year === year) {
        return {
          ...m,
          habits: (m.habits ?? []).map(h => {
            if (h.id === habitId) {
              const dateStr = date.toDateString();
              const isCompleted = (h.completedDays ?? []).some(d => coerceDate(d).toDateString() === dateStr);
              return {
                ...h,
                completedDays: isCompleted
                  ? (h.completedDays ?? []).filter(d => coerceDate(d).toDateString() !== dateStr)
                  : [...(h.completedDays ?? []), date]
              };
            }
            return h;
          })
        };
      }
      return m;
    }));
  };

  const addNote = (month: number, year: number, content: string) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month && m.year === year
        ? { ...m, notes: [...(m.notes ?? []), { id: uuidv4(), content, createdAt: new Date(), completed: false }] }
        : m
    ));
  };

  const toggleNoteComplete = (month: number, year: number, noteId: string) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month && m.year === year
        ? { ...m, notes: (m.notes ?? []).map(n => n.id === noteId ? { ...n, completed: !n.completed } : n) }
        : m
    ));
  };

  const deleteNote = (month: number, year: number, noteId: string) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month && m.year === year
        ? { ...m, notes: (m.notes ?? []).filter(n => n.id !== noteId) }
        : m
    ));
  };

  const addShoppingItem = (month: number, year: number, name: string) => {
    setMonthsData(prev => {
      const existingMonth = prev.find(m => m.month === month && m.year === year);
      const targetMonth = existingMonth ? normalizeMonthData(existingMonth) : createEmptyMonthData(month, year);

      const updatedMonth = {
        ...targetMonth,
        shoppingList: [...targetMonth.shoppingList, { id: uuidv4(), name, completed: false }],
      };

      if (existingMonth) {
        return prev.map(m => (m.month === month && m.year === year ? updatedMonth : m));
      }

      return [...prev, updatedMonth];
    });
  };

  const toggleShoppingItem = (month: number, year: number, itemId: string) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month && m.year === year
        ? { ...m, shoppingList: (m.shoppingList ?? []).map(i => i.id === itemId ? { ...i, completed: !i.completed } : i) }
        : m
    ));
  };

  const deleteShoppingItem = (month: number, year: number, itemId: string) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month && m.year === year
        ? { ...m, shoppingList: (m.shoppingList ?? []).filter(i => i.id !== itemId) }
        : m
    ));
  };

  const getMonthCoverImage = async (month: number, year: number): Promise<string | undefined> => {
    const monthData = monthsData.find(m => m.month === month && m.year === year);
    if (!monthData) return undefined;

    // If it's an external URL, return directly
    if (monthData.coverImage) return monthData.coverImage;

    // If it has a key, try to retrieve from IndexedDB
    if (monthData.coverImageKey) {
      return await retrieveImageFromIndexedDB(monthData.coverImageKey);
    }

    return undefined;
  };

  const updatePlannerBorderImage = async (image: string) => {
    try {
      if (!image) {
        await removeImageFromIndexedDB('planner_border_image');
        setPlannerBorderImage('');
        return;
      }

      if (image.startsWith('data:')) {
        const compressed = await compressImage(image);
        await storeImageInIndexedDB('planner_border_image', compressed);
      }

      setPlannerBorderImage(image);
    } catch (error) {
      console.error('Error updating planner border image:', error);
      throw error;
    }
  };

  return (
    <PlannerContext.Provider value={{
      monthsData,
      plannerBorderImage,
      getMonthData,
      getMonthCoverImage,
      updateMonthCover,
      updatePlannerBorderImage,
      addEvent,
      updateEvent,
      deleteEvent,
      toggleEventComplete,
      addDailyActivity,
      updateDailyActivity,
      deleteDailyActivity,
      toggleDailyActivityComplete,
      clearAllDailyActivities,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleHabitDay,
      addNote,
      toggleNoteComplete,
      deleteNote,
      addShoppingItem,
      toggleShoppingItem,
      deleteShoppingItem,
    }}>
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) throw new Error('usePlanner must be used within PlannerProvider');
  return context;
};