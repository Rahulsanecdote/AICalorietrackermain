import { useState, useCallback } from 'react';
import { Recipe } from '../types/recipes';
import { API_CONFIG } from '../constants';
import { postAIChat } from '../utils/aiClient';
import useLocalStorage from './useLocalStorage';

interface UseRecipeDetailsReturn {
  recipe: Recipe | null;
  isLoading: boolean;
  error: string | null;
  getRecipeById: (recipeId: string) => Promise<Recipe | null>;
  clearRecipe: () => void;
}

export function useRecipeDetails(): UseRecipeDetailsReturn {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRecipes] = useLocalStorage<Record<string, Recipe>>('act_saved_recipes', {});

  const generateRecipeFromMeal = useCallback(async (mealName: string): Promise<Recipe> => {
    // Generate a recipe based on the meal name using OpenAI
    const prompt = `Create a detailed recipe for "${mealName}" with the following information:
    - id: a unique ID string
    - title: The name of the dish
    - description: A brief description
    - prepTimeMinutes: preparation time in minutes
    - cookTimeMinutes: cooking time in minutes
    - servings: number of servings
    - caloriesPerServing: calories per serving
    - macros: protein, carbs, fat in grams per serving
    - ingredients: list of ingredients with name, amount, unit, and category (produce, dairy, meat, pantry, frozen, other)
    - instructions: numbered cooking steps with instruction and optional duration
    - prepTips: optional tips for meal prep
    - tags: relevant tags like cuisine type, dietary info
    - mealType: breakfast, lunch, dinner, or snack

    Return as JSON object only, no markdown.`;

    const response = await postAIChat({
      model: API_CONFIG.MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    if (!response.ok) {
      throw new Error('Failed to generate recipe');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    // Parse the JSON from the response
    const jsonMatch = content?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse recipe');
  }, []);

  const getRecipeById = useCallback(async (recipeId: string): Promise<Recipe | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if recipe is already saved
      if (savedRecipes[recipeId]) {
        setRecipe(savedRecipes[recipeId]);
        return savedRecipes[recipeId];
      }

      // Generate recipe on the fly (simplified approach)
      // In a real app, this would fetch from an API or database
      const generatedRecipe = await generateRecipeFromMeal(recipeId);
      setRecipe(generatedRecipe);
      return generatedRecipe;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [savedRecipes, generateRecipeFromMeal]);

  const clearRecipe = useCallback(() => {
    setRecipe(null);
    setError(null);
  }, []);

  return {
    recipe,
    isLoading,
    error,
    getRecipeById,
    clearRecipe,
  };
}
