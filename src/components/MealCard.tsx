import { Trash2, Edit2, Clock, Utensils, BookOpen, Heart, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFoodTranslation } from '../hooks/useFoodTranslation';
import { Meal } from '../types';
import { Recipe } from '../types/recipes';

interface MealCardProps {
  meal: Meal;
  onDelete: (id: string) => void;
  onEdit: (meal: Meal) => void;
  onViewRecipe?: (recipe: Recipe) => void;
  onToggleFavorite?: (recipeId: string) => void;
  onAddToShoppingList?: (meal: Meal) => void;
  isFavorite?: boolean;
  isInShoppingList?: boolean;
}

const categoryIcons = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍿',
};

const categoryColors = {
  breakfast: 'bg-amber-50 text-amber-600 border-amber-200',
  lunch: 'bg-sky-50 text-sky-600 border-sky-200',
  dinner: 'bg-indigo-50 text-primary border-indigo-200',
  snack: 'bg-pink-50 text-pink-600 border-pink-200',
};

const categoryBgColors = {
  breakfast: 'bg-amber-500',
  lunch: 'bg-sky-500',
  dinner: 'bg-indigo-500',
  snack: 'bg-pink-500',
};

export default function MealCard({
  meal,
  onDelete,
  onEdit,
  onViewRecipe,
  onToggleFavorite,
  onAddToShoppingList,
  isFavorite = false,
  isInShoppingList = false
}: MealCardProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const hasRecipe = !!meal.recipe;
  const { t } = useTranslation();
  const { translateFood } = useFoodTranslation();

  // Get translated category label
  const getCategoryLabel = (cat: string) => t(`meals.${cat}`);

  return (
    <div className="bg-card rounded-xl shadow-sm p-4 border border-border hover:shadow-md transition-shadow relative group">
      {/* Category color bar */}
      <div className={`absolute left-0 top-4 bottom-4 w-1 ${categoryBgColors[meal.category]} rounded-l-xl`} />

      {/* Favorite button */}
      {hasRecipe && onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(meal.recipe!.id);
          }}
          className={`absolute top-3 right-12 p-1.5 rounded-lg transition-colors z-10 ${isFavorite
            ? 'text-red-500 bg-red-50'
            : 'text-gray-300 hover:text-red-400 hover:bg-red-50'
            }`}
          aria-label={isFavorite ? t('common.removeFavorite') : t('common.addFavorite')}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      )}

      <div className="flex justify-between items-start mb-3 pl-3">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{categoryIcons[meal.category]}</div>
          <div>
            <h3 className="font-semibold text-foreground">{translateFood(meal.foodName)}</h3>
            <p className="text-sm text-muted-foreground mt-1">"{meal.description}"</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(meal)}
            className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            aria-label="Edit meal"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(meal.id)}
            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Delete meal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 pl-3">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{formatTime(meal.timestamp)}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${categoryColors[meal.category]
          }`}>
          {getCategoryLabel(meal.category)}
        </span>
        {hasRecipe && (
          <button
            onClick={() => onViewRecipe && meal.recipe && onViewRecipe(meal.recipe)}
            className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-primary rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors"
          >
            <BookOpen className="w-3 h-3" />
            {t('meals.recipe')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 pt-3 border-t border-border">
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">{meal.nutrition.calories}</div>
          <div className="text-xs text-muted-foreground">{t('meals.calories')}</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-500">{meal.nutrition.protein_g}g</div>
          <div className="text-xs text-muted-foreground">{t('meals.protein')}</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-amber-500">{meal.nutrition.carbs_g}g</div>
          <div className="text-xs text-muted-foreground">{t('meals.carbs')}</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-500">{meal.nutrition.fat_g}g</div>
          <div className="text-xs text-muted-foreground">{t('meals.fat')}</div>
        </div>
      </div>

      {/* Action bar with Shopping Cart */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          {/* Shopping Cart Button */}
          {onAddToShoppingList && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToShoppingList(meal);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isInShoppingList
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-accent text-muted-foreground border border-border hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600'
                }`}
              aria-label="Add ingredients to shopping list"
            >
              <ShoppingCart className={`w-4 h-4 ${isInShoppingList ? 'fill-current' : ''}`} />
              {isInShoppingList ? t('shopping.inList') : t('shopping.addToCart')}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Utensils className="w-4 h-4" />
          <span>{meal.servingSize}</span>
        </div>
      </div>
    </div>
  );
}
