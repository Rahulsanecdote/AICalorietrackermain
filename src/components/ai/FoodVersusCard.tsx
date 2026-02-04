'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ArrowRightLeft, Sparkles, TrendingUp, Minus, AlertCircle, Loader2, Info, Search, Check, Grid3X3, List } from 'lucide-react';
import { Button } from '../ui/button';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { PRESET_COMPARISONS } from '../../hooks/useFoodComparator';
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
import {
  computeAllModes,
  AllModeResults,
  ComparisonMode,
  modeResultToVerdict
} from '../../utils/comparisonScorer';


interface FoodVersusCardProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODE_LABELS: Record<ComparisonMode, string> = {
  'weight-loss': 'Weight Loss',
  'muscle-gain': 'Muscle Gain',
  'general-health': 'General Health',
  'energy': 'Energy',
};

const MODE_ICONS: Record<ComparisonMode, string> = {
  'weight-loss': '🏃',
  'muscle-gain': '💪',
  'general-health': '❤️',
  'energy': '⚡',
};

export function FoodVersusCard({ isOpen, onClose }: FoodVersusCardProps) {
  const { t } = useTranslation();
  const { translateFood } = useFoodTranslation();
  const [selectedMode, setSelectedMode] = useState<ComparisonMode>('general-health');
  const [foodA, setFoodA] = useState<ComparisonFoodItem>(PRESET_COMPARISONS.pizzaVsSalad.foodA);
  const [foodB, setFoodB] = useState<ComparisonFoodItem>(PRESET_COMPARISONS.pizzaVsSalad.foodB);
  const [inputMode, setInputMode] = useState<'preset' | 'custom'>('preset');
  const [showAllModes, setShowAllModes] = useState(false);

  // Compute all mode results when foods change (cached via useMemo)
  const allModeResults = useMemo<AllModeResults | null>(() => {
    if (!hasMinimumDataForComparison(foodA) || !hasMinimumDataForComparison(foodB)) {
      return null;
    }
    return computeAllModes(foodA, foodB);
  }, [foodA, foodB]);

  // Current mode result for tab view
  const currentResult = allModeResults?.[selectedMode];
  const currentVerdict = currentResult
    ? modeResultToVerdict(currentResult, !allModeResults?.hasCompleteData)
    : null;

  const canCompare = allModeResults !== null;

  const handleClose = () => {
    onClose();
  };

  const loadPreset = (preset: keyof typeof PRESET_COMPARISONS) => {
    setInputMode('preset');
    setFoodA(PRESET_COMPARISONS[preset].foodA);
    setFoodB(PRESET_COMPARISONS[preset].foodB);
    setShowAllModes(false);
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
    setShowAllModes(false);
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
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            {t('compare.title') || 'Food Comparison'}
          </DialogTitle>
          <DialogDescription>
            {inputMode === 'custom'
              ? 'Type food names to auto-fill nutrition data'
              : 'Compare nutritional values across different goals.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Tabs - Now instant switching */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MODE_LABELS) as ComparisonMode[]).map((mode) => (
              <Button
                key={mode}
                variant={selectedMode === mode ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedMode(mode);
                  setShowAllModes(false);
                }}
                className="gap-1"
              >
                <span>{MODE_ICONS[mode]}</span>
                {MODE_LABELS[mode]}
              </Button>
            ))}
            {/* View All Modes Toggle */}
            {canCompare && (
              <Button
                variant={showAllModes ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setShowAllModes(!showAllModes)}
                className="gap-1 ml-auto"
              >
                <Grid3X3 className="w-4 h-4" />
                {showAllModes ? 'Single View' : 'All Modes'}
              </Button>
            )}
          </div>

          {/* Input Mode Selector */}
          <div className="flex flex-wrap gap-2 border-b pb-4">
            <span className="text-sm text-muted-foreground py-1">Choose foods:</span>
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
            <AutoLookupFoodCard
              title="Food A"
              food={foodA}
              onChange={setFoodA}
              isCustomMode={inputMode === 'custom'}
              color="blue"
            />

            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <div className="bg-primary text-white px-4 py-2 rounded-full font-bold text-lg">
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

            <AutoLookupFoodCard
              title="Food B"
              food={foodB}
              onChange={setFoodB}
              isCustomMode={inputMode === 'custom'}
              color="green"
            />
          </div>

          {/* Validation Warning */}
          {!canCompare && inputMode === 'custom' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700">
                {t('compare.needMoreData') || 'Type a food name to auto-fill nutrition. Try "oatmeal" or "chicken breast".'}
              </p>
            </div>
          )}

          {/* Results Section */}
          {canCompare && (
            <>
              {showAllModes ? (
                <AllModesGrid
                  results={allModeResults!}
                  foodA={foodA}
                  foodB={foodB}
                  translateFood={translateFood}
                />
              ) : (
                currentVerdict && (
                  <ComparisonResultCard
                    verdict={currentVerdict}
                    foodA={foodA}
                    foodB={foodB}
                    translateFood={translateFood}
                    hasIncompleteData={!allModeResults?.hasCompleteData}
                    showModeLabel={true}
                  />
                )
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// All Modes Grid (4-card parallel view)
// ============================================================================

interface AllModesGridProps {
  results: AllModeResults;
  foodA: ComparisonFoodItem;
  foodB: ComparisonFoodItem;
  translateFood: (name: string) => string;
}

function AllModesGrid({ results, foodA, foodB, translateFood }: AllModesGridProps) {
  const modes: ComparisonMode[] = ['weight-loss', 'muscle-gain', 'general-health', 'energy'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {modes.map((mode) => {
        const result = results[mode];
        const winnerName = result.winner === 'A' ? translateFood(foodA.name)
          : result.winner === 'B' ? translateFood(foodB.name)
            : 'Tie';

        const winnerColor = result.winner === 'A' ? 'bg-blue-500'
          : result.winner === 'B' ? 'bg-green-500'
            : 'bg-card0';

        return (
          <div key={mode} className="border border-border rounded-lg overflow-hidden">
            {/* Header */}
            <div className={`${winnerColor} px-3 py-2 text-white`}>
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-1">
                  {MODE_ICONS[mode]} {MODE_LABELS[mode]}
                </span>
                <span className="text-sm font-semibold">
                  {result.winner === 'tie' ? 'Tie' : `${winnerName} Wins`}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-3 bg-card">
              <p className="text-sm text-foreground mb-2">{result.summary}</p>

              {/* Key Differences */}
              {result.keyDifferences.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-0.5 mb-2">
                  {result.keyDifferences.slice(0, 2).map((diff, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-indigo-500">•</span>
                      {diff}
                    </li>
                  ))}
                </ul>
              )}

              {/* Recommendation */}
              {result.recommendations.length > 0 && (
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                  {result.recommendations[0]}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
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

  useEffect(() => {
    setNameInput(food.name);
    setServingInput(food.servingSize);
  }, [food.name, food.servingSize]);

  useEffect(() => {
    if (!isCustomMode) return;
    const timer = setTimeout(() => {
      search(nameInput);
    }, 200);
    return () => clearTimeout(timer);
  }, [nameInput, search, isCustomMode]);

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
        <div className="relative">
          <label htmlFor={`${title}-name`} className="text-xs text-muted-foreground flex items-center gap-1">
            <Search className="w-3 h-3" />
            Food Name {isCustomMode && <span className="text-muted-foreground">(type to search)</span>}
          </label>
          <input
            id={`${title}-name`}
            type="text"
            value={nameInput}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => isCustomMode && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            disabled={!isCustomMode}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:bg-accent"
            placeholder={isCustomMode ? "e.g., oatmeal, chicken..." : ""}
            autoComplete="off"
          />

          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {searchSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 flex items-center justify-between"
                  onMouseDown={() => handleSelectSuggestion(suggestion)}
                >
                  <span>{suggestion.name}</span>
                  <span className="text-xs text-muted-foreground">{suggestion.per100g.calories} cal/100g</span>
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="absolute right-3 top-7">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div>
          <label htmlFor={`${title}-serving`} className="text-xs text-muted-foreground">Serving Size</label>
          <input
            id={`${title}-serving`}
            type="text"
            value={servingInput}
            onChange={(e) => handleServingChange(e.target.value)}
            onBlur={handleServingBlur}
            disabled={!isCustomMode}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:bg-accent"
            placeholder="1 cup, 100g, 2 slices..."
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Calories</label>
            <div className="px-3 py-2 border border-border rounded-lg text-sm bg-card text-center font-medium">
              {formatNutrientDisplay(food.calories)}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Protein</label>
            <div className="px-3 py-2 border border-border rounded-lg text-sm bg-card text-center">
              {formatNutrientDisplay(food.macros.protein_g, 'g')}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Carbs</label>
            <div className="px-3 py-2 border border-border rounded-lg text-sm bg-card text-center">
              {formatNutrientDisplay(food.macros.carbs_g, 'g')}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Fat</label>
            <div className="px-3 py-2 border border-border rounded-lg text-sm bg-card text-center">
              {formatNutrientDisplay(food.macros.fat_g, 'g')}
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-1">
          {food.calories !== null && <Check className="w-3 h-3 text-green-500" />}
          Source: {sourceLabel}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Comparison Result Card (Single Mode View)
// ============================================================================

interface ComparisonResultCardProps {
  verdict: ComparisonVerdict;
  foodA: ComparisonFoodItem;
  foodB: ComparisonFoodItem;
  translateFood: (name: string) => string;
  hasIncompleteData?: boolean;
  showModeLabel?: boolean;
}

function ComparisonResultCard({ verdict, foodA, foodB, translateFood, hasIncompleteData, showModeLabel }: ComparisonResultCardProps) {
  const winnerColor =
    verdict.winner === 'A'
      ? 'bg-blue-600'
      : verdict.winner === 'B'
        ? 'bg-green-600'
        : verdict.winner === 'insufficient-data'
          ? 'bg-card0'
          : 'bg-gray-600';

  const winnerName =
    verdict.winner === 'A' ? translateFood(foodA.name) :
      verdict.winner === 'B' ? translateFood(foodB.name) :
        verdict.winner === 'insufficient-data' ? 'Insufficient Data' : 'Tie';

  return (
    <div className="border border-border rounded-xl overflow-hidden">
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
          {showModeLabel && (
            <span className="text-sm opacity-90 capitalize flex items-center gap-1">
              {MODE_ICONS[verdict.context as ComparisonMode]} {verdict.context.replace('-', ' ')}
            </span>
          )}
        </div>
      </div>

      {hasIncompleteData && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
          <Info className="w-4 h-4 text-yellow-600" />
          <span className="text-xs text-yellow-700">Comparison based on available data.</span>
        </div>
      )}

      <div className="p-4 bg-card">
        <p className="text-foreground">{verdict.summary}</p>
      </div>

      <div className="p-4 space-y-3">
        <h4 className="font-medium text-foreground">Macro Comparison</h4>
        <MacroBar label="Calories" valueA={foodA.calories} valueB={foodB.calories} unit="" />
        <MacroBar label="Protein" valueA={foodA.macros.protein_g} valueB={foodB.macros.protein_g} unit="g" />
        <MacroBar label="Carbs" valueA={foodA.macros.carbs_g} valueB={foodB.macros.carbs_g} unit="g" />
        <MacroBar label="Fat" valueA={foodA.macros.fat_g} valueB={foodB.macros.fat_g} unit="g" />
      </div>

      {verdict.keyDifferences.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className="font-medium text-foreground mb-2">Key Differences</h4>
          <ul className="space-y-1">
            {verdict.keyDifferences.map((diff, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5">•</span>
                {diff}
              </li>
            ))}
          </ul>
        </div>
      )}

      {verdict.recommendations.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className="font-medium text-foreground mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {verdict.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {verdict.disclaimers && verdict.disclaimers.length > 0 && (
        <div className="px-4 pb-4 pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground space-y-1">
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
  const hasA = valueA !== null;
  const hasB = valueB !== null;

  const maxValue = Math.max(valueA ?? 0, valueB ?? 0, 1);
  const percentageA = hasA ? ((valueA ?? 0) / maxValue) * 100 : 0;
  const percentageB = hasB ? ((valueB ?? 0) / maxValue) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{label}</span>
        <span>
          {formatNutrientDisplay(valueA, unit)} vs {formatNutrientDisplay(valueB, unit)}
        </span>
      </div>
      <div className="h-2 bg-accent rounded-full overflow-hidden flex gap-0.5">
        <div
          className={`${hasA ? 'bg-blue-500' : 'bg-gray-400'} h-full transition-all`}
          style={{ width: hasA ? `${percentageA / 2}%` : '50%' }}
        />
        <div
          className={`${hasB ? 'bg-green-500' : 'bg-gray-400'} h-full transition-all`}
          style={{ width: hasB ? `${percentageB / 2}%` : '50%' }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
        <span>{hasA ? 'A' : 'A (--)'}</span>
        <span>{hasB ? 'B' : 'B (--)'}</span>
      </div>
    </div>
  );
}
