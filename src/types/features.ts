// Feature Types for UX Enhancements

// Quick Add Feature Types
export interface QuickAddPayload {
  rawInput: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: number;
}

export interface QuickAddState {
  isOpen: boolean;
  isProcessing: boolean;
  lastMeal: QuickAddMealResult | null;
  error: string | null;
}

export interface QuickAddMealResult {
  id: string;
  foodName: string;
  description: string;
  servingSize: string;
  nutrition: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

// Nutritional Insights Types
export type InsightCategory = 'macronutrient' | 'micronutrient' | 'habit' | 'achievement';
export type InsightSeverity = 'info' | 'warning' | 'positive';

export interface WeeklyInsight {
  id: string;
  generatedAt: number;
  dateRange: { start: string; end: string };
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  description: string;
  actionItem?: string;
}

export interface InsightsState {
  insights: WeeklyInsight[];
  isLoading: boolean;
  lastGenerated: number | null;
  error: string | null;
}

export interface WeeklyStats {
  totalCalories: number;
  avgCaloriesPerDay: number;
  totalProtein: number;
  avgProteinPerDay: number;
  totalCarbs: number;
  avgCarbsPerDay: number;
  totalFat: number;
  avgFatPerDay: number;
  mealCount: number;
  avgMealsPerDay: number;
  dayStreak: number;
  topCategory: string;
}

// Language Support Types
export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'zh';

export interface LanguageConfig {
  code: SupportedLanguage;
  label: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

// Storage Keys
export const STORAGE_KEYS = {
  LANGUAGE: 'nutriai-language',
  INSIGHTS: 'nutriai-insights',
  QUICK_ADD_CACHE: 'nutriai-quick-add-cache',
};
