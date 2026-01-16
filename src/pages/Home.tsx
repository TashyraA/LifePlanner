import React, { useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import { useFinance } from '../contexts/FinanceContext';
import { usePlanner } from '../contexts/PlannerContext';
import { useMeals } from '../contexts/MealContext';
import { useFitness } from '../contexts/FitnessContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Calendar, UtensilsCrossed, Dumbbell, Target, TrendingUp, Heart, Sparkles } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BorderImage } from '../components/PageHeaderImages';
import { storeImageInIndexedDB, retrieveImageFromIndexedDB } from '../lib/imageCompression';

const Home = () => {
  const [homeBorderImage, setHomeBorderImage] = React.useState<string>('');

  React.useEffect(() => {
    const loadBorderImage = async () => {
      const storedKey = localStorage.getItem('home_border_image');
      if (storedKey && !storedKey.startsWith('data:')) {
        const fromDB = await retrieveImageFromIndexedDB(storedKey);
        if (fromDB) setHomeBorderImage(fromDB);
      } else if (storedKey) {
        setHomeBorderImage(storedKey);
      }
    };
    loadBorderImage();
  }, []);

  const updateHomeBorderImage = async (image: string) => {
    if (!image) {
      setHomeBorderImage('');
      localStorage.removeItem('home_border_image');
      return;
    }
    
    if (image.startsWith('data:')) {
      const key = `home_border_${Date.now()}`;
      await storeImageInIndexedDB(key, image);
      localStorage.setItem('home_border_image', key);
      setHomeBorderImage(image);
    } else {
      setHomeBorderImage(image);
    }
  };

  const { currentBalance, savingsGoal, totalSavings, totalIncome } = useFinance();
  const { monthsData } = usePlanner();
  const { meals } = useMeals();
  const { weightEntries, workouts } = useFitness();

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthData = monthsData.find(m => m.month === currentMonth && m.year === currentYear);

  const thisWeekStart = startOfWeek(today);
  const thisWeekEnd = endOfWeek(today);

  const thisWeekEvents = monthData?.events.filter(event =>
    isWithinInterval(event.date, { start: thisWeekStart, end: thisWeekEnd }) && !event.completed
  ) || [];

  const todayMeals = meals.filter(m => m.day === format(today, 'EEEE'));
  const totalCaloriesToday = todayMeals.reduce((sum, m) => sum + m.calories, 0);

  const completedWorkouts = workouts.filter(w => (w.completedDays && w.completedDays.length > 0) || w.completed).length;
  const totalWorkouts = workouts.length;
  const workoutProgress = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

  const savingsProgress = savingsGoal > 0 ? (totalSavings / savingsGoal) * 100 : 0;

  const weightData = weightEntries
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-7)
    .map(entry => ({
      date: format(entry.date, 'MMM d'),
      weight: entry.weight,
    }));

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-coquette-brown-50 via-coquette-pink-50 to-white">
        <AppSidebar />
        <SidebarInset className="flex-1 w-full min-w-0">
          {/* Border Image */}
          <BorderImage
            image={homeBorderImage}
            onUpload={updateHomeBorderImage}
            onRemove={() => updateHomeBorderImage('')}
          />

          <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-coquette-brown-200 bg-white/80 backdrop-blur-sm px-6 py-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-coquette-pink-400" />
              <h1 className="text-2xl font-bold text-coquette-brown-600">Dashboard</h1>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Welcome Section */}
              <Card className="border-coquette-brown-200 bg-gradient-to-r from-coquette-pink-100 to-coquette-brown-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-coquette-brown-600 mb-2">
                        Welcome back! ✨
                      </h2>
                      <p className="text-coquette-brown-500">
                        {format(today, 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                    <Heart className="h-16 w-16 text-coquette-pink-400" fill="currentColor" />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-coquette-brown-600">Balance</CardTitle>
                    <DollarSign className="h-4 w-4 text-coquette-pink-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-coquette-brown-600">${currentBalance.toFixed(2)}</div>
                    <p className="text-xs text-coquette-brown-500 mt-1">Current balance</p>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-coquette-brown-600">This Week</CardTitle>
                    <Calendar className="h-4 w-4 text-coquette-pink-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-coquette-brown-600">{thisWeekEvents.length}</div>
                    <p className="text-xs text-coquette-brown-500 mt-1">Events scheduled</p>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-coquette-brown-600">Today's Meals</CardTitle>
                    <UtensilsCrossed className="h-4 w-4 text-coquette-pink-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-coquette-brown-600">{totalCaloriesToday}</div>
                    <p className="text-xs text-coquette-brown-500 mt-1">Calories planned</p>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-coquette-brown-600">Workouts</CardTitle>
                    <Dumbbell className="h-4 w-4 text-coquette-pink-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-coquette-brown-600">{completedWorkouts}/{totalWorkouts}</div>
                    <p className="text-xs text-coquette-brown-500 mt-1">Completed this week</p>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Savings Goal Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-coquette-brown-500">Current Savings</span>
                        <span className="text-lg font-bold text-coquette-brown-600">${totalSavings.toFixed(2)}</span>
                      </div>
                      <Progress value={savingsProgress} className="h-3" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-coquette-brown-500">Goal</span>
                        <span className="text-sm font-semibold text-coquette-brown-600">${savingsGoal.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-coquette-brown-400 text-center">
                        {savingsProgress.toFixed(0)}% of your goal achieved
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600 flex items-center gap-2">
                      <Dumbbell className="h-5 w-5" />
                      Workout Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-coquette-brown-500">Completed</span>
                        <span className="text-lg font-bold text-coquette-brown-600">{completedWorkouts} workouts</span>
                      </div>
                      <Progress value={workoutProgress} className="h-3" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-coquette-brown-500">Total Planned</span>
                        <span className="text-sm font-semibold text-coquette-brown-600">{totalWorkouts} workouts</span>
                      </div>
                      <p className="text-xs text-coquette-brown-400 text-center">
                        {workoutProgress.toFixed(0)}% of weekly workouts completed
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Weight Tracking Chart */}
              {weightData.length > 0 && (
                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Weight Progress (Last 7 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={weightData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f5e6d3" />
                        <XAxis dataKey="date" stroke="#9c7c5f" />
                        <YAxis stroke="#9c7c5f" />
                        <Tooltip />
                        <Line type="monotone" dataKey="weight" stroke="#f4c2c2" strokeWidth={2} dot={{ fill: '#f4c2c2' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* This Week's Events */}
              <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-coquette-brown-600 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    This Week's Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {thisWeekEvents.length > 0 ? (
                      thisWeekEvents.slice(0, 5).map(event => (
                        <div key={event.id} className="p-3 bg-gradient-to-r from-coquette-pink-50 to-coquette-brown-50 rounded-lg border border-coquette-brown-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-coquette-brown-600">{event.title}</p>
                              <p className="text-sm text-coquette-brown-500">
                                {format(event.date, 'EEEE, MMM d')}
                                {event.time && ` at ${event.time}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-coquette-brown-400 py-8">No events scheduled this week</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Home;