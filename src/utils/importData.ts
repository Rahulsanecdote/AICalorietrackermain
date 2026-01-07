import { Meal, UserSettings, MealCategory } from '../types';
import { Recipe } from '../types/recipes';
import { LifestyleEntry } from '../types/lifestyle';
import { STORAGE_KEYS, MEAL_CATEGORIES, BACKUP_VERSION } from '../constants';
import { validateUserSettings } from './validation';
import { normalizeSettings } from './settingsNormalization';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface representing the structure of a backup file
 */
interface BackupStructure {
  meals: unknown[];
  recipes: unknown[];
  lifestyle: unknown[];
  settings?: unknown;
  exportDate: string;
  version: string;
}

/**
 * Result interface for import operations
 */
export interface ImportResult {
  success: boolean;
  meals: Meal[];
  recipes: Recipe[];
  lifestyle: LifestyleEntry[];
  settings?: UserSettings;
  errors: string[];
}

/**
 * Interface for CSV parsing result
 */
interface CSVParseResult {
  meals: Partial<Meal>[];
  errors: string[];
}

/**
 * Validates that the imported data has the correct backup structure
 */
function validateBackupStructure(data: unknown): data is BackupStructure {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const backup = data as Record<string, unknown>;
  return (
    Array.isArray(backup.meals) &&
    Array.isArray(backup.recipes) &&
    Array.isArray(backup.lifestyle) &&
    (backup.settings === undefined || typeof backup.settings === 'object') &&
    typeof backup.exportDate === 'string' &&
    typeof backup.version === 'string'
  );
}

/**
 * Type guard for validating a single meal entry
 */
function isValidMeal(data: unknown): data is Meal {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const meal = data as Record<string, unknown>;
  const hasRequiredFields =
    typeof meal.id === 'string' &&
    typeof meal.foodName === 'string' &&
    typeof meal.description === 'string' &&
    typeof meal.servingSize === 'string' &&
    typeof meal.timestamp === 'string' &&
    typeof meal.category === 'string';

  if (!hasRequiredFields) {
    return false;
  }

  const hasValidNutrition =
    meal.nutrition !== undefined &&
    typeof meal.nutrition === 'object' &&
    typeof (meal.nutrition as Record<string, unknown>).calories === 'number';

  return hasValidNutrition;
}

/**
 * Type guard for validating a single recipe entry
 */
function isValidRecipe(data: unknown): data is Recipe {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const recipe = data as Record<string, unknown>;
  return (
    typeof recipe.id === 'string' &&
    typeof recipe.title === 'string' &&
    typeof recipe.description === 'string' &&
    Array.isArray(recipe.ingredients) &&
    Array.isArray(recipe.instructions)
  );
}

/**
 * Type guard for validating a lifestyle entry
 */
function isValidLifestyleEntry(data: unknown): data is LifestyleEntry {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const entry = data as Record<string, unknown>;
  return typeof entry.type === 'string';
}

/**
 * Parses a JSON file and returns the parsed data
 */
export async function parseJSONFile(file: File): Promise<{ data: unknown; error?: string }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    return { data };
  } catch {
    return { data: null, error: `Failed to parse ${file.name}: Invalid JSON format` };
  }
}

/**
 * Imports data from a backup JSON file
 */
export function importFromBackup(data: unknown): ImportResult {
  const result: ImportResult = {
    success: false,
    meals: [],
    recipes: [],
    lifestyle: [],
    errors: [],
  };

  if (!validateBackupStructure(data)) {
    result.errors.push('Invalid backup file structure. Please ensure the file is a valid backup.');
    return result;
  }

  // Check backup version for compatibility
  const backupVersion = parseInt(data.version, 10);
  if (isNaN(backupVersion) || backupVersion > parseInt(BACKUP_VERSION, 10)) {
    result.errors.push(
      `Incompatible backup version: ${data.version}. Please update the application to import this backup.`
    );
    return result;
  }

  // Validate and transform meals
  data.meals.forEach((meal, index) => {
    if (isValidMeal(meal)) {
      result.meals.push({
        ...meal,
        id: meal.id || uuidv4(),
      });
    } else {
      result.errors.push(`Invalid meal entry at index ${index}`);
    }
  });

  // Validate and transform recipes
  data.recipes.forEach((recipe, index) => {
    if (isValidRecipe(recipe)) {
      result.recipes.push(recipe);
    } else {
      result.errors.push(`Invalid recipe entry at index ${index}`);
    }
  });

  // Validate lifestyle entries
  data.lifestyle.forEach((entry, index) => {
    if (isValidLifestyleEntry(entry)) {
      result.lifestyle.push(entry);
    } else {
      result.errors.push(`Invalid lifestyle entry at index ${index}`);
    }
  });

  // Validate and set settings if present
  if (data.settings && typeof data.settings === 'object') {
    const validation = validateUserSettings(data.settings);
    if (!validation.valid || !validation.data) {
      result.errors.push(validation.error || 'Invalid settings data');
    } else {
      result.settings = normalizeSettings(validation.data);
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Parses CSV content and converts it to meal entries
 */
export function parseCSVFile(content: string): CSVParseResult {
  const result: CSVParseResult = {
    meals: [],
    errors: [],
  };

  const lines = content.split('\n').filter((line) => line.trim());

  if (lines.length < 2) {
    result.errors.push('CSV file must contain headers and at least one data row');
    return result;
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const headerMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  // Validate required columns
  const requiredColumns = ['food name', 'calories'];
  for (const col of requiredColumns) {
    if (!(col in headerMap)) {
      result.errors.push(`Missing required column: ${col}`);
      return result;
    }
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const columns = parseCSVLine(lines[i]);
    if (columns.length < headers.length) {
      continue;
    }

    const foodName = columns[headerMap['food name'] || 0];
    if (!foodName) {
      result.errors.push(`Missing food name at row ${i + 1}`);
      continue;
    }

    const calories = parseFloat(columns[headerMap['calories'] || 0]) || 0;
    const protein = parseFloat(columns[headerMap['protein (g)'] || headerMap['protein'] || 0]) || 0;
    const carbs = parseFloat(columns[headerMap['carbs (g)'] || headerMap['carbs'] || 0]) || 0;
    const fat = parseFloat(columns[headerMap['fat (g)'] || headerMap['fat'] || 0]) || 0;
    const category = columns[headerMap['category'] || 0]?.toLowerCase() || 'snack';
    const description = columns[headerMap['description'] || 0] || foodName;
    const servingSize = columns[headerMap['serving size'] || headerMap['serving'] || 0] || '1 serving';

    // Validate numeric values
    if (isNaN(calories) || calories < 0) {
      result.errors.push(`Invalid calories value at row ${i + 1}`);
      continue;
    }

    const meal: Partial<Meal> = {
      id: uuidv4(),
      foodName,
      description: description || foodName,
      servingSize,
      category: mapCategory(category),
      nutrition: {
        calories,
        protein_g: protein,
        carbs_g: carbs,
        fat_g: fat,
      },
      timestamp: new Date().toISOString(),
    };

    result.meals.push(meal);
  }

  return result;
}

/**
 * Parses a CSV line handling quoted values properly
 */
function parseCSVLine(line: string): string[] {
  const columns: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      columns.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  columns.push(current.trim());
  return columns;
}

/**
 * Maps a category string to a valid MealCategory type
 */
function mapCategory(category: string): MealCategory {
  const normalized = category.toLowerCase().trim();

  if (normalized.includes('break')) {
    return 'breakfast';
  }
  if (normalized.includes('lunch')) {
    return 'lunch';
  }
  if (normalized.includes('dinner') || normalized.includes('supper')) {
    return 'dinner';
  }

  return 'snack';
}

/**
 * Imports meals from a CSV file
 */
export async function importFromCSV(file: File): Promise<CSVParseResult> {
  try {
    const content = await file.text();
    return parseCSVFile(content);
  } catch {
    return { meals: [], errors: [`Failed to read file: ${file.name}`] };
  }
}

/**
 * Generates a CSV template for meal import
 */
export function generateCSVTemplate(): string {
  const headers = [
    'Date',
    'Time',
    'Category',
    'Food Name',
    'Description',
    'Serving Size',
    'Calories',
    'Protein (g)',
    'Carbs (g)',
    'Fat (g)',
  ];

  const exampleRow = [
    new Date().toLocaleDateString(),
    new Date().toLocaleTimeString(),
    'breakfast',
    'Oatmeal',
    'Plain oatmeal with water',
    '1 bowl',
    '150',
    '5',
    '27',
    '3',
  ];

  return [headers.join(','), exampleRow.join(',')].join('\n');
}
