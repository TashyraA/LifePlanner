import React, { useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import { useMeals } from '../contexts/MealContext';
import { usePlanner } from '../contexts/PlannerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, Trash2, Edit, Link as LinkIcon, Play, Calendar, ShoppingCart, ArrowLeft, Crop, Search, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateAndCompressImage } from '../lib/imageCompression';
import { Link } from 'react-router-dom';
import { ImageCropper } from '../components/ImageCropper';
import { NutritionSearch, FoodIngredient, NutritionData } from '../components/NutritionSearch';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const RecipeBank = () => {
  const { recipes, addRecipe, updateRecipe, deleteRecipe, addRecipeToMealPlan } = useMeals();
  const { addShoppingItem } = usePlanner();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<string | null>(null);
  const [addingToMealPlan, setAddingToMealPlan] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [loadingVideo, setLoadingVideo] = useState(false);

  // Image cropper state
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [cropperTarget, setCropperTarget] = useState<'newRecipe' | 'editRecipe' | null>(null);

  // Nutrition search state
  const [nutritionSearchOpen, setNutritionSearchOpen] = useState(false);
  const [nutritionSearchTarget, setNutritionSearchTarget] = useState<'newRecipe' | 'editRecipe'>('newRecipe');

  // Food ingredients with nutrition
  const [newFoodIngredients, setNewFoodIngredients] = useState<FoodIngredient[]>([]);
  const [editFoodIngredients, setEditFoodIngredients] = useState<FoodIngredient[]>([]);

  const [newRecipe, setNewRecipe] = useState({
    name: '',
    image: '',
    videoUrl: '',
    recipe: '',
    category: '',
    prepTime: '',
    servings: '',
  });

  const [editRecipeData, setEditRecipeData] = useState({
    name: '',
    image: '',
    videoUrl: '',
    recipe: '',
    category: '',
    prepTime: '',
    servings: '',
  });

  // Calculate total nutrition from ingredients
  const calculateTotalNutrition = (ingredients: FoodIngredient[]): NutritionData => {
    return ingredients.reduce(
      (total, ing) => ({
        calories: total.calories + ing.nutrition.calories,
        protein: Math.round((total.protein + ing.nutrition.protein) * 10) / 10,
        carbs: Math.round((total.carbs + ing.nutrition.carbs) * 10) / 10,
        fats: Math.round((total.fats + ing.nutrition.fats) * 10) / 10,
        fiber: Math.round((total.fiber + ing.nutrition.fiber) * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
    );
  };

  const handleAddFoodIngredient = (ingredient: FoodIngredient) => {
    if (nutritionSearchTarget === 'newRecipe') {
      setNewFoodIngredients([...newFoodIngredients, ingredient]);
    } else {
      setEditFoodIngredients([...editFoodIngredients, ingredient]);
    }
    toast({
      title: 'Ingredient Added!',
      description: `Added "${ingredient.name}"`,
    });
  };

  const removeFoodIngredient = (id: string, target: 'newRecipe' | 'editRecipe') => {
    if (target === 'newRecipe') {
      setNewFoodIngredients(newFoodIngredients.filter(i => i.id !== id));
    } else {
      setEditFoodIngredients(editFoodIngredients.filter(i => i.id !== id));
    }
  };

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

  const fetchYouTubeInfo = async (url: string, isEdit: boolean = false) => {
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
    
    if (isEdit) {
      setEditRecipeData(prev => ({
        ...prev,
        videoUrl: embedUrl,
        image: thumbnail,
      }));
    } else {
      setNewRecipe(prev => ({
        ...prev,
        videoUrl: embedUrl,
        image: thumbnail,
      }));
    }

    setLoadingVideo(false);
    
    toast({
      title: "Video loaded! 🎥",
      description: "YouTube video has been added to your recipe",
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropperImage(reader.result as string);
        setCropperTarget(isEdit ? 'editRecipe' : 'newRecipe');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCroppedImage = (croppedImage: string) => {
    if (cropperTarget === 'newRecipe') {
      setNewRecipe({ ...newRecipe, image: croppedImage });
    } else if (cropperTarget === 'editRecipe') {
      setEditRecipeData({ ...editRecipeData, image: croppedImage });
    }
    setCropperImage(null);
    setCropperTarget(null);
  };

  const handleAddRecipe = () => {
    if (newRecipe.name) {
      const totalNutrition = calculateTotalNutrition(newFoodIngredients);
      const ingredients = newFoodIngredients.map(i => ({ 
        name: i.name, 
        amount: `${i.servings} serving${i.servings !== 1 ? 's' : ''} (${i.servingSize})` 
      }));

      addRecipe({
        name: newRecipe.name,
        image: newRecipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
        videoUrl: newRecipe.videoUrl,
        ingredients: ingredients,
        calories: totalNutrition.calories,
        protein: totalNutrition.protein,
        carbs: totalNutrition.carbs,
        fats: totalNutrition.fats,
        fiber: totalNutrition.fiber,
        recipe: newRecipe.recipe,
        category: newRecipe.category,
        prepTime: newRecipe.prepTime,
        servings: parseInt(newRecipe.servings) || 1,
      });

      setNewRecipe({
        name: '',
        image: '',
        videoUrl: '',
        recipe: '',
        category: '',
        prepTime: '',
        servings: '',
      });
      setNewFoodIngredients([]);

      setIsAddDialogOpen(false);
      toast({
        title: "Recipe added! 📖",
        description: "Your recipe has been saved to the bank.",
      });
    }
  };

  const handleEditRecipe = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      setEditRecipeData({
        name: recipe.name,
        image: recipe.image || '',
        videoUrl: recipe.videoUrl || '',
        recipe: recipe.recipe || '',
        category: recipe.category || '',
        prepTime: recipe.prepTime || '',
        servings: recipe.servings?.toString() || '',
      });
      // Convert ingredients to FoodIngredient format for display
      // Note: For existing recipes, we'll show them as simple ingredients
      // Users can add new food items with nutrition
      const foodIngredients: FoodIngredient[] = recipe.ingredients.map((i, idx) => ({
        id: `existing-${idx}`,
        name: i.name,
        servings: 1,
        servingSize: i.amount,
        nutrition: {
          calories: Math.round((recipe.calories || 0) / recipe.ingredients.length),
          protein: Math.round(((recipe.protein || 0) / recipe.ingredients.length) * 10) / 10,
          carbs: Math.round(((recipe.carbs || 0) / recipe.ingredients.length) * 10) / 10,
          fats: Math.round(((recipe.fats || 0) / recipe.ingredients.length) * 10) / 10,
          fiber: Math.round((((recipe as any).fiber || 0) / recipe.ingredients.length) * 10) / 10,
        },
      }));
      setEditFoodIngredients(foodIngredients);
      setEditingRecipe(recipeId);
    }
  };

  const handleSaveRecipe = () => {
    if (editingRecipe && editRecipeData.name) {
      const totalNutrition = calculateTotalNutrition(editFoodIngredients);
      const ingredients = editFoodIngredients.map(i => ({ 
        name: i.name, 
        amount: i.servingSize || `${i.servings} serving${i.servings !== 1 ? 's' : ''}` 
      }));

      updateRecipe(editingRecipe, {
        name: editRecipeData.name,
        image: editRecipeData.image,
        videoUrl: editRecipeData.videoUrl,
        ingredients: ingredients,
        calories: totalNutrition.calories,
        protein: totalNutrition.protein,
        carbs: totalNutrition.carbs,
        fats: totalNutrition.fats,
        fiber: totalNutrition.fiber,
        recipe: editRecipeData.recipe,
        category: editRecipeData.category,
        prepTime: editRecipeData.prepTime,
        servings: parseInt(editRecipeData.servings) || 1,
      });

      setEditingRecipe(null);
      setEditFoodIngredients([]);
      toast({
        title: "Recipe updated! ✓",
        description: "Your recipe has been updated.",
      });
    }
  };

  const handleAddToMealPlan = () => {
    if (addingToMealPlan && selectedDays.length > 0) {
      addRecipeToMealPlan(addingToMealPlan, selectedDays, selectedMealType);
      setAddingToMealPlan(null);
      setSelectedDays([]);
      toast({
        title: "Added to meal plan! 📅",
        description: `Recipe added to ${selectedDays.length} day(s).`,
      });
    }
  };

  const handleAddToShoppingList = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      recipe.ingredients.forEach(ingredient => {
        addShoppingItem(currentMonth, currentYear, `${ingredient.name} (${ingredient.amount})`);
      });
      toast({
        title: "Added to shopping list! 🛒",
        description: `${recipe.ingredients.length} items added to your shopping list.`,
      });
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const selectedRecipeData = recipes.find(r => r.id === selectedRecipe);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-coquette-brown-50 via-coquette-pink-50 to-white">
        <AppSidebar />
        <SidebarInset className="flex-1 w-full min-w-0">
          <header className="flex items-center sticky top-0 z-10 gap-2 sm:gap-4 border-b border-coquette-brown-200 bg-white/80 backdrop-blur-sm px-3 sm:px-6 py-3 sm:py-4 flex-wrap">
            <SidebarTrigger />
            <Link to="/meals">
              <Button variant="ghost" size="sm" className="text-coquette-brown-500 hover:bg-coquette-brown-100 text-xs sm:text-sm px-2 sm:px-3">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back to Meal Planner</span>
              </Button>
            </Link>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-coquette-pink-400 flex-shrink-0" />
              <h1 className="text-lg sm:text-2xl font-bold text-coquette-brown-600 truncate">Recipe Bank</h1>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600 text-xs sm:text-sm px-2 sm:px-4" size="sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add Recipe</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-coquette-brown-600">Add New Recipe</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-coquette-brown-600">Recipe Name</Label>
                    <Input
                      value={newRecipe.name}
                      onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                      placeholder="e.g., Grilled Chicken Salad"
                      className="border-coquette-brown-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-coquette-brown-600">Category</Label>
                      <Input
                        value={newRecipe.category}
                        onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value })}
                        placeholder="e.g., Dinner, Dessert"
                        className="border-coquette-brown-200"
                      />
                    </div>
                    <div>
                      <Label className="text-coquette-brown-600">Prep Time</Label>
                      <Input
                        value={newRecipe.prepTime}
                        onChange={(e) => setNewRecipe({ ...newRecipe, prepTime: e.target.value })}
                        placeholder="e.g., 30 mins"
                        className="border-coquette-brown-200"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-coquette-brown-600">YouTube Recipe URL (optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newRecipe.videoUrl}
                        onChange={(e) => setNewRecipe({ ...newRecipe, videoUrl: e.target.value })}
                        placeholder="https://youtube.com/watch?v=..."
                        className="border-coquette-brown-200"
                      />
                      <Button
                        type="button"
                        onClick={() => fetchYouTubeInfo(newRecipe.videoUrl, false)}
                        disabled={loadingVideo}
                        className="bg-coquette-brown-300 hover:bg-coquette-brown-400 text-white"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {newRecipe.image && (
                    <div className="relative">
                      <img
                        src={newRecipe.image}
                        alt="Recipe preview"
                        className="w-full h-48 object-contain rounded-lg bg-coquette-brown-50"
                      />
                      {newRecipe.videoUrl && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                          <Play className="h-16 w-16 text-white" />
                        </div>
                      )}
                      {!newRecipe.videoUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCropperImage(newRecipe.image!);
                            setCropperTarget('newRecipe');
                          }}
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white border-coquette-pink-300"
                        >
                          <Crop className="h-4 w-4 mr-1" />
                          Re-crop
                        </Button>
                      )}
                    </div>
                  )}

                  <div>
                    <Label className="text-coquette-brown-600">Or Upload Image</Label>
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-coquette-brown-200 rounded-lg cursor-pointer hover:bg-coquette-pink-50 transition-colors">
                      <Upload className="h-5 w-5 text-coquette-brown-500" />
                      <span className="text-sm text-coquette-brown-600">{newRecipe.image ? 'Change Image' : 'Choose Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Ingredients Section - Search & Add */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-coquette-brown-600 font-medium">Ingredients</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNutritionSearchTarget('newRecipe');
                          setNutritionSearchOpen(true);
                        }}
                        className="border-coquette-pink-300 text-coquette-pink-500 hover:bg-coquette-pink-50"
                      >
                        <Search className="h-4 w-4 mr-1" />
                        Search & Add Food
                      </Button>
                    </div>
                    
                    {/* Added Ingredients List */}
                    {newFoodIngredients.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {newFoodIngredients.map((ingredient) => (
                          <div key={ingredient.id} className="bg-coquette-pink-50 p-2 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-coquette-brown-600 text-sm capitalize">
                                  {ingredient.name.toLowerCase()}
                                </p>
                                <p className="text-xs text-coquette-brown-400">
                                  {ingredient.servings} × {ingredient.servingSize}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFoodIngredient(ingredient.id, 'newRecipe')}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1 text-xs">
                              <span className="bg-white px-1.5 py-0.5 rounded">{ingredient.nutrition.calories} cal</span>
                              <span className="bg-blue-50 px-1.5 py-0.5 rounded">P: {ingredient.nutrition.protein}g</span>
                              <span className="bg-yellow-50 px-1.5 py-0.5 rounded">C: {ingredient.nutrition.carbs}g</span>
                              <span className="bg-orange-50 px-1.5 py-0.5 rounded">F: {ingredient.nutrition.fats}g</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-coquette-brown-400 text-sm border-2 border-dashed border-coquette-brown-200 rounded-lg">
                        <Search className="h-6 w-6 mx-auto mb-1 opacity-50" />
                        <p>No ingredients added yet</p>
                        <p className="text-xs">Search for foods to add them</p>
                      </div>
                    )}
                  </div>

                  {/* Total Nutrition Display */}
                  {newFoodIngredients.length > 0 && (
                    <div className="bg-gradient-to-r from-coquette-pink-100 to-coquette-brown-100 p-4 rounded-lg">
                      <Label className="text-coquette-brown-600 font-medium mb-3 block">
                        📊 Total Nutrition ({newFoodIngredients.length} ingredient{newFoodIngredients.length !== 1 ? 's' : ''})
                      </Label>
                      <div className="grid grid-cols-5 gap-2 text-center">
                        <div className="bg-white rounded-lg p-2">
                          <div className="font-bold text-lg text-coquette-brown-600">
                            {calculateTotalNutrition(newFoodIngredients).calories}
                          </div>
                          <div className="text-xs text-coquette-brown-500">Calories</div>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <div className="font-bold text-lg text-blue-600">
                            {calculateTotalNutrition(newFoodIngredients).protein}g
                          </div>
                          <div className="text-xs text-coquette-brown-500">Protein</div>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <div className="font-bold text-lg text-yellow-600">
                            {calculateTotalNutrition(newFoodIngredients).carbs}g
                          </div>
                          <div className="text-xs text-coquette-brown-500">Carbs</div>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <div className="font-bold text-lg text-orange-600">
                            {calculateTotalNutrition(newFoodIngredients).fats}g
                          </div>
                          <div className="text-xs text-coquette-brown-500">Fats</div>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <div className="font-bold text-lg text-green-600">
                            {calculateTotalNutrition(newFoodIngredients).fiber}g
                          </div>
                          <div className="text-xs text-coquette-brown-500">Fiber</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-coquette-brown-600">Servings</Label>
                    <Input
                      type="number"
                      value={newRecipe.servings}
                      onChange={(e) => setNewRecipe({ ...newRecipe, servings: e.target.value })}
                      placeholder="1"
                      className="border-coquette-brown-200"
                    />
                  </div>

                  <div>
                    <Label className="text-coquette-brown-600">Recipe Instructions</Label>
                    <Textarea
                      value={newRecipe.recipe}
                      onChange={(e) => setNewRecipe({ ...newRecipe, recipe: e.target.value })}
                      placeholder="Step-by-step cooking instructions..."
                      className="border-coquette-brown-200"
                      rows={6}
                    />
                  </div>

                  <Button onClick={handleAddRecipe} className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
                    Add Recipe
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </header>

          <main className="flex-1 overflow-auto p-3 sm:p-6">
            <div className="max-w-7xl mx-auto">
              {recipes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {recipes.map(recipe => (
                    <Card
                      key={recipe.id}
                      className="border-coquette-brown-200 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all cursor-pointer"
                      onClick={() => setSelectedRecipe(recipe.id)}
                    >
                      <CardContent className="p-0">
                        <div className="relative">
                          <img
                            src={recipe.image}
                            alt={recipe.name}
                            className="w-full h-32 sm:h-48 object-cover rounded-t-lg"
                          />
                          {recipe.videoUrl && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-t-lg">
                              <Play className="h-12 w-12 text-white" />
                            </div>
                          )}
                          {recipe.category && (
                            <span className="absolute top-2 right-2 bg-coquette-pink-300 text-coquette-brown-600 text-xs px-2 py-1 rounded-full">
                              {recipe.category}
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-coquette-brown-600 mb-2">{recipe.name}</h3>
                          <div className="flex items-center justify-between text-xs text-coquette-brown-500">
                            {recipe.prepTime && <span>⏱️ {recipe.prepTime}</span>}
                            {recipe.servings && <span>🍽️ {recipe.servings} servings</span>}
                          </div>
                          <p className="text-sm text-coquette-brown-500 mt-2">{recipe.calories} cal</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <BookOpen className="h-16 w-16 text-coquette-brown-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-coquette-brown-600 mb-2">No recipes yet</h3>
                  <p className="text-coquette-brown-500 mb-4">Start building your recipe collection!</p>
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Recipe
                  </Button>
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>

      {/* Recipe Detail Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedRecipeData && (
            <>
              <DialogHeader>
                <DialogTitle className="text-coquette-brown-600">{selectedRecipeData.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={selectedRecipeData.image}
                    alt={selectedRecipeData.name}
                    className="w-full h-64 object-contain rounded-lg bg-coquette-brown-50"
                  />
                  {selectedRecipeData.videoUrl && (
                    <Button
                      onClick={() => window.open(selectedRecipeData.videoUrl, '_blank')}
                      className="absolute bottom-4 right-4 bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Watch Recipe
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-3">
                  {selectedRecipeData.servings && (
                    <div className="text-center p-3 bg-coquette-pink-50 rounded-lg">
                      <p className="text-lg font-bold text-coquette-brown-600">{selectedRecipeData.servings}</p>
                      <p className="text-xs text-coquette-brown-500">Servings</p>
                    </div>
                  )}
                  <div className="text-center p-3 bg-coquette-pink-50 rounded-lg">
                    <p className="text-lg font-bold text-coquette-brown-600">{selectedRecipeData.calories}</p>
                    <p className="text-xs text-coquette-brown-500">Calories</p>
                  </div>
                  <div className="text-center p-3 bg-coquette-pink-50 rounded-lg">
                    <p className="text-lg font-bold text-coquette-brown-600">{selectedRecipeData.protein}g</p>
                    <p className="text-xs text-coquette-brown-500">Protein</p>
                  </div>
                  <div className="text-center p-3 bg-coquette-pink-50 rounded-lg">
                    <p className="text-lg font-bold text-coquette-brown-600">{selectedRecipeData.carbs}g</p>
                    <p className="text-xs text-coquette-brown-500">Carbs</p>
                  </div>
                  <div className="text-center p-3 bg-coquette-pink-50 rounded-lg">
                    <p className="text-lg font-bold text-coquette-brown-600">{selectedRecipeData.fats}g</p>
                    <p className="text-xs text-coquette-brown-500">Fats</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-coquette-brown-600 mb-2">Ingredients</h4>
                  <ul className="space-y-1">
                    {selectedRecipeData.ingredients.map((ingredient, idx) => (
                      <li key={idx} className="text-sm text-coquette-brown-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-coquette-pink-400 rounded-full" />
                        {ingredient.name} - {ingredient.amount}
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedRecipeData.recipe && (
                  <div>
                    <h4 className="font-semibold text-coquette-brown-600 mb-2">Instructions</h4>
                    <p className="text-sm text-coquette-brown-600 whitespace-pre-wrap">{selectedRecipeData.recipe}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setAddingToMealPlan(selectedRecipeData.id);
                      setSelectedRecipe(null);
                    }}
                    className="flex-1 bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Add to Meal Plan
                  </Button>
                  <Button
                    onClick={() => handleAddToShoppingList(selectedRecipeData.id)}
                    className="flex-1 bg-coquette-brown-300 hover:bg-coquette-brown-400 text-white"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Shopping List
                  </Button>
                  <Button
                    onClick={() => {
                      handleEditRecipe(selectedRecipeData.id);
                      setSelectedRecipe(null);
                    }}
                    variant="ghost"
                    className="text-coquette-brown-500 hover:bg-coquette-brown-100"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      deleteRecipe(selectedRecipeData.id);
                      setSelectedRecipe(null);
                      toast({
                        title: "Recipe deleted",
                        description: "The recipe has been removed from your bank.",
                      });
                    }}
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add to Meal Plan Dialog */}
      <Dialog open={!!addingToMealPlan} onOpenChange={() => setAddingToMealPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-coquette-brown-600">Add to Meal Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-coquette-brown-600">Select Days</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {daysOfWeek.map(day => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`meal-${day}`}
                      checked={selectedDays.includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                      className="border-coquette-brown-300"
                    />
                    <label
                      htmlFor={`meal-${day}`}
                      className="text-sm font-medium text-coquette-brown-600 cursor-pointer"
                    >
                      {day}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-coquette-brown-600">Meal Type</Label>
              <Select
                value={selectedMealType}
                onValueChange={(value: 'breakfast' | 'lunch' | 'dinner' | 'snack') => setSelectedMealType(value)}
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

            <Button
              onClick={handleAddToMealPlan}
              disabled={selectedDays.length === 0}
              className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
            >
              Add to Meal Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Recipe Dialog - Similar to Add Recipe */}
      <Dialog open={!!editingRecipe} onOpenChange={() => setEditingRecipe(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-coquette-brown-600">Edit Recipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Same fields as Add Recipe but with editRecipeData */}
            <div>
              <Label className="text-coquette-brown-600">Recipe Name</Label>
              <Input
                value={editRecipeData.name}
                onChange={(e) => setEditRecipeData({ ...editRecipeData, name: e.target.value })}
                className="border-coquette-brown-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-coquette-brown-600">Category</Label>
                <Input
                  value={editRecipeData.category}
                  onChange={(e) => setEditRecipeData({ ...editRecipeData, category: e.target.value })}
                  className="border-coquette-brown-200"
                />
              </div>
              <div>
                <Label className="text-coquette-brown-600">Prep Time</Label>
                <Input
                  value={editRecipeData.prepTime}
                  onChange={(e) => setEditRecipeData({ ...editRecipeData, prepTime: e.target.value })}
                  className="border-coquette-brown-200"
                />
              </div>
            </div>

            <div>
              <Label className="text-coquette-brown-600">YouTube Recipe URL</Label>
              <div className="flex gap-2">
                <Input
                  value={editRecipeData.videoUrl}
                  onChange={(e) => setEditRecipeData({ ...editRecipeData, videoUrl: e.target.value })}
                  className="border-coquette-brown-200"
                />
                <Button
                  type="button"
                  onClick={() => fetchYouTubeInfo(editRecipeData.videoUrl, true)}
                  disabled={loadingVideo}
                  className="bg-coquette-brown-300 hover:bg-coquette-brown-400 text-white"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {editRecipeData.image && (
              <div className="relative">
                <img
                  src={editRecipeData.image}
                  alt="Recipe preview"
                  className="w-full h-48 object-contain rounded-lg bg-coquette-brown-50"
                />
                {editRecipeData.videoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                    <Play className="h-16 w-16 text-white" />
                  </div>
                )}
                {!editRecipeData.videoUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCropperImage(editRecipeData.image!);
                      setCropperTarget('editRecipe');
                    }}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white border-coquette-pink-300"
                  >
                    <Crop className="h-4 w-4 mr-1" />
                    Re-crop
                  </Button>
                )}
              </div>
            )}

            <div>
              <Label className="text-coquette-brown-600">Or Upload Image</Label>
              <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-coquette-brown-200 rounded-lg cursor-pointer hover:bg-coquette-pink-50 transition-colors">
                <Upload className="h-5 w-5 text-coquette-brown-500" />
                <span className="text-sm text-coquette-brown-600">{editRecipeData.image ? 'Change Image' : 'Choose Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-coquette-brown-600 font-medium">Ingredients</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNutritionSearchTarget('editRecipe');
                    setNutritionSearchOpen(true);
                  }}
                  className="border-coquette-pink-300 text-coquette-pink-500 hover:bg-coquette-pink-50"
                >
                  <Search className="h-4 w-4 mr-1" />
                  Search & Add Food
                </Button>
              </div>
              
              {/* Added Ingredients List */}
              {editFoodIngredients.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {editFoodIngredients.map((ingredient) => (
                    <div key={ingredient.id} className="bg-coquette-pink-50 p-2 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-coquette-brown-600 text-sm capitalize">
                            {ingredient.name.toLowerCase()}
                          </p>
                          <p className="text-xs text-coquette-brown-400">
                            {ingredient.servings} × {ingredient.servingSize}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFoodIngredient(ingredient.id, 'editRecipe')}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1 text-xs">
                        <span className="bg-white px-1.5 py-0.5 rounded">{ingredient.nutrition.calories} cal</span>
                        <span className="bg-blue-50 px-1.5 py-0.5 rounded">P: {ingredient.nutrition.protein}g</span>
                        <span className="bg-yellow-50 px-1.5 py-0.5 rounded">C: {ingredient.nutrition.carbs}g</span>
                        <span className="bg-orange-50 px-1.5 py-0.5 rounded">F: {ingredient.nutrition.fats}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-coquette-brown-400 text-sm border-2 border-dashed border-coquette-brown-200 rounded-lg">
                  <Search className="h-6 w-6 mx-auto mb-1 opacity-50" />
                  <p>No ingredients added yet</p>
                </div>
              )}
            </div>

            {/* Total Nutrition Display */}
            {editFoodIngredients.length > 0 && (
              <div className="bg-gradient-to-r from-coquette-pink-100 to-coquette-brown-100 p-4 rounded-lg">
                <Label className="text-coquette-brown-600 font-medium mb-3 block">
                  📊 Total Nutrition ({editFoodIngredients.length} ingredient{editFoodIngredients.length !== 1 ? 's' : ''})
                </Label>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div className="bg-white rounded-lg p-2">
                    <div className="font-bold text-lg text-coquette-brown-600">
                      {calculateTotalNutrition(editFoodIngredients).calories}
                    </div>
                    <div className="text-xs text-coquette-brown-500">Calories</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="font-bold text-lg text-blue-600">
                      {calculateTotalNutrition(editFoodIngredients).protein}g
                    </div>
                    <div className="text-xs text-coquette-brown-500">Protein</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="font-bold text-lg text-yellow-600">
                      {calculateTotalNutrition(editFoodIngredients).carbs}g
                    </div>
                    <div className="text-xs text-coquette-brown-500">Carbs</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="font-bold text-lg text-orange-600">
                      {calculateTotalNutrition(editFoodIngredients).fats}g
                    </div>
                    <div className="text-xs text-coquette-brown-500">Fats</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="font-bold text-lg text-green-600">
                      {calculateTotalNutrition(editFoodIngredients).fiber}g
                    </div>
                    <div className="text-xs text-coquette-brown-500">Fiber</div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label className="text-coquette-brown-600">Servings</Label>
              <Input
                type="number"
                value={editRecipeData.servings}
                onChange={(e) => setEditRecipeData({ ...editRecipeData, servings: e.target.value })}
                className="border-coquette-brown-200"
              />
            </div>

            <div>
              <Label className="text-coquette-brown-600">Recipe Instructions</Label>
              <Textarea
                value={editRecipeData.recipe}
                onChange={(e) => setEditRecipeData({ ...editRecipeData, recipe: e.target.value })}
                className="border-coquette-brown-200"
                rows={6}
              />
            </div>

            <Button onClick={handleSaveRecipe} className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Cropper */}
      {cropperImage && (
        <ImageCropper
          imageSrc={cropperImage}
          open={!!cropperImage}
          onCropComplete={handleCroppedImage}
          onCancel={() => {
            setCropperImage(null);
            setCropperTarget(null);
          }}
        />
      )}

      {/* Nutrition Search */}
      <NutritionSearch
        isOpen={nutritionSearchOpen}
        onClose={() => setNutritionSearchOpen(false)}
        onAddIngredient={handleAddFoodIngredient}
      />
    </SidebarProvider>
  );
};

export default RecipeBank;