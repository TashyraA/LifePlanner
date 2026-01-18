import React, { useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Plus, Trash2, BookOpen, Calendar, Clock, Star, CheckCircle2, AlertCircle, Edit } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useCollege } from '../contexts/CollegeContext';
import ClassNotebook from '../components/ClassNotebook';
import { CurvedArches } from '../components/PageHeaderImages';

const CollegeDashboard = () => {
  const { toast } = useToast();
  const { assignments, courses, addAssignment, updateAssignment, deleteAssignment, addCourse, deleteCourse, headerImages, updateHeaderImage } = useCollege();

  const [activeTab, setActiveTab] = useState('overview');
  const [isCompletedDialogOpen, setIsCompletedDialogOpen] = useState(false);

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    course: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    description: '',
    estimatedHours: '',
  });

  const [newCourse, setNewCourse] = useState({
    name: '',
    professor: '',
    credits: '',
    color: '#f4c2c2',
  });

  const [editingAssignment, setEditingAssignment] = useState<string | null>(null);
  const [editAssignmentData, setEditAssignmentData] = useState({
    title: '',
    course: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    description: '',
    estimatedHours: '',
  });

  const handleAddAssignment = () => {
    if (newAssignment.title && newAssignment.course && newAssignment.dueDate) {
      const [year, month, day] = newAssignment.dueDate.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day, 23, 59, 59);
      
      addAssignment({
        title: newAssignment.title,
        course: newAssignment.course,
        dueDate: dueDate,
        priority: newAssignment.priority,
        status: 'todo',
        description: newAssignment.description,
        estimatedHours: newAssignment.estimatedHours ? parseFloat(newAssignment.estimatedHours) : undefined,
      });
      setNewAssignment({
        title: '',
        course: '',
        dueDate: '',
        priority: 'medium',
        description: '',
        estimatedHours: '',
      });
      toast({
        title: "Assignment added! 📚",
        description: "Your assignment has been added to your tracker.",
      });
    }
  };

  const handleAddCourse = () => {
    if (newCourse.name) {
      addCourse({
        name: newCourse.name,
        color: newCourse.color,
        professor: newCourse.professor,
        credits: newCourse.credits ? parseInt(newCourse.credits) : undefined,
      });
      setNewCourse({ name: '', professor: '', credits: '', color: '#f4c2c2' });
      toast({
        title: "Course added! 🎓",
        description: "Your course has been added.",
      });
    }
  };

  const handleEditAssignment = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (assignment) {
      const date = new Date(assignment.dueDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      setEditAssignmentData({
        title: assignment.title,
        course: assignment.course,
        dueDate: `${year}-${month}-${day}`,
        priority: assignment.priority,
        description: assignment.description || '',
        estimatedHours: assignment.estimatedHours?.toString() || '',
      });
      setEditingAssignment(assignmentId);
    }
  };

  const handleSaveAssignment = () => {
    if (editingAssignment) {
      const [year, month, day] = editAssignmentData.dueDate.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day, 23, 59, 59);
      
      updateAssignment(editingAssignment, {
        title: editAssignmentData.title,
        course: editAssignmentData.course,
        dueDate: dueDate,
        priority: editAssignmentData.priority,
        description: editAssignmentData.description,
        estimatedHours: editAssignmentData.estimatedHours ? parseFloat(editAssignmentData.estimatedHours) : undefined,
      });
      setEditingAssignment(null);
      toast({
        title: "Assignment updated! ✓",
        description: "Your assignment has been updated.",
      });
    }
  };

  const updateAssignmentStatus = (id: string, status: 'todo' | 'in-progress' | 'completed') => {
    const updates = status === 'completed' ? { status, completedAt: new Date() } : { status };
    updateAssignment(id, updates);
  };

  const handleDeleteAssignment = (id: string) => {
    deleteAssignment(id);
    toast({
      title: "Assignment deleted",
      description: "The assignment has been removed.",
    });
  };

  const handleDeleteCourse = (id: string) => {
    deleteCourse(id);
    toast({
      title: "Course deleted",
      description: "The course has been removed.",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-600 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-600 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-600 border-green-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getDaysUntilDue = (dueDate: Date) => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  const isCompletedWithin48Hours = (completedAt?: Date) => {
    if (!completedAt) return false;
    const completed = new Date(completedAt);
    const now = new Date();
    const diffInMs = now.getTime() - completed.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    return diffInHours <= 48;
  };

  const upcomingAssignments = assignments
    .filter(a => a.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const completedAssignments = assignments
    .filter(a => a.status === 'completed' && isCompletedWithin48Hours(a.completedAt))
    .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());

  const completedCount = completedAssignments.length;
  const totalAssignments = assignments.length;
  const completionRate = totalAssignments > 0 ? (completedCount / totalAssignments) * 100 : 0;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-coquette-brown-50 via-coquette-pink-50 to-white">
        <AppSidebar />
        <SidebarInset className="flex-1 w-full min-w-0 flex flex-col">
          <header className="flex items-center justify-between sticky top-0 z-10 gap-2 sm:gap-4 border-b border-coquette-brown-200 bg-white/80 backdrop-blur-sm px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-coquette-pink-400" />
              <h1 className="text-lg sm:text-2xl font-bold text-coquette-brown-600">College</h1>
            </div>
          </header>

          {/* Curved Image Arches */}
          <CurvedArches
            images={headerImages}
            onUpload={async (index, image) => {
              await updateHeaderImage(index, image);
              toast({
                title: "Image uploaded! 🎨",
                description: "Your decorative arch has been updated.",
              });
            }}
            onRemove={async (index) => {
              await updateHeaderImage(index, '');
              toast({
                title: "Image removed",
                description: "Arch image has been cleared.",
              });
            }}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full h-auto rounded-none border-b border-coquette-brown-200 bg-white px-3 sm:px-6 py-0">
              <TabsTrigger value="overview" className="text-xs sm:text-sm text-coquette-brown-600 data-[state=active]:text-coquette-pink-400 data-[state=active]:border-b-2 data-[state=active]:border-coquette-pink-400 rounded-none border-b-2 border-transparent">
                Overview
              </TabsTrigger>
              <TabsTrigger value="notebook" className="text-xs sm:text-sm text-coquette-brown-600 data-[state=active]:text-coquette-pink-400 data-[state=active]:border-b-2 data-[state=active]:border-coquette-pink-400 rounded-none border-b-2 border-transparent">
                Notebook
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 overflow-auto">
          <main className="p-3 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                <Card className="border-coquette-brown-200 bg-gradient-to-br from-white to-coquette-pink-100">
                  <CardHeader className="pb-1 sm:pb-2">
                    <CardTitle className="text-coquette-brown-600 text-xs sm:text-sm">Assignments</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-2xl sm:text-3xl font-bold text-coquette-brown-600">{totalAssignments}</p>
                  </CardContent>
                </Card>

                <Card 
                  className="border-coquette-brown-200 bg-gradient-to-br from-white to-green-100 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => setIsCompletedDialogOpen(true)}
                >
                  <CardHeader className="pb-1 sm:pb-2">
                    <CardTitle className="text-coquette-brown-600 text-xs sm:text-sm flex items-center justify-between">
                      Completed
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">{completedCount}</p>
                    <p className="text-xs text-green-600 mt-1 hidden sm:block">Click to view</p>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-gradient-to-br from-white to-coquette-brown-100">
                  <CardHeader className="pb-1 sm:pb-2">
                    <CardTitle className="text-coquette-brown-600 text-xs sm:text-sm">In Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                      {assignments.filter(a => a.status === 'in-progress').length}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-gradient-to-br from-white to-coquette-pink-100">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600 text-sm">Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-coquette-brown-600">{completionRate.toFixed(0)}%</p>
                    <Progress value={completionRate} className="h-2 mt-2" />
                  </CardContent>
                </Card>
              </div>

              {/* Add Assignment and Course Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer">
                      <CardContent className="p-6 flex items-center justify-center gap-3">
                        <Plus className="h-6 w-6 text-coquette-pink-400" />
                        <span className="text-lg font-semibold text-coquette-brown-600">Add New Assignment</span>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="border-coquette-brown-200 max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-coquette-brown-600">Add New Assignment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-coquette-brown-600">Title</Label>
                        <Input
                          value={newAssignment.title}
                          onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                          placeholder="Assignment title"
                          className="border-coquette-brown-200"
                        />
                      </div>
                      <div>
                        <Label className="text-coquette-brown-600">Course</Label>
                        <Select
                          value={newAssignment.course}
                          onValueChange={(value) => setNewAssignment({ ...newAssignment, course: value })}
                        >
                          <SelectTrigger className="border-coquette-brown-200">
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map(course => (
                              <SelectItem key={course.id} value={course.name}>{course.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-coquette-brown-600">Due Date</Label>
                          <Input
                            type="date"
                            value={newAssignment.dueDate}
                            onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                            className="border-coquette-brown-200"
                          />
                        </div>
                        <div>
                          <Label className="text-coquette-brown-600">Priority</Label>
                          <Select
                            value={newAssignment.priority}
                            onValueChange={(value: 'low' | 'medium' | 'high') => setNewAssignment({ ...newAssignment, priority: value })}
                          >
                            <SelectTrigger className="border-coquette-brown-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-coquette-brown-600">Estimated Hours (optional)</Label>
                        <Input
                          type="number"
                          value={newAssignment.estimatedHours}
                          onChange={(e) => setNewAssignment({ ...newAssignment, estimatedHours: e.target.value })}
                          placeholder="Hours"
                          className="border-coquette-brown-200"
                        />
                      </div>
                      <div>
                        <Label className="text-coquette-brown-600">Description (optional)</Label>
                        <Textarea
                          value={newAssignment.description}
                          onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                          placeholder="Assignment details..."
                          className="border-coquette-brown-200"
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleAddAssignment} className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                        Add Assignment
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer">
                      <CardContent className="p-6 flex items-center justify-center gap-3">
                        <Plus className="h-6 w-6 text-coquette-brown-400" />
                        <span className="text-lg font-semibold text-coquette-brown-600">Add New Course</span>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="border-coquette-brown-200">
                    <DialogHeader>
                      <DialogTitle className="text-coquette-brown-600">Add New Course</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-coquette-brown-600">Course Name</Label>
                        <Input
                          value={newCourse.name}
                          onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                          placeholder="e.g., Computer Science"
                          className="border-coquette-brown-200"
                        />
                      </div>
                      <div>
                        <Label className="text-coquette-brown-600">Professor (optional)</Label>
                        <Input
                          value={newCourse.professor}
                          onChange={(e) => setNewCourse({ ...newCourse, professor: e.target.value })}
                          placeholder="e.g., Dr. Smith"
                          className="border-coquette-brown-200"
                        />
                      </div>
                      <div>
                        <Label className="text-coquette-brown-600">Credits (optional)</Label>
                        <Input
                          type="number"
                          value={newCourse.credits}
                          onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })}
                          placeholder="e.g., 3"
                          className="border-coquette-brown-200"
                        />
                      </div>
                      <div>
                        <Label className="text-coquette-brown-600">Color</Label>
                        <div className="flex gap-2">
                          {['#f4c2c2', '#d4c4b0', '#f5e6d3', '#e8d5c4', '#f0e5d8', '#fad4d8', '#e5c9c1'].map(color => (
                            <button
                              key={color}
                              onClick={() => setNewCourse({ ...newCourse, color })}
                              className={`w-10 h-10 rounded-full border-2 ${newCourse.color === color ? 'border-coquette-brown-600' : 'border-gray-300'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <Button onClick={handleAddCourse} className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                        Add Course
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Upcoming Assignments */}
              <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-coquette-brown-600 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Upcoming Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingAssignments.length > 0 ? (
                      upcomingAssignments.map(assignment => {
                        const daysUntil = getDaysUntilDue(assignment.dueDate);
                        const isOverdue = daysUntil < 0;
                        
                        return (
                          <Card 
                            key={assignment.id} 
                            className={`border-2 ${isOverdue ? 'border-red-400 bg-red-50' : 'border-coquette-brown-200'}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-coquette-brown-600">{assignment.title}</h4>
                                    <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(assignment.priority)}`}>
                                      {assignment.priority}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-coquette-brown-500">
                                    <div className="flex items-center gap-1">
                                      <BookOpen className="h-3 w-3" />
                                      <span>{assignment.course}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                                        {format(new Date(assignment.dueDate), 'MMM d, yyyy')}
                                        {isOverdue ? ' (OVERDUE)' : ` (${daysUntil} days)`}
                                      </span>
                                    </div>
                                    {assignment.estimatedHours && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{assignment.estimatedHours}h</span>
                                      </div>
                                    )}
                                  </div>
                                  {assignment.description && (
                                    <p className="text-sm text-coquette-brown-400 mt-2">{assignment.description}</p>
                                  )}
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <Select
                                    value={assignment.status}
                                    onValueChange={(value: 'todo' | 'in-progress' | 'completed') => updateAssignmentStatus(assignment.id, value)}
                                  >
                                    <SelectTrigger className="w-32 border-coquette-brown-200">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="todo">To Do</SelectItem>
                                      <SelectItem value="in-progress">In Progress</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Dialog open={editingAssignment === assignment.id} onOpenChange={(open) => !open && setEditingAssignment(null)}>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditAssignment(assignment.id)}
                                        className="text-coquette-brown-500 hover:bg-coquette-brown-100"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="border-coquette-brown-200 max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle className="text-coquette-brown-600">Edit Assignment</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <Label className="text-coquette-brown-600">Title</Label>
                                          <Input
                                            value={editAssignmentData.title}
                                            onChange={(e) => setEditAssignmentData({ ...editAssignmentData, title: e.target.value })}
                                            className="border-coquette-brown-200"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-coquette-brown-600">Course</Label>
                                          <Select
                                            value={editAssignmentData.course}
                                            onValueChange={(value) => setEditAssignmentData({ ...editAssignmentData, course: value })}
                                          >
                                            <SelectTrigger className="border-coquette-brown-200">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {courses.map(course => (
                                                <SelectItem key={course.id} value={course.name}>{course.name}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label className="text-coquette-brown-600">Due Date</Label>
                                            <Input
                                              type="date"
                                              value={editAssignmentData.dueDate}
                                              onChange={(e) => setEditAssignmentData({ ...editAssignmentData, dueDate: e.target.value })}
                                              className="border-coquette-brown-200"
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-coquette-brown-600">Priority</Label>
                                            <Select
                                              value={editAssignmentData.priority}
                                              onValueChange={(value: 'low' | 'medium' | 'high') => setEditAssignmentData({ ...editAssignmentData, priority: value })}
                                            >
                                              <SelectTrigger className="border-coquette-brown-200">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                        <div>
                                          <Label className="text-coquette-brown-600">Estimated Hours</Label>
                                          <Input
                                            type="number"
                                            value={editAssignmentData.estimatedHours}
                                            onChange={(e) => setEditAssignmentData({ ...editAssignmentData, estimatedHours: e.target.value })}
                                            className="border-coquette-brown-200"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-coquette-brown-600">Description</Label>
                                          <Textarea
                                            value={editAssignmentData.description}
                                            onChange={(e) => setEditAssignmentData({ ...editAssignmentData, description: e.target.value })}
                                            className="border-coquette-brown-200"
                                            rows={3}
                                          />
                                        </div>
                                        <Button onClick={handleSaveAssignment} className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                                          Save Changes
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteAssignment(assignment.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <p className="text-center text-coquette-brown-400 py-8">No upcoming assignments. Add one to get started!</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Courses */}
              <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-coquette-brown-600">My Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map(course => (
                      <Card key={course.id} className="border-coquette-brown-200" style={{ backgroundColor: course.color + '40' }}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-coquette-brown-600 mb-1">{course.name}</h4>
                              {course.professor && (
                                <p className="text-sm text-coquette-brown-500">{course.professor}</p>
                              )}
                              {course.credits && (
                                <p className="text-xs text-coquette-brown-400 mt-1">{course.credits} credits</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCourse(course.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Completed Assignments Dialog */}
              <Dialog open={isCompletedDialogOpen} onOpenChange={setIsCompletedDialogOpen}>
                <DialogContent className="border-coquette-brown-200 max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-coquette-brown-600 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Completed Assignments
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {completedAssignments.length > 0 ? (
                      completedAssignments.map(assignment => (
                        <Card key={assignment.id} className="border-coquette-brown-200 bg-green-50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-coquette-brown-600 mb-1">{assignment.title}</h4>
                                <div className="flex items-center gap-4 text-sm text-coquette-brown-500">
                                  <span>{assignment.course}</span>
                                  <span>Completed: {assignment.completedAt ? format(new Date(assignment.completedAt), 'MMM d, yyyy') : 'N/A'}</span>
                                </div>
                              </div>
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-center text-coquette-brown-400 py-8">No completed assignments yet.</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </main>
            </TabsContent>

            <TabsContent value="notebook" className="flex-1 overflow-hidden p-0">
              <ClassNotebook />
            </TabsContent>
          </Tabs>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CollegeDashboard;