import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { useNutritionAI } from './useNutritionAI';
import { Meal, MealCategory } from '../types';
import { createTimestampFromLocal, getTodayStr } from '../utils/dateHelpers';

export interface QuickAddResult {
  id: string;
  foodName: string;
  description: string;
  servingSize: string;
  nutrition: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  category: MealCategory;
}

export function useQuickAdd() {
  const { t } = useTranslation();
  const { analyzeFood, isLoading } = useNutritionAI();

  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<QuickAddResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processInput = useCallback(async (input: string, category: MealCategory): Promise<QuickAddResult | null> => {
    if (!input.trim()) return null;

    setIsProcessing(true);
    setError(null);
    setLastResult(null);

    try {
      // Analyze food with AI
      const result = await analyzeFood(input);

      if (!result) {
        throw new Error(t('quickAdd.errors.analysisFailed') || 'Could not analyze food');
      }

      const quickAddResult: QuickAddResult = {
        id: uuidv4(),
        foodName: result.foodName,
        description: input, // Use input as description
        servingSize: result.servingSize,
        nutrition: {
          calories: Math.round(result.calories),
          protein_g: Math.round(result.protein_g),
          carbs_g: Math.round(result.carbs_g),
          fat_g: Math.round(result.fat_g),
        },
        category
      };

      setLastResult(quickAddResult);
      return quickAddResult;
    } catch (err) {
      console.error('Quick add error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [analyzeFood, t]);

  const createMealFromResult = useCallback(
    (result: QuickAddResult, dateStr?: string): Meal => {
      // Use provided date or today's date if not provided
      const targetDate = dateStr || getTodayStr();

      return {
        id: result.id,
        description: result.description,
        foodName: result.foodName,
        servingSize: result.servingSize,
        nutrition: result.nutrition,
        timestamp: createTimestampFromLocal(targetDate),
        category: result.category,
      };
    },
    []
  );

  const openWidget = useCallback(() => {
    setIsOpen(true);
    setError(null);
    setLastResult(null);
  }, []);

  const closeWidget = useCallback(() => {
    setIsOpen(false);
    setError(null);
    setLastResult(null);
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setLastResult(null);
    setIsProcessing(false);
  }, []);

  return {
    isOpen,
    isProcessing: isProcessing || isLoading,
    error,
    lastResult,
    openWidget,
    closeWidget,
    reset,
    processInput,
    createMealFromResult,
  };
}

// Quick add presets for common foods
export const QUICK_ADD_PRESETS = [
  { name: 'Apple', description: '1 medium apple', category: 'snack' as const },
  { name: 'Banana', description: '1 medium banana', category: 'snack' as const },
  { name: 'Coffee', description: '1 cup black coffee', category: 'breakfast' as const },
  { name: 'Toast', description: '1 slice toast with butter', category: 'breakfast' as const },
  { name: 'Eggs', description: '2 scrambled eggs', category: 'breakfast' as const },
  { name: 'Water', description: '1 glass water', category: 'snack' as const },
  { name: 'Yogurt', description: '1 cup Greek yogurt', category: 'snack' as const },
  { name: 'Salad', description: 'mixed green salad', category: 'lunch' as const },
];
