import { useState, useCallback } from 'react';
import { FoodComparisonData, ComparisonFoodItem, ComparisonVerdict, AIProcessingStatus } from '../types/ai';
import { API_CONFIG } from '../constants';
import { postAIChat } from '../utils/aiClient';

interface ComparisonState {
  status: AIProcessingStatus;
  data: FoodComparisonData | null;
  error: string | null;
}

const DEFAULT_SYSTEM_PROMPT = `You are a nutrition comparison assistant. Compare two food items and provide a detailed analysis.

Return a JSON object with the following structure:
{
  "verdict": {
    "summary": "A concise comparison summary (2-3 sentences)",
    "winner": "A, B, or tie",
    "keyDifferences": ["Array of key nutritional differences"],
    "recommendations": ["Context-aware recommendations"],
    "context": "general-health"
  }
}

Consider:
- Calorie density
- Protein content
- Fiber and micronutrients
- Overall nutritional value
- Suitable for different goals (weight loss, muscle gain, energy)

Keep recommendations practical and actionable.`;

export function useFoodComparator() {
  const [state, setState] = useState<ComparisonState>({
    status: 'idle',
    data: null,
    error: null,
  });

  const generateComparison = useCallback(async (
    foodA: ComparisonFoodItem,
    foodB: ComparisonFoodItem,
    context: 'weight-loss' | 'muscle-gain' | 'general-health' | 'energy' = 'general-health'
  ): Promise<void> => {
    setState({ status: 'processing', data: null, error: null });

    try {
      const userPrompt = `
Compare these two foods:

**Food A: ${foodA.name}**
- Serving Size: ${foodA.servingSize}
- Calories: ${foodA.calories}
- Protein: ${foodA.macros.protein_g}g
- Carbs: ${foodA.macros.carbs_g}g
- Fat: ${foodA.macros.fat_g}g
${foodA.macros.fiber_g ? `- Fiber: ${foodA.macros.fiber_g}g` : ''}
${foodA.macros.sodium_mg ? `- Sodium: ${foodA.macros.sodium_mg}mg` : ''}

**Food B: ${foodB.name}**
- Serving Size: ${foodB.servingSize}
- Calories: ${foodB.calories}
- Protein: ${foodB.macros.protein_g}g
- Carbs: ${foodB.macros.carbs_g}g
- Fat: ${foodB.macros.fat_g}g
${foodB.macros.fiber_g ? `- Fiber: ${foodB.macros.fiber_g}g` : ''}
${foodB.macros.sodium_mg ? `- Sodium: ${foodB.macros.sodium_mg}mg` : ''}

Context: ${context}

Provide a comparison focusing on which food is better for this goal.
      `.trim();

      const response = await postAIChat({
        model: API_CONFIG.MODEL,
        messages: [
          { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Comparison failed');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from AI');
      }

      const parsedContent = JSON.parse(content);

      const comparisonData: FoodComparisonData = {
        foodA,
        foodB,
        verdict: {
          ...parsedContent.verdict,
          context,
        },
        comparisonTimestamp: new Date().toISOString(),
      };

      setState({
        status: 'success',
        data: comparisonData,
        error: null,
      });
    } catch (err) {
      console.error('Comparison error:', err);
      setState({
        status: 'error',
        data: null,
        error: err instanceof Error ? err.message : 'Failed to compare foods',
      });
    }
  }, []);

  const clearComparison = useCallback(() => {
    setState({ status: 'idle', data: null, error: null });
  }, []);

  return {
    ...state,
    generateComparison,
    clearComparison,
  };
}

// Helper function to create comparison food from simple inputs
export function createComparisonFood(
  name: string,
  servingSize: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number
): ComparisonFoodItem {
  return {
    name,
    servingSize,
    calories,
    macros: {
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
    },
  };
}

// Predefined comparison scenarios for demo
export const PRESET_COMPARISONS = {
  pizzaVsSalad: {
    foodA: {
      name: 'Pepperoni Pizza (2 slices)',
      servingSize: '2 slices (357g)',
      calories: 730,
      macros: { protein_g: 32, carbs_g: 80, fat_g: 32 },
    },
    foodB: {
      name: 'Garden Salad with Chicken',
      servingSize: '1 bowl (350g)',
      calories: 320,
      macros: { protein_g: 35, carbs_g: 20, fat_g: 12 },
    },
  },
  sodaVsWater: {
    foodA: {
      name: 'Cola Soda',
      servingSize: '1 can (355ml)',
      calories: 140,
      macros: { protein_g: 0, carbs_g: 39, fat_g: 0 },
    },
    foodB: {
      name: 'Still Water',
      servingSize: '1 glass (250ml)',
      calories: 0,
      macros: { protein_g: 0, carbs_g: 0, fat_g: 0 },
    },
  },
  oatmealVsCereal: {
    foodA: {
      name: 'Oatmeal',
      servingSize: '1 cup cooked (234g)',
      calories: 158,
      macros: { protein_g: 6, carbs_g: 27, fat_g: 3 },
    },
    foodB: {
      name: 'Sugary Cereal',
      servingSize: '1 cup (39g)',
      calories: 150,
      macros: { protein_g: 2, carbs_g: 34, fat_g: 1 },
    },
  },
};
