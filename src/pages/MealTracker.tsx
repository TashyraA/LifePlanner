import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import { useMeals } from '../contexts/MealContext';
import { usePlanner } from '../contexts/PlannerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { UtensilsCrossed, Plus, Upload, Trash2, Edit, Calculator, ChefHat, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CurvedArches } from '../components/PageHeaderImages';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MealTracker = () => {
  const { meals, recipes, addMeal, updateMeal, deleteMeal, headerImages, updateHeaderImage, addRecipeToMealPlan } = useMeals();
  const { addShoppingItem } = usePlanner();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday']);
  
  // Get today's date as a string for comparison
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const [trackingDate, setTrackingDate] = useState<string>(getTodayString());
  
  const [consumedMeals, setConsumedMeals] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('consumed_meals_data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Check if the stored date matches today
        if (data.date === getTodayString()) {
          return new Set(data.meals);
        }
        // Reset if it's a new day
        return new Set();
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  // Persist consumed meals with date to localStorage
  React.useEffect(() => {
    localStorage.setItem('consumed_meals_data', JSON.stringify({
      date: trackingDate,
      meals: Array.from(consumedMeals)
    }));
  }, [consumedMeals, trackingDate]);

  // Check for midnight reset
  React.useEffect(() => {
    const checkForNewDay = () => {
      const today = getTodayString();
      if (today !== trackingDate) {
        setTrackingDate(today);
        setConsumedMeals(new Set());
        toast({
          title: "New day started! 🌅",
          description: "Your daily meal tracking has been reset.",
        });
      }
    };

    // Check every minute for date change
    const interval = setInterval(checkForNewDay, 60000);
    
    // Also check immediately on mount
    checkForNewDay();

    return () => clearInterval(interval);
  }, [trackingDate, toast]);

  // Format today's date for display
  const formatDisplayDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Nutrition Calculator State
  const [calculatorData, setCalculatorData] = useState(() => {
    const stored = localStorage.getItem('nutrition_calculator');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {
          age: '',
          gender: 'female',
          heightFeet: '',
          heightInches: '',
          weight: '',
          activityLevel: 'moderate',
          goal: 'maintenance',
          deficitPercent: '20',
        };
      }
    }
    return {
      age: '',
      gender: 'female',
      heightFeet: '',
      heightInches: '',
      weight: '',
      activityLevel: 'moderate',
      goal: 'maintenance',
      deficitPercent: '20',
    };
  });

  const [calculatedNutrition, setCalculatedNutrition] = useState<{
    bmr: number;
    tdee: number;
    targetCalories: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null>(null);

  // Saved nutrition profiles
  interface NutritionProfile {
    id: string;
    name: string;
    createdAt: string;
    inputs: typeof calculatorData;
    results: {
      bmr: number;
      tdee: number;
      targetCalories: number;
      protein: number;
      carbs: number;
      fats: number;
    };
  }

  const [savedProfiles, setSavedProfiles] = useState<NutritionProfile[]>(() => {
    const stored = localStorage.getItem('nutrition_profiles');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('');

  // Persist saved profiles to localStorage
  React.useEffect(() => {
    localStorage.setItem('nutrition_profiles', JSON.stringify(savedProfiles));
  }, [savedProfiles]);

  // Save current calculation as a profile
  const saveProfile = () => {
    if (!calculatedNutrition) {
      toast({
        title: "No calculation to save",
        description: "Please calculate your nutrition first.",
        variant: "destructive",
      });
      return;
    }

    const name = profileName.trim() || `Profile ${savedProfiles.length + 1}`;
    
    if (activeProfileId) {
      // Update existing profile
      setSavedProfiles(prev => prev.map(p => 
        p.id === activeProfileId 
          ? { ...p, name, inputs: calculatorData, results: calculatedNutrition, createdAt: new Date().toISOString() }
          : p
      ));
      toast({
        title: "Profile updated! ✓",
        description: `"${name}" has been updated.`,
      });
    } else {
      // Create new profile
      const newProfile: NutritionProfile = {
        id: Date.now().toString(),
        name,
        createdAt: new Date().toISOString(),
        inputs: { ...calculatorData },
        results: { ...calculatedNutrition },
      };
      setSavedProfiles(prev => [...prev, newProfile]);
      setActiveProfileId(newProfile.id);
      toast({
        title: "Profile saved! 💾",
        description: `"${name}" has been saved for reference.`,
      });
    }
    setProfileName('');
  };

  // Load a saved profile into the calculator
  const loadProfile = (profile: NutritionProfile) => {
    setCalculatorData(profile.inputs);
    setCalculatedNutrition(profile.results);
    setActiveProfileId(profile.id);
    setProfileName(profile.name);
    toast({
      title: "Profile loaded",
      description: `Editing "${profile.name}"`,
    });
  };

  // Delete a saved profile
  const deleteProfile = (profileId: string) => {
    setSavedProfiles(prev => prev.filter(p => p.id !== profileId));
    if (activeProfileId === profileId) {
      setActiveProfileId(null);
    }
    toast({
      title: "Profile deleted",
      description: "The profile has been removed.",
    });
  };

  // Create new profile (clear current)
  const createNewProfile = () => {
    setActiveProfileId(null);
    setProfileName('');
    setCalculatedNutrition(null);
    setCalculatorData({
      age: '',
      gender: 'female',
      heightFeet: '',
      heightInches: '',
      weight: '',
      activityLevel: 'moderate',
      goal: 'maintenance',
      deficitPercent: '20',
    });
  };

  // Calculator minimized state
  const [calculatorMinimized, setCalculatorMinimized] = useState(() => {
    return localStorage.getItem('calculator_minimized') === 'true';
  });

  // Toggle calculator minimized state
  const toggleCalculatorMinimized = () => {
    const newValue = !calculatorMinimized;
    setCalculatorMinimized(newValue);
    localStorage.setItem('calculator_minimized', String(newValue));
  };

  // Get the active nutrition profile (either calculated or from saved profile)
  const getActiveNutritionGoals = () => {
    // First check if there's a calculated nutrition
    if (calculatedNutrition) return calculatedNutrition;
    
    // Then check saved profiles for an active one
    if (activeProfileId) {
      const profile = savedProfiles.find(p => p.id === activeProfileId);
      if (profile) return profile.results;
    }
    
    // Finally, use the first saved profile if available
    if (savedProfiles.length > 0) {
      return savedProfiles[0].results;
    }
    
    return null;
  };

  // Calculate remaining nutrition for the day based on consumed meals
  const getRemainingNutrition = () => {
    const goals = getActiveNutritionGoals();
    if (!goals) return null;

    const consumed = Array.from(consumedMeals).reduce(
      (acc, mealId) => {
        const meal = meals.find(m => m.id === mealId);
        if (meal) {
          return {
            calories: acc.calories + (meal.calories || 0),
            protein: acc.protein + (meal.protein || 0),
            carbs: acc.carbs + (meal.carbs || 0),
            fats: acc.fats + (meal.fats || 0),
          };
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    return {
      targetCalories: goals.targetCalories,
      targetProtein: goals.protein,
      targetCarbs: goals.carbs,
      targetFats: goals.fats,
      consumedCalories: consumed.calories,
      consumedProtein: consumed.protein,
      consumedCarbs: consumed.carbs,
      consumedFats: consumed.fats,
      remainingCalories: Math.max(0, goals.targetCalories - consumed.calories),
      remainingProtein: Math.max(0, goals.protein - consumed.protein),
      remainingCarbs: Math.max(0, goals.carbs - consumed.carbs),
      remainingFats: Math.max(0, goals.fats - consumed.fats),
      calorieProgress: Math.min(100, (consumed.calories / goals.targetCalories) * 100),
      proteinProgress: Math.min(100, (consumed.protein / goals.protein) * 100),
      carbsProgress: Math.min(100, (consumed.carbs / goals.carbs) * 100),
      fatsProgress: Math.min(100, (consumed.fats / goals.fats) * 100),
    };
  };

  // Save calculator data to localStorage
  React.useEffect(() => {
    localStorage.setItem('nutrition_calculator', JSON.stringify(calculatorData));
  }, [calculatorData]);

  // Calculate nutrition needs using Mifflin-St Jeor equation
  const calculateNutrition = () => {
    const age = parseFloat(calculatorData.age);
    const heightInches = (parseFloat(calculatorData.heightFeet) * 12) + parseFloat(calculatorData.heightInches || '0');
    const heightCm = heightInches * 2.54;
    const weightLbs = parseFloat(calculatorData.weight);
    const weightKg = weightLbs * 0.453592;

    if (!age || !heightCm || !weightKg) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Mifflin-St Jeor Equation
    let bmr: number;
    if (calculatorData.gender === 'male') {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
    } else {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    }

    // Activity multipliers
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };

    const tdee = bmr * activityMultipliers[calculatorData.activityLevel];

    // Calculate target calories based on goal
    let targetCalories: number;
    const deficitPercent = parseFloat(calculatorData.deficitPercent) / 100;
    
    switch (calculatorData.goal) {
      case 'weightLoss':
        targetCalories = tdee * (1 - deficitPercent);
        break;
      case 'mildWeightLoss':
        targetCalories = tdee * 0.9; // 10% deficit
        break;
      case 'muscleGain':
        targetCalories = tdee * 1.1; // 10% surplus
        break;
      case 'bulking':
        targetCalories = tdee * 1.2; // 20% surplus
        break;
      default:
        targetCalories = tdee;
    }

    // Calculate macros (protein: 0.8-1g per lb, fats: 25-30% of calories, rest carbs)
    const protein = weightLbs * 0.9; // 0.9g per pound
    const fatCalories = targetCalories * 0.28; // 28% from fats
    const fats = fatCalories / 9; // 9 calories per gram of fat
    const proteinCalories = protein * 4; // 4 calories per gram of protein
    const carbCalories = targetCalories - proteinCalories - fatCalories;
    const carbs = carbCalories / 4; // 4 calories per gram of carbs

    setCalculatedNutrition({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fats: Math.round(fats),
    });

    toast({
      title: "Nutrition calculated! 📊",
      description: `Your daily target: ${Math.round(targetCalories)} calories`,
    });
  };

  const [newMeal, setNewMeal] = useState({
    name: '',
    mealType: 'breakfast' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    image: '',
    ingredients: '',
    calories: '',
    carbs: '',
    protein: '',
    fats: '',
  });

  const [editMealData, setEditMealData] = useState({
    name: '',
    mealType: 'breakfast' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    image: '',
    ingredients: '',
    calories: '',
    carbs: '',
    protein: '',
    fats: '',
  });



  const toggleDay = (day: string) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  const handleAddMeal = () => {
    if (newMeal.name && selectedDays.length > 0) {
      const ingredientsList = newMeal.ingredients
        .split('\n')
        .filter(i => i.trim())
        .map(i => {
          const parts = i.split(':');
          return { name: parts[0].trim(), amount: parts[1]?.trim() || '' };
        });

      const mealData = {
        name: newMeal.name,
        mealType: newMeal.mealType,
        image: newMeal.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
        ingredients: ingredientsList,
        calories: newMeal.calories ? parseFloat(newMeal.calories) : 0,
        carbs: newMeal.carbs ? parseFloat(newMeal.carbs) : 0,
        protein: newMeal.protein ? parseFloat(newMeal.protein) : 0,
        fats: newMeal.fats ? parseFloat(newMeal.fats) : 0,
      };

      selectedDays.forEach(day => {
        console.log('Adding meal to day:', day, 'with image:', mealData.image ? 'YES' : 'NO');
        addMeal({
          ...mealData,
          day: day,
        });
      });

      setNewMeal({
        name: '',
        mealType: 'breakfast',
        image: '',
        ingredients: '',
        calories: '',
        carbs: '',
        protein: '',
        fats: '',
      });

      setSelectedDays(['Monday']);
      setIsAddDialogOpen(false);
      
      toast({
        title: "Meal added! 🍽️",
        description: `Your meal has been added to ${selectedDays.length} day${selectedDays.length > 1 ? 's' : ''}.`,
      });
    }
  };

  const handleEditMeal = (mealId: string) => {
    const meal = meals.find(m => m.id === mealId);
    if (meal) {
      setEditMealData({
        name: meal.name,
        mealType: meal.mealType,
        image: meal.image,
        ingredients: meal.ingredients.map(i => `${i.name}: ${i.amount}`).join('\n'),
        calories: meal.calories.toString(),
        carbs: meal.carbs.toString(),
        protein: meal.protein.toString(),
        fats: meal.fats.toString(),
      });
      setEditingMeal(mealId);
    }
  };

  const handleSaveMeal = () => {
    if (editingMeal && editMealData.name) {
      const ingredientsList = editMealData.ingredients
        .split('\n')
        .filter(i => i.trim())
        .map(i => {
          const parts = i.split(':');
          return { name: parts[0].trim(), amount: parts[1]?.trim() || '' };
        });

      updateMeal(editingMeal, {
        name: editMealData.name,
        mealType: editMealData.mealType,
        image: editMealData.image,
        ingredients: ingredientsList,
        calories: editMealData.calories ? parseFloat(editMealData.calories) : 0,
        carbs: editMealData.carbs ? parseFloat(editMealData.carbs) : 0,
        protein: editMealData.protein ? parseFloat(editMealData.protein) : 0,
        fats: editMealData.fats ? parseFloat(editMealData.fats) : 0,
      });

      setEditingMeal(null);
      toast({
        title: "Meal updated! ✓",
        description: "Your meal has been updated successfully.",
      });
    }
  };

  const handleAddToShoppingList = (mealId: string) => {
    const meal = meals.find(m => m.id === mealId);
    if (meal) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      meal.ingredients.forEach(ingredient => {
        addShoppingItem(currentMonth, currentYear, `${ingredient.name} (${ingredient.amount})`);
      });
      toast({
        title: "Added to shopping list! 🛒",
        description: `${meal.ingredients.length} items added to your shopping list.`,
      });
    }
  };

  const selectedMealData = meals.find(m => m.id === selectedMeal);

  const totalNutrition = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      carbs: acc.carbs + meal.carbs,
      protein: acc.protein + meal.protein,
      fats: acc.fats + meal.fats,
    }),
    { calories: 0, carbs: 0, protein: 0, fats: 0 }
  );

  const nutritionData = [
    { name: 'Calories', value: totalNutrition.calories, color: '#dba9a9' },
    { name: 'Carbs', value: totalNutrition.carbs, color: '#f4c2c2' },
    { name: 'Protein', value: totalNutrition.protein, color: '#d4c4b0' },
    { name: 'Fats', value: totalNutrition.fats, color: '#f5e6d3' },
  ];

  const weeklyCalories = daysOfWeek.map(day => ({
    day,
    calories: meals.filter(m => m.day === day).reduce((sum, m) => sum + m.calories, 0),
  }));

  console.log('Rendering MealTracker, total meals:', meals.length);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-coquette-brown-50 via-coquette-pink-50 to-white">
        <AppSidebar />
        <SidebarInset className="flex-1 w-full min-w-0">
          <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-coquette-brown-200 bg-white/80 backdrop-blur-sm px-6 py-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6 text-coquette-pink-400" />
              <h1 className="text-2xl font-bold text-coquette-brown-600">Meal Tracker</h1>
            </div>
            <div className="ml-auto">
              <Button
                variant="outline"
                className="border-coquette-brown-200 text-coquette-brown-600 hover:bg-coquette-pink-50"
                onClick={() => navigate('/recipes')}
              >
                Open Recipe Bank
              </Button>
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

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Nutrition Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600">Weekly Calories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={weeklyCalories} margin={{ top: 20, right: 30, left: 0, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f5e6d3" />
                        <XAxis dataKey="day" stroke="#9c7c5f" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                        <YAxis stroke="#9c7c5f" />
                        <Tooltip />
                        <Bar dataKey="calories" fill="#f4c2c2" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-coquette-brown-600">Macronutrient Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={nutritionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => name === 'Calories' ? `${name}: ${value.toFixed(0)}` : `${name}: ${value.toFixed(0)}g`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {nutritionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [value.toFixed(1), 'Value']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Nutrition Calculator */}
              <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                <CardHeader className="cursor-pointer" onClick={toggleCalculatorMinimized}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-coquette-pink-400" />
                      <CardTitle className="text-coquette-brown-600">Daily Nutrition Calculator</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-coquette-brown-400 hover:text-coquette-brown-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCalculatorMinimized();
                      }}
                    >
                      {calculatorMinimized ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronUp className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Minimized Profile Summary */}
                  {calculatorMinimized && (calculatedNutrition || savedProfiles.length > 0) && (
                    <div className="mt-3 pt-3 border-t border-coquette-brown-100">
                      {(() => {
                        const activeProfile = activeProfileId 
                          ? savedProfiles.find(p => p.id === activeProfileId)
                          : null;
                        const displayNutrition = calculatedNutrition || activeProfile?.results;
                        
                        if (!displayNutrition && savedProfiles.length > 0) {
                          return (
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-coquette-brown-500">
                                {savedProfiles.length} saved profile{savedProfiles.length > 1 ? 's' : ''}
                              </p>
                              <p className="text-xs text-coquette-brown-400">Click to expand</p>
                            </div>
                          );
                        }
                        
                        if (displayNutrition) {
                          return (
                            <div className="flex flex-wrap items-center gap-4">
                              {activeProfile && (
                                <span className="text-sm font-medium text-coquette-pink-600">
                                  {activeProfile.name}
                                </span>
                              )}
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-bold text-coquette-pink-600">{displayNutrition.targetCalories} cal</span>
                                <span className="text-coquette-brown-500">{displayNutrition.protein}g P</span>
                                <span className="text-coquette-brown-500">{displayNutrition.carbs}g C</span>
                                <span className="text-coquette-brown-500">{displayNutrition.fats}g F</span>
                              </div>
                              {savedProfiles.length > 0 && (
                                <span className="text-xs text-coquette-brown-400 ml-auto">
                                  {savedProfiles.length} profile{savedProfiles.length > 1 ? 's' : ''} saved
                                </span>
                              )}
                            </div>
                          );
                        }
                        
                        return null;
                      })()}
                    </div>
                  )}
                </CardHeader>
                
                {!calculatorMinimized && (
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Section */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-coquette-brown-600">Age</Label>
                          <Input
                            type="number"
                            value={calculatorData.age}
                            onChange={(e) => setCalculatorData({ ...calculatorData, age: e.target.value })}
                            placeholder="25"
                            className="border-coquette-brown-200"
                          />
                        </div>
                        <div>
                          <Label className="text-coquette-brown-600">Gender</Label>
                          <Select
                            value={calculatorData.gender}
                            onValueChange={(value) => setCalculatorData({ ...calculatorData, gender: value })}
                          >
                            <SelectTrigger className="border-coquette-brown-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="male">Male</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-coquette-brown-600">Height (ft)</Label>
                          <Input
                            type="number"
                            value={calculatorData.heightFeet}
                            onChange={(e) => setCalculatorData({ ...calculatorData, heightFeet: e.target.value })}
                            placeholder="5"
                            className="border-coquette-brown-200"
                          />
                        </div>
                        <div>
                          <Label className="text-coquette-brown-600">Height (in)</Label>
                          <Input
                            type="number"
                            value={calculatorData.heightInches}
                            onChange={(e) => setCalculatorData({ ...calculatorData, heightInches: e.target.value })}
                            placeholder="6"
                            className="border-coquette-brown-200"
                          />
                        </div>
                        <div>
                          <Label className="text-coquette-brown-600">Weight (lbs)</Label>
                          <Input
                            type="number"
                            value={calculatorData.weight}
                            onChange={(e) => setCalculatorData({ ...calculatorData, weight: e.target.value })}
                            placeholder="150"
                            className="border-coquette-brown-200"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-coquette-brown-600">Activity Level</Label>
                        <Select
                          value={calculatorData.activityLevel}
                          onValueChange={(value) => setCalculatorData({ ...calculatorData, activityLevel: value })}
                        >
                          <SelectTrigger className="border-coquette-brown-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                            <SelectItem value="light">Lightly Active (1-3 days/week)</SelectItem>
                            <SelectItem value="moderate">Moderately Active (3-5 days/week)</SelectItem>
                            <SelectItem value="active">Very Active (6-7 days/week)</SelectItem>
                            <SelectItem value="veryActive">Extra Active (athlete/physical job)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-coquette-brown-600">Goal</Label>
                          <Select
                            value={calculatorData.goal}
                            onValueChange={(value) => setCalculatorData({ ...calculatorData, goal: value })}
                          >
                            <SelectTrigger className="border-coquette-brown-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weightLoss">Weight Loss (deficit)</SelectItem>
                              <SelectItem value="mildWeightLoss">Mild Weight Loss (-10%)</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="muscleGain">Muscle Gain (+10%)</SelectItem>
                              <SelectItem value="bulking">Bulking (+20%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {calculatorData.goal === 'weightLoss' && (
                          <div>
                            <Label className="text-coquette-brown-600">Deficit %</Label>
                            <Select
                              value={calculatorData.deficitPercent}
                              onValueChange={(value) => setCalculatorData({ ...calculatorData, deficitPercent: value })}
                            >
                              <SelectTrigger className="border-coquette-brown-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="10">10% (slow, sustainable)</SelectItem>
                                <SelectItem value="15">15% (moderate)</SelectItem>
                                <SelectItem value="20">20% (standard)</SelectItem>
                                <SelectItem value="25">25% (aggressive)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={calculateNutrition}
                        className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculate My Nutrition
                      </Button>

                      {activeProfileId && (
                        <Button
                          onClick={createNewProfile}
                          variant="outline"
                          className="w-full border-coquette-brown-200 text-coquette-brown-500"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Profile
                        </Button>
                      )}
                    </div>

                    {/* Results Section */}
                    <div className="space-y-4">
                      {calculatedNutrition ? (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <Card className="border-coquette-brown-200 bg-coquette-pink-50">
                              <CardContent className="pt-4 text-center">
                                <p className="text-2xl font-bold text-coquette-brown-600">{calculatedNutrition.bmr}</p>
                                <p className="text-xs text-coquette-brown-500">BMR (Base Metabolic Rate)</p>
                              </CardContent>
                            </Card>
                            <Card className="border-coquette-brown-200 bg-coquette-pink-50">
                              <CardContent className="pt-4 text-center">
                                <p className="text-2xl font-bold text-coquette-brown-600">{calculatedNutrition.tdee}</p>
                                <p className="text-xs text-coquette-brown-500">TDEE (Total Daily Energy)</p>
                              </CardContent>
                            </Card>
                          </div>
                          
                          <Card className="border-coquette-pink-300 bg-coquette-pink-100">
                            <CardContent className="pt-4 text-center">
                              <p className="text-3xl font-bold text-coquette-pink-600">{calculatedNutrition.targetCalories}</p>
                              <p className="text-sm text-coquette-brown-500">Daily Calorie Target</p>
                            </CardContent>
                          </Card>

                          <div className="grid grid-cols-3 gap-4">
                            <Card className="border-coquette-brown-200">
                              <CardContent className="pt-4 text-center">
                                <p className="text-xl font-bold text-coquette-brown-600">{calculatedNutrition.protein}g</p>
                                <p className="text-xs text-coquette-brown-500">Protein</p>
                              </CardContent>
                            </Card>
                            <Card className="border-coquette-brown-200">
                              <CardContent className="pt-4 text-center">
                                <p className="text-xl font-bold text-coquette-brown-600">{calculatedNutrition.carbs}g</p>
                                <p className="text-xs text-coquette-brown-500">Carbs</p>
                              </CardContent>
                            </Card>
                            <Card className="border-coquette-brown-200">
                              <CardContent className="pt-4 text-center">
                                <p className="text-xl font-bold text-coquette-brown-600">{calculatedNutrition.fats}g</p>
                                <p className="text-xs text-coquette-brown-500">Fats</p>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Save Profile Section */}
                          <div className="border-t border-coquette-brown-200 pt-4 space-y-3">
                            <div className="flex gap-2">
                              <Input
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                placeholder={activeProfileId ? "Update profile name..." : "Profile name (optional)"}
                                className="border-coquette-brown-200"
                              />
                              <Button
                                onClick={saveProfile}
                                className="bg-coquette-brown-500 hover:bg-coquette-brown-600 text-white whitespace-nowrap"
                              >
                                {activeProfileId ? 'Update' : 'Save'}
                              </Button>
                            </div>
                            {activeProfileId && (
                              <p className="text-xs text-coquette-pink-500 text-center">
                                ✓ Editing saved profile
                              </p>
                            )}
                          </div>

                          <p className="text-xs text-coquette-brown-400 text-center">
                            * Calculations based on the Mifflin-St Jeor equation. Consult a healthcare provider for personalized advice.
                          </p>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                          <Calculator className="h-12 w-12 text-coquette-brown-300 mb-4" />
                          <p className="text-coquette-brown-500">Fill in your details and click calculate</p>
                          <p className="text-xs text-coquette-brown-400 mt-2">
                            Get personalized calorie and macro recommendations
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Saved Profiles */}
                  {savedProfiles.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-coquette-brown-200">
                      <h3 className="text-sm font-semibold text-coquette-brown-600 mb-3">Saved Profiles</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {savedProfiles.map((profile) => (
                          <Card 
                            key={profile.id} 
                            className={`border-coquette-brown-200 cursor-pointer hover:shadow-md transition-all ${
                              activeProfileId === profile.id ? 'ring-2 ring-coquette-pink-400 bg-coquette-pink-50' : 'bg-white'
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-medium text-coquette-brown-600">{profile.name}</p>
                                  <p className="text-xs text-coquette-brown-400">
                                    {new Date(profile.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteProfile(profile.id);
                                  }}
                                  className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                                <div>
                                  <p className="font-bold text-coquette-pink-600">{profile.results.targetCalories}</p>
                                  <p className="text-coquette-brown-400">cal</p>
                                </div>
                                <div>
                                  <p className="font-medium text-coquette-brown-600">{profile.results.protein}g</p>
                                  <p className="text-coquette-brown-400">protein</p>
                                </div>
                                <div>
                                  <p className="font-medium text-coquette-brown-600">{profile.results.carbs}g</p>
                                  <p className="text-coquette-brown-400">carbs</p>
                                </div>
                                <div>
                                  <p className="font-medium text-coquette-brown-600">{profile.results.fats}g</p>
                                  <p className="text-coquette-brown-400">fats</p>
                                </div>
                              </div>
                              <Button
                                onClick={() => loadProfile(profile)}
                                variant="outline"
                                size="sm"
                                className="w-full border-coquette-brown-200 text-coquette-brown-600 hover:bg-coquette-pink-50"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                {activeProfileId === profile.id ? 'Currently Editing' : 'Load & Edit'}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                )}
              </Card>

              {/* Weekly Meal Plan */}
              <Card className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-coquette-brown-600">Weekly Meal Plan</CardTitle>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Meal
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-coquette-brown-600">Add New Meal</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 p-1">
                        {/* ... existing add meal form ... */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Meal Name *</Label>
                            <Input
                              value={newMeal.name}
                              onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                              placeholder="e.g., Avocado Toast"
                              className="border-coquette-brown-200"
                            />
                          </div>
                          <div>
                            <Label>Meal Type</Label>
                            <Select
                              value={newMeal.mealType}
                              onValueChange={(value: any) => setNewMeal({ ...newMeal, mealType: value })}
                            >
                              <SelectTrigger className="border-coquette-brown-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="breakfast">Breakfast</SelectItem>
                                <SelectItem value="lunch">Lunch</SelectItem>
                                <SelectItem value="dinner">Dinner</SelectItem>
                                <SelectItem value="snack">Snack</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="mb-3 block">Select Days (choose one or more) *</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {daysOfWeek.map(day => (
                              <div key={day} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`day-${day}`}
                                  checked={selectedDays.includes(day)}
                                  onCheckedChange={() => toggleDay(day)}
                                  className="border-coquette-brown-300"
                                />
                                <label
                                  htmlFor={`day-${day}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {day.substring(0, 3)}
                                </label>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-coquette-brown-500 mt-2">
                            Selected: {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''}
                          </p>
                        </div>

                          <div>
                            <Label>Upload Photo</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setNewMeal({ ...newMeal, image: reader.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="border-coquette-brown-200"
                            />
                          </div>

                          {newMeal.image && (
                            <div>
                              <Label>Preview</Label>
                              <img src={newMeal.image} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-coquette-brown-200" />
                            </div>
                          )}

                        <div>
                          <Label>Ingredients (one per line, format: name: amount)</Label>
                          <Textarea
                            value={newMeal.ingredients}
                            onChange={(e) => setNewMeal({ ...newMeal, ingredients: e.target.value })}
                            placeholder="Bread: 2 slices&#10;Avocado: 1 whole&#10;Eggs: 2"
                            rows={4}
                            className="border-coquette-brown-200"
                          />
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <Label>Calories</Label>
                            <Input
                              type="number"
                              value={newMeal.calories}
                              onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })}
                              placeholder="0"
                              className="border-coquette-brown-200"
                            />
                          </div>
                          <div>
                            <Label>Carbs (g)</Label>
                            <Input
                              type="number"
                              value={newMeal.carbs}
                              onChange={(e) => setNewMeal({ ...newMeal, carbs: e.target.value })}
                              placeholder="0"
                              className="border-coquette-brown-200"
                            />
                          </div>
                          <div>
                            <Label>Protein (g)</Label>
                            <Input
                              type="number"
                              value={newMeal.protein}
                              onChange={(e) => setNewMeal({ ...newMeal, protein: e.target.value })}
                              placeholder="0"
                              className="border-coquette-brown-200"
                            />
                          </div>
                          <div>
                            <Label>Fats (g)</Label>
                            <Input
                              type="number"
                              value={newMeal.fats}
                              onChange={(e) => setNewMeal({ ...newMeal, fats: e.target.value })}
                              placeholder="0"
                              className="border-coquette-brown-200"
                            />
                          </div>
                        </div>

                        <Button 
                          onClick={handleAddMeal} 
                          disabled={!newMeal.name}
                          className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Meal to {selectedDays.length} Day{selectedDays.length !== 1 ? 's' : ''}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Daily Consumed Meals Summary */}
                    <Card className="border-coquette-pink-200 bg-coquette-pink-50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-coquette-brown-600 text-sm">Today's Nutrition</CardTitle>
                          <span className="text-xs text-coquette-brown-500">{formatDisplayDate()}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const goals = getActiveNutritionGoals();
                          const consumed = {
                            calories: Array.from(consumedMeals).reduce((sum, mealId) => {
                              const meal = meals.find(m => m.id === mealId);
                              return sum + (meal?.calories || 0);
                            }, 0),
                            protein: Array.from(consumedMeals).reduce((sum, mealId) => {
                              const meal = meals.find(m => m.id === mealId);
                              return sum + (meal?.protein || 0);
                            }, 0),
                            carbs: Array.from(consumedMeals).reduce((sum, mealId) => {
                              const meal = meals.find(m => m.id === mealId);
                              return sum + (meal?.carbs || 0);
                            }, 0),
                            fats: Array.from(consumedMeals).reduce((sum, mealId) => {
                              const meal = meals.find(m => m.id === mealId);
                              return sum + (meal?.fats || 0);
                            }, 0),
                          };

                          if (!goals) {
                            // No profile saved - show simple consumed view
                            return consumedMeals.size > 0 ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center text-sm">
                                  <div className="space-y-1">
                                    <p className="font-bold text-coquette-pink-600">{consumed.calories}</p>
                                    <p className="text-xs text-coquette-brown-500">Calories</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="font-medium text-coquette-brown-600">{consumed.protein.toFixed(0)}g</p>
                                    <p className="text-xs text-coquette-brown-500">Protein</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="font-medium text-coquette-brown-600">{consumed.carbs.toFixed(0)}g</p>
                                    <p className="text-xs text-coquette-brown-500">Carbs</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="font-medium text-coquette-brown-600">{consumed.fats.toFixed(0)}g</p>
                                    <p className="text-xs text-coquette-brown-500">Fats</p>
                                  </div>
                                  <div className="space-y-1 border-l border-coquette-brown-200 pl-4">
                                    <p className="font-medium text-coquette-brown-600">{consumedMeals.size}</p>
                                    <p className="text-xs text-coquette-brown-500">Meals</p>
                                  </div>
                                </div>
                                <p className="text-xs text-coquette-brown-400 text-center">
                                  Set up a nutrition profile to see your remaining goals
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-coquette-brown-400 text-center py-2">
                                No meals consumed yet today. Check off meals as you eat them!
                              </p>
                            );
                          }

                          // Calculate remaining
                          const remaining = {
                            calories: Math.max(0, goals.targetCalories - consumed.calories),
                            protein: Math.max(0, goals.protein - consumed.protein),
                            carbs: Math.max(0, goals.carbs - consumed.carbs),
                            fats: Math.max(0, goals.fats - consumed.fats),
                          };

                          const progress = {
                            calories: Math.min(100, (consumed.calories / goals.targetCalories) * 100),
                            protein: Math.min(100, (consumed.protein / goals.protein) * 100),
                            carbs: Math.min(100, (consumed.carbs / goals.carbs) * 100),
                            fats: Math.min(100, (consumed.fats / goals.fats) * 100),
                          };

                          return (
                            <div className="space-y-4">
                              {/* Progress bars */}
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Calories */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-coquette-brown-600 font-medium">Calories</span>
                                    <span className={consumed.calories > goals.targetCalories ? 'text-red-500 font-bold' : 'text-coquette-brown-500'}>
                                      {consumed.calories} / {goals.targetCalories}
                                    </span>
                                  </div>
                                  <div className="h-3 bg-coquette-brown-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all ${
                                        progress.calories > 100 ? 'bg-red-400' : 'bg-coquette-brown-400'
                                      }`}
                                      style={{ width: `${Math.min(progress.calories, 100)}%` }}
                                    />
                                  </div>
                                  <p className={`text-xs text-center ${
                                    consumed.calories > goals.targetCalories ? 'text-red-500' : 'text-coquette-brown-400'
                                  }`}>
                                    {consumed.calories > goals.targetCalories 
                                      ? `${consumed.calories - goals.targetCalories} over` 
                                      : `${remaining.calories} left`}
                                  </p>
                                </div>

                                {/* Protein */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-coquette-brown-600 font-medium">Protein</span>
                                    <span className={consumed.protein > goals.protein ? 'text-red-500 font-bold' : 'text-coquette-brown-500'}>
                                      {consumed.protein.toFixed(0)}g / {goals.protein}g
                                    </span>
                                  </div>
                                  <div className="h-3 bg-coquette-brown-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all ${
                                        progress.protein > 100 ? 'bg-red-400' : 'bg-coquette-brown-400'
                                      }`}
                                      style={{ width: `${Math.min(progress.protein, 100)}%` }}
                                    />
                                  </div>
                                  <p className={`text-xs text-center ${
                                    consumed.protein > goals.protein ? 'text-red-500' : 'text-coquette-brown-400'
                                  }`}>
                                    {consumed.protein > goals.protein 
                                      ? `${(consumed.protein - goals.protein).toFixed(0)}g over` 
                                      : `${remaining.protein.toFixed(0)}g left`}
                                  </p>
                                </div>

                                {/* Carbs */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-coquette-brown-600 font-medium">Carbs</span>
                                    <span className={consumed.carbs > goals.carbs ? 'text-red-500 font-bold' : 'text-coquette-brown-500'}>
                                      {consumed.carbs.toFixed(0)}g / {goals.carbs}g
                                    </span>
                                  </div>
                                  <div className="h-3 bg-coquette-brown-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all ${
                                        progress.carbs > 100 ? 'bg-red-400' : 'bg-coquette-brown-400'
                                      }`}
                                      style={{ width: `${Math.min(progress.carbs, 100)}%` }}
                                    />
                                  </div>
                                  <p className={`text-xs text-center ${
                                    consumed.carbs > goals.carbs ? 'text-red-500' : 'text-coquette-brown-400'
                                  }`}>
                                    {consumed.carbs > goals.carbs 
                                      ? `${(consumed.carbs - goals.carbs).toFixed(0)}g over` 
                                      : `${remaining.carbs.toFixed(0)}g left`}
                                  </p>
                                </div>

                                {/* Fats */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-coquette-brown-600 font-medium">Fats</span>
                                    <span className={consumed.fats > goals.fats ? 'text-red-500 font-bold' : 'text-coquette-brown-500'}>
                                      {consumed.fats.toFixed(0)}g / {goals.fats}g
                                    </span>
                                  </div>
                                  <div className="h-3 bg-coquette-brown-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all ${
                                        progress.fats > 100 ? 'bg-red-400' : 'bg-coquette-brown-400'
                                      }`}
                                      style={{ width: `${Math.min(progress.fats, 100)}%` }}
                                    />
                                  </div>
                                  <p className={`text-xs text-center ${
                                    consumed.fats > goals.fats ? 'text-red-500' : 'text-coquette-brown-400'
                                  }`}>
                                    {consumed.fats > goals.fats 
                                      ? `${(consumed.fats - goals.fats).toFixed(0)}g over` 
                                      : `${remaining.fats.toFixed(0)}g left`}
                                  </p>
                                </div>
                              </div>

                              {/* Summary row */}
                              <div className="flex items-center justify-between pt-2 border-t border-coquette-brown-200">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-coquette-brown-500">
                                    {consumedMeals.size} meal{consumedMeals.size !== 1 ? 's' : ''} consumed
                                  </span>
                                  {progress.calories >= 100 && (
                                    <span className="text-xs bg-coquette-pink-200 text-coquette-pink-700 px-2 py-0.5 rounded-full">
                                      🎉 Goal reached!
                                    </span>
                                  )}
                                </div>
                                {activeProfileId && (
                                  <span className="text-xs text-coquette-brown-400">
                                    Profile: {savedProfiles.find(p => p.id === activeProfileId)?.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>

                    {/* Days Grid */}
                    <div className="overflow-x-auto pb-4">
                      <div className="grid grid-cols-7 gap-4 min-w-[900px]">
                        {daysOfWeek.map(day => {
                          const dayMeals = meals.filter(m => m.day === day);
                          return (
                            <div key={day} className="space-y-3 min-w-[120px]">
                              <h3 className="font-semibold text-coquette-brown-600 text-center pb-2 border-b border-coquette-brown-200 sticky top-0 bg-white/80 backdrop-blur-sm">
                                {day}
                              </h3>
                              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                              {dayMeals.map(meal => {
                              const isConsumed = consumedMeals.has(meal.id);
                              return (
                                <div key={meal.id} className="space-y-2">
                                  <Card
                                    className={`cursor-pointer hover:shadow-lg transition-all border-coquette-brown-200 overflow-hidden group ${
                                      isConsumed ? 'bg-coquette-pink-100 border-coquette-pink-300' : 'bg-white'
                                    }`}
                                    onClick={() => setSelectedMeal(meal.id)}
                                  >
                                    <div className="relative h-24 overflow-hidden">
                                      <img
                                        src={meal.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                                        alt={meal.name}
                                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${
                                          isConsumed ? 'opacity-60' : 'opacity-100'
                                        }`}
                                        onError={(e) => {
                                          console.error('Image failed to load for meal:', meal.name);
                                          e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                      <div className="absolute bottom-1 left-1 right-1">
                                        <p className="text-xs font-semibold text-white truncate">{meal.name}</p>
                                        <p className="text-xs text-white/80">{meal.mealType}</p>
                                      </div>
                                      {isConsumed && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="bg-coquette-pink-400 text-white rounded-full p-2">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                  <div className="flex items-center gap-2 px-1">
                                    <Checkbox
                                      checked={isConsumed}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setConsumedMeals(new Set([...consumedMeals, meal.id]));
                                        } else {
                                          const newSet = new Set(consumedMeals);
                                          newSet.delete(meal.id);
                                          setConsumedMeals(newSet);
                                        }
                                      }}
                                      className="border-coquette-brown-300 h-4 w-4"
                                    />
                                    <span className="text-xs text-coquette-brown-500">{meal.calories} cal</span>
                                  </div>
                                </div>
                              );
                            })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Meal Details Dialog */}
              {selectedMealData && (
                <Dialog open={!!selectedMeal} onOpenChange={() => setSelectedMeal(null)}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-coquette-brown-600">{selectedMealData.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <img
                        src={selectedMealData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                        alt={selectedMealData.name}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
                        }}
                      />
                      
                      <div className="grid grid-cols-4 gap-4">
                        <Card className="border-coquette-brown-200">
                          <CardContent className="pt-4 text-center">
                            <p className="text-2xl font-bold text-coquette-brown-600">{selectedMealData.calories}</p>
                            <p className="text-xs text-coquette-brown-500">Calories</p>
                          </CardContent>
                        </Card>
                        <Card className="border-coquette-brown-200">
                          <CardContent className="pt-4 text-center">
                            <p className="text-2xl font-bold text-coquette-brown-600">{selectedMealData.carbs}g</p>
                            <p className="text-xs text-coquette-brown-500">Carbs</p>
                          </CardContent>
                        </Card>
                        <Card className="border-coquette-brown-200">
                          <CardContent className="pt-4 text-center">
                            <p className="text-2xl font-bold text-coquette-brown-600">{selectedMealData.protein}g</p>
                            <p className="text-xs text-coquette-brown-500">Protein</p>
                          </CardContent>
                        </Card>
                        <Card className="border-coquette-brown-200">
                          <CardContent className="pt-4 text-center">
                            <p className="text-2xl font-bold text-coquette-brown-600">{selectedMealData.fats}g</p>
                            <p className="text-xs text-coquette-brown-500">Fats</p>
                          </CardContent>
                        </Card>
                      </div>

                      <div>
                        <h4 className="font-semibold text-coquette-brown-600 mb-2">Ingredients</h4>
                        <ul className="space-y-1">
                          {selectedMealData.ingredients.map((ing, idx) => (
                            <li key={idx} className="text-sm text-coquette-brown-500">
                              • {ing.name} {ing.amount && `- ${ing.amount}`}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAddToShoppingList(selectedMealData.id)}
                          className="flex-1 bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                        >
                          Add to Shopping List
                        </Button>
                        <Dialog open={editingMeal === selectedMealData.id} onOpenChange={(open) => !open && setEditingMeal(null)}>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => handleEditMeal(selectedMealData.id)}
                              variant="outline"
                              className="border-coquette-brown-300"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-coquette-brown-600">Edit Meal</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 p-1">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Meal Name</Label>
                                  <Input
                                    value={editMealData.name}
                                    onChange={(e) => setEditMealData({ ...editMealData, name: e.target.value })}
                                    className="border-coquette-brown-200"
                                  />
                                </div>
                                <div>
                                  <Label>Meal Type</Label>
                                  <Select
                                    value={editMealData.mealType}
                                    onValueChange={(value: any) => setEditMealData({ ...editMealData, mealType: value })}
                                  >
                                    <SelectTrigger className="border-coquette-brown-200">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="breakfast">Breakfast</SelectItem>
                                      <SelectItem value="lunch">Lunch</SelectItem>
                                      <SelectItem value="dinner">Dinner</SelectItem>
                                      <SelectItem value="snack">Snack</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                                <div>
                                  <Label>Upload New Photo (optional)</Label>
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setEditMealData({ ...editMealData, image: reader.result as string });
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="border-coquette-brown-200"
                                  />
                                </div>

                                {editMealData.image && (
                                  <div>
                                    <Label>Current Photo</Label>
                                    <img src={editMealData.image} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-coquette-brown-200" />
                                  </div>
                                )}

                              <div>
                                <Label>Ingredients (one per line, format: name: amount)</Label>
                                <Textarea
                                  value={editMealData.ingredients}
                                  onChange={(e) => setEditMealData({ ...editMealData, ingredients: e.target.value })}
                                  rows={4}
                                  className="border-coquette-brown-200"
                                />
                              </div>

                              <div className="grid grid-cols-4 gap-4">
                                <div>
                                  <Label>Calories</Label>
                                  <Input
                                    type="number"
                                    value={editMealData.calories}
                                    onChange={(e) => setEditMealData({ ...editMealData, calories: e.target.value })}
                                    className="border-coquette-brown-200"
                                  />
                                </div>
                                <div>
                                  <Label>Carbs (g)</Label>
                                  <Input
                                    type="number"
                                    value={editMealData.carbs}
                                    onChange={(e) => setEditMealData({ ...editMealData, carbs: e.target.value })}
                                    className="border-coquette-brown-200"
                                  />
                                </div>
                                <div>
                                  <Label>Protein (g)</Label>
                                  <Input
                                    type="number"
                                    value={editMealData.protein}
                                    onChange={(e) => setEditMealData({ ...editMealData, protein: e.target.value })}
                                    className="border-coquette-brown-200"
                                  />
                                </div>
                                <div>
                                  <Label>Fats (g)</Label>
                                  <Input
                                    type="number"
                                    value={editMealData.fats}
                                    onChange={(e) => setEditMealData({ ...editMealData, fats: e.target.value })}
                                    className="border-coquette-brown-200"
                                  />
                                </div>
                              </div>

                              <Button 
                                onClick={handleSaveMeal}
                                className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                              >
                                Save Changes
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          onClick={() => {
                            deleteMeal(selectedMealData.id);
                            setSelectedMeal(null);
                            toast({
                              title: "Meal deleted",
                              description: "The meal has been removed from your plan.",
                            });
                          }}
                          variant="outline"
                          className="border-red-300 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MealTracker;