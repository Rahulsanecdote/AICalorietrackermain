import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { Meal, MealCategory } from '../types';
import { useNutritionAI } from './useNutritionAI';
import useLocalStorage from './useLocalStorage';

interface QuickAddResult {
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

interface UseQuickAddOptions {
  onSuccess?: (meal: Meal) => void;
  onError?: (error: string) => void;
}

export function useQuickAdd(options: UseQuickAddOptions = {}) {
  const { t } = useTranslation('quickAdd');
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<QuickAddResult | null>(null);

  const { analyzeFood, isLoading } = useNutritionAI();

  const processInput = useCallback(
    async (rawInput: string, category: MealCategory = 'snack') => {
      if (!rawInput.trim()) {
        const errorMsg = 'Please enter a description';
        setError(errorMsg);
        options.onError?.(errorMsg);
        return null;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await analyzeFood(rawInput);

        if (result) {
          const mealResult: QuickAddResult = {
            id: uuidv4(),
            foodName: result.foodName,
            description: rawInput,
            servingSize: result.servingSize,
            nutrition: {
              calories: Math.round(result.calories),
              protein_g: Math.round(result.protein_g),
              carbs_g: Math.round(result.carbs_g),
              fat_g: Math.round(result.fat_g),
            },
            category,
          };

          setLastResult(mealResult);
          setIsProcessing(false);
          return mealResult;
        } else {
          const errorMsg = 'Could not analyze food. Please try again.';
          setError(errorMsg);
          options.onError?.(errorMsg);
          setIsProcessing(false);
          return null;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMsg);
        options.onError?.(errorMsg);
        setIsProcessing(false);
        return null;
      }
    },
    [analyzeFood, options]
  );

  const createMealFromResult = useCallback(
    (result: QuickAddResult): Meal => {
      return {
        id: result.id,
        description: result.description,
        foodName: result.foodName,
        servingSize: result.servingSize,
        nutrition: result.nutrition,
        timestamp: new Date().toISOString(),
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
