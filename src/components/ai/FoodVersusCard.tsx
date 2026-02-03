'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ArrowRightLeft, Sparkles, TrendingUp, Minus, RefreshCw, AlertCircle, Loader2, Info, Search, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { useFoodComparator, PRESET_COMPARISONS } from '../../hooks/useFoodComparator';
import { useFoodTranslation } from '../../hooks/useFoodTranslation';
import { useNutritionLookup, createFoodFromLookup } from '../../hooks/useNutritionLookup';
import { ComparisonFoodItem, ComparisonVerdict } from '../../types/ai';
import { CatalogFood } from '../../data/foodCatalog';
import {
  calculateDataCompleteness,
  formatNutrientDisplay,
  getCompletenessColor,
  getCompletenessLabel,
  hasMinimumDataForComparison
} from '../../utils/comparisonValidation';


interface FoodVersusCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FoodVersusCard({ isOpen, onClose }: FoodVersusCardProps) {
  const { t } = useTranslation();
  const { translateFood } = useFoodTranslation();
  const [context, setContext] = useState<'weight-loss' | 'muscle-gain' | 'general-health' | 'energy'>('general-health');
  const [foodA, setFoodA] = useState<ComparisonFoodItem>(PRESET_COMPARISONS.pizzaVsSalad.foodA);
  const [foodB, setFoodB] = useState<ComparisonFoodItem>(PRESET_COMPARISONS.pizzaVsSalad.foodB);
  const [inputMode, setInputMode] = useState<'preset' | 'custom'>('preset');

  const { status, data, error, generateComparison, clearComparison } = useFoodComparator();

  // Calculate if we can compare
  const canCompare = useMemo(() => {
    return hasMinimumDataForComparison(foodA) && hasMinimumDataForComparison(foodB);
  }, [foodA, foodB]);

  const handleCompare = async () => {
    await generateComparison(foodA, foodB, context);
  };

  const handleClose = () => {
    clearComparison();
    onClose();
  };

  const loadPreset = (preset: keyof typeof PRESET_COMPARISONS) => {
    setInputMode('preset');
    setFoodA(PRESET_COMPARISONS[preset].foodA);
    setFoodB(PRESET_COMPARISONS[preset].foodB);
  };

  const startCustomEntry = () => {
    setInputMode('custom');
    setFoodA({
      name: '',
      servingSize: '1 cup',
      calories: null,
      macros: { protein_g: null, carbs_g: null, fat_g: null },
      source: 'manual',
    });
    setFoodB({
      name: '',
      servingSize: '1 cup',
      calories: null,
      macros: { protein_g: null, carbs_g: null, fat_g: null },
      source: 'manual',
    });
  };

  const swapFoods = () => {
    setFoodA(foodB);
    setFoodB(foodA);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
            {t('compare.title') || 'Food Comparison'}
          </DialogTitle>
          <DialogDescription>
            {inputMode === 'custom'
              ? 'Type food names to auto-fill nutrition data'
              : 'Compare nutritional values to make better choices.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Context Selector */}
          <div className="flex flex-wrap gap-2">
            {(['weight-loss', 'muscle-gain', 'general-health', 'energy'] as const).map((c) => (
              <Button
                key={c}
                variant={context === c ? 'default' : 'outline'}
                size="sm"
                onClick={() => setContext(c)}
                className="capitalize"
              >
                {c.replace('-', ' ')}
              </Button>
            ))}
          </div>

          {/* Input Mode Selector */}
          <div className="flex flex-wrap gap-2 border-b pb-4">
            <span className="text-sm text-gray-500 py-1">Choose foods:</span>
            {Object.keys(PRESET_COMPARISONS).map((key) => (
              <Button
                key={key}
                variant={inputMode === 'preset' &&
                  foodA.name === PRESET_COMPARISONS[key as keyof typeof PRESET_COMPARISONS].foodA.name
                  ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => loadPreset(key as keyof typeof PRESET_COMPARISONS)}
                className="text-xs"
              >
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </Button>
            ))}
            <Button
              variant={inputMode === 'custom' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={startCustomEntry}
              className="text-xs"
            >
              ✏️ Custom
            </Button>
          </div>

          {/* Food Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
            {/* Food A */}
            <AutoLookupFoodCard
              title="Food A"
              food={foodA}
              onChange={setFoodA}
              isCustomMode={inputMode === 'custom'}
              color="blue"
            />

            {/* VS Badge + Swap */}
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-full font-bold text-lg">
                VS
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={swapFoods}
                className="text-xs"
                aria-label="Swap foods"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </Button>
            </div>

            {/* Food B */}
            <AutoLookupFoodCard
              title="Food B"
              food={foodB}
              onChange={setFoodB}
              isCustomMode={inputMode === 'custom'}
              color="green"
            />
          </div>

          {/* Compare Button */}
          <Button
            onClick={handleCompare}
            disabled={status === 'processing' || !canCompare}
            className="w-full"
            size="lg"
          >
            {status === 'processing' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.analyzing') || 'Analyzing...'}
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                {t('compare.compareButton') || 'Compare Foods'}
              </>
            )}
          </Button>

          {/* Validation Warning */}
          {!canCompare && inputMode === 'custom' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700">
                {t('compare.needMoreData') || 'Type a food name to auto-fill nutrition. Try "oatmeal" or "chicken breast".'}
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800">{t('common.comparisonFailed') || "Couldn't generate comparison"}</p>
                  <p className="text-sm text-amber-700 mt-1">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCompare}
                    className="mt-3"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('common.tryAgain') || 'Try Again'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {status === 'processing' && (
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                <span className="text-gray-600">{t('common.analyzing') || 'Analyzing foods...'}</span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>
            </div>
          )}

          {/* Results */}
          {data && status === 'success' && (
            <ComparisonResultCard
              verdict={data.verdict}
              foodA={data.foodA}
              foodB={data.foodB}
              translateFood={translateFood}
              hasIncompleteData={data.hasIncompleteData}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Auto-Lookup Food Card (with autocomplete)
// ============================================================================

interface AutoLookupFoodCardProps {
  title: string;
  food: ComparisonFoodItem;
  onChange: (food: ComparisonFoodItem) => void;
  isCustomMode: boolean;
  color: 'blue' | 'green';
}

function AutoLookupFoodCard({ title, food, onChange, isCustomMode, color }: AutoLookupFoodCardProps) {
  const { searchSuggestions, search, clearSuggestions, lookupFood, isLoading } = useNutritionLookup();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [nameInput, setNameInput] = useState(food.name);
  const [servingInput, setServingInput] = useState(food.servingSize);

  const completeness = calculateDataCompleteness(food);

  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50/50',
    green: 'border-green-200 bg-green-50/50',
  };
  const headerColors = {
    blue: 'text-blue-700',
    green: 'text-green-700',
  };

  // Update inputs when food changes externally (e.g., preset selection)
  useEffect(() => {
    setNameInput(food.name);
    setServingInput(food.servingSize);
  }, [food.name, food.servingSize]);

  // Debounced search
  useEffect(() => {
    if (!isCustomMode) return;
    const timer = setTimeout(() => {
      search(nameInput);
    }, 200);
    return () => clearTimeout(timer);
  }, [nameInput, search, isCustomMode]);

  // Auto-lookup when name or serving changes
  const performLookup = useCallback(async (name: string, serving: string) => {
    if (!isCustomMode || name.length < 2) return;

    const result = await lookupFood(name, serving);
    if (result.found && result.nutrition) {
      const newFood = createFoodFromLookup(name, serving, result);
      onChange(newFood);
    }
  }, [isCustomMode, lookupFood, onChange]);

  const handleNameChange = (value: string) => {
    setNameInput(value);
    setShowSuggestions(true);
    // Clear macros when name is manually changed
    if (isCustomMode) {
      onChange({
        ...food,
        name: value,
        calories: null,
        macros: { protein_g: null, carbs_g: null, fat_g: null },
        source: 'manual',
        dataCompleteness: 10,
      });
    }
  };

  const handleSelectSuggestion = async (suggestion: CatalogFood) => {
    setNameInput(suggestion.name);
    setShowSuggestions(false);
    clearSuggestions();

    const result = await lookupFood(suggestion.name, servingInput);
    if (result.found && result.nutrition) {
      const newFood = createFoodFromLookup(suggestion.name, servingInput, result);
      onChange(newFood);
    }
  };

  const handleServingChange = (value: string) => {
    setServingInput(value);
    onChange({ ...food, servingSize: value });
  };

  const handleServingBlur = () => {
    // Re-lookup with new serving
    if (food.name && food.name.length >= 2) {
      performLookup(food.name, servingInput);
    }
  };

  const sourceLabel = food.source === 'database' ? '✓ Verified'
    : food.source === 'logged' ? '📋 Your log'
      : food.source === 'manual' && food.calories !== null ? '🤖 Estimated'
        : '✏️ Manual';

  return (
    <div className={`p-4 rounded-xl border-2 ${colorClasses[color]} relative`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold ${headerColors[color]}`}>{title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${getCompletenessColor(completeness)}`}>
          {getCompletenessLabel(completeness)}
        </span>
      </div>

      <div className="space-y-3">
        {/* Food Name with Autocomplete */}
        <div className="relative">
          <label htmlFor={`${title}-name`} className="text-xs text-gray-500 flex items-center gap-1">
            <Search className="w-3 h-3" />
            Food Name {isCustomMode && <span className="text-gray-400">(type to search)</span>}
          </label>
          <input
            id={`${title}-name`}
            type="text"
            value={nameInput}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => isCustomMode && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            disabled={!isCustomMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
            placeholder={isCustomMode ? "e.g., oatmeal, chicken..." : ""}
            autoComplete="off"
          />

          {/* Autocomplete Dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {searchSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 flex items-center justify-between"
                  onMouseDown={() => handleSelectSuggestion(suggestion)}
                >
                  <span>{suggestion.name}</span>
                  <span className="text-xs text-gray-400">{suggestion.per100g.calories} cal/100g</span>
                </button>
              ))}
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute right-3 top-7">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            </div>
          )}
        </div>

        {/* Serving Size */}
        <div>
          <label htmlFor={`${title}-serving`} className="text-xs text-gray-500">Serving Size</label>
          <input
            id={`${title}-serving`}
            type="text"
            value={servingInput}
            onChange={(e) => handleServingChange(e.target.value)}
            onBlur={handleServingBlur}
            disabled={!isCustomMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
            placeholder="1 cup, 100g, 2 slices..."
          />
        </div>

        {/* Macros (Read-only when auto-filled) */}
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="text-xs text-gray-500">Calories</label>
            <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-center font-medium">
              {formatNutrientDisplay(food.calories)}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Protein</label>
            <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-center">
              {formatNutrientDisplay(food.macros.protein_g, 'g')}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Carbs</label>
            <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-center">
              {formatNutrientDisplay(food.macros.carbs_g, 'g')}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Fat</label>
            <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-center">
              {formatNutrientDisplay(food.macros.fat_g, 'g')}
            </div>
          </div>
        </div>

        {/* Source indicator */}
        <div className="text-xs text-gray-400 flex items-center gap-1">
          {food.calories !== null && <Check className="w-3 h-3 text-green-500" />}
          Source: {sourceLabel}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Comparison Result Card
// ============================================================================

interface ComparisonResultCardProps {
  verdict: ComparisonVerdict;
  foodA: ComparisonFoodItem;
  foodB: ComparisonFoodItem;
  translateFood: (name: string) => string;
  hasIncompleteData?: boolean;
}

function ComparisonResultCard({ verdict, foodA, foodB, translateFood, hasIncompleteData }: ComparisonResultCardProps) {
  const winnerColor =
    verdict.winner === 'A'
      ? 'bg-blue-600'
      : verdict.winner === 'B'
        ? 'bg-green-600'
        : verdict.winner === 'insufficient-data'
          ? 'bg-gray-500'
          : 'bg-gray-600';

  const winnerName =
    verdict.winner === 'A' ? translateFood(foodA.name) :
      verdict.winner === 'B' ? translateFood(foodB.name) :
        verdict.winner === 'insufficient-data' ? 'Insufficient Data' : 'Tie';

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Winner Header */}
      <div className={`${winnerColor} px-4 py-3 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {verdict.winner === 'insufficient-data' ? (
              <AlertCircle className="h-5 w-5" />
            ) : verdict.winner !== 'tie' ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <Minus className="h-5 w-5" />
            )}
            <span className="font-semibold">
              {verdict.winner === 'tie' ? "It's a Tie!" :
                verdict.winner === 'insufficient-data' ? 'Cannot Determine Winner' :
                  `${winnerName} Wins!`}
            </span>
          </div>
          <span className="text-sm opacity-90 capitalize">{verdict.context.replace('-', ' ')}</span>
        </div>
      </div>

      {/* Incomplete Data Warning */}
      {hasIncompleteData && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
          <Info className="w-4 h-4 text-yellow-600" />
          <span className="text-xs text-yellow-700">Comparison based on available data. Some values were incomplete.</span>
        </div>
      )}

      {/* Summary */}
      <div className="p-4 bg-gray-50">
        <p className="text-gray-700">{verdict.summary}</p>
      </div>

      {/* Macro Comparison */}
      <div className="p-4 space-y-3">
        <h4 className="font-medium text-gray-900">Macro Comparison</h4>

        <MacroBar
          label="Calories"
          valueA={foodA.calories}
          valueB={foodB.calories}
          unit=""
        />
        <MacroBar
          label="Protein"
          valueA={foodA.macros.protein_g}
          valueB={foodB.macros.protein_g}
          unit="g"
        />
        <MacroBar
          label="Carbs"
          valueA={foodA.macros.carbs_g}
          valueB={foodB.macros.carbs_g}
          unit="g"
        />
        <MacroBar
          label="Fat"
          valueA={foodA.macros.fat_g}
          valueB={foodB.macros.fat_g}
          unit="g"
        />
      </div>

      {/* Key Differences */}
      {verdict.keyDifferences.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className="font-medium text-gray-900 mb-2">Key Differences</h4>
          <ul className="space-y-1">
            {verdict.keyDifferences.map((diff, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-indigo-600 mt-0.5">•</span>
                {diff}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {verdict.recommendations.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {verdict.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimers */}
      {verdict.disclaimers && verdict.disclaimers.length > 0 && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 space-y-1">
            {verdict.disclaimers.map((disclaimer, index) => (
              <p key={index}>ℹ️ {disclaimer}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Macro Bar Component
// ============================================================================

interface MacroBarProps {
  label: string;
  valueA: number | null;
  valueB: number | null;
  unit: string;
}

function MacroBar({ label, valueA, valueB, unit }: MacroBarProps) {
  // Handle null values
  const hasA = valueA !== null;
  const hasB = valueB !== null;

  // Calculate bar widths (only if both values known)
  const maxValue = Math.max(valueA ?? 0, valueB ?? 0, 1);
  const percentageA = hasA ? ((valueA ?? 0) / maxValue) * 100 : 0;
  const percentageB = hasB ? ((valueB ?? 0) / maxValue) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span>
          {formatNutrientDisplay(valueA, unit)} vs {formatNutrientDisplay(valueB, unit)}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex gap-0.5">
        <div
          className={`${hasA ? 'bg-blue-500' : 'bg-gray-400'} h-full transition-all`}
          style={{ width: hasA ? `${percentageA / 2}%` : '50%' }}
        />
        <div
          className={`${hasB ? 'bg-green-500' : 'bg-gray-400'} h-full transition-all`}
          style={{ width: hasB ? `${percentageB / 2}%` : '50%' }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>{hasA ? 'A' : 'A (--)'}</span>
        <span>{hasB ? 'B' : 'B (--)'}</span>
      </div>
    </div>
  );
}
