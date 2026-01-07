'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, Send, Mic, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { useQuickAdd, QUICK_ADD_PRESETS } from '../../hooks/useQuickAdd';
import { useNutritionAI } from '../../hooks/useNutritionAI';
import { MealCategory } from '../../types';

interface QuickAddWidgetProps {
  onMealAdded: (meal: any) => void;
}

export function QuickAddWidget({ onMealAdded }: QuickAddWidgetProps) {
  const { t } = useTranslation('quickAdd');
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [category, setCategory] = useState<MealCategory>('snack');

  const {
    isProcessing,
    error,
    lastResult,
    processInput,
    createMealFromResult,
    closeWidget,
    reset,
  } = useQuickAdd({
    onSuccess: (meal) => {
      onMealAdded(meal);
      setInput('');
      reset();
      setTimeout(() => setIsExpanded(false), 1500);
    },
  });

  const { isLoading } = useNutritionAI();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const result = await processInput(input, category);
    if (result) {
      const meal = createMealFromResult(result);
      onMealAdded(meal);
      setInput('');
      reset();
      setTimeout(() => setIsExpanded(false), 1500);
    }
  };

  const handlePresetClick = (preset: typeof QUICK_ADD_PRESETS[0]) => {
    setInput(preset.description);
    setCategory(preset.category);
  };

  const handleClose = () => {
    setIsExpanded(false);
    reset();
    setInput('');
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsExpanded(true)}
        className={`fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isExpanded
            ? 'bg-gray-500 opacity-0 scale-0'
            : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-xl transform hover:scale-105'
        }`}
        aria-label={t('title')}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Expanded Widget */}
      {isExpanded && (
        <div className="fixed bottom-6 left-6 z-50 w-80 sm:w-96">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-emerald-600">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white">{t('title')}</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-emerald-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Category Selection */}
              <div className="flex gap-2 flex-wrap">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      category === cat
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {t(`meals.${cat}`)}
                  </button>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <textarea
                    id="quick-add-input"
                    name="quick-add-input"
                    autoComplete="off"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('placeholder')}
                    className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    rows={2}
                    disabled={isProcessing}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isProcessing}
                    className={`absolute right-2 bottom-2 p-2 rounded-lg transition-colors ${
                      !input.trim() || isProcessing
                        ? 'bg-gray-200 text-gray-400'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </form>

              {/* Error Message */}
              {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {lastResult && !isProcessing && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('added')}</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    {lastResult.foodName} - {lastResult.nutrition.calories} cal
                  </p>
                </div>
              )}

              {/* Presets */}
              <div>
                <p className="text-xs text-gray-500 mb-2">{t('quickAdd.quickPresets') || 'Quick presets:'}</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ADD_PRESETS.slice(0, 6).map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetClick(preset)}
                      disabled={isProcessing}
                      className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900 dark:hover:text-emerald-300 transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Input Hint */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Mic className="w-4 h-4" />
                <span>{t('quickAdd.voiceHint') || 'Tip: Use the Voice button in the header for hands-free entry'}</span>
              </div>
            </div>
          </div>

          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black/20 -z-10 lg:hidden"
            onClick={handleClose}
          />
        </div>
      )}
    </>
  );
}

// Compact version for the header
export function QuickAddButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation('quickAdd');

  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="sm"
      className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
    >
      <Plus className="w-4 h-4 mr-1" />
      {t('title')}
    </Button>
  );
}
