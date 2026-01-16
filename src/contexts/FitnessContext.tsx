import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { compressImage, storeImageInIndexedDB, retrieveImageFromIndexedDB, removeImageFromIndexedDB } from '../lib/imageCompression';

export interface Workout {
  id: string;
  name: string;
  days: string[];
  exercises: string[];
  duration: number;
  caloriesBurned: number;
  image?: string;
  videoUrl?: string;
  videoTitle?: string;
  videoThumbnail?: string;
  completedDays?: string[];
  completed?: boolean;
}

export interface ProgressPhoto {
  id: string;
  date: Date;
  imageUrl: string;
  weight?: number;
  notes?: string;
}

export interface WeightEntry {
  id: string;
  date: Date;
  weight: number;
}

interface FitnessContextType {
  workouts: Workout[];
  progressPhotos: ProgressPhoto[];
  weightEntries: WeightEntry[];
  headerImages: [string, string, string];
  addWorkout: (workout: Omit<Workout, 'id'>) => void;
  updateWorkout: (id: string, updates: Partial<Omit<Workout, 'id'>>) => void;
  deleteWorkout: (id: string) => void;
  toggleWorkoutCompleteForDay: (id: string, day: string) => void;
  addProgressPhoto: (imageUrl: string, notes?: string) => void;
  deleteProgressPhoto: (id: string) => void;
  addWeightEntry: (weight: number) => void;
  deleteWeightEntry: (id: string) => void;
  updateHeaderImage: (index: 0 | 1 | 2, image: string) => Promise<void>;
}

const FitnessContext = createContext<FitnessContextType | null>(null);

const STORAGE_KEY = 'fitness_data';

export const FitnessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const migratedWorkouts = (data.workouts || []).map((w: any) => {
          if (w.day && !w.days) {
            return { ...w, days: [w.day], completedDays: [] };
          }
          if (!w.completedDays) {
            return { ...w, completedDays: [] };
          }
          return w;
        });
        return migratedWorkouts;
      } catch {
        return [];
      }
    }
    return [];
  });

  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored, (key, value) => {
          if (key === 'date' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        });
        return data.progressPhotos || [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored, (key, value) => {
          if (key === 'date' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        });
        return data.weightEntries || [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [headerImages, setHeaderImages] = useState<[string, string, string]>(['', '', '']);
  const [headerImageKeys, setHeaderImageKeys] = useState<[string, string, string]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        return data.headerImageKeys || ['', '', ''];
      } catch {
        return ['', '', ''];
      }
    }
    return ['', '', ''];
  });

  useEffect(() => {
    const loadHeaderImages = async () => {
      const newImages: [string, string, string] = ['', '', ''];
      for (let i = 0; i < 3; i++) {
        if (headerImageKeys[i]) {
          const image = await retrieveImageFromIndexedDB(headerImageKeys[i]);
          if (image) newImages[i] = image;
        }
      }
      setHeaderImages(newImages);
    };
    loadHeaderImages();
  }, []);

  useEffect(() => {
    const data = { workouts, progressPhotos, weightEntries, headerImageKeys };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('localDataSaved'));
  }, [workouts, progressPhotos, weightEntries, headerImageKeys]);

  const addWorkout = (workout: Omit<Workout, 'id'>) => {
    setWorkouts([...workouts, { ...workout, id: uuidv4(), completedDays: [] }]);
  };

  const updateWorkout = (id: string, updates: Partial<Omit<Workout, 'id'>>) => {
    setWorkouts(workouts.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const deleteWorkout = (id: string) => {
    setWorkouts(workouts.filter(w => w.id !== id));
  };

  const toggleWorkoutCompleteForDay = (id: string, day: string) => {
    setWorkouts(workouts.map(w => {
      if (w.id === id) {
        const completedDays = w.completedDays || [];
        const isCompleted = completedDays.includes(day);
        return {
          ...w,
          completedDays: isCompleted
            ? completedDays.filter(d => d !== day)
            : [...completedDays, day]
        };
      }
      return w;
    }));
  };

  const addProgressPhoto = (imageUrl: string, notes?: string) => {
    const newPhoto: ProgressPhoto = {
      id: uuidv4(),
      date: new Date(),
      imageUrl,
      notes,
    };
    setProgressPhotos([newPhoto, ...progressPhotos]);
  };

  const deleteProgressPhoto = (id: string) => {
    setProgressPhotos(progressPhotos.filter(p => p.id !== id));
  };

  const addWeightEntry = (weight: number) => {
    const newEntry: WeightEntry = {
      id: uuidv4(),
      date: new Date(),
      weight,
    };
    setWeightEntries([newEntry, ...weightEntries]);
  };

  const deleteWeightEntry = (id: string) => {
    setWeightEntries(weightEntries.filter(e => e.id !== id));
  };

  const updateHeaderImage = async (index: 0 | 1 | 2, image: string) => {
    try {
      if (!image) {
        const oldKey = headerImageKeys[index];
        if (oldKey) await removeImageFromIndexedDB(oldKey);
        const newKeys: [string, string, string] = [...headerImageKeys];
        newKeys[index] = '';
        setHeaderImageKeys(newKeys);
        const newImages: [string, string, string] = [...headerImages];
        newImages[index] = '';
        setHeaderImages(newImages);
        return;
      }

      if (image.startsWith('data:')) {
        const compressed = await compressImage(image);
        const imageKey = `fitness_header_${index}_${Date.now()}`;
        await storeImageInIndexedDB(imageKey, compressed);
        const oldKey = headerImageKeys[index];
        if (oldKey) await removeImageFromIndexedDB(oldKey);
        const newKeys: [string, string, string] = [...headerImageKeys];
        newKeys[index] = imageKey;
        setHeaderImageKeys(newKeys);
        const newImages: [string, string, string] = [...headerImages];
        newImages[index] = compressed;
        setHeaderImages(newImages);
      } else {
        const newImages: [string, string, string] = [...headerImages];
        newImages[index] = image;
        setHeaderImages(newImages);
        const newKeys: [string, string, string] = [...headerImageKeys];
        newKeys[index] = '';
        setHeaderImageKeys(newKeys);
      }
    } catch (error) {
      console.error('Failed to update header image:', error);
      throw error;
    }
  };

  return (
    <FitnessContext.Provider value={{
      workouts,
      progressPhotos,
      weightEntries,
      headerImages,
      addWorkout,
      updateWorkout,
      deleteWorkout,
      toggleWorkoutCompleteForDay,
      addProgressPhoto,
      deleteProgressPhoto,
      addWeightEntry,
      deleteWeightEntry,
      updateHeaderImage,
    }}>
      {children}
    </FitnessContext.Provider>
  );
};

export const useFitness = () => {
  const context = useContext(FitnessContext);
  if (!context) throw new Error('useFitness must be used within FitnessProvider');
  return context;
};