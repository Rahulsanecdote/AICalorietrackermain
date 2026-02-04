import { useState, useEffect } from 'react';
import { X, ChefHat, Check, Package } from 'lucide-react';
import { PantryInputProps, PantryInputData } from '../types';

const defaultData: PantryInputData = {
  breakfast: '',
  lunch: '',
  dinner: '',
  snacks: '',
};

const mealIcons = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snacks: '🍿',
};

const mealColors = {
  breakfast: {
    bg: 'bg-amber-50 dark:bg-amber-900/10',
    border: 'border-amber-200 dark:border-amber-800/50',
    accent: 'text-amber-700 dark:text-amber-400',
  },
  lunch: {
    bg: 'bg-green-50 dark:bg-green-900/10',
    border: 'border-green-200 dark:border-green-800/50',
    accent: 'text-green-700 dark:text-green-400',
  },
  dinner: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/10',
    border: 'border-indigo-200 dark:border-indigo-800/50',
    accent: 'text-indigo-700 dark:text-indigo-400',
  },
  snacks: {
    bg: 'bg-pink-50 dark:bg-pink-900/10',
    border: 'border-pink-200 dark:border-pink-800/50',
    accent: 'text-pink-700 dark:text-pink-400',
  },
};

export default function PantryInput({
  isOpen,
  onClose,
  initialData,
  onSave,
  onGeneratePlan,
}: PantryInputProps) {
  const [pantryData, setPantryData] = useState<PantryInputData>(initialData || defaultData);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);



  useEffect(() => {
    if (initialData) {
      setPantryData(initialData);
    } else {
      setPantryData(defaultData);
    }
  }, [initialData]);

  if (!isOpen) {
    return null;
  }

  const handleInputChange = (field: keyof PantryInputData, value: string) => {
    setPantryData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      await onGeneratePlan(pantryData);
      if (saveAsDefault) {
        await onSave(pantryData, true);
      }
      onClose();
    } catch (error) {
      console.error('Error generating meal plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDefault = async () => {
    await onSave(pantryData, true);
    setSaveAsDefault(false);
  };

  const getMealData = (mealType: keyof PantryInputData) => {
    const colors = mealColors[mealType as keyof typeof mealColors];
    const icon = mealIcons[mealType as keyof typeof mealIcons];

    return {
      colors,
      icon,
      label: mealType.charAt(0).toUpperCase() + mealType.slice(1),
      placeholder: getPlaceholderText(mealType),
    };
  };

  const getPlaceholderText = (mealType: string): string => {
    switch (mealType) {
      case 'breakfast':
        return 'e.g., eggs, oats, banana, milk, almonds';
      case 'lunch':
        return 'e.g., chicken breast, rice, broccoli, olive oil';
      case 'dinner':
        return 'e.g., salmon, quinoa, spinach, avocado';
      case 'snacks':
        return 'e.g., greek yogurt, berries, protein powder (optional)';
      default:
        return 'Enter foods separated by commas';
    }
  };

  const hasAnyFoods = Object.values(pantryData).some(food => food.trim().length > 0);
  const isFormValid = pantryData.breakfast.trim() && pantryData.lunch.trim() && pantryData.dinner.trim();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col border border-border">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">What foods do you have available?</h2>
              <p className="text-sm text-muted-foreground">Enter your available foods for each meal time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            disabled={isGenerating}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {Object.entries(pantryData).map(([mealType, foods]) => {
              const mealData = getMealData(mealType as keyof PantryInputData);

              return (
                <div
                  key={mealType}
                  className={`${mealData.colors.bg} ${mealData.colors.border} border rounded-xl p-4`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{mealData.icon}</span>
                    <h3 className={`font-semibold ${mealData.colors.accent}`}>
                      {mealData.label} Foods
                    </h3>
                  </div>

                  <textarea
                    id={`pantry-${mealType}`}
                    name={`pantry-${mealType}`}
                    autoComplete="off"
                    value={foods}
                    onChange={(e) => handleInputChange(mealType as keyof PantryInputData, e.target.value)}
                    placeholder={mealData.placeholder}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent resize-none text-foreground placeholder:text-muted-foreground"
                    rows={2}
                    disabled={isGenerating}
                  />

                  <p className="text-xs text-muted-foreground mt-1">
                    Separate foods with commas
                  </p>
                </div>
              );
            })}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <ChefHat className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                  AI will only use these foods
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Enter foods you actually have available. The AI will calculate exact portions
                  to reach your calorie goal and create a personalized meal plan.
                </p>
              </div>
            </div>
          </div>

          {/* Save as Default Checkbox */}
          <div className="mt-6 flex items-center gap-2">
            <input
              type="checkbox"
              id="saveDefault"
              checked={saveAsDefault}
              onChange={(e) => setSaveAsDefault(e.target.checked)}
              className="w-4 h-4 text-primary border-input rounded focus:ring-ring bg-background"
              disabled={!hasAnyFoods || isGenerating}
            />
            <label htmlFor="saveDefault" className="text-sm text-foreground">
              Save these foods as my default pantry
            </label>
            {hasAnyFoods && (
              <button
                onClick={handleSaveDefault}
                className="text-xs text-primary hover:text-primary/80 font-medium"
                disabled={isGenerating}
              >
                Save now
              </button>
            )}
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex justify-end gap-3 p-4 border-t border-border flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGeneratePlan}
            disabled={!isFormValid || isGenerating}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Generating Plan...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Generate Smart Meal Plan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
