// --- Ingredients & Recipes ---

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string; // e.g., "g", "oz", "cup", "pcs"
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'other';
}

export interface CookingStep {
  order: number;
  instruction: string;
  durationMinutes?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  caloriesPerServing: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  ingredients: Ingredient[];
  instructions: CookingStep[];
  prepTips?: string[]; // Specific tips for meal prepping this item in advance
  tags: string[]; // e.g., "keto", "high-protein", "freezable"
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

// --- Shopping List ---

export interface ShoppingItem extends Ingredient {
  checked: boolean;
  sourceRecipeIds: string[]; // To know which meal requires this item
  recipeNames: string[]; // Human-readable recipe names
}

export interface ShoppingList {
  id: string;
  weekStartDate: string; // ISO Date
  items: ShoppingItem[];
  generatedAt: string;
}

// --- Favorites ---

export interface FavoriteMeal {
  recipeId: string;
  addedAt: string;
  mealPlanId?: string; // Reference to original meal in plan if applicable
}

// --- Meal Prep ---

export interface MealPrepSuggestion {
  id: string;
  day: string; // ISO date
  title: string;
  description: string;
  tasks: {
    task: string;
    duration: number;
    isBatchTask: boolean; // True if can be done for multiple meals
  }[];
  affectedMeals: string[]; // Recipe IDs
}
