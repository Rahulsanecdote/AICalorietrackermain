/**
 * Nutrition Lookup Hook
 * 
 * Provides automatic nutrition lookup for food names.
 * Priority: Catalog > AI Estimation
 */

import { useState, useCallback } from 'react';
import {
    searchFoodCatalog,
    CatalogFood,
    calculateNutritionForServing,
    parseServingToGrams,
    CalculatedNutrition
} from '../data/foodCatalog';
import { ComparisonFoodItem } from '../types/ai';
import { API_CONFIG } from '../constants';
import { postAIChat } from '../utils/aiClient';
import { extractJsonFromAIResponse } from '../utils/safeParseAI';

export type NutritionSource = 'catalog' | 'logged' | 'estimated' | 'manual';

export interface LookupResult {
    found: boolean;
    nutrition: CalculatedNutrition | null;
    source: NutritionSource;
    catalogFood?: CatalogFood;
    error?: string;
}

export interface UseNutritionLookupReturn {
    // Search suggestions
    searchSuggestions: CatalogFood[];
    search: (query: string) => void;
    clearSuggestions: () => void;

    // Lookup
    lookupFood: (name: string, serving: string) => Promise<LookupResult>;

    // State
    isLoading: boolean;
}

/**
 * Hook for nutrition lookup with autocomplete
 */
export function useNutritionLookup(): UseNutritionLookupReturn {
    const [searchSuggestions, setSearchSuggestions] = useState<CatalogFood[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const search = useCallback((query: string) => {
        if (query.length < 2) {
            setSearchSuggestions([]);
            return;
        }
        const results = searchFoodCatalog(query, 8);
        setSearchSuggestions(results);
    }, []);

    const clearSuggestions = useCallback(() => {
        setSearchSuggestions([]);
    }, []);

    const lookupFood = useCallback(async (
        name: string,
        serving: string
    ): Promise<LookupResult> => {
        if (!name || name.trim().length < 2) {
            return { found: false, nutrition: null, source: 'manual', error: 'Name too short' };
        }

        setIsLoading(true);

        try {
            // Step 1: Search catalog
            const catalogResults = searchFoodCatalog(name, 1);

            if (catalogResults.length > 0) {
                const food = catalogResults[0];
                const { grams } = parseServingToGrams(serving, food);

                if (grams && grams > 0) {
                    const nutrition = calculateNutritionForServing(food, grams);
                    setIsLoading(false);
                    return {
                        found: true,
                        nutrition,
                        source: 'catalog',
                        catalogFood: food,
                    };
                } else {
                    // Use default serving
                    const defaultServing = food.servings[0]?.grams || 100;
                    const nutrition = calculateNutritionForServing(food, defaultServing);
                    setIsLoading(false);
                    return {
                        found: true,
                        nutrition: { ...nutrition, servingLabel: serving || nutrition.servingLabel },
                        source: 'catalog',
                        catalogFood: food,
                    };
                }
            }

            // Step 2: AI Estimation fallback
            const aiResult = await estimateNutritionWithAI(name, serving);
            setIsLoading(false);

            if (aiResult) {
                return {
                    found: true,
                    nutrition: aiResult,
                    source: 'estimated',
                };
            }

            setIsLoading(false);
            return { found: false, nutrition: null, source: 'manual', error: 'Could not find nutrition data' };

        } catch (error) {
            setIsLoading(false);
            return {
                found: false,
                nutrition: null,
                source: 'manual',
                error: error instanceof Error ? error.message : 'Lookup failed'
            };
        }
    }, []);

    return {
        searchSuggestions,
        search,
        clearSuggestions,
        lookupFood,
        isLoading,
    };
}

/**
 * AI-based nutrition estimation (fallback when catalog doesn't have the food)
 */
async function estimateNutritionWithAI(
    foodName: string,
    serving: string
): Promise<CalculatedNutrition | null> {
    const prompt = `Estimate the nutrition for: "${foodName}" (serving: ${serving || '1 serving'})

Return ONLY raw JSON, no markdown:
{
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "servingGrams": number (estimated grams for this serving)
}

Be realistic. If unsure, use typical values for this food type.`;

    try {
        const response = await postAIChat({
            model: API_CONFIG.MODEL,
            messages: [
                { role: 'system', content: 'You are a nutrition estimation assistant. Return ONLY JSON.' },
                { role: 'user', content: prompt },
            ],
            temperature: 0.2,
            max_tokens: 200,
            response_format: { type: 'json_object' },
        });

        if (!response.ok) return null;

        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (!content) return null;

        const extracted = extractJsonFromAIResponse(content);
        const parsed = JSON.parse(extracted);

        return {
            calories: Math.round(parsed.calories || 0),
            protein: Math.round((parsed.protein || 0) * 10) / 10,
            carbs: Math.round((parsed.carbs || 0) * 10) / 10,
            fat: Math.round((parsed.fat || 0) * 10) / 10,
            servingGrams: parsed.servingGrams || 100,
            servingLabel: serving || '1 serving',
            source: 'catalog', // Will be overwritten to 'estimated' by caller
            confidence: 0.7,
        };
    } catch {
        return null;
    }
}

/**
 * Create a ComparisonFoodItem from lookup result
 */
export function createFoodFromLookup(
    name: string,
    serving: string,
    result: LookupResult
): ComparisonFoodItem {
    if (!result.found || !result.nutrition) {
        return {
            name,
            servingSize: serving || '1 serving',
            calories: null,
            macros: { protein_g: null, carbs_g: null, fat_g: null },
            source: 'manual',
            dataCompleteness: 10,
        };
    }

    const n = result.nutrition;
    return {
        name: result.catalogFood?.name || name,
        servingSize: n.servingLabel || serving,
        calories: n.calories,
        macros: {
            protein_g: n.protein,
            carbs_g: n.carbs,
            fat_g: n.fat,
            fiber_g: n.fiber,
        },
        source: result.source === 'estimated' ? 'manual' : 'database',
        dataCompleteness: 100,
    };
}
