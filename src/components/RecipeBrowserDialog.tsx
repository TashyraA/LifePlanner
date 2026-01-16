import React, { useState } from 'react';
import { useMeals } from '../contexts/MealContext';
import { usePlanner } from '../contexts/PlannerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Calendar, ShoppingCart, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface RecipeBrowserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RecipeBrowserDialog: React.FC<RecipeBrowserDialogProps> = ({ open, onOpenChange }) => {
  const { recipes, addRecipeToMealPlan } = useMeals();
  const { addShoppingItem } = usePlanner();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [addingToMealPlan, setAddingToMealPlan] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedRecipeData = recipes.find(r => r.id === selectedRecipe);

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleAddToMealPlan = () => {
    if (addingToMealPlan && selectedDays.length > 0) {
      addRecipeToMealPlan(addingToMealPlan, selectedDays, selectedMealType);
      setAddingToMealPlan(null);
      setSelectedDays([]);
      setSelectedRecipe(null);
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

  return (
    <>
      <Dialog open={open && !selectedRecipe && !addingToMealPlan} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-coquette-brown-600">Browse Recipes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-coquette-brown-400" />
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-coquette-brown-200"
              />
            </div>

            {filteredRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecipes.map(recipe => (
                  <Card
                    key={recipe.id}
                    className="border-coquette-brown-200 bg-white hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSelectedRecipe(recipe.id)}
                  >
                    <CardContent className="p-0">
                      <div className="relative">
                        <img
                          src={recipe.image}
                          alt={recipe.name}
                          className="w-full h-32 object-cover rounded-t-lg"
                        />
                        {recipe.videoUrl && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-t-lg">
                            <Play className="h-8 w-8 text-white" />
                          </div>
                        )}
                        {recipe.category && (
                          <span className="absolute top-2 right-2 bg-coquette-pink-300 text-coquette-brown-600 text-xs px-2 py-1 rounded-full">
                            {recipe.category}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-coquette-brown-600 text-sm mb-1">{recipe.name}</h3>
                        <div className="flex items-center justify-between text-xs text-coquette-brown-500">
                          {recipe.prepTime && <span>⏱️ {recipe.prepTime}</span>}
                          <span>{recipe.calories} cal</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-coquette-brown-400">No recipes found</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Recipe Detail Dialog */}
      <Dialog open={!!selectedRecipe && !addingToMealPlan} onOpenChange={() => setSelectedRecipe(null)}>
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
                    className="w-full h-64 object-cover rounded-lg"
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
              <label className="text-sm font-medium text-coquette-brown-600 mb-2 block">Select Days</label>
              <div className="grid grid-cols-2 gap-2">
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
              <label className="text-sm font-medium text-coquette-brown-600 mb-2 block">Meal Type</label>
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
              className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600 disabled:opacity-50"
            >
              Add to Meal Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};