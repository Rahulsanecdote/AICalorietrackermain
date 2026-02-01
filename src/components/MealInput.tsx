import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { MealCategory } from '../types';

interface MealInputProps {
  onSubmit: (description: string, category: MealCategory) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onVoiceClick?: () => void;
}

const categoryOptions: { value: MealCategory; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

export default function MealInput({ onSubmit, isLoading, error }: MealInputProps) {
  const { t } = useTranslation();
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MealCategory>('breakfast');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim() && !isLoading) {
      await onSubmit(description.trim(), category);
      setDescription('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as React.FormEvent);
    }
  };

  const exampleDescriptions = [
    '2 scrambled eggs with toast',
    'Grilled chicken salad',
    'Greek yogurt with berries',
    'Oatmeal with banana',
  ];

  const fillExample = (example: string) => {
    setDescription(example);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('mealInput.logMeal')}</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <span className="block text-sm font-medium text-gray-700 mb-2">
            {t('mealInput.category')}
          </span>
          <div className="flex gap-2 flex-wrap">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategory(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${category === option.value
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="meal-description" className="block text-sm font-medium text-gray-700 mb-2">
            {t('mealInput.whatDidYouEat')}
          </label>
          <div className="relative">
            <textarea
              id="meal-description"
              name="meal-description"
              autoComplete="off"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('mealInput.placeholder')}
              className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
              rows={3}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!description.trim() || isLoading}
              className={`absolute bottom-3 right-3 p-2 rounded-full transition-all ${!description.trim() || isLoading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              aria-label="Submit meal"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 mb-4">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>{t('mealInput.analyzingAI')}</span>
          </div>
        )}
      </form>

      <div className="mt-4">
        <p className="text-xs text-gray-500 mb-2">{t('mealInput.quickExamples')}</p>
        <div className="flex gap-2 flex-wrap">
          {exampleDescriptions.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => fillExample(example)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
