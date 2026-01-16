import React, { createContext, useContext, useState, useEffect } from 'react';

export interface NotebookNote {
  id: string;
  title: string;
  content: string;
  fontSize: number; // in pixels
  fontFamily: string;
  createdAt: Date;
  updatedAt: Date;
  attachments?: string[]; // URLs or base64 data
}

export interface NotebookAssignment {
  id: string;
  title: string;
  notes: NotebookNote[];
  createdAt: Date;
}

export interface NotebookCourse {
  id: string;
  title: string;
  color: string;
  assignments: NotebookAssignment[];
  createdAt: Date;
}

interface NotebookContextType {
  courses: NotebookCourse[];
  addCourse: (course: Omit<NotebookCourse, 'id' | 'createdAt'>) => void;
  updateCourse: (id: string, updates: Partial<NotebookCourse>) => void;
  deleteCourse: (id: string) => void;
  reorderCourses: (courseIds: string[]) => void;
  
  addAssignment: (courseId: string, assignment: Omit<NotebookAssignment, 'id' | 'createdAt'>) => void;
  updateAssignment: (courseId: string, assignmentId: string, updates: Partial<NotebookAssignment>) => void;
  deleteAssignment: (courseId: string, assignmentId: string) => void;
  reorderAssignments: (courseId: string, assignmentIds: string[]) => void;
  
  addNote: (courseId: string, assignmentId: string, note: Omit<NotebookNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (courseId: string, assignmentId: string, noteId: string, updates: Partial<NotebookNote>) => void;
  deleteNote: (courseId: string, assignmentId: string, noteId: string) => void;
  
  searchNotes: (query: string) => Array<{ courseId: string; course: string; assignment: NotebookAssignment; note: NotebookNote }>;
}

const NotebookContext = createContext<NotebookContextType | null>(null);

const NOTEBOOK_STORAGE_KEY = 'notebook_data';
const DEFAULT_COURSES: NotebookCourse[] = [
  {
    id: '1',
    title: 'CS-310',
    color: '#E0D4C4',
    assignments: [
      {
        id: '1',
        title: 'Assignment 1',
        notes: [
          {
            id: '1',
            title: 'My Notes',
            content: 'Welcome to CS-310. Start typing here...',
            fontSize: 16,
            fontFamily: 'system-ui',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
      },
    ],
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Real Estate',
    color: '#B5C4D4',
    assignments: [
      {
        id: '1',
        title: 'Chapter 1 Reading',
        notes: [
          {
            id: '1',
            title: 'Notes',
            content: 'Start taking notes on real estate here...',
            fontSize: 16,
            fontFamily: 'system-ui',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
      },
    ],
    createdAt: new Date(),
  },
];

export const NotebookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<NotebookCourse[]>(() => {
    const stored = localStorage.getItem(NOTEBOOK_STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored, (key, value) => {
          if ((key === 'createdAt' || key === 'updatedAt') && value) {
            return new Date(value);
          }
          return value;
        });
        return data.courses || DEFAULT_COURSES;
      } catch {
        return DEFAULT_COURSES;
      }
    }
    return DEFAULT_COURSES;
  });

  // Auto-save to localStorage
  useEffect(() => {
    const saveData = async () => {
      const data = { courses };
      localStorage.setItem(NOTEBOOK_STORAGE_KEY, JSON.stringify(data));
    };
    
    const timer = setTimeout(saveData, 1000);
    return () => clearTimeout(timer);
  }, [courses]);

  const addCourse = (course: Omit<NotebookCourse, 'id' | 'createdAt'>) => {
    const assignments: NotebookAssignment[] = (course.assignments || []).map((assignment, idx) => ({
      ...assignment,
      id: (Date.now() + idx).toString(),
      createdAt: new Date(),
      notes: (assignment.notes || []).map((note, nIdx) => ({
        ...note,
        id: (Date.now() + idx * 1000 + nIdx).toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    }));
    
    const newCourse: NotebookCourse = {
      ...course,
      id: Date.now().toString(),
      createdAt: new Date(),
      assignments,
    };
    setCourses([...courses, newCourse]);
  };

  const updateCourse = (id: string, updates: Partial<NotebookCourse>) => {
    setCourses(courses.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  const reorderCourses = (courseIds: string[]) => {
    const newOrder = courseIds
      .map(id => courses.find(c => c.id === id))
      .filter(Boolean) as NotebookCourse[];
    setCourses(newOrder);
  };

  const addAssignment = (courseId: string, assignment: Omit<NotebookAssignment, 'id' | 'createdAt'>) => {
    setCourses(courses.map(c => {
      if (c.id === courseId) {
        const notes: NotebookNote[] = (assignment.notes || []).map((note, idx) => ({
          ...note,
          id: (Date.now() + idx).toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        
        const newAssignment: NotebookAssignment = {
          ...assignment,
          id: Date.now().toString(),
          createdAt: new Date(),
          notes,
        };
        return { ...c, assignments: [...(c.assignments || []), newAssignment] };
      }
      return c;
    }));
  };

  const updateAssignment = (courseId: string, assignmentId: string, updates: Partial<NotebookAssignment>) => {
    setCourses(courses.map(c => {
      if (c.id === courseId) {
        return {
          ...c,
          assignments: (c.assignments || []).map(a =>
            a.id === assignmentId ? { ...a, ...updates } : a
          ),
        };
      }
      return c;
    }));
  };

  const deleteAssignment = (courseId: string, assignmentId: string) => {
    setCourses(courses.map(c => {
      if (c.id === courseId) {
        return {
          ...c,
          assignments: (c.assignments || []).filter(a => a.id !== assignmentId),
        };
      }
      return c;
    }));
  };

  const reorderAssignments = (courseId: string, assignmentIds: string[]) => {
    setCourses(courses.map(c => {
      if (c.id === courseId) {
        const assignments = c.assignments || [];
        const newOrder = assignmentIds
          .map(id => assignments.find(a => a.id === id))
          .filter(Boolean) as NotebookAssignment[];
        return { ...c, assignments: newOrder };
      }
      return c;
    }));
  };

  const addNote = (courseId: string, assignmentId: string, note: Omit<NotebookNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    setCourses(courses.map(c => {
      if (c.id === courseId) {
        return {
          ...c,
          assignments: (c.assignments || []).map(a => {
            if (a.id === assignmentId) {
              const newNote: NotebookNote = {
                ...note,
                id: Date.now().toString(),
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              return { ...a, notes: [...(a.notes || []), newNote] };
            }
            return a;
          }),
        };
      }
      return c;
    }));
  };

  const updateNote = (courseId: string, assignmentId: string, noteId: string, updates: Partial<NotebookNote>) => {
    setCourses(courses.map(c => {
      if (c.id === courseId) {
        return {
          ...c,
          assignments: (c.assignments || []).map(a => {
            if (a.id === assignmentId) {
              return {
                ...a,
                notes: (a.notes || []).map(n =>
                  n.id === noteId
                    ? { ...n, ...updates, updatedAt: new Date() }
                    : n
                ),
              };
            }
            return a;
          }),
        };
      }
      return c;
    }));
  };

  const deleteNote = (courseId: string, assignmentId: string, noteId: string) => {
    setCourses(courses.map(c => {
      if (c.id === courseId) {
        return {
          ...c,
          assignments: (c.assignments || []).map(a => {
            if (a.id === assignmentId) {
              return {
                ...a,
                notes: (a.notes || []).filter(n => n.id !== noteId),
              };
            }
            return a;
          }),
        };
      }
      return c;
    }));
  };

  const searchNotes = (query: string) => {
    const lowerQuery = query.toLowerCase();
    const results: Array<{ courseId: string; course: string; assignment: NotebookAssignment; note: NotebookNote }> = [];

    courses.forEach(course => {
      (course.assignments || []).forEach(assignment => {
        (assignment.notes || []).forEach(note => {
          if (
            note.title.toLowerCase().includes(lowerQuery) ||
            note.content.toLowerCase().includes(lowerQuery) ||
            assignment.title.toLowerCase().includes(lowerQuery)
          ) {
            results.push({
              courseId: course.id,
              course: course.title,
              assignment,
              note,
            });
          }
        });
      });
    });

    return results;
  };

  return (
    <NotebookContext.Provider
      value={{
        courses,
        addCourse,
        updateCourse,
        deleteCourse,
        reorderCourses,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        reorderAssignments,
        addNote,
        updateNote,
        deleteNote,
        searchNotes,
      }}
    >
      {children}
    </NotebookContext.Provider>
  );
};

export const useNotebook = () => {
  const context = useContext(NotebookContext);
  if (!context) throw new Error('useNotebook must be used within NotebookProvider');
  return context;
};
