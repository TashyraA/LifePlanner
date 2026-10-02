import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { compressImage, storeImageInIndexedDB, retrieveImageFromIndexedDB, removeImageFromIndexedDB } from '../lib/imageCompression';

export interface IngredientWithNutrition {
  name: string;
  amount: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

export interface Recipe {
  id: string;
  name: string;
  image?: string; // External URL
  imageKey?: string; // IndexedDB key for base64 images
  videoUrl?: string;
  ingredients: IngredientWithNutrition[];
  calories: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  fiber?: number;
  recipe?: string;
  category?: string;
  prepTime?: string;
  servings?: number;
}

export interface Meal {
  id: string;
  name: string;
  day: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  image?: string; // External URL
  imageKey?: string; // IndexedDB key for base64 images
  videoUrl?: string;
  recipe?: string;
  ingredients: IngredientWithNutrition[];
}

interface MealContextType {
  meals: Meal[];
  recipes: Recipe[];
  headerImages: [string, string, string];
  headerImageKeys: [string, string, string];
  addMeal: (meal: Omit<Meal, 'id'>) => void;
  updateMeal: (id: string, updates: Partial<Omit<Meal, 'id'>>) => void;
  deleteMeal: (id: string) => void;
  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  updateRecipe: (id: string, updates: Partial<Omit<Recipe, 'id'>>) => void;
  deleteRecipe: (id: string) => void;
  addRecipeToMealPlan: (recipeId: string, days: string[], mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  updateHeaderImage: (index: 0 | 1 | 2, image: string) => Promise<void>;
  getRecipeImage: (recipeId: string) => Promise<string | undefined>;
  getMealImage: (mealId: string) => Promise<string | undefined>;
  getHeaderImage: (index: 0 | 1 | 2) => Promise<string | undefined>;
}

const MealContext = createContext<MealContextType | null>(null);

const STORAGE_KEY = 'meal_data';

export const MealProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [meals, setMeals] = useState<Meal[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        return data.meals || [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        return data.recipes || [];
      } catch {
        return [];
      }
    }
    return [];
  });

   const [headerImages, setHeaderImages] = useState<[string, string, string]>(['', '', '']);
   const [headerImageKeys, setHeaderImageKeys] = useState<[string, string, string]>(() => {
     const stored = localStorage.getItem(STORAGE_KEY);
     if (stored) {
       try {
         const data = JSON.parse(stored);
         return data.headerImageKeys || ['', '', ''];
       } catch {
         return ['', '', ''];
       }
     }
     return ['', '', ''];
   });

  useEffect(() => {
    const loadHeaderImages = async () => {
      const newImages: [string, string, string] = ['', '', ''];
      for (let i = 0; i < 3; i++) {
        if (headerImageKeys[i]) {
          const image = await retrieveImageFromIndexedDB(headerImageKeys[i]);
          if (image) newImages[i] = image;
        }
      }
      setHeaderImages(newImages);
    };
    loadHeaderImages();
  }, []);

  useEffect(() => {
     const data = { meals, recipes, headerImageKeys };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('localDataSaved'));
   }, [meals, recipes, headerImageKeys]);

  const addMeal = (meal: Omit<Meal, 'id'>) => {
    setMeals(currentMeals => [...currentMeals, { ...meal, id: uuidv4() }]);
  };

  const updateMeal = (id: string, updates: Partial<Omit<Meal, 'id'>>) => {
    setMeals(meals.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMeal = (id: string) => {
    setMeals(meals.filter(m => m.id !== id));
  };

  const addRecipe = (recipe: Omit<Recipe, 'id'>) => {
    setRecipes(currentRecipes => [...currentRecipes, { ...recipe, id: uuidv4() }]);
  };

  const updateRecipe = (id: string, updates: Partial<Omit<Recipe, 'id'>>) => {
    setRecipes(recipes.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRecipe = (id: string) => {
    setRecipes(recipes.filter(r => r.id !== id));
  };

  const addRecipeToMealPlan = (recipeId: string, days: string[], mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      days.forEach(day => {
        addMeal({
          name: recipe.name,
          day,
          mealType,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fats: recipe.fats,
          image: recipe.image,
          imageKey: recipe.imageKey,
          videoUrl: recipe.videoUrl,
          recipe: recipe.recipe,
          ingredients: recipe.ingredients,
        });
      });
    }
  };

  const updateHeaderImage = async (index: 0 | 1 | 2, image: string) => {
    try {
      if (!image) {
        // Clear image
        const oldKey = headerImageKeys[index];
        if (oldKey) {
          await removeImageFromIndexedDB(oldKey);
        }
        const newKeys: [string, string, string] = [...headerImageKeys];
        newKeys[index] = '';
        setHeaderImageKeys(newKeys);
        const newImages: [string, string, string] = [...headerImages];
        newImages[index] = '';
        setHeaderImages(newImages);
        return;
      }

      if (image.startsWith('data:')) {
        // Compress and store in IndexedDB
        const compressed = await compressImage(image);
        const imageKey = `meal_header_${index}_${Date.now()}`;
        await storeImageInIndexedDB(imageKey, compressed);
        
        // Remove old image if exists
        const oldKey = headerImageKeys[index];
        if (oldKey) {
          await removeImageFromIndexedDB(oldKey);
        }
        
        const newKeys: [string, string, string] = [...headerImageKeys];
        newKeys[index] = imageKey;
        setHeaderImageKeys(newKeys);
        const newImages: [string, string, string] = [...headerImages];
        newImages[index] = compressed;
        setHeaderImages(newImages);
      } else {
        // External URL, store directly
        const newImages: [string, string, string] = [...headerImages];
        newImages[index] = image;
        setHeaderImages(newImages);
        const newKeys: [string, string, string] = [...headerImageKeys];
        newKeys[index] = '';
        setHeaderImageKeys(newKeys);
      }
    } catch (error) {
      console.error('Failed to update header image:', error);
      throw error;
    }
  };

  const getHeaderImage = async (index: 0 | 1 | 2): Promise<string | undefined> => {
    if (headerImages[index]) return headerImages[index];
    if (headerImageKeys[index]) {
      return await retrieveImageFromIndexedDB(headerImageKeys[index]);
    }
    return undefined;
  };

  const getRecipeImage = async (recipeId: string): Promise<string | undefined> => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return undefined;
    if (recipe.image) return recipe.image;
    if (recipe.imageKey) {
      return await retrieveImageFromIndexedDB(recipe.imageKey);
    }
    return undefined;
  };

  const getMealImage = async (mealId: string): Promise<string | undefined> => {
    const meal = meals.find(m => m.id === mealId);
    if (!meal) return undefined;
    if (meal.image) return meal.image;
    if (meal.imageKey) {
      return await retrieveImageFromIndexedDB(meal.imageKey);
    }
    return undefined;
  };

  return (
    <MealContext.Provider value={{ 
      meals, 
      recipes, 
      headerImages,
      headerImageKeys,
      addMeal, 
      updateMeal, 
      deleteMeal,
      addRecipe,
      updateRecipe,
      deleteRecipe,
      addRecipeToMealPlan,
      updateHeaderImage,
      getRecipeImage,
      getMealImage,
      getHeaderImage,
    }}>
      {children}
    </MealContext.Provider>
  );
};

export const useMeals = () => {
  const context = useContext(MealContext);
  if (!context) throw new Error('useMeals must be used within MealProvider');
  return context;
};