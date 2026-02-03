/**
 * Deterministic Comparison Scorer
 * 
 * Computes comparison results for all modes using only macro data.
 * No AI calls - pure local computation for instant mode switching.
 */

import { ComparisonFoodItem, ComparisonVerdict } from '../types/ai';

export type ComparisonMode = 'weight-loss' | 'muscle-gain' | 'general-health' | 'energy';

export interface ModeScore {
    foodAScore: number;
    foodBScore: number;
    winner: 'A' | 'B' | 'tie';
    confidence: number;  // 0-1, lower if data incomplete
}

export interface ModeResult {
    mode: ComparisonMode;
    winner: 'A' | 'B' | 'tie';
    summary: string;
    keyDifferences: string[];
    recommendations: string[];
    score: ModeScore;
}

export interface AllModeResults {
    'weight-loss': ModeResult;
    'muscle-gain': ModeResult;
    'general-health': ModeResult;
    'energy': ModeResult;
    hasCompleteData: boolean;
}

// ============================================================================
// Mode-Specific Scoring Weights
// ============================================================================

/**
 * Scoring weights per mode (higher = more important)
 * Score = (weight × normalized_value) for each metric
 */
const MODE_WEIGHTS: Record<ComparisonMode, {
    calories: number;    // positive = higher is better, negative = lower is better
    protein: number;
    carbs: number;
    fat: number;
}> = {
    'weight-loss': {
        calories: -3,    // Lower calories strongly preferred
        protein: 2,      // Higher protein helps preserve muscle
        carbs: -0.5,     // Slightly lower carbs
        fat: -1,         // Lower fat
    },
    'muscle-gain': {
        calories: 1,     // Adequate calories needed
        protein: 4,      // Protein is king for muscle
        carbs: 1.5,      // Carbs fuel workouts
        fat: 0.5,        // Moderate fat ok
    },
    'general-health': {
        calories: -0.5,  // Slightly favor lower calories
        protein: 1.5,    // Good protein important
        carbs: 0.5,      // Moderate carbs
        fat: -0.5,       // Moderate fat
    },
    'energy': {
        calories: 2,     // Higher calories = more energy
        protein: 0.5,    // Protein less critical for immediate energy
        carbs: 3,        // Carbs are primary energy source
        fat: 0.5,        // Fats provide sustained energy
    },
};

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Calculate score for a single food in a given mode
 */
function calculateFoodScore(
    food: ComparisonFoodItem,
    mode: ComparisonMode,
    maxValues: { cal: number; pro: number; carb: number; fat: number }
): { score: number; hasData: boolean } {
    const weights = MODE_WEIGHTS[mode];

    // Check data completeness
    const hasCalories = food.calories !== null;
    const hasProtein = food.macros.protein_g !== null;
    const hasCarbs = food.macros.carbs_g !== null;
    const hasFat = food.macros.fat_g !== null;

    const hasData = hasCalories || hasProtein || hasCarbs || hasFat;

    // Normalize values to 0-1 range (relative to max)
    const normCal = hasCalories ? (food.calories! / Math.max(maxValues.cal, 1)) : 0.5;
    const normPro = hasProtein ? (food.macros.protein_g! / Math.max(maxValues.pro, 1)) : 0.5;
    const normCarb = hasCarbs ? (food.macros.carbs_g! / Math.max(maxValues.carb, 1)) : 0.5;
    const normFat = hasFat ? (food.macros.fat_g! / Math.max(maxValues.fat, 1)) : 0.5;

    // Calculate weighted score
    const score =
        weights.calories * normCal +
        weights.protein * normPro +
        weights.carbs * normCarb +
        weights.fat * normFat;

    return { score, hasData };
}

/**
 * Calculate scores for both foods in a mode
 */
export function scoreFoodsForMode(
    foodA: ComparisonFoodItem,
    foodB: ComparisonFoodItem,
    mode: ComparisonMode
): ModeScore {
    // Find max values for normalization
    const maxValues = {
        cal: Math.max(foodA.calories ?? 0, foodB.calories ?? 0, 100),
        pro: Math.max(foodA.macros.protein_g ?? 0, foodB.macros.protein_g ?? 0, 10),
        carb: Math.max(foodA.macros.carbs_g ?? 0, foodB.macros.carbs_g ?? 0, 10),
        fat: Math.max(foodA.macros.fat_g ?? 0, foodB.macros.fat_g ?? 0, 5),
    };

    const scoreA = calculateFoodScore(foodA, mode, maxValues);
    const scoreB = calculateFoodScore(foodB, mode, maxValues);

    // Determine winner with threshold for ties
    const diff = scoreA.score - scoreB.score;
    const threshold = 0.5; // Scores within 0.5 = tie

    let winner: 'A' | 'B' | 'tie';
    if (Math.abs(diff) < threshold) {
        winner = 'tie';
    } else {
        winner = diff > 0 ? 'A' : 'B';
    }

    // Confidence based on data completeness
    const aComplete = (foodA.dataCompleteness ?? 50) / 100;
    const bComplete = (foodB.dataCompleteness ?? 50) / 100;
    const confidence = (aComplete + bComplete) / 2;

    return {
        foodAScore: scoreA.score,
        foodBScore: scoreB.score,
        winner,
        confidence,
    };
}

// ============================================================================
// Result Generation
// ============================================================================

/**
 * Generate human-readable result for a mode
 */
function generateModeResult(
    foodA: ComparisonFoodItem,
    foodB: ComparisonFoodItem,
    mode: ComparisonMode,
    score: ModeScore
): ModeResult {
    const winnerFood = score.winner === 'A' ? foodA : score.winner === 'B' ? foodB : null;
    const loserFood = score.winner === 'A' ? foodB : score.winner === 'B' ? foodA : null;

    // Generate summary based on mode
    const summaries: Record<ComparisonMode, () => string> = {
        'weight-loss': () => {
            if (score.winner === 'tie') return `Both foods are similar for weight loss goals.`;
            const winCal = winnerFood?.calories ?? 0;
            const loseCal = loserFood?.calories ?? 0;
            const diff = Math.abs(winCal - loseCal);
            return `${winnerFood?.name} is better for weight loss with ${diff > 50 ? `${diff} fewer calories` : 'a more favorable macro profile'}.`;
        },
        'muscle-gain': () => {
            if (score.winner === 'tie') return `Both foods provide similar support for muscle building.`;
            const winPro = winnerFood?.macros.protein_g ?? 0;
            return `${winnerFood?.name} offers ${winPro}g protein, making it better for muscle gain.`;
        },
        'general-health': () => {
            if (score.winner === 'tie') return `Both foods are reasonably balanced for general health.`;
            return `${winnerFood?.name} has a more balanced nutritional profile for overall health.`;
        },
        'energy': () => {
            if (score.winner === 'tie') return `Both foods provide similar energy levels.`;
            const winCarb = winnerFood?.macros.carbs_g ?? 0;
            const winCal = winnerFood?.calories ?? 0;
            return `${winnerFood?.name} provides more energy with ${winCarb}g carbs and ${winCal} calories.`;
        },
    };

    // Generate key differences
    const keyDifferences = generateKeyDifferences(foodA, foodB, mode);

    // Generate recommendations
    const recommendations = generateRecommendations(foodA, foodB, mode, score.winner);

    return {
        mode,
        winner: score.winner,
        summary: summaries[mode](),
        keyDifferences,
        recommendations,
        score,
    };
}

/**
 * Generate key differences based on macro deltas
 */
function generateKeyDifferences(
    foodA: ComparisonFoodItem,
    foodB: ComparisonFoodItem,
    mode: ComparisonMode
): string[] {
    const differences: string[] = [];

    // Calorie difference
    const calA = foodA.calories ?? 0;
    const calB = foodB.calories ?? 0;
    if (calA !== calB) {
        const calDiff = Math.abs(calA - calB);
        const higher = calA > calB ? foodA.name : foodB.name;
        differences.push(`${higher} has ${calDiff} more calories`);
    }

    // Protein difference
    const proA = foodA.macros.protein_g ?? 0;
    const proB = foodB.macros.protein_g ?? 0;
    if (Math.abs(proA - proB) >= 2) {
        const higher = proA > proB ? foodA.name : foodB.name;
        differences.push(`${higher} has ${Math.abs(proA - proB).toFixed(1)}g more protein`);
    }

    // Carbs difference (relevant for weight-loss and energy)
    const carbA = foodA.macros.carbs_g ?? 0;
    const carbB = foodB.macros.carbs_g ?? 0;
    if (Math.abs(carbA - carbB) >= 5 && (mode === 'weight-loss' || mode === 'energy')) {
        const higher = carbA > carbB ? foodA.name : foodB.name;
        differences.push(`${higher} has ${Math.abs(carbA - carbB).toFixed(1)}g more carbs`);
    }

    // Fat difference
    const fatA = foodA.macros.fat_g ?? 0;
    const fatB = foodB.macros.fat_g ?? 0;
    if (Math.abs(fatA - fatB) >= 3) {
        const higher = fatA > fatB ? foodA.name : foodB.name;
        differences.push(`${higher} has ${Math.abs(fatA - fatB).toFixed(1)}g more fat`);
    }

    return differences.slice(0, 3); // Max 3 differences
}

/**
 * Generate recommendations per mode
 */
function generateRecommendations(
    foodA: ComparisonFoodItem,
    foodB: ComparisonFoodItem,
    mode: ComparisonMode,
    winner: 'A' | 'B' | 'tie'
): string[] {
    const recs: string[] = [];
    const winnerFood = winner === 'A' ? foodA : winner === 'B' ? foodB : null;

    switch (mode) {
        case 'weight-loss':
            if (winnerFood) {
                recs.push(`Choose ${winnerFood.name} to stay in a calorie deficit`);
            }
            recs.push(`Pair with vegetables to increase volume without extra calories`);
            break;

        case 'muscle-gain':
            if (winnerFood) {
                recs.push(`${winnerFood.name} supports protein synthesis better`);
            }
            recs.push(`Combine with strength training for best results`);
            break;

        case 'general-health':
            recs.push(`Both can fit a balanced diet in moderation`);
            if (winnerFood) {
                recs.push(`${winnerFood.name} offers slightly better macro balance`);
            }
            break;

        case 'energy':
            if (winnerFood) {
                recs.push(`Have ${winnerFood.name} 1-2 hours before activity`);
            }
            recs.push(`Carbs provide quick energy; fats give sustained fuel`);
            break;
    }

    return recs.slice(0, 2);
}

// ============================================================================
// Main Export: Compute All Modes
// ============================================================================

/**
 * Compute comparison results for ALL modes at once
 * This enables instant mode switching without re-fetching
 */
export function computeAllModes(
    foodA: ComparisonFoodItem,
    foodB: ComparisonFoodItem
): AllModeResults {
    const modes: ComparisonMode[] = ['weight-loss', 'muscle-gain', 'general-health', 'energy'];

    const results = {} as AllModeResults;

    for (const mode of modes) {
        const score = scoreFoodsForMode(foodA, foodB, mode);
        results[mode] = generateModeResult(foodA, foodB, mode, score);
    }

    // Check overall data completeness
    const aComplete = foodA.dataCompleteness ?? 0;
    const bComplete = foodB.dataCompleteness ?? 0;
    results.hasCompleteData = aComplete >= 80 && bComplete >= 80;

    return results;
}

/**
 * Convert ModeResult to ComparisonVerdict for compatibility
 */
export function modeResultToVerdict(
    result: ModeResult,
    hasIncompleteData: boolean
): ComparisonVerdict {
    return {
        summary: result.summary,
        winner: result.winner,
        keyDifferences: result.keyDifferences,
        recommendations: result.recommendations,
        context: result.mode,
        disclaimers: hasIncompleteData
            ? ['Comparison based on available nutrition data.']
            : undefined,
    };
}
