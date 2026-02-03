/**
 * Food Comparison Validation Utilities
 * 
 * Handles data completeness checking, serving scaling, and validation
 * for the Compare Foods feature.
 */

import { ComparisonFoodItem } from '../types/ai';

// ============================================================================
// Data Completeness
// ============================================================================

/**
 * Calculate data completeness percentage for a food item
 * Weights: calories (30%), protein (20%), carbs (20%), fat (20%), name (10%)
 */
export function calculateDataCompleteness(food: ComparisonFoodItem): number {
    let score = 0;

    // Name (10%)
    if (food.name && food.name.trim().length > 0) score += 10;

    // Calories (30%)
    if (food.calories !== null && food.calories !== undefined) score += 30;

    // Macros (20% each for main 3)
    if (food.macros.protein_g !== null && food.macros.protein_g !== undefined) score += 20;
    if (food.macros.carbs_g !== null && food.macros.carbs_g !== undefined) score += 20;
    if (food.macros.fat_g !== null && food.macros.fat_g !== undefined) score += 20;

    return score;
}

/**
 * Check if a food item has minimum data for comparison
 * Requires: name + (calories OR at least 2 macros)
 */
export function hasMinimumDataForComparison(food: ComparisonFoodItem): boolean {
    if (!food.name || food.name.trim().length === 0) return false;

    const hasCalories = food.calories !== null && food.calories !== undefined;
    const macroCount = [
        food.macros.protein_g,
        food.macros.carbs_g,
        food.macros.fat_g,
    ].filter(v => v !== null && v !== undefined).length;

    return hasCalories || macroCount >= 2;
}

/**
 * Validate both foods for comparison and return issues
 */
export interface ComparisonValidation {
    isValid: boolean;
    canCompare: boolean;
    issues: string[];
    foodACompleteness: number;
    foodBCompleteness: number;
    hasIncompleteData: boolean;
}

export function validateForComparison(
    foodA: ComparisonFoodItem,
    foodB: ComparisonFoodItem
): ComparisonValidation {
    const issues: string[] = [];
    const foodACompleteness = calculateDataCompleteness(foodA);
    const foodBCompleteness = calculateDataCompleteness(foodB);

    // Check names
    if (!foodA.name || foodA.name.trim().length === 0) {
        issues.push('Food A needs a name');
    }
    if (!foodB.name || foodB.name.trim().length === 0) {
        issues.push('Food B needs a name');
    }

    // Check minimum data
    const aHasMinimum = hasMinimumDataForComparison(foodA);
    const bHasMinimum = hasMinimumDataForComparison(foodB);

    if (!aHasMinimum) {
        issues.push('Food A needs calories or at least 2 macros');
    }
    if (!bHasMinimum) {
        issues.push('Food B needs calories or at least 2 macros');
    }

    const hasIncompleteData = foodACompleteness < 100 || foodBCompleteness < 100;
    const canCompare = aHasMinimum && bHasMinimum;

    return {
        isValid: issues.length === 0,
        canCompare,
        issues,
        foodACompleteness,
        foodBCompleteness,
        hasIncompleteData,
    };
}

// ============================================================================
// Serving Size Calculations
// ============================================================================

export interface ServingScaleResult {
    scaledCalories: number | null;
    scaledMacros: {
        protein_g: number | null;
        carbs_g: number | null;
        fat_g: number | null;
    };
}

/**
 * Scale nutrients by serving size ratio
 * @param food - Original food item
 * @param newAmount - New serving amount
 * @param originalAmount - Original serving amount (defaults to 1)
 */
export function scaleByServing(
    food: ComparisonFoodItem,
    newAmount: number,
    originalAmount: number = 1
): ServingScaleResult {
    const ratio = newAmount / originalAmount;

    return {
        scaledCalories: food.calories !== null ? Math.round(food.calories * ratio) : null,
        scaledMacros: {
            protein_g: food.macros.protein_g !== null ? Math.round(food.macros.protein_g * ratio * 10) / 10 : null,
            carbs_g: food.macros.carbs_g !== null ? Math.round(food.macros.carbs_g * ratio * 10) / 10 : null,
            fat_g: food.macros.fat_g !== null ? Math.round(food.macros.fat_g * ratio * 10) / 10 : null,
        },
    };
}

// ============================================================================
// Display Formatting
// ============================================================================

/**
 * Format a nutrient value for display
 * Returns "--" for null/undefined values
 */
export function formatNutrientDisplay(value: number | null | undefined, unit: string = ''): string {
    if (value === null || value === undefined) {
        return '--';
    }
    return `${value}${unit}`;
}

/**
 * Format nutrient for AI prompt (explicit about unknown)
 */
export function formatNutrientForAI(value: number | null | undefined, unit: string): string {
    if (value === null || value === undefined) {
        return 'unknown';
    }
    return `${value}${unit}`;
}

/**
 * Generate disclaimers based on data completeness
 */
export function generateDisclaimers(
    foodA: ComparisonFoodItem,
    foodB: ComparisonFoodItem
): string[] {
    const disclaimers: string[] = [];

    const aCompleteness = calculateDataCompleteness(foodA);
    const bCompleteness = calculateDataCompleteness(foodB);

    if (aCompleteness < 100 || bCompleteness < 100) {
        disclaimers.push('Comparison based on available data. Some values may be incomplete.');
    }

    // Check specific missing fields
    if (foodA.calories === null || foodB.calories === null) {
        disclaimers.push('Calorie data unavailable for one or both foods.');
    }

    if (foodA.macros.protein_g === null || foodB.macros.protein_g === null) {
        disclaimers.push('Protein data incomplete.');
    }

    return disclaimers;
}

/**
 * Get completeness badge color
 */
export function getCompletenessColor(completeness: number): string {
    if (completeness >= 80) return 'text-green-600 bg-green-50';
    if (completeness >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
}

/**
 * Get completeness label
 */
export function getCompletenessLabel(completeness: number): string {
    if (completeness >= 80) return 'Complete';
    if (completeness >= 50) return 'Partial';
    return 'Incomplete';
}
