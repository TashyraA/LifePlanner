import React, { useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import { useFitness } from '../contexts/FitnessContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Dumbbell, Plus, Trash2, Check, TrendingDown, Camera, Link as LinkIcon, Play, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { CurvedArches } from '../components/PageHeaderImages';
import { validateAndCompressImage } from '../lib/imageCompression';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const FitnessTracker = () => {
  const {
    workouts,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    toggleWorkoutCompleteForDay,
    weightEntries,
    addWeightEntry,
    deleteWeightEntry,
    progressPhotos,
    addProgressPhoto,
    deleteProgressPhoto,
    headerImages,
    updateHeaderImage,
  } = useFitness();

  const { toast } = useToast();
  const [isAddWorkoutOpen, setIsAddWorkoutOpen] = useState(false);
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [isEditWorkoutOpen, setIsEditWorkoutOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<string | null>(null);
  const [editWorkoutData, setEditWorkoutData] = useState({
    name: '',
    days: [] as string[],
    exercises: '',
    duration: '',
    videoUrl: '',
    image: '',
  });

  const [newWorkout, setNewWorkout] = useState({
    name: '',
    days: [] as string[],
    exercises: '',
    duration: '',
    videoUrl: '',
    image: '',
  });

  const [newWeight, setNewWeight] = useState('');
  const [newPhoto, setNewPhoto] = useState({ url: '', notes: '' });
  const [loadingVideo, setLoadingVideo] = useState(false);

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const fetchYouTubeInfo = async (url: string) => {
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setLoadingVideo(true);
    
    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    
    setNewWorkout(prev => ({
      ...prev,
      videoUrl: embedUrl,
      image: thumbnail,
    }));

    setLoadingVideo(false);
    
    toast({
      title: "Video loaded! 🎥",
      description: "YouTube video has been added to your workout",
    });
  };

  const handleWorkoutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await validateAndCompressImage(file);
        setNewWorkout({ ...newWorkout, image: compressedImage });
      } catch (error) {
        console.error('Error compressing image:', error);
        toast({
          title: 'Error',
          description: 'Failed to process image. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleProgressPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await validateAndCompressImage(file);
        setNewPhoto({ ...newPhoto, url: compressedImage });
      } catch (error) {
        console.error('Error compressing image:', error);
        toast({
          title: 'Error',
          description: 'Failed to process image. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const toggleDay = (day: string) => {
    setNewWorkout(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleAddWorkout = () => {
    if (newWorkout.name && newWorkout.exercises && newWorkout.days.length > 0) {
      addWorkout({
        name: newWorkout.name,
        days: newWorkout.days,
        exercises: newWorkout.exercises.split('\n').filter(e => e.trim()),
        duration: parseInt(newWorkout.duration) || 30,
        caloriesBurned: 0,
        image: newWorkout.image || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
        videoUrl: newWorkout.videoUrl,
      });
      setNewWorkout({ name: '', days: [], exercises: '', duration: '', videoUrl: '', image: '' });
      setIsAddWorkoutOpen(false);
      toast({
        title: "Workout added! 💪",
        description: `Your workout has been added to ${newWorkout.days.length} day(s).`,
      });
    } else {
      toast({
        title: "Missing information",
        description: "Please fill in workout name, exercises, and select at least one day.",
        variant: "destructive",
      });
    }
  };

  const handleAddWeight = () => {
    if (newWeight) {
      addWeightEntry(parseFloat(newWeight));
      setNewWeight('');
      toast({
        title: "Weight logged! 📊",
        description: "Your weight has been recorded.",
      });
    }
  };

  const handleAddPhoto = () => {
    if (newPhoto.url) {
      addProgressPhoto(newPhoto.url, newPhoto.notes);
      setNewPhoto({ url: '', notes: '' });
      setIsAddPhotoOpen(false);
      toast({
        title: "Photo added! 📸",
        description: "Your progress photo has been saved.",
      });
    }
  };

  const handleEditWorkout = (workoutId: string) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (workout) {
      setEditWorkoutData({
        name: workout.name,
        days: workout.days,
        exercises: workout.exercises.join('\n'),
        duration: workout.duration.toString(),
        videoUrl: workout.videoUrl || '',
        image: workout.image || '',
      });
      setEditingWorkout(workoutId);
      setIsEditWorkoutOpen(true);
    }
  };

  const toggleEditDay = (day: string) => {
    setEditWorkoutData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleEditWorkoutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await validateAndCompressImage(file);
        setEditWorkoutData({ ...editWorkoutData, image: compressedImage });
      } catch (error) {
        console.error('Error compressing image:', error);
        toast({
          title: 'Error',
          description: 'Failed to process image. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleSaveWorkout = () => {
    if (editingWorkout && editWorkoutData.name && editWorkoutData.exercises && editWorkoutData.days.length > 0) {
      updateWorkout(editingWorkout, {
        name: editWorkoutData.name,
        days: editWorkoutData.days,
        exercises: editWorkoutData.exercises.split('\n').filter(e => e.trim()),
        duration: parseInt(editWorkoutData.duration) || 30,
        image: editWorkoutData.image || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
        videoUrl: editWorkoutData.videoUrl,
      });
      setEditingWorkout(null);
      setIsEditWorkoutOpen(false);
      toast({
        title: "Workout updated! ✓",
        description: "Your workout has been updated successfully.",
      });
    } else {
      toast({
        title: "Missing information",
        description: "Please fill in workout name, exercises, and select at least one day.",
        variant: "destructive",
      });
    }
  };

  const weightData = weightEntries
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10)
    .map(entry => ({
      date: format(new Date(entry.date), 'MMM d'),
      weight: entry.weight,
    }));

  const getWorkoutsForDay = (day: string) => {
    return workouts.filter(w => w.days.includes(day));
  };

  const isWorkoutCompletedForDay = (workout: any, day: string) => {
    return workout.completedDays?.includes(day) || false;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-coquette-brown-50 via-coquette-pink-50 to-white">
        <AppSidebar />
        <SidebarInset className="flex-1 w-full min-w-0">
          <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-coquette-brown-200 bg-white/80 backdrop-blur-sm px-6 py-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2 flex-1">
              <Dumbbell className="h-6 w-6 text-coquette-pink-400" />
              <h1 className="text-2xl font-bold text-coquette-brown-600">Fitness Tracker</h1>
            </div>
            <Dialog open={isAddWorkoutOpen} onOpenChange={setIsAddWorkoutOpen}>
              <DialogTrigger asChild>
                <Button className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Workout
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-coquette-brown-600">Add New Workout</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-coquette-brown-600">Workout Name</Label>
                    <Input
                      value={newWorkout.name}
                      onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })}
                      placeholder="e.g., Upper Body Strength"
                      className="border-coquette-brown-200"
                    />
                  </div>

                  <div>
                    <Label className="text-coquette-brown-600">Select Days (multiple)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                      {daysOfWeek.map(day => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={day}
                            checked={newWorkout.days.includes(day)}
                            onCheckedChange={() => toggleDay(day)}
                            className="border-coquette-brown-300"
                          />
                          <label
                            htmlFor={day}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-coquette-brown-600 cursor-pointer"
                          >
                            {day.slice(0, 3)}
                          </label>
                        </div>
                      ))}
                    </div>
                    {newWorkout.days.length > 0 && (
                      <p className="text-xs text-coquette-brown-500 mt-2">
                        Selected: {newWorkout.days.join(', ')}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-coquette-brown-600">YouTube Video URL (optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newWorkout.videoUrl}
                        onChange={(e) => setNewWorkout({ ...newWorkout, videoUrl: e.target.value })}
                        placeholder="https://youtube.com/watch?v=..."
                        className="border-coquette-brown-200"
                      />
                      <Button
                        type="button"
                        onClick={() => fetchYouTubeInfo(newWorkout.videoUrl)}
                        disabled={loadingVideo}
                        className="bg-coquette-brown-300 hover:bg-coquette-brown-400 text-white"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-coquette-brown-400 mt-1">
                      Paste a YouTube URL to embed the video
                    </p>
                  </div>

                  {newWorkout.image && (
                    <div className="relative">
                      <img
                        src={newWorkout.image}
                        alt="Workout preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {newWorkout.videoUrl && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                          <Play className="h-16 w-16 text-white" />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <Label className="text-coquette-brown-600">Or Upload Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleWorkoutImageUpload}
                      className="border-coquette-brown-200"
                    />
                  </div>

                  <div>
                    <Label className="text-coquette-brown-600">Exercises (one per line)</Label>
                    <Textarea
                      value={newWorkout.exercises}
                      onChange={(e) => setNewWorkout({ ...newWorkout, exercises: e.target.value })}
                      placeholder="Push-ups x 15&#10;Squats x 20&#10;Plank 60 seconds"
                      className="border-coquette-brown-200"
                      rows={5}
                    />
                  </div>

                  <div>
                    <Label className="text-coquette-brown-600">Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={newWorkout.duration}
                      onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })}
                      placeholder="30"
                      className="border-coquette-brown-200"
                    />
                  </div>

                  <Button onClick={handleAddWorkout} className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                    Add Workout
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Workout Dialog */}
            <Dialog open={isEditWorkoutOpen} onOpenChange={setIsEditWorkoutOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-coquette-brown-600">Edit Workout</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-coquette-brown-600">Workout Name</Label>
                    <Input
                      value={editWorkoutData.name}
                      onChange={(e) => setEditWorkoutData({ ...editWorkoutData, name: e.target.value })}
                      placeholder="e.g., Upper Body Strength"
                      className="border-coquette-brown-200"
                    />
                  </div>

                  <div>
                    <Label className="text-coquette-brown-600">Select Days (multiple)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                      {daysOfWeek.map(day => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-${day}`}
                            checked={editWorkoutData.days.includes(day)}
                            onCheckedChange={() => toggleEditDay(day)}
                            className="border-coquette-brown-300"
                          />
                          <label
                            htmlFor={`edit-${day}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-coquette-brown-600 cursor-pointer"
                          >
                            {day.slice(0, 3)}
                          </label>
                        </div>
                      ))}
                    </div>
                    {editWorkoutData.days.length > 0 && (
                      <p className="text-xs text-coquette-brown-500 mt-2">
                        Selected: {editWorkoutData.days.join(', ')}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-coquette-brown-600">YouTube Video URL (optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={editWorkoutData.videoUrl}
                        onChange={(e) => setEditWorkoutData({ ...editWorkoutData, videoUrl: e.target.value })}
                        placeholder="https://youtube.com/watch?v=..."
                        className="border-coquette-brown-200"
                      />
                    </div>
                  </div>

                  {editWorkoutData.image && (
                    <div className="relative">
                      <img
                        src={editWorkoutData.image}
                        alt="Workout preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {editWorkoutData.videoUrl && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                          <Play className="h-16 w-16 text-white" />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <Label className="text-coquette-brown-600">Upload New Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleEditWorkoutImageUpload}
                      className="border-coquette-brown-200"
                    />
                  </div>

                  <div>
                    <Label className="text-coquette-brown-600">Exercises (one per line)</Label>
                    <Textarea
                      value={editWorkoutData.exercises}
                      onChange={(e) => setEditWorkoutData({ ...editWorkoutData, exercises: e.target.value })}
                      placeholder="Push-ups x 15&#10;Squats x 20&#10;Plank 60 seconds"
                      className="border-coquette-brown-200"
                      rows={5}
                    />
                  </div>

                  <div>
                    <Label className="text-coquette-brown-600">Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={editWorkoutData.duration}
                      onChange={(e) => setEditWorkoutData({ ...editWorkoutData, duration: e.target.value })}
                      placeholder="30"
                      className="border-coquette-brown-200"
                    />
                  </div>

                  <Button onClick={handleSaveWorkout} className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Weight Tracking Section - Top */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600 flex items-center gap-2">
                      <TrendingDown className="h-5 w-5" />
                      Current Weight
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Weight (lbs)"
                          value={newWeight}
                          onChange={(e) => setNewWeight(e.target.value)}
                          className="border-coquette-brown-200"
                        />
                        <Button onClick={handleAddWeight} className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                          Log
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {weightEntries.slice(0, 5).map(entry => (
                          <div key={entry.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-coquette-pink-50 to-white rounded-lg border border-coquette-brown-200">
                            <div>
                              <p className="font-semibold text-coquette-brown-600">{entry.weight} lbs</p>
                              <p className="text-xs text-coquette-brown-500">{format(new Date(entry.date), 'MMM d, yyyy')}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteWeightEntry(entry.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600">Weight Progress Chart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {weightData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={weightData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f5e6d3" />
                          <XAxis dataKey="date" stroke="#9c7c5f" />
                          <YAxis stroke="#9c7c5f" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #d4c4b0',
                              borderRadius: '8px'
                            }}
                          />
                          <Line type="monotone" dataKey="weight" stroke="#f4c2c2" strokeWidth={3} dot={{ fill: '#f4c2c2', r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-coquette-brown-400">
                        <p>No weight data yet. Start logging to see your progress!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Weekly Workout Plan - Horizontal Scroll */}
              <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-coquette-brown-600">Weekly Workout Plan</CardTitle>
                  <p className="text-sm text-coquette-brown-500">Scroll horizontally to view all days</p>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                    {daysOfWeek.map(day => {
                      const dayWorkouts = getWorkoutsForDay(day);
                      return (
                        <div key={day} className="flex-shrink-0 w-80 snap-start">
                          <div className="border-2 border-coquette-brown-200 rounded-lg p-4 bg-gradient-to-br from-white to-coquette-pink-50 h-full">
                            <h3 className="font-bold text-lg text-coquette-brown-600 mb-3 sticky top-0 bg-gradient-to-br from-white to-coquette-pink-50 pb-2">
                              {day}
                            </h3>
                            {dayWorkouts.length > 0 ? (
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {dayWorkouts.map(workout => {
                                  const isCompleted = isWorkoutCompletedForDay(workout, day);
                                  return (
                                    <Card key={workout.id} className="border-coquette-brown-200 bg-white shadow-sm">
                                      <CardContent className="p-3">
                                        <div className="space-y-3">
                                          <div className="relative">
                                            <img
                                              src={workout.image}
                                              alt={workout.name}
                                              className="w-full h-32 object-cover rounded-lg"
                                            />
                                            {workout.videoUrl && (
                                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                                                <Play className="h-10 w-10 text-white" />
                                              </div>
                                            )}
                                          </div>
                                          <div>
                                            <h4 className="font-semibold text-coquette-brown-600">{workout.name}</h4>
                                            <p className="text-sm text-coquette-brown-500">{workout.duration} minutes</p>
                                          </div>
                                          <ul className="space-y-1">
                                            {workout.exercises.map((exercise, idx) => (
                                              <li key={idx} className="text-xs text-coquette-brown-600 flex items-center gap-2">
                                                <span className="w-1 h-1 bg-coquette-pink-400 rounded-full" />
                                                {exercise}
                                              </li>
                                            ))}
                                          </ul>
                                          <div className="flex gap-1 pt-2">
                                            {workout.videoUrl && (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => window.open(workout.videoUrl, '_blank')}
                                                className="flex-1 text-coquette-pink-400 hover:bg-coquette-pink-100"
                                              >
                                                <Play className="h-4 w-4 mr-1" />
                                                Watch
                                              </Button>
                                            )}
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => toggleWorkoutCompleteForDay(workout.id, day)}
                                              className={`flex-1 ${isCompleted ? 'text-green-500 bg-green-50' : 'text-coquette-brown-400'}`}
                                            >
                                              <Check className="h-4 w-4 mr-1" />
                                              {isCompleted ? 'Done' : 'Mark'}
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleEditWorkout(workout.id)}
                                              className="text-coquette-brown-400 hover:text-coquette-brown-600 hover:bg-coquette-brown-50"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => deleteWorkout(workout.id)}
                                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="h-32 flex items-center justify-center">
                                <p className="text-sm text-coquette-brown-400 italic">Rest day</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Progress Photos - Bottom */}
              <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-coquette-brown-600 flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Progress Photos
                  </CardTitle>
                  <Dialog open={isAddPhotoOpen} onOpenChange={setIsAddPhotoOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Photo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-coquette-brown-600">Add Progress Photo</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-coquette-brown-600">Upload Photo</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleProgressPhotoUpload}
                            className="border-coquette-brown-200"
                          />
                        </div>
                        <div>
                          <Label className="text-coquette-brown-600">Or Image URL</Label>
                          <Input
                            type="url"
                            placeholder="https://..."
                            value={newPhoto.url}
                            onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })}
                            className="border-coquette-brown-200"
                          />
                        </div>
                        <div>
                          <Label className="text-coquette-brown-600">Notes (optional)</Label>
                          <Textarea
                            placeholder="How are you feeling?"
                            value={newPhoto.notes}
                            onChange={(e) => setNewPhoto({ ...newPhoto, notes: e.target.value })}
                            className="border-coquette-brown-200"
                          />
                        </div>
                        <Button onClick={handleAddPhoto} className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                          Add Photo
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {progressPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {progressPhotos.map(photo => (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.imageUrl}
                            alt="Progress"
                            className="w-full h-40 object-cover rounded-lg border-2 border-coquette-brown-200"
                          />
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center p-3">
                            <p className="text-white text-xs font-semibold mb-1">{format(new Date(photo.date), 'MMM d, yyyy')}</p>
                            {photo.notes && <p className="text-white text-xs text-center mb-2 line-clamp-2">{photo.notes}</p>}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteProgressPhoto(photo.id)}
                              className="text-red-500 hover:text-red-700 bg-white/90 hover:bg-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-coquette-brown-400">
                      <p>No progress photos yet. Add your first photo to track your journey!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default FitnessTracker;