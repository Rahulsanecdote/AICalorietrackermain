export interface NutritionInfo {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

/**
 * User goal type - consistent across the application
 */
export type UserGoal = 'lose' | 'maintain' | 'gain';

/**
 * Activity level type - consistent across the application
 */
export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active';

export interface Meal {
  id: string;
  description: string;
  foodName: string;
  servingSize: string;
  nutrition: NutritionInfo;
  timestamp: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  // Enhanced fields for recipe details
  recipe?: {
    id: string;
    title: string;
    description: string;
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    servings: number;
    caloriesPerServing: number;
    macros: {
      protein: number;
      carbs: number;
      fat: number;
    };
    ingredients: Array<{
      id: string;
      name: string;
      amount: number;
      unit: string;
      category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'other';
    }>;
    instructions: Array<{
      order: number;
      instruction: string;
      durationMinutes?: number;
    }>;
    prepTips?: string[];
    tags: string[];
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  };
  // Legacy field for simple meal names (used in shopping list)
  name?: string;
}

export interface UserSettings {
  dailyCalorieGoal: number;
  proteinGoal_g: number;
  carbsGoal_g: number;
  fatGoal_g: number;
  // Additional user profile fields for meal planning
  age?: number;
  weight?: number; // in kg
  height?: number; // in cm
  activityLevel?: ActivityLevel;
  goal?: UserGoal;
  dietaryPreferences?: string[]; // e.g., ['vegetarian', 'high_protein', 'low_carb']
  defaultPantry?: PantryData; // User's saved default pantry
}

export interface DailyTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface AIResponse {
  foodName: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  servingSize: string;
}

export interface AppState {
  meals: Meal[];
  settings: UserSettings;
  currentDate: string;
  isLoading: boolean;
  error: string | null;
}

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// New interfaces for meal planning feature
export interface Micronutrients {
  fiber?: number;
  vitaminC?: number;
  iron?: number;
  calcium?: number;
  potassium?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  weightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  micronutrients?: Micronutrients;
  emoji?: string; // Optional - AI may or may not include emojis
  // Enhanced fields for pantry-based planning
  isFromPantry?: boolean; // Indicates if food was from user's available list
  availableInPantry?: boolean; // Food available in user's pantry
}

export interface MealSection {
  type: MealCategory;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  timeEstimate?: string; // e.g., "7:00 AM"
}

export interface DailyMealPlan {
  id: string;
  date: string; // YYYY-MM-DD
  targetCalories: number;
  meals: MealSection[];
  totalMacros: { protein: number; carbs: number; fat: number };
  macroRatio: { protein: number; carbs: number; fat: number }; // percentages
  summary?: string;
  createdAt: string;
  
  // Enhanced fields for pantry-based planning
  accuracyVariance?: number; // Difference between target and actual calories
  sourceType: 'generic' | 'pantry_based';
  usedPantry?: PantryData; // The pantry data used for generation
  regenerationCount?: number; // Number of attempts made to reach accuracy
}

export interface MealPlanTemplate {
  id: string;
  name: string;
  description?: string;
  plan: DailyMealPlan;
  isFavorite: boolean;
  createdAt: string;
}

export interface MealPlanGenerationRequest {
  targetCalories: number;
  goal: UserSettings['goal'];
  activityLevel: UserSettings['activityLevel'];
  dietaryPreferences: string[];
  existingPlan?: DailyMealPlan; // for regeneration
  availableFoods?: PantryData; // User's available foods for pantry-based generation
  generateFromPantry?: boolean; // Flag to use pantry-based generation
}

export interface MealPlanGenerationResponse {
  summary: string;
  meals: Array<{
    type: MealCategory;
    time: string;
    foods: Array<{
      name: string;
      weight: number;
      unit: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
      emoji: string;
    }>;
    totals: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  }>;
  dailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

// Pantry management interfaces
export interface PantryData {
  breakfast: string; // comma-separated foods
  lunch: string; // comma-separated foods
  dinner: string; // comma-separated foods
  snacks: string; // comma-separated foods
  updatedAt: string;
}

// Pantry input component props
export interface PantryInputData {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
}

export interface PantryInputProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PantryInputData;
  onSave: (pantryData: PantryInputData, saveAsDefault: boolean) => void;
  onGeneratePlan: (pantryData: PantryInputData) => void;
}
