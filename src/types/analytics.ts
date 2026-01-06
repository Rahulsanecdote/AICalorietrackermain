import { DailyTotals } from './index';

// Weight tracking interfaces
export interface WeightEntry {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  weight: number; // Stored in kg
  note?: string;
  createdAt: string;
}

export interface WeightStats {
  currentWeight: number;
  startWeight: number;
  change: number;
  changePercentage: number;
  bmi: number;
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese';
  totalEntries: number;
}

// Progress photo interfaces
export interface ProgressPhoto {
  id: string;
  date: string;
  frontUrl: string; // Base64 compressed string
  sideUrl?: string; // Optional side view
  backUrl?: string; // Optional back view
  weightAtTime?: number;
  notes?: string;
  createdAt: string;
}

// Report period types
export type ReportPeriod = 'week' | 'month' | 'quarter';

// Report aggregation interfaces
export interface DailyNutritionSummary {
  date: string;
  totals: DailyTotals;
  mealsCount: number;
  goalCalories: number;
  adherencePercentage: number;
}

export interface MacroAverage {
  protein: number;
  carbs: number;
  fat: number;
  percentage: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface NutritionReport {
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  dailySummaries: DailyNutritionSummary[];
  averageCalories: number;
  averageMacros: MacroAverage;
  totalAdherenceScore: number; // 0-100 percentage of days meeting calorie goals
  daysLogged: number;
  totalDays: number;
}

// Settings extensions for analytics
export interface AnalyticsSettings {
  height: number; // in cm, for BMI calculation
  targetWeight: number;
  weeklyWeightGoal: number; // kg per week target
  calorieAdjustmentDays: number; // days to average for calorie suggestions
}
