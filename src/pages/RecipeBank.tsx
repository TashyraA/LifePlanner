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
import { BookOpen, Plus, Trash2, Edit, Link as LinkIcon, Play, Calendar, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateAndCompressImage } from '../lib/imageCompression';
import { Link } from 'react-router-dom';

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

  const [newRecipe, setNewRecipe] = useState({
    name: '',
    image: '',
    videoUrl: '',
    recipe: '',
    category: '',
    prepTime: '',
    servings: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    fiber: '',
  });

  const [newIngredients, setNewIngredients] = useState<{ name: string; amount: string }[]>([
    { name: '', amount: '' }
  ]);

  const [editRecipeData, setEditRecipeData] = useState({
    name: '',
    image: '',
    videoUrl: '',
    recipe: '',
    category: '',
    prepTime: '',
    servings: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    fiber: '',
  });

  const [editIngredients, setEditIngredients] = useState<{ name: string; amount: string }[]>([]);

  const addNewIngredient = () => {
    setNewIngredients([...newIngredients, { name: '', amount: '' }]);
  };

  const removeNewIngredient = (index: number) => {
    if (newIngredients.length > 1) {
      setNewIngredients(newIngredients.filter((_, i) => i !== index));
    }
  };

  const updateNewIngredient = (index: number, field: 'name' | 'amount', value: string) => {
    const updated = [...newIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setNewIngredients(updated);
  };

  const addEditIngredient = () => {
    setEditIngredients([...editIngredients, { name: '', amount: '' }]);
  };

  const removeEditIngredient = (index: number) => {
    if (editIngredients.length > 1) {
      setEditIngredients(editIngredients.filter((_, i) => i !== index));
    }
  };

  const updateEditIngredient = (index: number, field: 'name' | 'amount', value: string) => {
    const updated = [...editIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setEditIngredients(updated);
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
      try {
        const compressedImage = await validateAndCompressImage(file);
        if (isEdit) {
          setEditRecipeData({ ...editRecipeData, image: compressedImage });
        } else {
          setNewRecipe({ ...newRecipe, image: compressedImage });
        }
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

  const handleAddRecipe = () => {
    if (newRecipe.name) {
      const validIngredients = newIngredients.filter(i => i.name.trim()).map(i => ({ name: i.name, amount: i.amount }));

      addRecipe({
        name: newRecipe.name,
        image: newRecipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
        videoUrl: newRecipe.videoUrl,
        ingredients: validIngredients,
        calories: parseFloat(newRecipe.calories) || 0,
        protein: parseFloat(newRecipe.protein) || 0,
        carbs: parseFloat(newRecipe.carbs) || 0,
        fats: parseFloat(newRecipe.fats) || 0,
        fiber: parseFloat(newRecipe.fiber) || 0,
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
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        fiber: '',
      });
      setNewIngredients([{ name: '', amount: '' }]);

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
        calories: recipe.calories?.toString() || '',
        protein: recipe.protein?.toString() || '',
        carbs: recipe.carbs?.toString() || '',
        fats: recipe.fats?.toString() || '',
        fiber: (recipe as any).fiber?.toString() || '',
      });
      // Convert ingredients to simple format
      const simpleIngredients = recipe.ingredients.map(i => ({
        name: i.name,
        amount: i.amount,
      }));
      setEditIngredients(simpleIngredients.length > 0 ? simpleIngredients : [{ name: '', amount: '' }]);
      setEditingRecipe(recipeId);
    }
  };

  const handleSaveRecipe = () => {
    if (editingRecipe && editRecipeData.name) {
      const validIngredients = editIngredients.filter(i => i.name.trim()).map(i => ({ name: i.name, amount: i.amount }));

      updateRecipe(editingRecipe, {
        name: editRecipeData.name,
        image: editRecipeData.image,
        videoUrl: editRecipeData.videoUrl,
        ingredients: validIngredients,
        calories: parseFloat(editRecipeData.calories) || 0,
        protein: parseFloat(editRecipeData.protein) || 0,
        carbs: parseFloat(editRecipeData.carbs) || 0,
        fats: parseFloat(editRecipeData.fats) || 0,
        fiber: parseFloat(editRecipeData.fiber) || 0,
        recipe: editRecipeData.recipe,
        category: editRecipeData.category,
        prepTime: editRecipeData.prepTime,
        servings: parseInt(editRecipeData.servings) || 1,
      });

      setEditingRecipe(null);
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
                    </div>
                  )}

                  <div>
                    <Label className="text-coquette-brown-600">Or Upload Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                      className="border-coquette-brown-200"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-coquette-brown-600 font-medium">Ingredients</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addNewIngredient}
                        className="border-coquette-pink-300 text-coquette-pink-500 hover:bg-coquette-pink-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Ingredient
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {newIngredients.map((ingredient, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="flex-1">
                            <Input
                              value={ingredient.name}
                              onChange={(e) => updateNewIngredient(index, 'name', e.target.value)}
                              placeholder="Ingredient name"
                              className="border-coquette-brown-200"
                            />
                          </div>
                          <div className="w-28">
                            <Input
                              value={ingredient.amount}
                              onChange={(e) => updateNewIngredient(index, 'amount', e.target.value)}
                              placeholder="Amount"
                              className="border-coquette-brown-200"
                            />
                          </div>
                          {newIngredients.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNewIngredient(index)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nutrition Info */}
                  <div className="space-y-3">
                    <Label className="text-coquette-brown-600 font-medium">Nutrition Information (per serving)</Label>
                    <div className="grid grid-cols-5 gap-3">
                      <div>
                        <Label className="text-xs text-coquette-brown-500">Calories</Label>
                        <Input
                          type="number"
                          value={newRecipe.calories}
                          onChange={(e) => setNewRecipe({ ...newRecipe, calories: e.target.value })}
                          placeholder="0"
                          className="border-coquette-brown-200"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-coquette-brown-500">Protein (g)</Label>
                        <Input
                          type="number"
                          value={newRecipe.protein}
                          onChange={(e) => setNewRecipe({ ...newRecipe, protein: e.target.value })}
                          placeholder="0"
                          className="border-coquette-brown-200"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-coquette-brown-500">Carbs (g)</Label>
                        <Input
                          type="number"
                          value={newRecipe.carbs}
                          onChange={(e) => setNewRecipe({ ...newRecipe, carbs: e.target.value })}
                          placeholder="0"
                          className="border-coquette-brown-200"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-coquette-brown-500">Fats (g)</Label>
                        <Input
                          type="number"
                          value={newRecipe.fats}
                          onChange={(e) => setNewRecipe({ ...newRecipe, fats: e.target.value })}
                          placeholder="0"
                          className="border-coquette-brown-200"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-coquette-brown-500">Fiber (g)</Label>
                        <Input
                          type="number"
                          value={newRecipe.fiber}
                          onChange={(e) => setNewRecipe({ ...newRecipe, fiber: e.target.value })}
                          placeholder="0"
                          className="border-coquette-brown-200"
                        />
                      </div>
                    </div>
                  </div>

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
              </div>
            )}

            <div>
              <Label className="text-coquette-brown-600">Or Upload Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, true)}
                className="border-coquette-brown-200"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-coquette-brown-600 font-medium">Ingredients</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEditIngredient}
                  className="border-coquette-pink-300 text-coquette-pink-500 hover:bg-coquette-pink-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Ingredient
                </Button>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {editIngredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        value={ingredient.name}
                        onChange={(e) => updateEditIngredient(index, 'name', e.target.value)}
                        placeholder="Ingredient name"
                        className="border-coquette-brown-200"
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        value={ingredient.amount}
                        onChange={(e) => updateEditIngredient(index, 'amount', e.target.value)}
                        placeholder="Amount"
                        className="border-coquette-brown-200"
                      />
                    </div>
                    {editIngredients.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEditIngredient(index)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition Info */}
            <div className="space-y-3">
              <Label className="text-coquette-brown-600 font-medium">Nutrition Information (per serving)</Label>
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <Label className="text-xs text-coquette-brown-500">Calories</Label>
                  <Input
                    type="number"
                    value={editRecipeData.calories}
                    onChange={(e) => setEditRecipeData({ ...editRecipeData, calories: e.target.value })}
                    placeholder="0"
                    className="border-coquette-brown-200"
                  />
                </div>
                <div>
                  <Label className="text-xs text-coquette-brown-500">Protein (g)</Label>
                  <Input
                    type="number"
                    value={editRecipeData.protein}
                    onChange={(e) => setEditRecipeData({ ...editRecipeData, protein: e.target.value })}
                    placeholder="0"
                    className="border-coquette-brown-200"
                  />
                </div>
                <div>
                  <Label className="text-xs text-coquette-brown-500">Carbs (g)</Label>
                  <Input
                    type="number"
                    value={editRecipeData.carbs}
                    onChange={(e) => setEditRecipeData({ ...editRecipeData, carbs: e.target.value })}
                    placeholder="0"
                    className="border-coquette-brown-200"
                  />
                </div>
                <div>
                  <Label className="text-xs text-coquette-brown-500">Fats (g)</Label>
                  <Input
                    type="number"
                    value={editRecipeData.fats}
                    onChange={(e) => setEditRecipeData({ ...editRecipeData, fats: e.target.value })}
                    placeholder="0"
                    className="border-coquette-brown-200"
                  />
                </div>
                <div>
                  <Label className="text-xs text-coquette-brown-500">Fiber (g)</Label>
                  <Input
                    type="number"
                    value={editRecipeData.fiber}
                    onChange={(e) => setEditRecipeData({ ...editRecipeData, fiber: e.target.value })}
                    placeholder="0"
                    className="border-coquette-brown-200"
                  />
                </div>
              </div>
            </div>

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
    </SidebarProvider>
  );
};

export default RecipeBank;