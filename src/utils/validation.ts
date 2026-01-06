/**
 * Validation Utilities
 * Input validation, data sanitization, and data integrity checks
 */

import { Meal, UserSettings, NutritionInfo } from '../types';
import { VALIDATION_RULES } from '../constants';

/**
 * Standard validation result type for consistent error handling
 */
export interface ValidationResult<T = void> {
  valid: boolean;
  error?: string;
  data?: T;
}

/**
 * Sanitizes user input to prevent XSS and other injection attacks
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .slice(0, VALIDATION_RULES.MAX_MEAL_DESCRIPTION_LENGTH);
}

/**
 * Validates meal description input
 */
export function validateMealDescription(
  input: string
): ValidationResult<string> {
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return { valid: false, error: 'Meal description cannot be empty' };
  }

  const trimmed = input.trim();

  if (trimmed.length < VALIDATION_RULES.MIN_MEAL_DESCRIPTION_LENGTH) {
    return {
      valid: false,
      error: `Description too short (minimum ${VALIDATION_RULES.MIN_MEAL_DESCRIPTION_LENGTH} characters)`,
    };
  }

  if (trimmed.length > VALIDATION_RULES.MAX_MEAL_DESCRIPTION_LENGTH) {
    return {
      valid: false,
      error: `Description too long (maximum ${VALIDATION_RULES.MAX_MEAL_DESCRIPTION_LENGTH} characters)`,
    };
  }

  return { valid: true, data: trimmed };
}

/**
 * Validates nutrition data with comprehensive bounds checking
 */
export function validateNutritionData(
  data: Partial<NutritionInfo>
): ValidationResult<NutritionInfo> {
  const errors: string[] = [];
  const validated: NutritionInfo = {
    calories: data.calories ?? 0,
    protein_g: data.protein_g ?? 0,
    carbs_g: data.carbs_g ?? 0,
    fat_g: data.fat_g ?? 0,
  };

  if (validated.calories < 0) {
    errors.push('Calories cannot be negative');
  } else if (validated.calories > VALIDATION_RULES.MAX_CALORIES_PER_DAY) {
    errors.push(`Calories exceed daily maximum of ${VALIDATION_RULES.MAX_CALORIES_PER_DAY}`);
  }

  if (validated.protein_g < 0) {
    errors.push('Protein cannot be negative');
  } else if (validated.protein_g > VALIDATION_RULES.MAX_PROTEIN_G) {
    errors.push(`Protein exceeds maximum of ${VALIDATION_RULES.MAX_PROTEIN_G}g`);
  }

  if (validated.carbs_g < 0) {
    errors.push('Carbs cannot be negative');
  } else if (validated.carbs_g > VALIDATION_RULES.MAX_CARBS_G) {
    errors.push(`Carbs exceed maximum of ${VALIDATION_RULES.MAX_CARBS_G}g`);
  }

  if (validated.fat_g < 0) {
    errors.push('Fat cannot be negative');
  } else if (validated.fat_g > VALIDATION_RULES.MAX_FAT_G) {
    errors.push(`Fat exceeds maximum of ${VALIDATION_RULES.MAX_FAT_G}g`);
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }

  return { valid: true, data: validated };
}

/**
 * Validates a complete meal object with full structure verification
 */
export function validateMeal(
  data: unknown
): ValidationResult<Meal> {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid meal data format: expected object' };
  }

  const meal = data as Record<string, unknown>;

  // Validate required string fields
  if (!meal.id || typeof meal.id !== 'string') {
    return { valid: false, error: 'Missing or invalid meal ID' };
  }

  if (!meal.timestamp || typeof meal.timestamp !== 'string') {
    return { valid: false, error: 'Missing or invalid timestamp' };
  }

  // Validate meal category
  const validCategories = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
  if (!meal.category || !validCategories.includes(meal.category as typeof validCategories[number])) {
    return { valid: false, error: 'Invalid or missing meal category' };
  }

  // Validate nutrition data
  const nutrition = meal.nutrition as Record<string, unknown> | undefined;
  if (!nutrition || typeof nutrition !== 'object') {
    return { valid: false, error: 'Missing or invalid nutrition data' };
  }

  const nutritionValidation = validateNutritionData({
    calories: typeof nutrition.calories === 'number' ? nutrition.calories : undefined,
    protein_g: typeof nutrition.protein_g === 'number' ? nutrition.protein_g : undefined,
    carbs_g: typeof nutrition.carbs_g === 'number' ? nutrition.carbs_g : undefined,
    fat_g: typeof nutrition.fat_g === 'number' ? nutrition.fat_g : undefined,
  });

  if (!nutritionValidation.valid) {
    return { valid: false, error: nutritionValidation.error };
  }

  return {
    valid: true,
    data: {
      id: meal.id as string,
      description: sanitizeInput(meal.description ?? ''),
      foodName: sanitizeInput(meal.foodName ?? 'Unknown'),
      servingSize: sanitizeInput(meal.servingSize ?? '1 serving'),
      category: meal.category as typeof validCategories[number],
      nutrition: nutritionValidation.data!,
      timestamp: meal.timestamp as string,
      recipe: meal.recipe as Meal['recipe'],
    },
  };
}

/**
 * Validates user settings with comprehensive checks
 */
export function validateUserSettings(
  settings: unknown
): ValidationResult<UserSettings> {
  if (!settings || typeof settings !== 'object') {
    return { valid: false, error: 'Invalid settings format: expected object' };
  }

  const s = settings as Record<string, unknown>;
  const errors: string[] = [];
  const validated: Partial<UserSettings> = {};

  // Validate daily calorie goal
  if (s.dailyCalorieGoal !== undefined) {
    if (
      typeof s.dailyCalorieGoal !== 'number' ||
      s.dailyCalorieGoal < VALIDATION_RULES.MIN_CALORIES_PER_DAY ||
      s.dailyCalorieGoal > VALIDATION_RULES.MAX_CALORIES_PER_DAY
    ) {
      errors.push(
        `Daily calorie goal must be between ${VALIDATION_RULES.MIN_CALORIES_PER_DAY} and ${VALIDATION_RULES.MAX_CALORIES_PER_DAY}`
      );
    } else {
      validated.dailyCalorieGoal = s.dailyCalorieGoal;
    }
  }

  // Validate API key if provided
  if (s.apiKey !== undefined && s.apiKey !== '') {
    if (typeof s.apiKey !== 'string') {
      errors.push('API key must be a string');
    } else if (s.apiKey.length < VALIDATION_RULES.API_KEY_MIN_LENGTH) {
      errors.push(`API key appears too short (minimum ${VALIDATION_RULES.API_KEY_MIN_LENGTH} characters)`);
    } else {
      validated.apiKey = s.apiKey;
    }
  }

  // Validate macro goals if provided
  if (s.proteinGoal_g !== undefined && typeof s.proteinGoal_g === 'number') {
    validated.proteinGoal_g = s.proteinGoal_g;
  }

  if (s.carbsGoal_g !== undefined && typeof s.carbsGoal_g === 'number') {
    validated.carbsGoal_g = s.carbsGoal_g;
  }

  if (s.fatGoal_g !== undefined && typeof s.fatGoal_g === 'number') {
    validated.fatGoal_g = s.fatGoal_g;
  }

  // Validate optional numeric fields
  if (s.age !== undefined && typeof s.age === 'number') {
    validated.age = Math.max(0, Math.min(150, s.age));
  }

  if (s.weight !== undefined && typeof s.weight === 'number') {
    validated.weight = Math.max(0, Math.min(500, s.weight));
  }

  if (s.height !== undefined && typeof s.height === 'number') {
    validated.height = Math.max(0, Math.min(300, s.height));
  }

  // Validate activity level
  const validActivityLevels = [
    'sedentary',
    'lightly_active',
    'moderately_active',
    'very_active',
    'extra_active',
  ] as const;

  if (
    s.activityLevel !== undefined &&
    typeof s.activityLevel === 'string' &&
    validActivityLevels.includes(s.activityLevel as typeof validActivityLevels[number])
  ) {
    validated.activityLevel = s.activityLevel as typeof validActivityLevels[number];
  }

  // Validate goal
  const validGoals = ['lose', 'maintain', 'gain'] as const;

  if (
    s.goal !== undefined &&
    typeof s.goal === 'string' &&
    validGoals.includes(s.goal as typeof validGoals[number])
  ) {
    validated.goal = s.goal as typeof validGoals[number];
  }

  // Validate dietary preferences
  if (s.dietaryPreferences !== undefined && Array.isArray(s.dietaryPreferences)) {
    validated.dietaryPreferences = s.dietaryPreferences.filter(
      (pref) => typeof pref === 'string'
    );
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }

  return {
    valid: true,
    data: validated as UserSettings,
  };
}

/**
 * Validates API key format for supported providers
 */
export function validateApiKey(
  apiKey: unknown
): ValidationResult<{ provider: 'openai' | 'anthropic'; key: string }> {
  if (!apiKey || typeof apiKey !== 'string') {
    return { valid: false, error: 'API key is required' };
  }

  const trimmed = apiKey.trim();

  if (trimmed.length < VALIDATION_RULES.API_KEY_MIN_LENGTH) {
    return { valid: false, error: 'API key is too short' };
  }

  // Detect provider from key format
  if (trimmed.startsWith('sk-')) {
    return { valid: true, data: { provider: 'openai', key: trimmed } };
  }

  if (trimmed.startsWith('sk-ant-')) {
    return { valid: true, data: { provider: 'anthropic', key: trimmed } };
  }

  return {
    valid: false,
    error:
      'Invalid API key format. OpenAI keys start with "sk-" and Anthropic keys start with "sk-ant-"',
  };
}

/**
 * Validates email format (for future use)
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
}

/**
 * Validates date format (ISO 8601)
 */
export function validateDate(dateString: string): ValidationResult<Date> {
  const date = new Date(dateString);
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  return { valid: true, data: date };
}

/**
 * Sanitizes meal object for safe storage
 */
export function sanitizeMeal(meal: Partial<Meal>): Partial<Meal> {
  return {
    id: meal.id,
    description: sanitizeInput(meal.description ?? ''),
    foodName: sanitizeInput(meal.foodName ?? 'Unknown'),
    servingSize: sanitizeInput(meal.servingSize ?? '1 serving'),
    category: meal.category,
    nutrition: meal.nutrition,
    timestamp: meal.timestamp,
    recipe: meal.recipe,
  };
}

/**
 * Type guard for checking if a value is within acceptable bounds
 */
export function isWithinBounds(
  value: unknown,
  min: number,
  max: number
): value is number {
  return (
    typeof value === 'number' && !isNaN(value) && value >= min && value <= max
  );
}

/**
 * Safe number parser with bounds checking
 */
export function safeParseNumber(
  value: unknown,
  min: number,
  max: number,
  defaultValue: number
): number {
  const parsed = parseFloat(String(value));
  if (isWithinBounds(parsed, min, max)) {
    return parsed;
  }
  return defaultValue;
}

/**
 * Batch validation helper for arrays of items
 */
export function validateArray<T>(
  items: unknown[],
  validator: (item: unknown) => ValidationResult<T>
): ValidationResult<T[]> {
  const validItems: T[] = [];
  const errors: string[] = [];

  items.forEach((item, index) => {
    const result = validator(item);
    if (result.valid && result.data) {
      validItems.push(result.data);
    } else {
      errors.push(`Item at index ${index}: ${result.error ?? 'Unknown error'}`);
    }
  });

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }

  return { valid: true, data: validItems };
}
