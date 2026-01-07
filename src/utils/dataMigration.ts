/**
 * Data Migration Utilities
 * Handles schema changes and data versioning for localStorage
 */

import { Meal, UserSettings } from '../types';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../constants';

// Current data version
export const CURRENT_DATA_VERSION = 2;

/**
 * Migration function interface
 */
type MigrationFunction = (data: unknown) => unknown;

/**
 * Migration definitions
 * Each migration transforms data from version N to version N+1
 */
const migrations: Record<number, MigrationFunction> = {
  // Migration from v1 to v2
  1: (data: unknown): unknown => {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const oldData = data as Record<string, unknown>;
    const meals = oldData.meals as unknown[];

    if (!Array.isArray(meals)) {
      return null;
    }

    // Add version field and migrate meals
    const migratedMeals = meals.map((meal) => {
      const m = meal as Record<string, unknown>;
      return {
        ...m,
        // Add any v2 fields here if needed
        // V2 maintains backward compatibility with v1
      };
    });

    return {
      version: 2,
      meals: migratedMeals,
      migratedAt: new Date().toISOString(),
    };
  },
};

/**
 * Migrates data to current version
 */
export function migrateData<T>(data: unknown, fromVersion: number): T {
  let currentData = data;
  let currentVersion = fromVersion;

  while (currentVersion < CURRENT_DATA_VERSION) {
    const migration = migrations[currentVersion + 1];
    if (migration) {
      currentData = migration(currentData);
      currentVersion++;
    } else {
      break;
    }
  }

  return currentData as T;
}

/**
 * Checks if data needs migration
 */
export function needsMigration(
  data: unknown
): { needsMigration: boolean; currentVersion: number } {
  if (!data || typeof data !== 'object') {
    return { needsMigration: true, currentVersion: 0 };
  }

  const dataObj = data as Record<string, unknown>;

  // Check for old storage format (no version field)
  if (!dataObj.version) {
    return { needsMigration: true, currentVersion: 1 };
  }

  const version = dataObj.version as number;
  return { needsMigration: version < CURRENT_DATA_VERSION, currentVersion: version };
}

/**
 * Result type for validation and migration operations
 */
export interface MigrationResult<T> {
  data: T;
  migrated: boolean;
  version: number;
}

/**
 * Validates and migrates meals from localStorage
 */
export function validateAndMigrateMeals(
  rawData: unknown
): MigrationResult<Meal[]> {
  if (!rawData) {
    return { data: [], migrated: false, version: CURRENT_DATA_VERSION };
  }

  // Check if it's the old format (plain array) or new format (object with version)
  if (Array.isArray(rawData)) {
    // Old format - migrate to new format
    const migrated = migrateData({ meals: rawData, version: 1 }, 1) as {
      meals: Meal[];
      version: number;
    };
    return { data: migrated.meals, migrated: true, version: migrated.version };
  }

  if (typeof rawData === 'object') {
    const { needsMigration: nm, currentVersion } = needsMigration(rawData);

    if (nm) {
      const migrated = migrateData(rawData, currentVersion) as {
        meals?: Meal[];
        version: number;
      };
      return {
        data: migrated.meals || [],
        migrated: true,
        version: migrated.version,
      };
    }

    // Already at current version
    const data = rawData as { meals?: Meal[]; version: number };
    return { data: data.meals || [], migrated: false, version: data.version };
  }

  return { data: [], migrated: false, version: CURRENT_DATA_VERSION };
}

/**
 * Validates and migrates settings from localStorage
 */
export function validateAndMigrateSettings(
  rawData: unknown
): MigrationResult<UserSettings> {
  if (!rawData || typeof rawData !== 'object') {
    return {
      data: DEFAULT_SETTINGS,
      migrated: true,
      version: CURRENT_DATA_VERSION,
    };
  }

  const { needsMigration: nm, currentVersion } = needsMigration(rawData);

  if (nm) {
    const migrated = migrateData(rawData, currentVersion) as {
      settings?: UserSettings;
      version: number;
    };
    return {
      data: mergedSettings(migrated.settings, DEFAULT_SETTINGS),
      migrated: true,
      version: migrated.version,
    };
  }

  return {
    data: rawData as UserSettings,
    migrated: false,
    version: currentVersion,
  };
}

/**
 * Merges partial settings with defaults, ensuring all required fields are present
 */
function mergedSettings(
  partial: Partial<UserSettings> | undefined,
  defaults: UserSettings
): UserSettings {
  if (!partial) {
    return defaults;
  }

  return {
    dailyCalorieGoal:
      typeof partial.dailyCalorieGoal === 'number'
        ? partial.dailyCalorieGoal
        : defaults.dailyCalorieGoal,
    proteinGoal_g:
      typeof partial.proteinGoal_g === 'number'
        ? partial.proteinGoal_g
        : defaults.proteinGoal_g,
    carbsGoal_g:
      typeof partial.carbsGoal_g === 'number'
        ? partial.carbsGoal_g
        : defaults.carbsGoal_g,
    fatGoal_g:
      typeof partial.fatGoal_g === 'number'
        ? partial.fatGoal_g
        : defaults.fatGoal_g,
    age: typeof partial.age === 'number' ? partial.age : defaults.age,
    weight:
      typeof partial.weight === 'number' ? partial.weight : defaults.weight,
    height:
      typeof partial.height === 'number' ? partial.height : defaults.height,
    activityLevel:
      partial.activityLevel ?? defaults.activityLevel,
    goal: partial.goal ?? defaults.goal,
    dietaryPreferences: partial.dietaryPreferences ?? defaults.dietaryPreferences,
  };
}

/**
 * Creates initial data structure with version
 */
export function createVersionedData<T>(
  data: T,
  version: number = CURRENT_DATA_VERSION
): { data: T; version: number; createdAt: string } {
  return {
    data,
    version,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Extracts data from versioned wrapper
 */
export function extractFromVersioned<T>(versionedData: unknown): T | null {
  if (!versionedData || typeof versionedData !== 'object') {
    return null;
  }

  const data = versionedData as { data?: T; version?: number };

  if (!data.data) {
    return null;
  }

  return data.data;
}

/**
 * Cleans corrupted data from localStorage
 */
export function cleanCorruptedData(key: string): boolean {
  try {
    localStorage.removeItem(key);
    console.log(`Cleaned corrupted data for key: ${key}`);
    return true;
  } catch (error) {
    console.error(`Failed to clean corrupted data for key ${key}:`, error);
    return false;
  }
}

/**
 * Recovers data from backup storage
 */
export function recoverFromBackup(backupKey: string): unknown {
  try {
    const backup = localStorage.getItem(backupKey);
    if (backup) {
      return JSON.parse(backup);
    }
  } catch (error) {
    console.error(`Failed to recover from backup ${backupKey}:`, error);
  }
  return null;
}

/**
 * Creates a backup of current data with timestamp
 */
export function createBackup(key: string, data: unknown): string | null {
  try {
    const backupKey = `${key}_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(data));
    console.log(`Created backup at: ${backupKey}`);
    return backupKey;
  } catch (error) {
    console.error(`Failed to create backup for ${key}:`, error);
    return null;
  }
}

/**
 * Lists all backup keys for a given data type
 */
export function listBackupKeys(dataType: string): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`${dataType}_backup_`)) {
      keys.push(key);
    }
  }
  return keys.sort().reverse(); // Most recent first
}

/**
 * Clears all backups for a given data type
 */
export function clearBackups(dataType: string): number {
  const backupKeys = listBackupKeys(dataType);
  backupKeys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove backup ${key}:`, error);
    }
  });
  return backupKeys.length;
}
