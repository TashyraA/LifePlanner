import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import { usePlanner } from '../contexts/PlannerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { CustomCalendar } from '../components/CustomCalendar';
import { ArrowLeft, Plus, Trash2, Clock, Edit, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval, isSameDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MonthView = () => {
  const { monthIndex } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const month = parseInt(monthIndex || '0');
  const currentYear = new Date().getFullYear();
  const today = new Date();

  const {
    getMonthData,
    addEvent,
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
  } = usePlanner();

  const monthData = getMonthData(month, currentYear);

  const [newActivity, setNewActivity] = useState({ title: '', time: '', description: '' });
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  const [editActivityData, setEditActivityData] = useState({ title: '', time: '', description: '' });
  
  const [newHabit, setNewHabit] = useState({ name: '', goal: 30 });
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [editHabitData, setEditHabitData] = useState({ name: '', goal: 30 });
  const [habitDatePicker, setHabitDatePicker] = useState<string | null>(null);
  const [selectedHabitDate, setSelectedHabitDate] = useState('');
  
  const [newNote, setNewNote] = useState('');
  const [newShoppingItem, setNewShoppingItem] = useState('');

  const thisWeekStart = startOfWeek(today);
  const thisWeekEnd = endOfWeek(today);

  const thisWeekEvents = monthData.events.filter(event =>
    isWithinInterval(new Date(event.date), { start: thisWeekStart, end: thisWeekEnd }) && !event.completed
  );

  const todayActivities = monthData.dailyActivities.filter(activity =>
    isSameDay(new Date(activity.date), today)
  ).sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  const convertTo12Hour = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleEditActivity = (activityId: string) => {
    const activity = monthData.dailyActivities.find(a => a.id === activityId);
    if (activity) {
      setEditActivityData({
        title: activity.title,
        time: activity.time || '',
        description: activity.description || '',
      });
      setEditingActivity(activityId);
    }
  };

  const handleSaveActivity = () => {
    if (editingActivity) {
      updateDailyActivity(month, currentYear, editingActivity, editActivityData);
      setEditingActivity(null);
      toast({
        title: "Activity updated",
        description: "Your activity has been updated successfully.",
      });
    }
  };

  const handleEditHabit = (habitId: string) => {
    const habit = monthData.habits.find(h => h.id === habitId);
    if (habit) {
      setEditHabitData({
        name: habit.name,
        goal: habit.goal,
      });
      setEditingHabit(habitId);
    }
  };

  const handleSaveHabit = () => {
    if (editingHabit) {
      updateHabit(month, currentYear, editingHabit, editHabitData);
      setEditingHabit(null);
      toast({
        title: "Habit updated",
        description: "Your habit has been updated successfully.",
      });
    }
  };

  const handleLogHabitForDate = (habitId: string) => {
    if (selectedHabitDate) {
      const date = new Date(selectedHabitDate + 'T12:00:00');
      toggleHabitDay(month, currentYear, habitId, date);
      setHabitDatePicker(null);
      setSelectedHabitDate('');
      toast({
        title: "Habit logged!",
        description: `Habit marked for ${format(date, 'MMM d, yyyy')}`,
      });
    }
  };

  const handleNewDay = () => {
    clearAllDailyActivities(month, currentYear);
    toast({
      title: "New day started! ✨",
      description: "All activities have been cleared.",
    });
  };

  const handleAddEvent = (event: { title: string; time: string; description: string; date: Date }) => {
    addEvent(month, currentYear, event);
    toast({
      title: "Event added! 📅",
      description: "Your event has been added to the calendar.",
    });
  };

  const handleToggleEventComplete = (eventId: string) => {
    toggleEventComplete(month, currentYear, eventId);
  };

  const handleToggleActivityComplete = (activityId: string) => {
    toggleDailyActivityComplete(month, currentYear, activityId);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-coquette-brown-50 via-coquette-pink-50 to-white">
        <AppSidebar />
        <SidebarInset className="flex-1 w-full min-w-0">
          <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-coquette-brown-200 bg-white/80 backdrop-blur-sm px-6 py-4">
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/planner')}
              className="text-coquette-brown-500 hover:bg-coquette-brown-100 text-xs sm:text-sm px-2 sm:px-3"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <h1 className="text-lg sm:text-2xl font-bold text-coquette-brown-600">{months[month]}</h1>
          </header>

          <main className="flex-1 overflow-auto p-3 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
              {/* Calendar and This Week's Priority */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600">Monthly Calendar</CardTitle>
                    <p className="text-sm text-coquette-brown-500">Click any day to add an event</p>
                  </CardHeader>
                  <CardContent>
                    <CustomCalendar
                      month={month}
                      year={currentYear}
                      events={monthData.events}
                      onAddEvent={handleAddEvent}
                      onDeleteEvent={(eventId) => deleteEvent(month, currentYear, eventId)}
                    />
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600">This Week's Priority</CardTitle>
                    <p className="text-sm text-coquette-brown-500">Check off completed events</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {thisWeekEvents.length > 0 ? (
                        thisWeekEvents.map(event => (
                          <div key={event.id} className="p-4 bg-gradient-to-r from-coquette-pink-100 to-coquette-brown-100 rounded-lg border border-coquette-brown-200">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={event.completed || false}
                                onCheckedChange={() => handleToggleEventComplete(event.id)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-coquette-brown-600">{event.title}</h4>
                                <p className="text-sm text-coquette-brown-500">
                                  {format(new Date(event.date), 'EEEE, MMM d')}
                                  {event.time && ` at ${convertTo12Hour(event.time)}`}
                                </p>
                                {event.description && (
                                  <p className="text-sm text-coquette-brown-500 mt-1">{event.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-coquette-brown-400 py-8">No events this week</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Schedule */}
              <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-coquette-brown-600 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Today's Schedule - {format(today, 'MMMM d, yyyy')}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleNewDay}
                      className="border-coquette-brown-300 text-coquette-brown-600 hover:bg-coquette-brown-100"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      New Day
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Activity
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-coquette-brown-600">Add Today's Activity</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Input
                              placeholder="Activity title"
                              value={newActivity.title}
                              onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                              className="border-coquette-brown-200"
                            />
                          </div>
                          <div>
                            <Input
                              type="time"
                              value={newActivity.time}
                              onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                              className="border-coquette-brown-200"
                            />
                          </div>
                          <div>
                            <Textarea
                              placeholder="Description (optional)"
                              value={newActivity.description}
                              onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                              className="border-coquette-brown-200"
                            />
                          </div>
                          <Button
                            onClick={() => {
                              if (newActivity.title) {
                                addDailyActivity(month, currentYear, {
                                  title: newActivity.title,
                                  time: newActivity.time,
                                  description: newActivity.description,
                                  date: today,
                                });
                                setNewActivity({ title: '', time: '', description: '' });
                                toast({
                                  title: "Activity added",
                                  description: "Your activity has been added to today's schedule.",
                                });
                              }
                            }}
                            className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                          >
                            Add Activity
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {todayActivities.length > 0 ? (
                      todayActivities.map(activity => (
                        <div
                          key={activity.id}
                          className={`p-4 rounded-lg border transition-all ${
                            activity.completed
                              ? 'border-green-300 bg-green-50'
                              : 'border-coquette-brown-200 bg-gradient-to-r from-coquette-pink-50 to-white hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <Checkbox
                                checked={activity.completed || false}
                                onCheckedChange={() => handleToggleActivityComplete(activity.id)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  {activity.time && (
                                    <span className={`text-lg font-bold ${activity.completed ? 'text-green-600 line-through' : 'text-coquette-pink-400'}`}>
                                      {convertTo12Hour(activity.time)}
                                    </span>
                                  )}
                                  <div>
                                    <p className={`font-semibold ${activity.completed ? 'text-green-600 line-through' : 'text-coquette-brown-600'}`}>
                                      {activity.title}
                                    </p>
                                    {activity.description && (
                                      <p className={`text-sm mt-1 ${activity.completed ? 'text-green-500 line-through' : 'text-coquette-brown-500'}`}>
                                        {activity.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Dialog open={editingActivity === activity.id} onOpenChange={(open) => !open && setEditingActivity(null)}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditActivity(activity.id)}
                                    className="text-coquette-brown-500 hover:bg-coquette-brown-100"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle className="text-coquette-brown-600">Edit Activity</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Input
                                        placeholder="Activity title"
                                        value={editActivityData.title}
                                        onChange={(e) => setEditActivityData({ ...editActivityData, title: e.target.value })}
                                        className="border-coquette-brown-200"
                                      />
                                    </div>
                                    <div>
                                      <Input
                                        type="time"
                                        value={editActivityData.time}
                                        onChange={(e) => setEditActivityData({ ...editActivityData, time: e.target.value })}
                                        className="border-coquette-brown-200"
                                      />
                                    </div>
                                    <div>
                                      <Textarea
                                        placeholder="Description (optional)"
                                        value={editActivityData.description}
                                        onChange={(e) => setEditActivityData({ ...editActivityData, description: e.target.value })}
                                        className="border-coquette-brown-200"
                                      />
                                    </div>
                                    <Button onClick={handleSaveActivity} className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                                      Save Changes
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  deleteDailyActivity(month, currentYear, activity.id);
                                  toast({
                                    title: "Activity deleted",
                                    description: "The activity has been removed.",
                                  });
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-coquette-brown-400 py-8">No activities scheduled for today</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Habits Tracker with Date Picker */}
              <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-coquette-brown-600">Habits Tracker</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Habit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-coquette-brown-600">Add New Habit</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Input
                            placeholder="Habit name"
                            value={newHabit.name}
                            onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                            className="border-coquette-brown-200"
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            placeholder="Goal (days)"
                            value={newHabit.goal}
                            onChange={(e) => setNewHabit({ ...newHabit, goal: parseInt(e.target.value) || 30 })}
                            className="border-coquette-brown-200"
                          />
                        </div>
                        <Button
                          onClick={() => {
                            if (newHabit.name) {
                              addHabit(month, currentYear, newHabit);
                              setNewHabit({ name: '', goal: 30 });
                              toast({
                                title: "Habit added",
                                description: "Your habit has been added to the tracker.",
                              });
                            }
                          }}
                          className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                        >
                          Add Habit
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthData.habits.map(habit => {
                      const completedDays = habit.completedDays.length;
                      const progress = (completedDays / habit.goal) * 100;
                      const isCompletedToday = habit.completedDays.some(d => 
                        new Date(d).toDateString() === today.toDateString()
                      );

                      return (
                        <Card key={habit.id} className="border-coquette-brown-200 bg-gradient-to-r from-coquette-pink-50 to-white">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-coquette-brown-600">{habit.name}</h4>
                                <p className="text-sm text-coquette-brown-500">
                                  {completedDays} / {habit.goal} days completed
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Dialog open={editingHabit === habit.id} onOpenChange={(open) => !open && setEditingHabit(null)}>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditHabit(habit.id)}
                                      className="text-coquette-brown-500 hover:bg-coquette-brown-100"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle className="text-coquette-brown-600">Edit Habit</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Input
                                          placeholder="Habit name"
                                          value={editHabitData.name}
                                          onChange={(e) => setEditHabitData({ ...editHabitData, name: e.target.value })}
                                          className="border-coquette-brown-200"
                                        />
                                      </div>
                                      <div>
                                        <Input
                                          type="number"
                                          placeholder="Goal (days)"
                                          value={editHabitData.goal}
                                          onChange={(e) => setEditHabitData({ ...editHabitData, goal: parseInt(e.target.value) || 30 })}
                                          className="border-coquette-brown-200"
                                        />
                                      </div>
                                      <Button onClick={handleSaveHabit} className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                                        Save Changes
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    deleteHabit(month, currentYear, habit.id);
                                    toast({
                                      title: "Habit deleted",
                                      description: "The habit has been removed.",
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <Progress value={progress} className="h-2 mb-3" />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => toggleHabitDay(month, currentYear, habit.id, today)}
                                className={`flex-1 ${
                                  isCompletedToday
                                    ? 'bg-green-500 hover:bg-green-600'
                                    : 'bg-coquette-pink-300 hover:bg-coquette-pink-400'
                                } text-white`}
                              >
                                {isCompletedToday ? '✓ Completed Today' : 'Mark as Done Today'}
                              </Button>
                              <Dialog open={habitDatePicker === habit.id} onOpenChange={(open) => {
                                if (!open) {
                                  setHabitDatePicker(null);
                                  setSelectedHabitDate('');
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setHabitDatePicker(habit.id)}
                                    className="border-coquette-brown-300 text-coquette-brown-600 hover:bg-coquette-brown-100"
                                  >
                                    <CalendarIcon className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle className="text-coquette-brown-600">Log for Previous Date</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium text-coquette-brown-600 mb-2 block">
                                        Select Date
                                      </label>
                                      <Input
                                        type="date"
                                        value={selectedHabitDate}
                                        onChange={(e) => setSelectedHabitDate(e.target.value)}
                                        className="border-coquette-brown-200"
                                      />
                                    </div>
                                    <Button
                                      onClick={() => handleLogHabitForDate(habit.id)}
                                      disabled={!selectedHabitDate}
                                      className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600 disabled:opacity-50"
                                    >
                                      Log Habit
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {monthData.habits.length === 0 && (
                      <p className="text-center text-coquette-brown-400 py-8">No habits yet. Add one to start tracking!</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notes and Shopping List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      {monthData.notes.map(note => (
                        <div key={note.id} className="p-3 bg-gradient-to-r from-coquette-pink-50 to-white rounded-lg border border-coquette-brown-200">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={note.completed}
                              onCheckedChange={() => toggleNoteComplete(month, currentYear, note.id)}
                              className="mt-1"
                            />
                            <p className={`flex-1 text-sm ${note.completed ? 'line-through text-coquette-brown-400' : 'text-coquette-brown-600'}`}>
                              {note.content}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteNote(month, currentYear, note.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newNote.trim()) {
                            addNote(month, currentYear, newNote);
                            setNewNote('');
                          }
                        }}
                        className="border-coquette-brown-200"
                      />
                      <Button
                        onClick={() => {
                          if (newNote.trim()) {
                            addNote(month, currentYear, newNote);
                            setNewNote('');
                          }
                        }}
                        className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600">Shopping List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      {monthData.shoppingList.map(item => (
                        <div key={item.id} className="p-3 bg-gradient-to-r from-coquette-pink-50 to-white rounded-lg border border-coquette-brown-200">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={() => toggleShoppingItem(month, currentYear, item.id)}
                            />
                            <p className={`flex-1 text-sm ${item.completed ? 'line-through text-coquette-brown-400' : 'text-coquette-brown-600'}`}>
                              {item.name}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteShoppingItem(month, currentYear, item.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add an item..."
                        value={newShoppingItem}
                        onChange={(e) => setNewShoppingItem(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newShoppingItem.trim()) {
                            addShoppingItem(month, currentYear, newShoppingItem);
                            setNewShoppingItem('');
                          }
                        }}
                        className="border-coquette-brown-200"
                      />
                      <Button
                        onClick={() => {
                          if (newShoppingItem.trim()) {
                            addShoppingItem(month, currentYear, newShoppingItem);
                            setNewShoppingItem('');
                          }
                        }}
                        className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MonthView;