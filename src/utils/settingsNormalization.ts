/**
 * Settings Normalization Utility
 *
 * Ensures all settings have valid default values and keeps Smart Goal derived
 * values (daily calories and macro goals) synchronized when in auto mode.
 */

import type {
  ActivityLevel,
  CalorieGoalMode,
  GoalAggressiveness,
  HeightUnit,
  SexAtBirth,
  UserGoal,
  UserSettings,
  WeightUnit,
} from "../types";
import { DEFAULT_SETTINGS } from "../constants";
import {
  computeSmartGoalSummary,
  getNormalizedAggressiveness,
} from "./smartGoals";

function validateNumber(
  value: unknown,
  defaultValue: number,
  min?: number,
  max?: number,
): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return defaultValue;
  }

  if (min !== undefined && value < min) return defaultValue;
  if (max !== undefined && value > max) return defaultValue;
  return value;
}

function validateActivityLevel(value: unknown): ActivityLevel {
  const validLevels: ActivityLevel[] = [
    "sedentary",
    "lightly_active",
    "moderately_active",
    "very_active",
    "extra_active",
  ];
  if (typeof value === "string" && validLevels.includes(value as ActivityLevel)) {
    return value as ActivityLevel;
  }
  return DEFAULT_SETTINGS.activityLevel;
}

function validateGoal(value: unknown): UserGoal {
  const validGoals: UserGoal[] = ["lose", "maintain", "gain"];
  if (typeof value === "string" && validGoals.includes(value as UserGoal)) {
    return value as UserGoal;
  }
  return DEFAULT_SETTINGS.goal;
}

function validateStringArray(value: unknown, defaultValue: string[]): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return defaultValue;
}

function validateSexAtBirth(value: unknown): SexAtBirth {
  const valid: SexAtBirth[] = ["male", "female", "unspecified"];
  if (typeof value === "string" && valid.includes(value as SexAtBirth)) {
    return value as SexAtBirth;
  }
  return DEFAULT_SETTINGS.sexAtBirth;
}

function validateCalorieGoalMode(value: unknown): CalorieGoalMode {
  const valid: CalorieGoalMode[] = ["auto", "manual"];
  if (typeof value === "string" && valid.includes(value as CalorieGoalMode)) {
    return value as CalorieGoalMode;
  }
  return DEFAULT_SETTINGS.calorieGoalMode;
}

function validateGoalAggressiveness(value: unknown): GoalAggressiveness {
  const valid: GoalAggressiveness[] = ["mild", "standard", "aggressive", "lean"];
  if (typeof value === "string" && valid.includes(value as GoalAggressiveness)) {
    return value as GoalAggressiveness;
  }
  return DEFAULT_SETTINGS.goalAggressiveness;
}

function validateWeightUnit(value: unknown): WeightUnit {
  if (value === "kg" || value === "lb") return value;
  return DEFAULT_SETTINGS.weightUnit;
}

function validateHeightUnit(value: unknown): HeightUnit {
  if (value === "cm" || value === "ft_in") return value;
  return DEFAULT_SETTINGS.heightUnit;
}

export function normalizeSettings(
  partialSettings: Partial<UserSettings> | null | undefined,
): UserSettings {
  if (!partialSettings || typeof partialSettings !== "object") {
    return { ...DEFAULT_SETTINGS };
  }

  const goal = validateGoal(partialSettings.goal);
  const goalAggressiveness = getNormalizedAggressiveness(
    goal,
    validateGoalAggressiveness(partialSettings.goalAggressiveness),
  );

  const base: UserSettings = {
    dailyCalorieGoal: validateNumber(
      partialSettings.dailyCalorieGoal,
      DEFAULT_SETTINGS.dailyCalorieGoal,
      500,
      10000,
    ),
    proteinGoal_g: validateNumber(
      partialSettings.proteinGoal_g,
      DEFAULT_SETTINGS.proteinGoal_g,
      0,
      500,
    ),
    carbsGoal_g: validateNumber(
      partialSettings.carbsGoal_g,
      DEFAULT_SETTINGS.carbsGoal_g,
      0,
      1000,
    ),
    fatGoal_g: validateNumber(
      partialSettings.fatGoal_g,
      DEFAULT_SETTINGS.fatGoal_g,
      0,
      500,
    ),
    age: validateNumber(partialSettings.age, DEFAULT_SETTINGS.age, 10, 120),
    weight: validateNumber(partialSettings.weight, DEFAULT_SETTINGS.weight, 20, 500),
    height: validateNumber(partialSettings.height, DEFAULT_SETTINGS.height, 100, 250),
    activityLevel: validateActivityLevel(partialSettings.activityLevel),
    goal,
    sexAtBirth: validateSexAtBirth(partialSettings.sexAtBirth),
    calorieGoalMode: validateCalorieGoalMode(partialSettings.calorieGoalMode),
    manualCalorieGoal:
      partialSettings.manualCalorieGoal !== undefined
        ? validateNumber(partialSettings.manualCalorieGoal, DEFAULT_SETTINGS.dailyCalorieGoal, 500, 10000)
        : undefined,
    goalAggressiveness,
    weightUnit: validateWeightUnit(partialSettings.weightUnit),
    heightUnit: validateHeightUnit(partialSettings.heightUnit),
    dietaryPreferences: validateStringArray(
      partialSettings.dietaryPreferences,
      DEFAULT_SETTINGS.dietaryPreferences,
    ),
    defaultPantry: partialSettings.defaultPantry || undefined,
  };

  const smartSummary = computeSmartGoalSummary({
    age: base.age ?? DEFAULT_SETTINGS.age,
    weightKg: base.weight ?? DEFAULT_SETTINGS.weight,
    heightCm: base.height ?? DEFAULT_SETTINGS.height,
    activityLevel: base.activityLevel ?? DEFAULT_SETTINGS.activityLevel,
    goal: base.goal ?? DEFAULT_SETTINGS.goal,
    goalAggressiveness: base.goalAggressiveness ?? DEFAULT_SETTINGS.goalAggressiveness,
    sexAtBirth: base.sexAtBirth ?? DEFAULT_SETTINGS.sexAtBirth,
  });

  if (base.calorieGoalMode === "auto") {
    base.dailyCalorieGoal = smartSummary.smartCalories;
    base.proteinGoal_g = smartSummary.smartMacros.protein;
    base.carbsGoal_g = smartSummary.smartMacros.carbs;
    base.fatGoal_g = smartSummary.smartMacros.fat;
    return base;
  }

  const manualFallback = validateNumber(base.dailyCalorieGoal, DEFAULT_SETTINGS.dailyCalorieGoal, 500, 10000);
  const manualValue =
    base.manualCalorieGoal !== undefined
      ? validateNumber(base.manualCalorieGoal, manualFallback, 500, 10000)
      : manualFallback;

  base.manualCalorieGoal = manualValue;
  base.dailyCalorieGoal = manualValue;
  return base;
}

export function isValidSettings(settings: unknown): settings is UserSettings {
  if (!settings || typeof settings !== "object") {
    return false;
  }

  const s = settings as Partial<UserSettings>;
  return (
    typeof s.dailyCalorieGoal === "number" &&
    typeof s.proteinGoal_g === "number" &&
    typeof s.carbsGoal_g === "number" &&
    typeof s.fatGoal_g === "number"
  );
}

export function mergeSettings(
  current: UserSettings,
  updates: Partial<UserSettings>,
): UserSettings {
  return normalizeSettings({
    ...current,
    ...updates,
  });
}

