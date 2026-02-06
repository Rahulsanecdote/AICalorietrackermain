import { createTimestampFromLocal, getTodayStr } from '../utils/dateHelpers';

// ... (existing imports)

// ...

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
