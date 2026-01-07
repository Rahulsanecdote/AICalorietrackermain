/**
 * Settings Normalization Utility
 *
 * Ensures all settings have valid default values to prevent undefined boundary issues.
 * This eliminates the need for optional chaining throughout the codebase.
 */

import type { UserSettings, ActivityLevel, UserGoal } from "../types"
import { DEFAULT_SETTINGS } from "../constants"

/**
 * Normalizes user settings by filling in missing or invalid values with defaults.
 * This ensures all settings properties are always defined and valid.
 */
export function normalizeSettings(partialSettings: Partial<UserSettings> | null | undefined): UserSettings {
  console.log("[v0] Normalizing settings:", { hasSettings: !!partialSettings, type: typeof partialSettings })

  if (!partialSettings || typeof partialSettings !== "object") {
    console.log("[v0] Using complete defaults - no settings provided")
    return { ...DEFAULT_SETTINGS }
  }

  const normalized: UserSettings = {
    // Core required fields
    dailyCalorieGoal: validateNumber(partialSettings.dailyCalorieGoal, DEFAULT_SETTINGS.dailyCalorieGoal, 500, 10000),
    proteinGoal_g: validateNumber(partialSettings.proteinGoal_g, DEFAULT_SETTINGS.proteinGoal_g, 0, 500),
    carbsGoal_g: validateNumber(partialSettings.carbsGoal_g, DEFAULT_SETTINGS.carbsGoal_g, 0, 1000),
    fatGoal_g: validateNumber(partialSettings.fatGoal_g, DEFAULT_SETTINGS.fatGoal_g, 0, 500),

    // Optional profile fields with defaults
    age: validateNumber(partialSettings.age, DEFAULT_SETTINGS.age, 10, 120),
    weight: validateNumber(partialSettings.weight, DEFAULT_SETTINGS.weight, 20, 500),
    height: validateNumber(partialSettings.height, DEFAULT_SETTINGS.height, 100, 250),
    activityLevel: validateActivityLevel(partialSettings.activityLevel),
    goal: validateGoal(partialSettings.goal),
    dietaryPreferences: validateStringArray(partialSettings.dietaryPreferences, DEFAULT_SETTINGS.dietaryPreferences),

    // Pantry data
    defaultPantry: partialSettings.defaultPantry || undefined,
  }

  console.log("[v0] Settings normalized:", {
    dailyCalorieGoal: normalized.dailyCalorieGoal,
  })

  return normalized
}

/**
 * Validates a number within a range, returning default if invalid
 */
function validateNumber(value: unknown, defaultValue: number, min?: number, max?: number): number {
  if (typeof value !== "number" || isNaN(value)) {
    return defaultValue
  }

  if (min !== undefined && value < min) {
    return defaultValue
  }

  if (max !== undefined && value > max) {
    return defaultValue
  }

  return value
}

/**
 * Validates activity level enum
 */
function validateActivityLevel(value: unknown): ActivityLevel {
  const validLevels: ActivityLevel[] = [
    "sedentary",
    "lightly_active",
    "moderately_active",
    "very_active",
    "extra_active",
  ]

  if (typeof value === "string" && validLevels.includes(value as ActivityLevel)) {
    return value as ActivityLevel
  }

  return DEFAULT_SETTINGS.activityLevel
}

/**
 * Validates goal enum
 */
function validateGoal(value: unknown): UserGoal {
  const validGoals: UserGoal[] = ["lose", "maintain", "gain"]

  if (typeof value === "string" && validGoals.includes(value as UserGoal)) {
    return value as UserGoal
  }

  return DEFAULT_SETTINGS.goal
}

/**
 * Validates string array
 */
function validateStringArray(value: unknown, defaultValue: string[]): string[] {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string")
  }
  return defaultValue
}

/**
 * Checks if settings are valid (used for validation without normalization)
 */
export function isValidSettings(settings: unknown): settings is UserSettings {
  if (!settings || typeof settings !== "object") {
    return false
  }

  const s = settings as Partial<UserSettings>

  // Check required fields
  if (typeof s.dailyCalorieGoal !== "number") return false
  if (typeof s.proteinGoal_g !== "number") return false
  if (typeof s.carbsGoal_g !== "number") return false
  if (typeof s.fatGoal_g !== "number") return false

  return true
}

/**
 * Deep merges user settings, ensuring defaults for missing fields
 */
export function mergeSettings(current: UserSettings, updates: Partial<UserSettings>): UserSettings {
  const merged = {
    ...current,
    ...updates,
  }

  // Normalize the merged result to ensure all fields are valid
  return normalizeSettings(merged)
}
