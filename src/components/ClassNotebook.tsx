import React, { useState } from 'react';
import { useNotebook } from '../contexts/NotebookContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Edit2, Search, X } from 'lucide-react';
import NotebookEditor from './NotebookEditor';
import SearchNotebook from './SearchNotebook';

const ClassNotebook = () => {
  const { courses, addCourse, updateCourse, deleteCourse, addAssignment, deleteAssignment, addNote } = useNotebook();
  const [activeTab, setActiveTab] = useState('notes');
  const [activeCourseId, setActiveCourseId] = useState(courses[0]?.id || '');
  const [activeAssignmentId, setActiveAssignmentId] = useState(courses[0]?.assignments?.[0]?.id || '');
  const [activeNoteId, setActiveNoteId] = useState(courses[0]?.assignments?.[0]?.notes?.[0]?.id || '');
  
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isEditingCourseTitle, setIsEditingCourseTitle] = useState<string | null>(null);
  
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseColor, setNewCourseColor] = useState('#E0D4C4');
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [editingCourseName, setEditingCourseName] = useState('');

  const activeCourse = courses.find(c => c.id === activeCourseId);
  const activeAssignment = activeCourse?.assignments?.find(a => a.id === activeAssignmentId);
  const activeNote = activeAssignment?.notes?.find(n => n.id === activeNoteId);

  const handleAddCourse = () => {
    if (newCourseName.trim()) {
      addCourse({
        title: newCourseName,
        color: newCourseColor,
        assignments: [
          {
            title: 'Assignment 1',
            notes: [
              {
                title: 'Notes',
                content: '',
                fontSize: 16,
                fontFamily: 'system-ui',
              } as any,
            ],
          } as any,
        ],
      });
      setNewCourseName('');
      setNewCourseColor('#E0D4C4');
      setIsAddCourseOpen(false);
    }
  };

  const handleAddAssignment = () => {
    if (newAssignmentTitle.trim() && activeCourseId) {
      addAssignment(activeCourseId, {
        title: newAssignmentTitle,
        notes: [
          {
            title: 'Notes',
            content: '',
            fontSize: 16,
            fontFamily: 'system-ui',
          } as any,
        ],
      });
      setNewAssignmentTitle('');
      setIsAddAssignmentOpen(false);
    }
  };

  const handleAddNote = () => {
    if (newNoteTitle.trim() && activeCourseId && activeAssignmentId) {
      addNote(activeCourseId, activeAssignmentId, {
        title: newNoteTitle,
        content: '',
        fontSize: 16,
        fontFamily: 'system-ui',
      } as any);
      setNewNoteTitle('');
      setIsAddNoteOpen(false);
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    deleteCourse(courseId);
    if (activeCourseId === courseId && courses.length > 1) {
      const nextCourse = courses.find(c => c.id !== courseId);
      if (nextCourse) {
        setActiveCourseId(nextCourse.id);
        setActiveAssignmentId(nextCourse.assignments?.[0]?.id || '');
        setActiveNoteId(nextCourse.assignments?.[0]?.notes?.[0]?.id || '');
      }
    }
  };

  const handleRenameCourse = (courseId: string, newName: string) => {
    if (newName.trim()) {
      updateCourse(courseId, { title: newName });
      setIsEditingCourseTitle(null);
    }
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (!activeCourseId) return;
    
    deleteAssignment(activeCourseId, assignmentId);
    
    // If we deleted the active assignment, switch to another one
    if (activeAssignmentId === assignmentId) {
      const course = courses.find(c => c.id === activeCourseId);
      const remainingAssignments = course?.assignments?.filter(a => a.id !== assignmentId) || [];
      
      if (remainingAssignments.length > 0) {
        setActiveAssignmentId(remainingAssignments[0].id);
        setActiveNoteId(remainingAssignments[0].notes?.[0]?.id || '');
      } else {
        setActiveAssignmentId('');
        setActiveNoteId('');
      }
    }
  };

  const COLORS = [
    '#E0D4C4', // Warm beige
    '#D4C8E0', // Soft lavender
    '#B5C4D4', // Muted blue
    '#C4D4B5', // Soft sage
    '#D4B5C4', // Mauve
    '#D4CDB5', // Khaki
    '#E0CCD4', // Dusty rose
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-slate-300 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-slate-700">📓</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Class Notebook</h2>
              <p className="text-xs text-slate-500">Organize notes by course and assignment</p>
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100">
              <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
              <TabsTrigger value="search" className="text-xs">Search</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'notes' && (
          <div className="flex h-full gap-0">
            {/* Course Sidebar - Compact */}
            <div className="w-48 border-r border-slate-200 bg-white flex flex-col shadow-sm">
              <ScrollArea className="flex-1">
                <div className="space-y-1 p-3">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className={`group relative rounded-lg transition-all cursor-pointer ${
                        activeCourseId === course.id
                          ? 'bg-slate-100 border-2'
                          : 'hover:bg-slate-50 border-2 border-transparent'
                      }`}
                      style={activeCourseId === course.id ? { borderColor: course.color } : {}}
                      onClick={() => {
                        setActiveCourseId(course.id);
                        setActiveAssignmentId(course.assignments?.[0]?.id || '');
                        setActiveNoteId(course.assignments?.[0]?.notes?.[0]?.id || '');
                      }}
                    >
                      <div className="flex items-start gap-2 p-2">
                        <div
                          className="h-3 w-3 rounded mt-1 flex-shrink-0"
                          style={{ backgroundColor: course.color }}
                        />
                        <div className="flex-1 min-w-0">
                          {isEditingCourseTitle === course.id ? (
                            <input
                              autoFocus
                              value={editingCourseName}
                              onChange={(e) => setEditingCourseName(e.target.value)}
                              onBlur={() => handleRenameCourse(course.id, editingCourseName)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameCourse(course.id, editingCourseName);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded px-1 py-0.5"
                            />
                          ) : (
                            <h3 className="text-xs font-semibold text-slate-700 truncate">
                              {course.title}
                            </h3>
                          )}
                          <p className="text-xs text-slate-500">{course.assignments?.length || 0} assignments</p>
                        </div>
                      </div>

                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingCourseTitle(course.id);
                            setEditingCourseName(course.title);
                          }}
                          className="p-1 hover:bg-slate-200 rounded transition-colors"
                        >
                          <Edit2 className="h-2.5 w-2.5 text-slate-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id);
                          }}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 className="h-2.5 w-2.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t border-slate-200 p-2">
                <Dialog open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full text-xs h-8">
                      <Plus className="h-3 w-3 mr-1" />
                      New Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Add New Course</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-2">Course Name</label>
                        <Input
                          value={newCourseName}
                          onChange={(e) => setNewCourseName(e.target.value)}
                          placeholder="e.g., CS-310"
                          className="bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-2">Color</label>
                        <div className="grid grid-cols-7 gap-2">
                          {COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setNewCourseColor(color)}
                              className={`h-8 w-8 rounded-lg border-2 transition-transform ${
                                newCourseColor === color ? 'border-slate-800 scale-110' : 'border-slate-200 hover:scale-105'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <Button onClick={handleAddCourse} className="w-full bg-slate-700 hover:bg-slate-800">
                        Create Course
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Assignment Tabs and Editor */}
            {activeCourse && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Assignment Tabs */}
                <div className="border-b border-slate-200 bg-white">
                  <div className="flex items-center gap-2 px-6 py-3 overflow-auto">
                    {activeCourse.assignments?.map((assignment) => (
                      <div
                        key={assignment.id}
                        className={`group relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0 whitespace-nowrap ${
                          activeAssignmentId === assignment.id
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <button
                          onClick={() => {
                            setActiveAssignmentId(assignment.id);
                            setActiveNoteId(assignment.notes?.[0]?.id || '');
                          }}
                          className="pr-6"
                        >
                          {assignment.title}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAssignment(assignment.id);
                          }}
                          className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                            activeAssignmentId === assignment.id
                              ? 'hover:bg-slate-600'
                              : 'hover:bg-slate-300'
                          }`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <Dialog open={isAddAssignmentOpen} onOpenChange={setIsAddAssignmentOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-slate-600 h-8">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                          <DialogTitle>Add New Assignment to {activeCourse.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <label className="text-sm font-medium text-slate-700 block mb-2">Assignment Title</label>
                            <Input
                              value={newAssignmentTitle}
                              onChange={(e) => setNewAssignmentTitle(e.target.value)}
                              placeholder="e.g., Assignment 1"
                              className="bg-slate-50"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddAssignment();
                              }}
                            />
                          </div>
                          <Button onClick={handleAddAssignment} className="w-full bg-slate-700 hover:bg-slate-800">
                            Create Assignment
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Note Tabs and Editor */}
                {activeAssignment && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Note Tabs */}
                    <div className="border-b border-slate-200 bg-slate-50">
                      <div className="flex items-center gap-2 px-6 py-2 overflow-auto">
                        {activeAssignment.notes?.map((note) => (
                          <button
                            key={note.id}
                            onClick={() => setActiveNoteId(note.id)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-all flex-shrink-0 ${
                              activeNoteId === note.id
                                ? 'bg-slate-700 text-white'
                                : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            {note.title}
                          </button>
                        ))}
                        <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-slate-600 h-7">
                              <Plus className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                              <DialogTitle>Add New Note</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">Note Title</label>
                                <Input
                                  value={newNoteTitle}
                                  onChange={(e) => setNewNoteTitle(e.target.value)}
                                  placeholder="e.g., My Notes"
                                  className="bg-slate-50"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddNote();
                                  }}
                                />
                              </div>
                              <Button onClick={handleAddNote} className="w-full bg-slate-700 hover:bg-slate-800">
                                Create Note
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Editor */}
                    {activeNote && (
                      <NotebookEditor
                        note={activeNote}
                        courseId={activeCourseId}
                        assignmentId={activeAssignmentId}
                        courseName={activeCourse.title}
                        assignmentName={activeAssignment.title}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && <SearchNotebook />}
      </div>
    </div>
  );
};

export default ClassNotebook;
