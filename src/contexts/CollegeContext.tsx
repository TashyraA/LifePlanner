import React, { createContext, useContext, useState, useEffect } from 'react';
import { compressImage, storeImageInIndexedDB, retrieveImageFromIndexedDB, removeImageFromIndexedDB } from '../lib/imageCompression';

export interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
  description?: string;
  estimatedHours?: number;
  completedAt?: Date;
}

export interface Course {
  id: string;
  name: string;
  color: string;
  professor?: string;
  credits?: number;
}

interface CollegeContextType {
  assignments: Assignment[];
  courses: Course[];
  headerImages: [string, string, string];
  addAssignment: (assignment: Omit<Assignment, 'id'>) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  addCourse: (course: Omit<Course, 'id'>) => void;
  deleteCourse: (id: string) => void;
  updateHeaderImage: (index: 0 | 1 | 2, image: string) => Promise<void>;
}

const CollegeContext = createContext<CollegeContextType | null>(null);

const STORAGE_KEY = 'college_data';

export const CollegeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored, (key, value) => {
          if ((key === 'dueDate' || key === 'completedAt') && value) {
            return new Date(value);
          }
          return value;
        });
        return data.assignments || [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        return data.courses || [
          { id: '1', name: 'Computer Science', color: '#f4c2c2', professor: 'Dr. Smith', credits: 3 },
          { id: '2', name: 'Mathematics', color: '#d4c4b0', professor: 'Prof. Johnson', credits: 4 },
          { id: '3', name: 'English Literature', color: '#f5e6d3', professor: 'Dr. Williams', credits: 3 },
        ];
      } catch {
        return [
          { id: '1', name: 'Computer Science', color: '#f4c2c2', professor: 'Dr. Smith', credits: 3 },
          { id: '2', name: 'Mathematics', color: '#d4c4b0', professor: 'Prof. Johnson', credits: 4 },
          { id: '3', name: 'English Literature', color: '#f5e6d3', professor: 'Dr. Williams', credits: 3 },
        ];
      }
    }
    return [
      { id: '1', name: 'Computer Science', color: '#f4c2c2', professor: 'Dr. Smith', credits: 3 },
      { id: '2', name: 'Mathematics', color: '#d4c4b0', professor: 'Prof. Johnson', credits: 4 },
      { id: '3', name: 'English Literature', color: '#f5e6d3', professor: 'Dr. Williams', credits: 3 },
    ];
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
    const data = { assignments, courses, headerImageKeys };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('localDataSaved'));
  }, [assignments, courses, headerImageKeys]);

  const addAssignment = (assignment: Omit<Assignment, 'id'>) => {
    setAssignments([...assignments, { ...assignment, id: Date.now().toString() }]);
  };

  const updateAssignment = (id: string, updates: Partial<Assignment>) => {
    setAssignments(assignments.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAssignment = (id: string) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };

  const addCourse = (course: Omit<Course, 'id'>) => {
    setCourses([...courses, { ...course, id: Date.now().toString() }]);
  };

  const deleteCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
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
        const imageKey = `college_header_${index}_${Date.now()}`;
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
    <CollegeContext.Provider value={{
      assignments,
      courses,
      headerImages,
      addAssignment,
      updateAssignment,
      deleteAssignment,
      addCourse,
      deleteCourse,
      updateHeaderImage,
    }}>
      {children}
    </CollegeContext.Provider>
  );
};

export const useCollege = () => {
  const context = useContext(CollegeContext);
  if (!context) throw new Error('useCollege must be used within CollegeProvider');
  return context;
};