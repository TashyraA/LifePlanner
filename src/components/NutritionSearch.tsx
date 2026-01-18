import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Search, Loader2, Plus, X, ChevronDown } from 'lucide-react';

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
    setSelectedFood(null);

    try {
      // Try branded foods first for brand name searches
      const response = await fetch(
        `${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(searchQuery)}&pageSize=30`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limited. Please wait a moment and try again.');
        } else if (response.status === 403) {
          throw new Error('API access issue. Try again in a few seconds.');
        }
        throw new Error(`API error: ${response.status}`);
      }

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
    } catch (err: any) {
      console.error('Error searching food:', err);
      setError(err.message || 'Failed to search. Please try again.');
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
      <DialogContent className="w-[95vw] max-w-lg mx-auto p-4 sm:p-6 max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-coquette-brown-600 flex items-center gap-2 text-base sm:text-lg">
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            Search & Add Food
          </DialogTitle>
        </DialogHeader>

        {/* Search Input - Sticky */}
        <div className="flex gap-2 pb-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search (e.g., chicken breast)"
            className="border-coquette-brown-200 text-base"
            style={{ fontSize: '16px' }} // Prevents iOS zoom
          />
          <Button
            onClick={searchFood}
            disabled={isLoading || !searchQuery.trim()}
            className="bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600 px-3"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center py-2">{error}</div>
        )}

        {/* Scrollable Results Area */}
        <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: selectedFood ? '30vh' : '50vh' }}>
          {searchResults.length > 0 && (
            <>
              <div className="text-xs text-coquette-brown-400 mb-2 flex items-center justify-between">
                <span>{searchResults.length} results found</span>
                <span className="flex items-center gap-1">
                  <ChevronDown className="h-3 w-3" />
                  Scroll for more
                </span>
              </div>
              <div className="space-y-2 pb-2">
                {searchResults.map((food) => (
                  <Card
                    key={food.fdcId}
                    className={`p-3 cursor-pointer transition-all active:scale-[0.98] ${
                      selectedFood?.fdcId === food.fdcId
                        ? 'border-2 border-coquette-pink-400 bg-coquette-pink-50'
                        : 'border-coquette-brown-200 hover:border-coquette-pink-300'
                    }`}
                    onClick={() => {
                      setSelectedFood(food);
                      setServings('1');
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <h4 className="font-medium text-coquette-brown-600 text-sm leading-tight capitalize">
                          {food.description.toLowerCase().slice(0, 60)}{food.description.length > 60 ? '...' : ''}
                        </h4>
                        {food.brandName && (
                          <p className="text-xs text-coquette-pink-500 font-medium truncate">{food.brandName}</p>
                        )}
                        <p className="text-xs text-coquette-brown-400">
                          Per {food.servingSize ? `${food.servingSize}${food.servingSizeUnit || 'g'}` : '100g'}
                        </p>
                      </div>
                      {selectedFood?.fdcId === food.fdcId && (
                        <div className="bg-coquette-pink-400 text-white text-xs px-2 py-0.5 rounded">
                          Selected
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1 text-xs">
                      <span className="bg-coquette-brown-100 px-1.5 py-0.5 rounded">{food.nutrients.calories}cal</span>
                      <span className="bg-blue-100 px-1.5 py-0.5 rounded">P:{food.nutrients.protein}g</span>
                      <span className="bg-yellow-100 px-1.5 py-0.5 rounded">C:{food.nutrients.carbs}g</span>
                      <span className="bg-orange-100 px-1.5 py-0.5 rounded">F:{food.nutrients.fats}g</span>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {!selectedFood && searchResults.length === 0 && !isLoading && !error && (
            <div className="text-center py-8 text-coquette-brown-400">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Search for food items</p>
              <p className="text-xs mt-1">Try "chicken breast" or "banana"</p>
            </div>
          )}
        </div>

        {/* Selected Food Panel - Fixed at bottom */}
        {selectedFood && adjustedNutrition && (
          <div className="border-t border-coquette-brown-200 pt-3 mt-2 space-y-3 flex-shrink-0">
            <div className="bg-coquette-pink-50 p-3 rounded-lg">
              <h4 className="font-medium text-coquette-brown-600 text-sm mb-2 capitalize leading-tight">
                {selectedFood.description.toLowerCase().slice(0, 50)}{selectedFood.description.length > 50 ? '...' : ''}
              </h4>
              
              {/* Servings Input */}
              <div className="flex items-center gap-2 mb-3">
                <Label className="text-xs text-coquette-brown-500 whitespace-nowrap">Servings:</Label>
                <Input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  min="0.25"
                  step="0.25"
                  className="w-16 h-8 text-center border-coquette-brown-200"
                  style={{ fontSize: '16px' }}
                />
                <span className="text-xs text-coquette-brown-400 truncate">
                  × {selectedFood.servingSize ? `${selectedFood.servingSize}${selectedFood.servingSizeUnit || 'g'}` : '100g'}
                </span>
              </div>

              {/* Calculated Nutrition - Compact for mobile */}
              <div className="grid grid-cols-5 gap-1 text-center">
                <div className="bg-white rounded p-1.5">
                  <div className="font-bold text-sm text-coquette-brown-600">{adjustedNutrition.calories}</div>
                  <div className="text-[10px] text-coquette-brown-400">Cal</div>
                </div>
                <div className="bg-white rounded p-1.5">
                  <div className="font-bold text-sm text-blue-600">{adjustedNutrition.protein}g</div>
                  <div className="text-[10px] text-coquette-brown-400">Prot</div>
                </div>
                <div className="bg-white rounded p-1.5">
                  <div className="font-bold text-sm text-yellow-600">{adjustedNutrition.carbs}g</div>
                  <div className="text-[10px] text-coquette-brown-400">Carb</div>
                </div>
                <div className="bg-white rounded p-1.5">
                  <div className="font-bold text-sm text-orange-600">{adjustedNutrition.fats}g</div>
                  <div className="text-[10px] text-coquette-brown-400">Fat</div>
                </div>
                <div className="bg-white rounded p-1.5">
                  <div className="font-bold text-sm text-green-600">{adjustedNutrition.fiber}g</div>
                  <div className="text-[10px] text-coquette-brown-400">Fiber</div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedFood(null)}
                className="flex-1 border-coquette-brown-200 h-10"
              >
                <X className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={handleAddIngredient}
                className="flex-1 bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600 h-10"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
