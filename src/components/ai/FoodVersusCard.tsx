'use client';

import React, { useState } from 'react';
import { ArrowRightLeft, Sparkles, TrendingUp, Minus } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { useFoodComparator, PRESET_COMPARISONS } from '../../hooks/useFoodComparator';
import { ComparisonFoodItem, ComparisonVerdict } from '../../types/ai';


interface FoodVersusCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FoodVersusCard({ isOpen, onClose }: FoodVersusCardProps) {
  const [context, setContext] = useState<'weight-loss' | 'muscle-gain' | 'general-health' | 'energy'>('general-health');
  const [foodA, setFoodA] = useState<ComparisonFoodItem>(PRESET_COMPARISONS.pizzaVsSalad.foodA);
  const [foodB, setFoodB] = useState<ComparisonFoodItem>(PRESET_COMPARISONS.pizzaVsSalad.foodB);
  const [useCustom, setUseCustom] = useState(false);
  const [customA, setCustomA] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [customB, setCustomB] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });

  const { status, data, error, generateComparison, clearComparison } = useFoodComparator();

  const handleCompare = async () => {
    const itemA = useCustom
      ? { ...foodA, name: customA.name || foodA.name }
      : foodA;
    const itemB = useCustom
      ? { ...foodB, name: customB.name || foodB.name }
      : foodB;

    await generateComparison(itemA, itemB, context);
  };

  const handleClose = () => {
    clearComparison();
    onClose();
  };

  const loadPreset = (preset: keyof typeof PRESET_COMPARISONS) => {
    setUseCustom(false);
    setFoodA(PRESET_COMPARISONS[preset].foodA);
    setFoodB(PRESET_COMPARISONS[preset].foodB);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
            Food Comparison
          </DialogTitle>
          <DialogDescription>
            Compare nutritional values of different foods to make better choices.
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

          {/* Preset Buttons */}
          {!useCustom && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500 py-1">Presets:</span>
              {Object.keys(PRESET_COMPARISONS).map((key) => (
                <Button
                  key={key}
                  variant="ghost"
                  size="sm"
                  onClick={() => loadPreset(key as keyof typeof PRESET_COMPARISONS)}
                  className="text-xs"
                >
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUseCustom(true)}
                className="text-xs"
              >
                Custom
              </Button>
            </div>
          )}

          {/* Food Comparison UI */}
          <div className="grid grid-cols-2 gap-4">
            {/* Food A */}
// Food A
            <FoodInputCard
              title="Food A"
              food={foodA}
              onChange={setFoodA}
              isCustom={useCustom}
              customValues={customA}
              onCustomChange={setCustomA}
              color="blue"
            />

            {/* VS Badge */}
            <div className="flex items-center justify-center">
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-full font-bold text-lg">
                VS
              </div>
            </div>

            {/* Food B */}
            <FoodInputCard
              title="Food B"
              food={foodB}
              onChange={setFoodB}
              isCustom={useCustom}
              customValues={customB}
              onCustomChange={setCustomB}
              color="green"
            />
          </div>

          {/* Compare Button */}
          <Button
            onClick={handleCompare}
            disabled={status === 'processing'}
            className="w-full"
            size="lg"
          >
            {status === 'processing' ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Compare Foods
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Results */}
          {data && (
            <ComparisonResultCard verdict={data.verdict} foodA={data.foodA} foodB={data.foodB} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface FoodInputCardProps {
  title: string;
  food: ComparisonFoodItem;
  onChange: (food: ComparisonFoodItem) => void;
  isCustom: boolean;
  customValues: {
    name: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };
  onCustomChange: React.Dispatch<React.SetStateAction<{
    name: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  }>>;
  color: 'blue' | 'green';
}

function FoodInputCard({
  title,
  food,
  onChange,
  onCustomChange,
  isCustom,
  customValues,
  color,
}: FoodInputCardProps) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
  };

  return (
    <div className={`p-4 rounded-xl border-2 ${colorClasses[color]}`}>
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>

      <div className="space-y-3">
        <div>
          <label htmlFor={`${title.toLowerCase().replace(' ', '-')}-food-name`} className="text-xs text-gray-500">Food Name</label>
          <input
            id={`${title.toLowerCase().replace(' ', '-')}-food-name`}
            name={`${title.toLowerCase().replace(' ', '-')}-food-name`}
            type="text"
            autoComplete="off"
            value={isCustom ? customValues.name : food.name}
            onChange={(e) =>
              isCustom
                ? onCustomChange({ ...customValues, name: e.target.value })
                : onChange({ ...food, name: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Enter food name"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={`${title.toLowerCase().replace(' ', '-')}-calories`} className="text-xs text-gray-500">Calories</label>
            <input
              id={`${title.toLowerCase().replace(' ', '-')}-calories`}
              name={`${title.toLowerCase().replace(' ', '-')}-calories`}
              type="number"
              autoComplete="off"
              value={isCustom ? customValues.calories : food.calories}
              onChange={(e) =>
                isCustom
                  ? onCustomChange({ ...customValues, calories: e.target.value })
                  : onChange({ ...food, calories: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor={`${title.toLowerCase().replace(' ', '-')}-serving`} className="text-xs text-gray-500">Serving</label>
            <input
              id={`${title.toLowerCase().replace(' ', '-')}-serving`}
              name={`${title.toLowerCase().replace(' ', '-')}-serving`}
              type="text"
              autoComplete="off"
              value={food.servingSize}
              onChange={(e) => onChange({ ...food, servingSize: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="1 serving"
              disabled={isCustom}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label htmlFor={`${title.toLowerCase().replace(' ', '-')}-protein`} className="text-xs text-gray-500">Protein (g)</label>
            <input
              id={`${title.toLowerCase().replace(' ', '-')}-protein`}
              name={`${title.toLowerCase().replace(' ', '-')}-protein`}
              type="number"
              autoComplete="off"
              value={isCustom ? customValues.protein : food.macros.protein_g}
              onChange={(e) =>
                isCustom
                  ? onCustomChange({ ...customValues, protein: e.target.value })
                  : onChange({ ...food, macros: { ...food.macros, protein_g: Number(e.target.value) } })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor={`${title.toLowerCase().replace(' ', '-')}-carbs`} className="text-xs text-gray-500">Carbs (g)</label>
            <input
              id={`${title.toLowerCase().replace(' ', '-')}-carbs`}
              name={`${title.toLowerCase().replace(' ', '-')}-carbs`}
              type="number"
              autoComplete="off"
              value={isCustom ? customValues.carbs : food.macros.carbs_g}
              onChange={(e) =>
                isCustom
                  ? onCustomChange({ ...customValues, carbs: e.target.value })
                  : onChange({ ...food, macros: { ...food.macros, carbs_g: Number(e.target.value) } })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor={`${title.toLowerCase().replace(' ', '-')}-fat`} className="text-xs text-gray-500">Fat (g)</label>
            <input
              id={`${title.toLowerCase().replace(' ', '-')}-fat`}
              name={`${title.toLowerCase().replace(' ', '-')}-fat`}
              type="number"
              autoComplete="off"
              value={isCustom ? customValues.fat : food.macros.fat_g}
              onChange={(e) =>
                isCustom
                  ? onCustomChange({ ...customValues, fat: e.target.value })
                  : onChange({ ...food, macros: { ...food.macros, fat_g: Number(e.target.value) } })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ComparisonResultCardProps {
  verdict: ComparisonVerdict;
  foodA: ComparisonFoodItem;
  foodB: ComparisonFoodItem;
}

function ComparisonResultCard({ verdict, foodA, foodB }: ComparisonResultCardProps) {
  const winnerColor =
    verdict.winner === 'A'
      ? 'bg-blue-600'
      : verdict.winner === 'B'
        ? 'bg-green-600'
        : 'bg-gray-600';

  const winnerName = verdict.winner === 'A' ? foodA.name : verdict.winner === 'B' ? foodB.name : 'Tie';

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Winner Header */}
      <div className={`${winnerColor} px-4 py-3 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {verdict.winner !== 'tie' ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <Minus className="h-5 w-5" />
            )}
            <span className="font-semibold">
              {verdict.winner === 'tie' ? "It's a Tie!" : `${winnerName} Wins!`}
            </span>
          </div>
          <span className="text-sm opacity-90 capitalize">{verdict.context.replace('-', ' ')}</span>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50">
        <p className="text-gray-700">{verdict.summary}</p>
      </div>

      {/* Macro Comparison */}
      <div className="p-4 space-y-3">
        <h4 className="font-medium text-gray-900">Macro Comparison</h4>

        <MacroBar label="Calories" valueA={foodA.calories} valueB={foodB.calories} unit="" />
        <MacroBar label="Protein" valueA={foodA.macros.protein_g} valueB={foodB.macros.protein_g} unit="g" />
        <MacroBar label="Carbs" valueA={foodA.macros.carbs_g} valueB={foodB.macros.carbs_g} unit="g" />
        <MacroBar label="Fat" valueA={foodA.macros.fat_g} valueB={foodB.macros.fat_g} unit="g" />
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
    </div>
  );
}

interface MacroBarProps {
  label: string;
  valueA: number;
  valueB: number;
  unit: string;
}

function MacroBar({ label, valueA, valueB, unit }: MacroBarProps) {
  const maxValue = Math.max(valueA, valueB, 1);
  const percentageA = (valueA / maxValue) * 100;
  const percentageB = (valueB / maxValue) * 100;

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span>
          {valueA}
          {unit} vs {valueB}
          {unit}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
        <div
          className="bg-blue-500 h-full"
          style={{ width: `${percentageA}%` }}
        />
        <div
          className="bg-green-500 h-full"
          style={{ width: `${percentageB}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>A</span>
        <span>B</span>
      </div>
    </div>
  );
}
