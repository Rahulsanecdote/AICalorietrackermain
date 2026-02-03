import { useState, useCallback } from 'react';
import { FoodComparisonData, ComparisonFoodItem, AIProcessingStatus } from '../types/ai';
import { API_CONFIG } from '../constants';
import { postAIChat } from '../utils/aiClient';
import { parseAIResponseWithSchema, ComparisonVerdictSchema, getUserFriendlyError } from '../utils/safeParseAI';
import {
  validateForComparison,
  formatNutrientForAI,
  generateDisclaimers,
  calculateDataCompleteness
} from '../utils/comparisonValidation';

interface ComparisonState {
  status: AIProcessingStatus;
  data: FoodComparisonData | null;
  error: string | null;
  validationIssues: string[];
}

const DEFAULT_SYSTEM_PROMPT = `You are a nutrition comparison assistant. Compare two food items based ONLY on the data provided.

CRITICAL RULES:
1. Return ONLY raw JSON, no markdown code fences
2. If a value is "unknown", do NOT claim that food has 0 of that nutrient
3. If data is incomplete, acknowledge it in your summary
4. Never invent or assume nutritional values

Return a JSON object:
{
  "verdict": {
    "summary": "Comparison summary (2-3 sentences). Acknowledge any data limitations.",
    "winner": "A", "B", "tie", or "insufficient-data",
    "keyDifferences": ["Based on available data..."],
    "recommendations": ["Context-aware recommendations"],
    "context": "general-health"
  }
}

IMPORTANT: If key nutrients are "unknown" for a food, say something like:
"Food A appears to have more protein, though complete data for Food B is not available."

Do NOT say "Food B has no calories" when the calorie value is unknown.`;

export function useFoodComparator() {
  const [state, setState] = useState<ComparisonState>({
    status: 'idle',
    data: null,
    error: null,
    validationIssues: [],
  });

  const generateComparison = useCallback(async (
    foodA: ComparisonFoodItem,
    foodB: ComparisonFoodItem,
    context: 'weight-loss' | 'muscle-gain' | 'general-health' | 'energy' = 'general-health'
  ): Promise<void> => {
    // Validate before comparing
    const validation = validateForComparison(foodA, foodB);

    if (!validation.canCompare) {
      setState({
        status: 'error',
        data: null,
        error: 'Insufficient data for comparison. ' + validation.issues.join(' '),
        validationIssues: validation.issues,
      });
      return;
    }

    setState({ status: 'processing', data: null, error: null, validationIssues: [] });

    try {
      // Build null-aware prompt
      const userPrompt = `
Compare these two foods for ${context.replace('-', ' ')}:

**Food A: ${foodA.name}**
- Serving Size: ${foodA.servingSize}
- Calories: ${formatNutrientForAI(foodA.calories, ' kcal')}
- Protein: ${formatNutrientForAI(foodA.macros.protein_g, 'g')}
- Carbs: ${formatNutrientForAI(foodA.macros.carbs_g, 'g')}
- Fat: ${formatNutrientForAI(foodA.macros.fat_g, 'g')}
- Data Completeness: ${calculateDataCompleteness(foodA)}%

**Food B: ${foodB.name}**
- Serving Size: ${foodB.servingSize}
- Calories: ${formatNutrientForAI(foodB.calories, ' kcal')}
- Protein: ${formatNutrientForAI(foodB.macros.protein_g, 'g')}
- Carbs: ${formatNutrientForAI(foodB.macros.carbs_g, 'g')}
- Fat: ${formatNutrientForAI(foodB.macros.fat_g, 'g')}
- Data Completeness: ${calculateDataCompleteness(foodB)}%

Remember: "unknown" means the data is not available. Do not treat it as 0.
      `.trim();

      const response = await postAIChat({
        model: API_CONFIG.MODEL,
        messages: [
          { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 600,
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

      // Safe parse with schema validation
      const parseResult = parseAIResponseWithSchema(content, ComparisonVerdictSchema);

      if (!parseResult.success) {
        console.error('AI Parse Error:', parseResult.error, 'Raw:', parseResult.rawContent);
        throw new Error(getUserFriendlyError(parseResult.error));
      }

      // Generate disclaimers based on data completeness
      const disclaimers = generateDisclaimers(foodA, foodB);

      const comparisonData: FoodComparisonData = {
        foodA: { ...foodA, dataCompleteness: validation.foodACompleteness },
        foodB: { ...foodB, dataCompleteness: validation.foodBCompleteness },
        verdict: {
          summary: parseResult.data.verdict.summary,
          winner: parseResult.data.verdict.winner.toUpperCase() as 'A' | 'B' | 'tie' | 'insufficient-data',
          keyDifferences: parseResult.data.verdict.keyDifferences ?? [],
          recommendations: parseResult.data.verdict.recommendations ?? [],
          context,
          disclaimers,
        },
        comparisonTimestamp: new Date().toISOString(),
        hasIncompleteData: validation.hasIncompleteData,
      };

      setState({
        status: 'success',
        data: comparisonData,
        error: null,
        validationIssues: [],
      });
    } catch (err) {
      console.error('Comparison error:', err);
      setState({
        status: 'error',
        data: null,
        error: err instanceof Error ? err.message : 'Failed to compare foods',
        validationIssues: [],
      });
    }
  }, []);

  const clearComparison = useCallback(() => {
    setState({ status: 'idle', data: null, error: null, validationIssues: [] });
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
  calories: number | null,
  protein: number | null,
  carbs: number | null,
  fat: number | null
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
    source: 'manual',
  };
}

// Predefined comparison scenarios with verified data
export const PRESET_COMPARISONS = {
  pizzaVsSalad: {
    foodA: {
      name: 'Pepperoni Pizza (2 slices)',
      servingSize: '2 slices (357g)',
      calories: 730,
      macros: { protein_g: 32, carbs_g: 80, fat_g: 32 },
      source: 'preset' as const,
      dataCompleteness: 100,
    },
    foodB: {
      name: 'Garden Salad with Chicken',
      servingSize: '1 bowl (350g)',
      calories: 320,
      macros: { protein_g: 35, carbs_g: 20, fat_g: 12 },
      source: 'preset' as const,
      dataCompleteness: 100,
    },
  },
  sodaVsWater: {
    foodA: {
      name: 'Cola Soda',
      servingSize: '1 can (355ml)',
      calories: 140,
      macros: { protein_g: 0, carbs_g: 39, fat_g: 0 },
      source: 'preset' as const,
      dataCompleteness: 100,
    },
    foodB: {
      name: 'Still Water',
      servingSize: '1 glass (250ml)',
      calories: 0,
      macros: { protein_g: 0, carbs_g: 0, fat_g: 0 },
      source: 'preset' as const,
      dataCompleteness: 100,
    },
  },
  oatmealVsCereal: {
    foodA: {
      name: 'Oatmeal',
      servingSize: '1 cup cooked (234g)',
      calories: 158,
      macros: { protein_g: 6, carbs_g: 27, fat_g: 3, fiber_g: 4 },
      source: 'preset' as const,
      dataCompleteness: 100,
    },
    foodB: {
      name: 'Sugary Cereal',
      servingSize: '1 cup (39g)',
      calories: 150,
      macros: { protein_g: 2, carbs_g: 34, fat_g: 1, fiber_g: 1 },
      source: 'preset' as const,
      dataCompleteness: 100,
    },
  },
  riceVsOatmeal: {
    foodA: {
      name: 'White Rice',
      servingSize: '1 cup cooked (158g)',
      calories: 205,
      macros: { protein_g: 4.3, carbs_g: 45, fat_g: 0.4 },
      source: 'preset' as const,
      dataCompleteness: 100,
    },
    foodB: {
      name: 'Oatmeal',
      servingSize: '1 cup cooked (234g)',
      calories: 158,
      macros: { protein_g: 6, carbs_g: 27, fat_g: 3 },
      source: 'preset' as const,
      dataCompleteness: 100,
    },
  },
};
