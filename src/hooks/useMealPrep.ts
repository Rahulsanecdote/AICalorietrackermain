import { useState, useCallback } from 'react';
import { MealPrepSuggestion } from '../types/recipes';
import { Meal } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface UseMealPrepReturn {
  suggestions: MealPrepSuggestion[];
  isGenerating: boolean;
  error: string | null;
  generateSuggestions: (meals: Meal[]) => MealPrepSuggestion[];
  clearSuggestions: () => void;
}

interface PrepTask {
  task: string;
  duration: number;
  isBatchTask: boolean;
}

function analyzeMealPrepNeeds(meals: Meal[]): PrepTask[] {
  const tasks: PrepTask[] = [];
  const ingredientUsage: Record<string, string[]> = {};

  // Track meal types for category-based prep
  const mealTypes: Record<string, number> = {
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0,
  };

  // Extract potential ingredients from meal descriptions
  const extractIngredients = (text: string): string[] => {
    const commonIngredients = [
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'tofu', 'eggs',
      'rice', 'pasta', 'bread', 'potato', 'oats', 'quinoa',
      'broccoli', 'spinach', 'lettuce', 'tomato', 'onion', 'garlic', 'carrot',
      'cheese', 'milk', 'yogurt', 'butter', 'cream',
      'beans', 'lentils', 'chickpeas',
      'apple', 'banana', 'berries', 'avocado', 'nuts', 'almonds',
    ];

    return commonIngredients.filter(ing =>
      text.toLowerCase().includes(ing.toLowerCase())
    );
  };

  meals.forEach((meal) => {
    mealTypes[meal.category] = (mealTypes[meal.category] || 0) + 1;

    // Extract ingredients from food name and description
    const foodText = `${meal.foodName} ${meal.description}`;
    const extractedIngredients = extractIngredients(foodText);

    extractedIngredients.forEach((ing) => {
      if (!ingredientUsage[ing]) {
        ingredientUsage[ing] = [];
      }
      ingredientUsage[ing].push(meal.foodName || meal.description);
    });

    // Only process recipe data if it exists
    if (meal.recipe) {
      // Group ingredients by type for batch prep analysis
      meal.recipe.ingredients.forEach((ing) => {
        const ingredientName = ing.name ?? '';
        const baseName = ingredientName.toLowerCase().replace(/ chopped| diced| sliced| minced/gi, '');
        if (!ingredientUsage[baseName]) {
          ingredientUsage[baseName] = [];
        }
        ingredientUsage[baseName].push(meal.recipe?.title || meal.foodName);
      });

      // Add general prep tasks based on recipe tags and ingredients
      if (meal.recipe.prepTips && meal.recipe.prepTips.length > 0) {
        meal.recipe.prepTips.forEach((tip) => {
          tasks.push({
            task: tip,
            duration: 15,
            isBatchTask: true,
          });
        });
      }
    }
  });

  // Generate category-based prep suggestions
  if ((mealTypes.breakfast ?? 0) > 0) {
    tasks.push({
      task: 'Prep breakfast items (overnight oats, pre-cut fruit, brew coffee)',
      duration: 15,
      isBatchTask: true,
    });
  }

  if ((mealTypes.lunch ?? 0) > 0) {
    tasks.push({
      task: 'Prep lunch components (wash greens, portion grains, prep proteins)',
      duration: 20,
      isBatchTask: true,
    });
  }

  if ((mealTypes.dinner ?? 0) > 0) {
    tasks.push({
      task: 'Prep dinner ingredients (chop vegetables, marinate proteins)',
      duration: 30,
      isBatchTask: true,
    });
  }

  if ((mealTypes.snack ?? 0) > 2) {
    tasks.push({
      task: 'Portion snacks for the week (nuts, fruits, veggies)',
      duration: 10,
      isBatchTask: true,
    });
  }

  // Generate batch prep suggestions for commonly used ingredients
  Object.entries(ingredientUsage).forEach(([ingredient, mealNames]) => {
    if (mealNames.length >= 2) {
      tasks.push({
        task: `Prep ${ingredient} for ${Math.min(mealNames.length, 3)} meals`,
        duration: 10 * Math.min(mealNames.length, 3),
        isBatchTask: true,
      });
    }
  });

  // Add general meal prep tips based on total meals
  const totalMeals = meals.length;
  if (totalMeals >= 7) {
    tasks.push({
      task: 'Batch cook grains (rice, pasta, quinoa) for multiple meals',
      duration: 25,
      isBatchTask: true,
    });
    tasks.push({
      task: 'Pre-cut and store vegetables in containers',
      duration: 20,
      isBatchTask: true,
    });
  }

  return tasks;
}

export function useMealPrep(): UseMealPrepReturn {
  const [suggestions, setSuggestions] = useState<MealPrepSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestions = useCallback((meals: Meal[]): MealPrepSuggestion[] => {
    setIsGenerating(true);
    setError(null);

    try {
      const tasks = analyzeMealPrepNeeds(meals);

      // Group tasks by day
      const dayTasks: Record<string, PrepTask[]> = {};
      const mealDays: Record<string, string[]> = {};

      meals.forEach((meal) => {
        const day = new Date(meal.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
        if (!dayTasks[day]) {
          dayTasks[day] = [];
          mealDays[day] = [];
        }
        mealDays[day]?.push(meal.foodName || meal.description);
      });

      // Distribute tasks across the week
      const taskDays = Object.keys(dayTasks);
      if (taskDays.length === 0) {
        setIsGenerating(false);
        return [];
      }

      const newSuggestions: MealPrepSuggestion[] = taskDays.map((day, index) => {
        const dayMeals = meals.filter((m) =>
          new Date(m.timestamp).toLocaleDateString('en-US', { weekday: 'long' }) === day
        );

        const relevantTasks = tasks.filter((_, i) => i % taskDays.length === index);

        return {
          id: uuidv4(),
          day,
          title: `${day} Meal Prep`,
          description: `Prepare ingredients and components for ${dayMeals.length} meals: ${(mealDays[day] ?? []).slice(0, 2).join(', ')}${(mealDays[day] ?? []).length > 2 ? '...' : ''}`,
          tasks: relevantTasks.length > 0 ? relevantTasks : [{
            task: `Review ${dayMeals.length} meals for the day`,
            duration: 5,
            isBatchTask: false,
          }],
          affectedMeals: dayMeals.map((m) => m.id),
        };
      });

      setSuggestions(newSuggestions);
      setIsGenerating(false);
      return newSuggestions;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
      setIsGenerating(false);
      return [];
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    isGenerating,
    error,
    generateSuggestions,
    clearSuggestions,
  };
}
