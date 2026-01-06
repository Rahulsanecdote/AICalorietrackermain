/**
 * NutriAI Application Constants
 * Centralized constants to eliminate magic numbers and improve maintainability
 */

import type { ActivityLevel, UserGoal } from "../types"

// Activity level multipliers for TDEE calculation
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
} as const

// Macro ratio targets based on goals
export const MACRO_RATIOS: Record<UserGoal, { protein: number; carbs: number; fat: number }> = {
  lose: { protein: 35, carbs: 40, fat: 25 },
  gain: { protein: 30, carbs: 50, fat: 20 },
  maintain: { protein: 25, carbs: 45, fat: 30 },
} as const

// Calorie distribution across meals
export const MEAL_CALORIE_DISTRIBUTION = {
  breakfast: 0.27, // 27%
  lunch: 0.38, // 38%
  dinner: 0.32, // 32%
  snack: 0.03, // 3%
} as const

// Tolerance thresholds
export const CALORIE_TOLERANCE = 50 // Allow 50 cal variance
export const MACRO_ACCURACY_THRESHOLD = 20 // 20 cal accuracy for meal plans

// Default user settings
export const DEFAULT_SETTINGS: {
  dailyCalorieGoal: number
  apiKey: string
  proteinGoal_g: number
  carbsGoal_g: number
  fatGoal_g: number
  age: number
  weight: number
  height: number
  activityLevel: ActivityLevel
  goal: UserGoal
  dietaryPreferences: string[]
} = {
  dailyCalorieGoal: 2000,
  apiKey: "", // Add apiKey field with empty default
  proteinGoal_g: 150,
  carbsGoal_g: 250,
  fatGoal_g: 65,
  age: 30,
  weight: 70, // kg
  height: 175, // cm
  activityLevel: "moderately_active",
  goal: "maintain",
  dietaryPreferences: [],
}

// Storage keys with versioning
export const STORAGE_KEYS = {
  SETTINGS: "nutriai_settings_v2",
  MEALS: "nutriai_meals_v2",
  MEAL_PLANS: "nutriai_meal_plans_v1",
  TEMPLATES: "nutriai_templates_v1",
  PANTRY: "nutriai_pantry_v1",
  FAVORITES: "nutriai_favorites_v1",
  SHOPPING_LIST: "nutriai_shopping_v1",
  LIFESTYLE: "nutriai_lifestyle_v1",
}

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
]

// Meal categories
export const MEAL_CATEGORIES = ["breakfast", "lunch", "dinner", "snack"] as const

// API configuration
export const API_CONFIG = {
  OPENAI_BASE_URL: "https://api.openai.com/v1/chat/completions",
  ANTHROPIC_BASE_URL: "https://api.anthropic.com/v1/messages",
  MODEL: "gpt-4o-mini",
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.3,
  RATE_LIMIT_DELAY: 1000, // ms between requests
}

// Validation rules
export const VALIDATION_RULES = {
  MAX_MEAL_DESCRIPTION_LENGTH: 500,
  MIN_MEAL_DESCRIPTION_LENGTH: 2,
  MAX_CALORIES_PER_DAY: 10000,
  MIN_CALORIES_PER_DAY: 500,
  MAX_PROTEIN_G: 500,
  MAX_CARBS_G: 1000,
  MAX_FAT_G: 500,
  API_KEY_MIN_LENGTH: 20,
}

// Pantry food categories
export const PANTRY_CATEGORIES = ["breakfast", "lunch", "dinner", "snacks"] as const

// Shopping list categories
export const SHOPPING_CATEGORIES = ["produce", "dairy", "meat", "pantry", "frozen", "other"] as const

// Data versioning
export const CURRENT_DATA_VERSION = 2
export const BACKUP_VERSION = "2"

// Re-export all constants for convenient imports
export type { ActivityLevel, UserGoal } from "../types"
