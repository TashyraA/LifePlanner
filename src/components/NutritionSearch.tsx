import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Loader2, Check, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
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
  onSelect: (nutrition: NutritionData, foodName: string) => void;
}

// USDA FoodData Central API - Free, no key required for demo
const USDA_API_KEY = 'DEMO_KEY';
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

export const NutritionSearch: React.FC<NutritionSearchProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

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
      
      // USDA nutrient IDs
      switch (id) {
        case 1008: // Energy (kcal)
        case 208:
          nutrients.calories = Math.round(value);
          break;
        case 1003: // Protein
        case 203:
          nutrients.protein = Math.round(value * 10) / 10;
          break;
        case 1005: // Carbohydrates
        case 205:
          nutrients.carbs = Math.round(value * 10) / 10;
          break;
        case 1004: // Total fat
        case 204:
          nutrients.fats = Math.round(value * 10) / 10;
          break;
        case 1079: // Fiber
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
        `${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(searchQuery)}&pageSize=15&dataType=Survey%20(FNDDS),Foundation,SR%20Legacy`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch food data');
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
    } catch (err) {
      console.error('Error searching food:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (food: FoodItem) => {
    setSelectedFood(food);
  };

  const confirmSelection = () => {
    if (selectedFood) {
      onSelect(selectedFood.nutrients, selectedFood.description);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFood(null);
    setError(null);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchFood();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-coquette-brown-600 flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Food Nutrition
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for a food (e.g., chicken breast, apple, rice)"
            className="border-coquette-brown-200"
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

        <ScrollArea className="flex-1 max-h-[50vh]">
          <div className="space-y-2 pr-4">
            {searchResults.map((food) => (
              <Card
                key={food.fdcId}
                className={`p-3 cursor-pointer transition-all ${
                  selectedFood?.fdcId === food.fdcId
                    ? 'border-2 border-coquette-pink-400 bg-coquette-pink-50'
                    : 'border-coquette-brown-200 hover:border-coquette-pink-300 hover:bg-coquette-pink-50/50'
                }`}
                onClick={() => handleSelect(food)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-coquette-brown-600 text-sm capitalize">
                      {food.description.toLowerCase()}
                    </h4>
                    {food.brandName && (
                      <p className="text-xs text-coquette-brown-400">{food.brandName}</p>
                    )}
                    {food.servingSize && (
                      <p className="text-xs text-coquette-brown-400">
                        Serving: {food.servingSize} {food.servingSizeUnit}
                      </p>
                    )}
                  </div>
                  {selectedFood?.fdcId === food.fdcId && (
                    <Check className="h-5 w-5 text-coquette-pink-500" />
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="bg-coquette-brown-100 px-2 py-1 rounded">
                    {food.nutrients.calories} cal
                  </span>
                  <span className="bg-blue-100 px-2 py-1 rounded">
                    P: {food.nutrients.protein}g
                  </span>
                  <span className="bg-yellow-100 px-2 py-1 rounded">
                    C: {food.nutrients.carbs}g
                  </span>
                  <span className="bg-orange-100 px-2 py-1 rounded">
                    F: {food.nutrients.fats}g
                  </span>
                  <span className="bg-green-100 px-2 py-1 rounded">
                    Fiber: {food.nutrients.fiber}g
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {selectedFood && (
          <div className="border-t border-coquette-brown-200 pt-4 mt-2">
            <div className="bg-coquette-pink-50 p-3 rounded-lg mb-3">
              <h4 className="font-medium text-coquette-brown-600 text-sm mb-2">
                Selected: {selectedFood.description}
              </h4>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div>
                  <div className="font-bold text-coquette-brown-600">{selectedFood.nutrients.calories}</div>
                  <div className="text-coquette-brown-400">Calories</div>
                </div>
                <div>
                  <div className="font-bold text-blue-600">{selectedFood.nutrients.protein}g</div>
                  <div className="text-coquette-brown-400">Protein</div>
                </div>
                <div>
                  <div className="font-bold text-yellow-600">{selectedFood.nutrients.carbs}g</div>
                  <div className="text-coquette-brown-400">Carbs</div>
                </div>
                <div>
                  <div className="font-bold text-orange-600">{selectedFood.nutrients.fats}g</div>
                  <div className="text-coquette-brown-400">Fats</div>
                </div>
                <div>
                  <div className="font-bold text-green-600">{selectedFood.nutrients.fiber}g</div>
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
                onClick={confirmSelection}
                className="flex-1 bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
              >
                <Check className="h-4 w-4 mr-1" />
                Use This Nutrition
              </Button>
            </div>
          </div>
        )}

        {!selectedFood && searchResults.length === 0 && !isLoading && !error && (
          <div className="text-center py-8 text-coquette-brown-400">
            <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Search for a food item to get its nutritional information</p>
            <p className="text-xs mt-1">Powered by USDA FoodData Central</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
