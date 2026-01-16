// Data Sync Utility for cross-device data sharing

export interface AppData {
  version: string;
  exportDate: string;
  planner: any;
  finance: any;
  fitness: any;
  meals: any;
  college: any;
  notebook: any;
  budget: any;
  homeBorderImage?: string;
}

const STORAGE_KEYS = {
  planner: 'planner_data',
  finance: 'finance_data',
  fitness: 'fitness_data',
  meals: 'meal_data',
  college: 'college_data',
  notebook: 'notebook_data',
  budget: 'budget_data',
  homeBorderImage: 'home_border_image',
  consumedMeals: 'consumed_meals_data',
  nutritionCalculator: 'nutrition_calculator',
  nutritionProfiles: 'nutrition_profiles',
};

export const exportAllData = (): AppData => {
  const data: AppData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    planner: null,
    finance: null,
    fitness: null,
    meals: null,
    college: null,
    notebook: null,
    budget: null,
  };

  // Collect all localStorage data
  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        (data as any)[key] = JSON.parse(stored);
      }
    } catch (e) {
      // If it's not JSON (like a string), store as-is
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        (data as any)[key] = stored;
      }
    }
  });

  return data;
};

export const importAllData = (data: AppData): { success: boolean; errors: string[] } => {
  const errors: string[] = [];

  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    try {
      const value = (data as any)[key];
      if (value !== null && value !== undefined) {
        if (typeof value === 'string') {
          localStorage.setItem(storageKey, value);
        } else {
          localStorage.setItem(storageKey, JSON.stringify(value));
        }
      }
    } catch (e) {
      errors.push(`Failed to import ${key}: ${e}`);
    }
  });

  return {
    success: errors.length === 0,
    errors,
  };
};

export const downloadDataAsFile = (data: AppData, filename: string = 'lifeplanner-backup.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const readFileAsData = (file: File): Promise<AppData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const getDataSummary = (): {
  planner: { events: number; habits: number };
  finance: { incomes: number; expenses: number };
  meals: { meals: number; recipes: number };
  fitness: { workouts: number; weightEntries: number };
} => {
  const summary = {
    planner: { events: 0, habits: 0 },
    finance: { incomes: 0, expenses: 0 },
    meals: { meals: 0, recipes: 0 },
    fitness: { workouts: 0, weightEntries: 0 },
  };

  try {
    const planner = localStorage.getItem('planner_data');
    if (planner) {
      const data = JSON.parse(planner);
      if (Array.isArray(data)) {
        data.forEach((month: any) => {
          summary.planner.events += month.events?.length || 0;
          summary.planner.habits += month.habits?.length || 0;
        });
      }
    }
  } catch {}

  try {
    const finance = localStorage.getItem('finance_data');
    if (finance) {
      const data = JSON.parse(finance);
      summary.finance.incomes = data.incomes?.length || 0;
      summary.finance.expenses = data.expenses?.length || 0;
    }
  } catch {}

  try {
    const meals = localStorage.getItem('meal_data');
    if (meals) {
      const data = JSON.parse(meals);
      summary.meals.meals = data.meals?.length || 0;
      summary.meals.recipes = data.recipes?.length || 0;
    }
  } catch {}

  try {
    const fitness = localStorage.getItem('fitness_data');
    if (fitness) {
      const data = JSON.parse(fitness);
      summary.fitness.workouts = data.workouts?.length || 0;
      summary.fitness.weightEntries = data.weightEntries?.length || 0;
    }
  } catch {}

  return summary;
};
