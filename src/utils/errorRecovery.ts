/**
 * Error Recovery Utilities
 * Storage corruption detection, data recovery, and backup management
 */

import { STORAGE_KEYS } from '../constants';

// ============================================================================
// Types
// ============================================================================

export interface RecoveryResult {
  success: boolean;
  recoveredData: Record<string, unknown> | null;
  errors: string[];
  backupCreated: boolean;
}

export interface StorageIntegrityReport {
  isCorrupted: boolean;
  corruptedKeys: string[];
  validKeys: string[];
  lastKnownGood: string | null;
}

export interface BackupManifest {
  timestamp: string;
  appVersion: string;
  keys: string[];
  checksum: string;
}

// ============================================================================
// Storage Corruption Detection
// ============================================================================

/**
 * Check if localStorage is accessible
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a single localStorage value
 */
export function validateStorageValue(key: string): { valid: boolean; error?: string } {
  try {
    const value = localStorage.getItem(key);
    if (value === null) {
      return { valid: true }; // Null is valid (key doesn't exist)
    }
    // Try to parse if it looks like JSON
    if (value.startsWith('{') || value.startsWith('[')) {
      JSON.parse(value);
    }
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown parse error',
    };
  }
}

/**
 * Perform full storage integrity check
 */
export function checkStorageIntegrity(): StorageIntegrityReport {
  const corruptedKeys: string[] = [];
  const validKeys: string[] = [];
  let lastKnownGood: string | null = null;

  // Check all keys in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    const validation = validateStorageValue(key);
    if (validation.valid) {
      validKeys.push(key);
      // Track the most recent backup key as last known good
      if (key.startsWith('nutriai_') && key.includes('backup')) {
        lastKnownGood = key;
      }
    } else {
      corruptedKeys.push(key);
    }
  }

  return {
    isCorrupted: corruptedKeys.length > 0,
    corruptedKeys,
    validKeys,
    lastKnownGood,
  };
}

/**
 * Validate specific data structures
 */
export function validateAppData(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Validate settings
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (settings) {
      const parsed = JSON.parse(settings);
      if (typeof parsed.dailyCalorieGoal !== 'number') {
        issues.push('Settings: dailyCalorieGoal is not a number');
      }
    }
  } catch (error) {
    issues.push(`Settings: ${error instanceof Error ? error.message : 'Parse error'}`);
  }

  // Validate meals
  try {
    const meals = localStorage.getItem(STORAGE_KEYS.MEALS);
    if (meals) {
      const parsed = JSON.parse(meals);
      if (!Array.isArray(parsed)) {
        issues.push('Meals: Expected array');
      } else {
        // Validate each meal has required fields
        parsed.forEach((meal, index) => {
          if (!meal.id) issues.push(`Meals[${index}]: Missing id`);
          if (!meal.timestamp) issues.push(`Meals[${index}]: Missing timestamp`);
          if (!meal.nutrition) issues.push(`Meals[${index}]: Missing nutrition`);
        });
      }
    }
  } catch (error) {
    issues.push(`Meals: ${error instanceof Error ? error.message : 'Parse error'}`);
  }

  return { valid: issues.length === 0, issues };
}

// ============================================================================
// Data Recovery
// ============================================================================

/**
 * Attempt to recover data from storage
 */
export function attemptRecovery(): RecoveryResult {
  const errors: string[] = [];
  const recoveredData: Record<string, unknown> = {};
  let backupCreated = false;

  // Create a backup before attempting recovery
  try {
    const backup = createEmergencyBackup();
    if (backup) {
      backupCreated = true;
    }
  } catch (error) {
    errors.push(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Try to recover each key
  const integrity = checkStorageIntegrity();

  integrity.validKeys.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        // Try to parse JSON
        try {
          recoveredData[key] = JSON.parse(value);
        } catch {
          // Store as raw string if not JSON
          recoveredData[key] = value;
        }
      }
    } catch (error) {
      errors.push(`Failed to recover ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Attempt to fix corrupted keys
  integrity.corruptedKeys.forEach((key) => {
    const recoveryResult = attemptKeyRecovery(key);
    if (recoveryResult.success && recoveryResult.data) {
      recoveredData[key] = recoveryResult.data;
      errors.push(`Recovered ${key} with data loss`);
    } else {
      errors.push(`Could not recover ${key}: ${recoveryResult.error}`);
    }
  });

  return {
    success: Object.keys(recoveredData).length > 0,
    recoveredData: Object.keys(recoveredData).length > 0 ? recoveredData : null,
    errors,
    backupCreated,
  };
}

/**
 * Attempt to recover a single corrupted key
 */
function attemptKeyRecovery(key: string): { success: boolean; data: unknown; error?: string } {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) {
      return { success: false, data: null, error: 'Key not found' };
    }

    // Try to extract valid JSON from the string
    const jsonMatch = rawValue.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return { success: true, data: parsed };
      } catch {
        // Return raw value as fallback
        return { success: true, data: rawValue };
      }
    }

    return { success: false, data: null, error: 'Could not parse JSON' };
  } catch (error) {
    return { success: false, data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create an emergency backup before recovery attempts
 */
export function createEmergencyBackup(): string | null {
  try {
    const backupData: Record<string, unknown> = {};
    const timestamp = Date.now();

    // Collect all localStorage data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          try {
            backupData[key] = JSON.parse(value);
          } catch {
            backupData[key] = value;
          }
        }
      }
    }

    // Create manifest
    const manifest: BackupManifest = {
      timestamp: new Date().toISOString(),
      appVersion: import.meta.env.VITE_APP_VERSION ?? 'unknown',
      keys: Object.keys(backupData),
      checksum: generateChecksum(backupData),
    };

    const backupKey = `nutriai_emergency_backup_${timestamp}`;
    const backupValue = {
      manifest,
      data: backupData,
    };

    localStorage.setItem(backupKey, JSON.stringify(backupValue));
    console.log(`Emergency backup created: ${backupKey}`);

    return backupKey;
  } catch (error) {
    console.error('Failed to create emergency backup:', error);
    return null;
  }
}

/**
 * Generate a simple checksum for data integrity verification
 */
function generateChecksum(data: Record<string, unknown>): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

// ============================================================================
// Backup Management
// ============================================================================

/**
 * List all backup keys
 */
export function listBackupKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('backup') || key.includes('emergency'))) {
      keys.push(key);
    }
  }
  return keys.sort().reverse();
}

/**
 * Get the most recent backup
 */
export function getLatestBackup(): { key: string; backup: { manifest: BackupManifest; data: Record<string, unknown> } } | null {
  const backups = listBackupKeys();
  if (backups.length === 0) return null;

  const latestKey = backups[0];
  try {
    const backupData = localStorage.getItem(latestKey);
    if (backupData) {
      const parsed = JSON.parse(backupData);
      return { key: latestKey, backup: parsed };
    }
  } catch (error) {
    console.error('Failed to parse latest backup:', error);
  }

  return null;
}

/**
 * Restore from a specific backup key
 */
export function restoreFromBackup(backupKey: string): { success: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      return { success: false, errors: ['Backup not found'] };
    }

    const backup = JSON.parse(backupData);
    const data = backup.data as Record<string, unknown>;

    // Restore each key from backup
    Object.entries(data).forEach(([key, value]) => {
      try {
        if (typeof value === 'object' && value !== null) {
          localStorage.setItem(key, JSON.stringify(value));
        } else {
          localStorage.setItem(key, String(value));
        }
      } catch (error) {
        errors.push(`Failed to restore ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    return { success: errors.length === 0, errors };
  } catch (error) {
    return { success: false, errors: [`Failed to parse backup: ${error instanceof Error ? error.message : 'Unknown error'}`] };
  }
}

/**
 * Clear old backups, keeping only the most recent N
 */
export function cleanupOldBackups(keepCount: number = 5): number {
  const backups = listBackupKeys();
  if (backups.length <= keepCount) return 0;

  const toRemove = backups.slice(keepCount);
  toRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove backup ${key}:`, error);
    }
  });

  return toRemove.length;
}

/**
 * Download full data export for user portability
 */
export function exportUserData(): Blob | null {
  try {
    const exportData: Record<string, unknown> = {
      exportTimestamp: new Date().toISOString(),
      appVersion: import.meta.env.VITE_APP_VERSION ?? 'unknown',
      userAgent: navigator.userAgent,
      data: {},
    };

    // Collect all localStorage data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          try {
            (exportData.data as Record<string, unknown>)[key] = JSON.parse(value);
          } catch {
            (exportData.data as Record<string, unknown>)[key] = value;
          }
        }
      }
    }

    return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  } catch (error) {
    console.error('Failed to export data:', error);
    return null;
  }
}

/**
 * Download data as file
 */
export function downloadDataExport(filename?: string): void {
  const blob = exportUserData();
  if (!blob) {
    alert('Failed to export data');
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `calorie-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Storage Quota Management
// ============================================================================

/**
 * Get storage usage statistics
 */
export function getStorageStats(): { used: number; available: number; quota: number; percentage: number } {
  let used = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        // Each character is 2 bytes in UTF-16
        used += key.length + value.length;
      }
    }
  }

  const quota = 5 * 1024 * 1024; // 5MB is typical localStorage quota
  const available = Math.max(0, quota - used);

  return {
    used,
    available,
    quota,
    percentage: (used / quota) * 100,
  };
}

/**
 * Check if storage is running low
 */
export function isStorageLow(threshold: number = 80): boolean {
  const stats = getStorageStats();
  return stats.percentage > threshold;
}

/**
 * Suggest cleanup actions when storage is low
 */
export function getStorageCleanupSuggestions(): string[] {
  const suggestions: string[] = [];
  const stats = getStorageStats();

  if (stats.percentage > 80) {
    suggestions.push('Storage is running low. Consider clearing old backups.');
    suggestions.push('Export and remove old meal history if no longer needed.');
  }

  // Check for excessive backups
  const backups = listBackupKeys();
  if (backups.length > 10) {
    suggestions.push(`Found ${backups.length} backups. Consider keeping only the most recent 5.`);
  }

  return suggestions;
}
