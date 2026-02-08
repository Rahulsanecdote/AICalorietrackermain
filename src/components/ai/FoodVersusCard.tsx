'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ArrowRightLeft,
  Grid3X3,
  X,
  Pencil,
  Info,
  Search,
  Loader2,
  AlertCircle,
  TrendingUp,
  Minus,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../lib/utils';
import { PRESET_COMPARISONS } from '../../hooks/useFoodComparator';
import { useNutritionLookup, createFoodFromLookup } from '../../hooks/useNutritionLookup';
import { useFoodTranslation } from '../../hooks/useFoodTranslation';
import { ComparisonFoodItem, ComparisonVerdict } from '../../types/ai';
import { CatalogFood } from '../../data/foodCatalog';
import {
  calculateDataCompleteness,
  formatNutrientDisplay,
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

// Custom Dialog Content for Food Comparison Theme
const FoodComparisonContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[hsl(var(--fc-overlay))] opacity-[var(--fc-overlay-opacity)] backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        "food-comparison-theme bg-[hsl(var(--fc-surface))] border-[hsl(var(--fc-border))] text-[hsl(var(--fc-text))]",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
FoodComparisonContent.displayName = "FoodComparisonContent";


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
      <FoodComparisonContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-[hsl(var(--fc-border))] space-y-0">
          <div>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-[hsl(var(--fc-text))]">
              <ArrowRightLeft className="h-5 w-5 text-[hsl(var(--fc-primary))]" />
              {t('compare.title') || 'Food Comparison'}
            </DialogTitle>
            <DialogDescription className="text-[hsl(var(--fc-text-muted))]">
              {inputMode === 'custom'
                ? 'Type food names to auto-fill nutrition data'
                : 'Compare nutritional values across different goals.'}
            </DialogDescription>
          </div>
          {/* Custom Close Button */}
          <DialogPrimitive.Close className="rounded-full p-2 opacity-70 ring-offset-background transition-all hover:bg-[hsl(var(--fc-surface-raised))] hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--fc-focus))] focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-5 w-5 text-[hsl(var(--fc-text-muted))] hover:text-[hsl(var(--fc-text))]" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Mode Tabs */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MODE_LABELS) as ComparisonMode[]).map((mode) => {
              const isSelected = selectedMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => {
                    setSelectedMode(mode);
                    setShowAllModes(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[hsl(var(--fc-focus))]",
                    isSelected
                      ? "bg-[hsl(var(--fc-primary-soft)/0.2)] text-[hsl(var(--fc-text))] border border-[hsl(var(--fc-primary))]"
                      : "bg-[hsl(var(--fc-surface-raised))] text-[hsl(var(--fc-text-muted))] border border-[hsl(var(--fc-border))] hover:bg-[hsl(var(--fc-primary-soft)/0.1)]"
                  )}
                >
                  <span>{MODE_ICONS[mode]}</span>
                  {MODE_LABELS[mode]}
                </button>
              );
            })}

            {/* View All Modes Toggle */}
            {canCompare && (
              <button
                onClick={() => setShowAllModes(!showAllModes)}
                className={cn(
                  "flex items-center gap-1 ml-auto px-3 py-1.5 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[hsl(var(--fc-focus))]",
                  showAllModes
                    ? "bg-[hsl(var(--fc-primary))] text-white"
                    : "text-[hsl(var(--fc-text-muted))] hover:bg-[hsl(var(--fc-surface-raised))]"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
                {showAllModes ? 'Single View' : 'All Modes'}
              </button>
            )}
          </div>

          {/* Input Mode Selector */}
          <div className="flex flex-wrap gap-2 border-b border-[hsl(var(--fc-border))] pb-4">
            <span className="text-sm text-[hsl(var(--fc-text-muted))] py-1">Choose foods:</span>
            {Object.keys(PRESET_COMPARISONS).map((key) => {
              const isActive = inputMode === 'preset' && foodA.name === PRESET_COMPARISONS[key as keyof typeof PRESET_COMPARISONS].foodA.name;
              return (
                <button
                  key={key}
                  onClick={() => loadPreset(key as keyof typeof PRESET_COMPARISONS)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[hsl(var(--fc-focus))]",
                    isActive
                      ? "bg-[hsl(var(--fc-primary))] text-white"
                      : "bg-[hsl(var(--fc-surface-raised))] text-[hsl(var(--fc-text-muted))] border border-[hsl(var(--fc-border))] hover:bg-[hsl(var(--fc-primary-soft)/0.1)]"
                  )}
                >
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </button>
              );
            })}
            <button
              onClick={startCustomEntry}
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[hsl(var(--fc-focus))]",
                inputMode === 'custom'
                  ? "bg-[hsl(var(--fc-primary))] text-white"
                  : "bg-[hsl(var(--fc-surface-raised))] text-[hsl(var(--fc-text-muted))] border border-[hsl(var(--fc-border))] hover:bg-[hsl(var(--fc-primary-soft)/0.1)]"
              )}
            >
              <Pencil className="w-3 h-3 text-[hsl(var(--fc-focus))]" />
              Custom
            </button>
          </div>

          {/* Food Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
            <AutoLookupFoodCard
              title="Food A"
              food={foodA}
              onChange={setFoodA}
              isCustomMode={inputMode === 'custom'}
              variant="A"
            />

            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <div className="bg-[hsl(var(--fc-primary))] text-[hsl(var(--fc-bg))] w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md border-2 border-[hsl(var(--fc-surface))]">
                VS
              </div>
              <button
                onClick={swapFoods}
                className="p-2 rounded-full text-[hsl(var(--fc-text-muted))] hover:text-[hsl(var(--fc-focus))] hover:bg-[hsl(var(--fc-surface-raised))] transition-all focus:outline-none focus:ring-2 focus:ring-[hsl(var(--fc-focus))]"
                aria-label="Swap foods"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            <AutoLookupFoodCard
              title="Food B"
              food={foodB}
              onChange={setFoodB}
              isCustomMode={inputMode === 'custom'}
              variant="B"
            />
          </div>

          {/* Validation Warning */}
          {!canCompare && inputMode === 'custom' && (
            <div className="p-3 bg-[hsl(var(--fc-warning)/0.1)] border border-[hsl(var(--fc-warning)/0.2)] rounded-lg flex items-start gap-2">
              <Info className="w-5 h-5 text-[hsl(var(--fc-warning))] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[hsl(var(--fc-text-muted))]">
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
      </FoodComparisonContent>
    </Dialog>
  );
}

// ============================================================================
// All Modes Grid
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

        // Use strict palette for winner header
        const headerClass = result.winner === 'A' ? 'bg-[hsl(var(--fc-primary-hover))]' // Fern
          : result.winner === 'B' ? 'bg-[hsl(var(--fc-focus))]' // Ochre
            : 'bg-[hsl(var(--fc-surface-raised))] border-b border-[hsl(var(--fc-border))]';

        const textClass = result.winner === 'tie' ? 'text-[hsl(var(--fc-text))]' : 'text-white';

        return (
          <div key={mode} className="border border-[hsl(var(--fc-border))] rounded-lg overflow-hidden bg-[hsl(var(--fc-surface))]">
            {/* Header */}
            <div className={`${headerClass} px-3 py-2 ${textClass}`}>
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
            <div className="p-3">
              <p className="text-sm text-[hsl(var(--fc-text))] mb-2">{result.summary}</p>

              {/* Key Differences */}
              {result.keyDifferences.length > 0 && (
                <ul className="text-xs text-[hsl(var(--fc-text-muted))] space-y-0.5 mb-2">
                  {result.keyDifferences.slice(0, 2).map((diff, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-[hsl(var(--fc-focus))]">•</span>
                      {diff}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Auto-Lookup Food Card
// ============================================================================

interface AutoLookupFoodCardProps {
  title: string;
  food: ComparisonFoodItem;
  onChange: (food: ComparisonFoodItem) => void;
  isCustomMode: boolean;
  variant: 'A' | 'B';
}

function AutoLookupFoodCard({ title, food, onChange, isCustomMode, variant }: AutoLookupFoodCardProps) {
  const { searchSuggestions, search, clearSuggestions, lookupFood, isLoading } = useNutritionLookup();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [nameInput, setNameInput] = useState(food.name);
  const [servingInput, setServingInput] = useState(food.servingSize);

  const completeness = calculateDataCompleteness(food);

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

  // Variant A = Fern (Primary Hover), Variant B = Ochre (Focus) - subtle backgrounds
  const borderColor = variant === 'A' ? 'border-[hsl(var(--fc-primary)/0.3)]' : 'border-[hsl(var(--fc-focus)/0.3)]';
  const labelColor = variant === 'A' ? 'text-[hsl(var(--fc-primary))]' : 'text-[hsl(var(--fc-focus))]';

  return (
    <div className={`p-4 rounded-xl border-2 bg-[hsl(var(--fc-surface-raised))] relative ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold ${labelColor}`}>{title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${completeness >= 100 ? 'bg-[hsl(var(--fc-primary-soft)/0.2)] text-[hsl(var(--fc-primary))] border border-[hsl(var(--fc-primary))]' : 'bg-[hsl(var(--fc-surface))] text-[hsl(var(--fc-text-muted))] border border-[hsl(var(--fc-border))]'}`}>
          {completeness >= 100 ? 'Complete' : 'Incomplete'}
        </span>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <label htmlFor={`${title}-name`} className="text-xs text-[hsl(var(--fc-text-muted))] flex items-center gap-1 mb-1">
            <Search className="w-3 h-3" />
            Food Name {isCustomMode && <span className="text-[hsl(var(--fc-text-muted))] opacity-70">(type to search)</span>}
          </label>
          <input
            id={`${title}-name`}
            type="text"
            value={nameInput}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => isCustomMode && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            disabled={!isCustomMode}
            className="w-full px-3 py-2 bg-[hsl(var(--fc-surface))] border border-[hsl(var(--fc-border))] rounded-lg text-sm text-[hsl(var(--fc-text))] placeholder:text-[hsl(var(--fc-text-muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--fc-focus))] disabled:opacity-50"
            placeholder={isCustomMode ? "e.g., oatmeal, chicken..." : ""}
            autoComplete="off"
          />

          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-[hsl(var(--fc-surface))] border border-[hsl(var(--fc-border))] rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {searchSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-[hsl(var(--fc-text))] hover:bg-[hsl(var(--fc-surface-raised))] flex items-center justify-between"
                  onMouseDown={() => handleSelectSuggestion(suggestion)}
                >
                  <span>{suggestion.name}</span>
                  <span className="text-xs text-[hsl(var(--fc-text-muted))]">{suggestion.per100g.calories} cal/100g</span>
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="absolute right-3 top-8">
              <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--fc-primary))]" />
            </div>
          )}
        </div>

        <div>
          <label htmlFor={`${title}-serving`} className="text-xs text-[hsl(var(--fc-text-muted))] mb-1 block">Serving Size</label>
          <input
            id={`${title}-serving`}
            type="text"
            value={servingInput}
            onChange={(e) => handleServingChange(e.target.value)}
            onBlur={handleServingBlur}
            disabled={!isCustomMode}
            className="w-full px-3 py-2 bg-[hsl(var(--fc-surface))] border border-[hsl(var(--fc-border))] rounded-lg text-sm text-[hsl(var(--fc-text))] placeholder:text-[hsl(var(--fc-text-muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--fc-focus))] disabled:opacity-50"
            placeholder="1 cup, 100g, 2 slices..."
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[{ label: 'Cals', val: food.calories }, { label: 'Prot', val: food.macros.protein_g }, { label: 'Carbs', val: food.macros.carbs_g }, { label: 'Fat', val: food.macros.fat_g }].map((macro, i) => (
            <div key={i}>
              <label className="text-[10px] text-[hsl(var(--fc-text-muted))] block text-center mb-0.5">{macro.label}</label>
              <div className="px-1 py-1.5 border border-[hsl(var(--fc-border))] rounded-lg text-xs bg-[hsl(var(--fc-surface))] text-[hsl(var(--fc-text))] text-center font-medium truncate">
                {formatNutrientDisplay(macro.val, macro.label === 'Cals' ? '' : 'g')}
              </div>
            </div>
          ))}
        </div>

        <div className="text-[10px] text-[hsl(var(--fc-text-muted))] flex items-center gap-1 mt-1 justify-end">
          {sourceLabel}
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
  showModeLabel?: boolean;
}

function ComparisonResultCard({ verdict, foodA, foodB, translateFood, hasIncompleteData, showModeLabel }: ComparisonResultCardProps) {
  // Strict Chart Colors: A = Fern (--fc-chart-a), B = Ochre (--fc-chart-b)
  const winnerColorClass =
    verdict.winner === 'A'
      ? 'bg-[hsl(var(--fc-primary-hover))]' // Fern
      : verdict.winner === 'B'
        ? 'bg-[hsl(var(--fc-focus))]' // Ochre
        : verdict.winner === 'insufficient-data'
          ? 'bg-[hsl(var(--fc-surface-raised))] border-b border-[hsl(var(--fc-border))]'
          : 'bg-[hsl(var(--fc-surface-raised))] border-b border-[hsl(var(--fc-border))]';

  const winnerTextColor = (verdict.winner === 'insufficient-data' || verdict.winner === 'tie')
    ? 'text-[hsl(var(--fc-text))]'
    : 'text-white';

  const winnerName =
    verdict.winner === 'A' ? translateFood(foodA.name) :
      verdict.winner === 'B' ? translateFood(foodB.name) :
        verdict.winner === 'insufficient-data' ? 'Insufficient Data' : 'Tie';

  return (
    <div className="border border-[hsl(var(--fc-border))] rounded-xl overflow-hidden bg-[hsl(var(--fc-surface))] shadow-sm">
      <div className={`${winnerColorClass} px-4 py-3 ${winnerTextColor}`}>
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
            <span className="text-sm opacity-90 capitalize flex items-center gap-1 font-medium bg-black/10 px-2 py-0.5 rounded-full">
              {MODE_ICONS[verdict.context as ComparisonMode]} {verdict.context.replace('-', ' ')}
            </span>
          )}
        </div>
      </div>

      {hasIncompleteData && (
        <div className="px-4 py-2 bg-[hsl(var(--fc-warning)/0.1)] border-b border-[hsl(var(--fc-warning)/0.2)] flex items-center gap-2">
          <Info className="w-4 h-4 text-[hsl(var(--fc-warning))]" />
          <span className="text-xs text-[hsl(var(--fc-warning))]">Comparison based on available data.</span>
        </div>
      )}

      <div className="p-4 bg-[hsl(var(--fc-surface))] border-b border-[hsl(var(--fc-border))]">
        <p className="text-[hsl(var(--fc-text))] leading-relaxed">{verdict.summary}</p>
      </div>

      <div className="p-4 space-y-4">
        <h4 className="font-medium text-[hsl(var(--fc-text))] border-b border-[hsl(var(--fc-border))] pb-2">Macro Comparison</h4>
        <MacroBar label="Calories" valueA={foodA.calories} valueB={foodB.calories} unit="" />
        <MacroBar label="Protein" valueA={foodA.macros.protein_g} valueB={foodB.macros.protein_g} unit="g" />
        <MacroBar label="Carbs" valueA={foodA.macros.carbs_g} valueB={foodB.macros.carbs_g} unit="g" />
        <MacroBar label="Fat" valueA={foodA.macros.fat_g} valueB={foodB.macros.fat_g} unit="g" />
      </div>

      {verdict.keyDifferences.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className="font-medium text-[hsl(var(--fc-text))] mb-2">Key Differences</h4>
          <ul className="space-y-1">
            {verdict.keyDifferences.map((diff, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-[hsl(var(--fc-text-muted))]">
                <span className="text-[hsl(var(--fc-focus))] mt-0.5">•</span>
                {diff}
              </li>
            ))}
          </ul>
        </div>
      )}

      {verdict.recommendations.length > 0 && (
        <div className="px-4 pb-4 bg-[hsl(var(--fc-surface-raised)/0.5)] mx-4 rounded-lg mb-4 pt-3">
          <h4 className="font-medium text-[hsl(var(--fc-text))] mb-2 flex items-center gap-2">
            Recommendations
          </h4>
          <ul className="space-y-2">
            {verdict.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-[hsl(var(--fc-text-muted))]">
                <Sparkles className="h-4 w-4 text-[hsl(var(--fc-primary))] mt-0.5 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
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
  const maxVal = Math.max(valueA || 0, valueB || 0, 1);
  const percentageA = ((valueA || 0) / maxVal) * 100;
  const percentageB = ((valueB || 0) / maxVal) * 100;
  const hasA = valueA !== null;
  const hasB = valueB !== null;

  return (
    <div>
      <div className="flex justify-between text-xs text-[hsl(var(--fc-text-muted))] mb-1">
        <span>{label}</span>
        <span className="font-medium text-[hsl(var(--fc-text))]">
          {formatNutrientDisplay(valueA, unit)} <span className="text-[hsl(var(--fc-border))] mx-1">vs</span> {formatNutrientDisplay(valueB, unit)}
        </span>
      </div>
      <div className="h-3 bg-[hsl(var(--fc-border)/0.3)] rounded-full overflow-hidden flex gap-0.5 relative">
        {/* A Bar (Fern) */}
        <div
          className={`${hasA ? 'bg-[hsl(var(--fc-chart-a))]' : 'bg-[hsl(var(--fc-text-muted)/0.3)]'} h-full transition-all`}
          style={{ width: hasA ? `${percentageA / 2}%` : '50%' }}
        />
        {/* B Bar (Ochre) */}
        <div
          className={`${hasB ? 'bg-[hsl(var(--fc-chart-b))]' : 'bg-[hsl(var(--fc-text-muted)/0.3)]'} h-full transition-all`}
          style={{ width: hasB ? `${percentageB / 2}%` : '50%' }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[hsl(var(--fc-text-muted))] mt-0.5 px-0.5">
        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--fc-chart-a))]"></div>A</span>
        <span className="flex items-center gap-1">B<div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--fc-chart-b))]"></div></span>
      </div>
    </div>
  );
}
