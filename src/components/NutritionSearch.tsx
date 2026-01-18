import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Search, Loader2, Plus, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

export interface FoodIngredient {
  id: string;
  name: string;
  servings: number;
  servingSize?: string;
  nutrition: NutritionData;
}

interface FoodItem {
  fdcId: number;
  description: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  nutrients: NutritionData;
}

interface NutritionSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIngredient: (ingredient: FoodIngredient) => void;
}

// USDA FoodData Central API
const USDA_API_KEY = 'DEMO_KEY';
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

export const NutritionSearch: React.FC<NutritionSearchProps> = ({
  isOpen,
  onClose,
  onAddIngredient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState('1');

  const extractNutrients = (foodNutrients: any[]): NutritionData => {
    const nutrients: NutritionData = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      fiber: 0,
    };

    foodNutrients?.forEach((nutrient: any) => {
      const id = nutrient.nutrientId || nutrient.number;
      const value = nutrient.value || nutrient.amount || 0;
      
      switch (id) {
        case 1008:
        case 208:
          nutrients.calories = Math.round(value);
          break;
        case 1003:
        case 203:
          nutrients.protein = Math.round(value * 10) / 10;
          break;
        case 1005:
        case 205:
          nutrients.carbs = Math.round(value * 10) / 10;
          break;
        case 1004:
        case 204:
          nutrients.fats = Math.round(value * 10) / 10;
          break;
        case 1079:
        case 291:
          nutrients.fiber = Math.round(value * 10) / 10;
          break;
      }
    });

    return nutrients;
  };

  const searchFood = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      const response = await fetch(
        `${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(searchQuery)}&pageSize=20&dataType=Branded,Survey%20(FNDDS),Foundation,SR%20Legacy`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch food data');

      const data = await response.json();
      
      if (data.foods && data.foods.length > 0) {
        const foods: FoodItem[] = data.foods.map((food: any) => ({
          fdcId: food.fdcId,
          description: food.description,
          brandName: food.brandName || food.brandOwner,
          servingSize: food.servingSize,
          servingSizeUnit: food.servingSizeUnit,
          nutrients: extractNutrients(food.foodNutrients),
        }));
        setSearchResults(foods);
      } else {
        setError('No foods found. Try a different search term.');
      }
    } catch (err) {
      console.error('Error searching food:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddIngredient = () => {
    if (!selectedFood) return;
    
    const servingCount = parseFloat(servings) || 1;
    const ingredient: FoodIngredient = {
      id: `${selectedFood.fdcId}-${Date.now()}`,
      name: selectedFood.description,
      servings: servingCount,
      servingSize: selectedFood.servingSize 
        ? `${selectedFood.servingSize} ${selectedFood.servingSizeUnit || 'g'}`
        : '100g',
      nutrition: {
        calories: Math.round(selectedFood.nutrients.calories * servingCount),
        protein: Math.round(selectedFood.nutrients.protein * servingCount * 10) / 10,
        carbs: Math.round(selectedFood.nutrients.carbs * servingCount * 10) / 10,
        fats: Math.round(selectedFood.nutrients.fats * servingCount * 10) / 10,
        fiber: Math.round(selectedFood.nutrients.fiber * servingCount * 10) / 10,
      },
    };
    
    onAddIngredient(ingredient);
    setSelectedFood(null);
    setServings('1');
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFood(null);
    setServings('1');
    setError(null);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') searchFood();
  };

  // Calculate nutrition based on servings
  const getAdjustedNutrition = () => {
    if (!selectedFood) return null;
    const servingCount = parseFloat(servings) || 1;
    return {
      calories: Math.round(selectedFood.nutrients.calories * servingCount),
      protein: Math.round(selectedFood.nutrients.protein * servingCount * 10) / 10,
      carbs: Math.round(selectedFood.nutrients.carbs * servingCount * 10) / 10,
      fats: Math.round(selectedFood.nutrients.fats * servingCount * 10) / 10,
      fiber: Math.round(selectedFood.nutrients.fiber * servingCount * 10) / 10,
    };
  };

  const adjustedNutrition = getAdjustedNutrition();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-coquette-brown-600 flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Add Ingredient
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search food (e.g., Perdue chicken breast, banana)"
            className="border-coquette-brown-200"
            autoFocus
          />
          <Button
            onClick={searchFood}
            disabled={isLoading || !searchQuery.trim()}
            className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center py-2">{error}</div>
        )}

        <ScrollArea className="flex-1 max-h-[40vh]">
          <div className="space-y-2 pr-4">
            {searchResults.map((food) => (
              <Card
                key={food.fdcId}
                className={`p-3 cursor-pointer transition-all ${
                  selectedFood?.fdcId === food.fdcId
                    ? 'border-2 border-coquette-pink-400 bg-coquette-pink-50'
                    : 'border-coquette-brown-200 hover:border-coquette-pink-300 hover:bg-coquette-pink-50/50'
                }`}
                onClick={() => {
                  setSelectedFood(food);
                  setServings('1');
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-coquette-brown-600 text-sm capitalize">
                      {food.description.toLowerCase()}
                    </h4>
                    {food.brandName && (
                      <p className="text-xs text-coquette-pink-500 font-medium">{food.brandName}</p>
                    )}
                    <p className="text-xs text-coquette-brown-400">
                      Per {food.servingSize ? `${food.servingSize} ${food.servingSizeUnit || 'g'}` : '100g'}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  <span className="bg-coquette-brown-100 px-2 py-0.5 rounded">{food.nutrients.calories} cal</span>
                  <span className="bg-blue-100 px-2 py-0.5 rounded">P: {food.nutrients.protein}g</span>
                  <span className="bg-yellow-100 px-2 py-0.5 rounded">C: {food.nutrients.carbs}g</span>
                  <span className="bg-orange-100 px-2 py-0.5 rounded">F: {food.nutrients.fats}g</span>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {selectedFood && adjustedNutrition && (
          <div className="border-t border-coquette-brown-200 pt-4 mt-2 space-y-3">
            <div className="bg-coquette-pink-50 p-3 rounded-lg">
              <h4 className="font-medium text-coquette-brown-600 text-sm mb-2 capitalize">
                {selectedFood.description.toLowerCase()}
              </h4>
              
              {/* Servings Input */}
              <div className="flex items-center gap-2 mb-3">
                <Label className="text-xs text-coquette-brown-500">Servings:</Label>
                <Input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  min="0.25"
                  step="0.25"
                  className="w-20 h-8 text-center border-coquette-brown-200"
                />
                <span className="text-xs text-coquette-brown-400">
                  × {selectedFood.servingSize ? `${selectedFood.servingSize} ${selectedFood.servingSizeUnit || 'g'}` : '100g'}
                </span>
              </div>

              {/* Calculated Nutrition */}
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="bg-white rounded p-2">
                  <div className="font-bold text-coquette-brown-600">{adjustedNutrition.calories}</div>
                  <div className="text-coquette-brown-400">Cal</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="font-bold text-blue-600">{adjustedNutrition.protein}g</div>
                  <div className="text-coquette-brown-400">Protein</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="font-bold text-yellow-600">{adjustedNutrition.carbs}g</div>
                  <div className="text-coquette-brown-400">Carbs</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="font-bold text-orange-600">{adjustedNutrition.fats}g</div>
                  <div className="text-coquette-brown-400">Fats</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="font-bold text-green-600">{adjustedNutrition.fiber}g</div>
                  <div className="text-coquette-brown-400">Fiber</div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedFood(null)}
                className="flex-1 border-coquette-brown-200"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleAddIngredient}
                className="flex-1 bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Ingredient
              </Button>
            </div>
          </div>
        )}

        {!selectedFood && searchResults.length === 0 && !isLoading && !error && (
          <div className="text-center py-6 text-coquette-brown-400">
            <Search className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Search for food items to add as ingredients</p>
            <p className="text-xs mt-1">Try brand names like "Perdue" or generic foods</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
