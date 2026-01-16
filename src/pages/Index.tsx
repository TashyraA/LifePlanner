import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { DollarSign, Calendar, Dumbbell, UtensilsCrossed, Heart, Sparkles, GraduationCap, TrendingUp, CheckCircle2, Target } from 'lucide-react';
import { usePlanner } from '../contexts/PlannerContext';
import { useFinance } from '../contexts/FinanceContext';
import { useFitness } from '../contexts/FitnessContext';
import { useMeals } from '../contexts/MealContext';
import { useCollege } from '../contexts/CollegeContext';
import { Progress } from '@/components/ui/progress';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

const Index = () => {
  const { monthsData } = usePlanner();
  const { totalIncome, totalExpenses, currentBalance, savingsGoal, totalSavings } = useFinance();
  const { workouts } = useFitness();
  const { meals } = useMeals();
  const { assignments } = useCollege();

  // Get current month data
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentMonthData = monthsData.find(m => m.month === currentMonth && m.year === currentYear);

  // This week's events
  const thisWeekStart = startOfWeek(today);
  const thisWeekEnd = endOfWeek(today);
  const thisWeekEvents = currentMonthData?.events.filter(event =>
    isWithinInterval(new Date(event.date), { start: thisWeekStart, end: thisWeekEnd }) && !event.completed
  ) || [];

  // Habits progress
  const totalHabits = currentMonthData?.habits.length || 0;
  const habitsCompletedToday = currentMonthData?.habits.filter(h =>
    h.completedDays.some(d => new Date(d).toDateString() === today.toDateString())
  ).length || 0;

  // Finance stats
  const savingsProgress = savingsGoal > 0 ? (totalSavings / savingsGoal) * 100 : 0;

  // Fitness stats
  const totalWorkouts = workouts.length;
  const totalCaloriesBurned = workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);

  // Meal stats
  const totalMeals = meals.length;
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);

  // College stats
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(a => a.status === 'completed').length;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-coquette-brown-50 via-coquette-pink-50 to-white">
        <AppSidebar />
        <SidebarInset className="flex-1 w-full min-w-0">
          <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-coquette-brown-200 bg-white/80 backdrop-blur-sm px-6 py-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-coquette-pink-400" fill="currentColor" />
              <h1 className="text-2xl font-bold text-coquette-brown-600">My Dashboard</h1>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Welcome Section */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-coquette-pink-300 to-coquette-pink-400 rounded-full mb-4">
                  <Heart className="text-white" size={40} fill="white" />
                </div>
                <h1 className="text-4xl font-bold text-coquette-brown-600 mb-2">
                  Welcome Back!
                </h1>
                <p className="text-xl text-coquette-brown-500 flex items-center justify-center gap-2">
                  <Sparkles size={20} />
                  Here's your life at a glance
                  <Sparkles size={20} />
                </p>
              </div>

              {/* Quick Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-coquette-brown-200 bg-gradient-to-br from-white to-coquette-pink-100">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600 text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      This Week's Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-coquette-brown-600">{thisWeekEvents.length}</p>
                    <p className="text-xs text-coquette-brown-500 mt-1">Upcoming events</p>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-gradient-to-br from-white to-green-100">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600 text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Today's Habits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">{habitsCompletedToday}/{totalHabits}</p>
                    <p className="text-xs text-coquette-brown-500 mt-1">Completed today</p>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-gradient-to-br from-white to-coquette-brown-100">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600 text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Current Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-coquette-brown-600">${currentBalance.toFixed(0)}</p>
                    <p className="text-xs text-coquette-brown-500 mt-1">Available funds</p>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-gradient-to-br from-white to-coquette-pink-100">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600 text-sm flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Savings Goal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-coquette-brown-600">{savingsProgress.toFixed(0)}%</p>
                    <Progress value={savingsProgress} className="h-2 mt-2" />
                  </CardContent>
                </Card>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link to="/college">
                  <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                    <CardHeader>
                      <div className="w-12 h-12 bg-gradient-to-br from-coquette-pink-200 to-coquette-pink-300 rounded-full flex items-center justify-center mb-2">
                        <GraduationCap className="h-6 w-6 text-coquette-brown-600" />
                      </div>
                      <CardTitle className="text-coquette-brown-600">College Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-coquette-brown-500 mb-4">
                        Track assignments, manage courses, and stay on top of your academic life.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-coquette-brown-500">Total assignments:</span>
                          <span className="font-semibold text-coquette-brown-600">{totalAssignments}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-coquette-brown-500">Completed:</span>
                          <span className="font-semibold text-green-600">{completedAssignments}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* ... rest of the feature cards remain the same ... */}
                <Link to="/finance">
                  <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                    <CardHeader>
                      <div className="w-12 h-12 bg-gradient-to-br from-coquette-pink-200 to-coquette-pink-300 rounded-full flex items-center justify-center mb-2">
                        <DollarSign className="h-6 w-6 text-coquette-brown-600" />
                      </div>
                      <CardTitle className="text-coquette-brown-600">Finance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-coquette-brown-500 mb-4">
                        Track your income, expenses, and savings goals. Manage your financial health with ease.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-coquette-brown-500">Monthly Income:</span>
                          <span className="font-semibold text-green-600">${totalIncome.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-coquette-brown-500">Monthly Expenses:</span>
                          <span className="font-semibold text-red-600">${totalExpenses.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-coquette-brown-500">Savings:</span>
                          <span className="font-semibold text-coquette-brown-600">${totalSavings.toFixed(0)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/planner">
                  <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                    <CardHeader>
                      <div className="w-12 h-12 bg-gradient-to-br from-coquette-brown-200 to-coquette-brown-300 rounded-full flex items-center justify-center mb-2">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-coquette-brown-600">Planner</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-coquette-brown-500 mb-4">
                        Plan your months with calendars, habits, notes, and shopping lists all in one place.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-coquette-brown-500">Events this week:</span>
                          <span className="font-semibold text-coquette-brown-600">{thisWeekEvents.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-coquette-brown-500">Active habits:</span>
                          <span className="font-semibold text-coquette-brown-600">{totalHabits}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-coquette-brown-500">Completed today:</span>
                          <span className="font-semibold text-green-600">{habitsCompletedToday}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/fitness">
                  <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                    <CardHeader>
                      <div className="w-12 h-12 bg-gradient-to-br from-coquette-pink-200 to-coquette-pink-300 rounded-full flex items-center justify-center mb-2">
                        <Dumbbell className="h-6 w-6 text-coquette-brown-600" />
                      </div>
                      <CardTitle className="text-coquette-brown-600">Fitness</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-coquette-brown-500 mb-4">
                        Create workout plans, track progress photos, and stay motivated on your fitness journey.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-coquette-brown-500">Workouts planned:</span>
                          <span className="font-semibold text-coquette-brown-600">{totalWorkouts}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-coquette-brown-500">Calories burned:</span>
                          <span className="font-semibold text-coquette-brown-600">{totalCaloriesBurned}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/meals">
                  <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                    <CardHeader>
                      <div className="w-12 h-12 bg-gradient-to-br from-coquette-brown-200 to-coquette-brown-300 rounded-full flex items-center justify-center mb-2">
                        <UtensilsCrossed className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-coquette-brown-600">Meals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-coquette-brown-500 mb-4">
                        Plan your weekly meals, track nutrition, and organize your recipes beautifully.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-coquette-brown-500">Meals planned:</span>
                          <span className="font-semibold text-coquette-brown-600">{totalMeals}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-coquette-brown-500">Total calories:</span>
                          <span className="font-semibold text-coquette-brown-600">{totalCalories}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Quick Tips */}
              <Card className="border-coquette-brown-200 bg-gradient-to-br from-white to-coquette-pink-50">
                <CardHeader>
                  <CardTitle className="text-coquette-brown-600">Getting Started</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-semibold text-coquette-brown-600 mb-2">🎓 Track Assignments</h4>
                      <p className="text-sm text-coquette-brown-500">
                        Add your college assignments, set priorities, and never miss a deadline again.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-coquette-brown-600 mb-2">📅 Plan Your Month</h4>
                      <p className="text-sm text-coquette-brown-500">
                        Click on any month in the Planner to add events, track habits, and organize your schedule.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-coquette-brown-600 mb-2">💰 Track Finances</h4>
                      <p className="text-sm text-coquette-brown-500">
                        Add your income sources and expenses to see your financial overview and savings progress.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-coquette-brown-600 mb-2">💪 Stay Fit</h4>
                      <p className="text-sm text-coquette-brown-500">
                        Create weekly workout plans and track your progress with photos and measurements.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-coquette-brown-600 mb-2">🍽️ Eat Well</h4>
                      <p className="text-sm text-coquette-brown-500">
                        Plan your meals for the week, track nutrition, and add ingredients to your shopping list.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-coquette-brown-600 mb-2">✨ Stay Organized</h4>
                      <p className="text-sm text-coquette-brown-500">
                        Everything syncs automatically, so your data is always safe and accessible.
                      </p>
                    </div>
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

export default Index;