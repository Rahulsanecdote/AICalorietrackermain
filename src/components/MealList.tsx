import { Meal } from '../types';
import { Recipe } from '../types/recipes';
import MealCard from './MealCard';
import { UtensilsCrossed } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MealListProps {
  meals: Meal[];
  onDelete: (id: string) => void;
  onEdit: (meal: Meal) => void;
  onViewRecipe?: (recipe: Recipe) => void;
  onToggleFavorite?: (recipeId: string) => void;
  isFavorite?: (recipeId: string) => boolean;
  onAddToShoppingList?: (meal: Meal) => void;
  isInShoppingList?: (meal: Meal) => boolean;
}

export default function MealList({ 
  meals, 
  onDelete, 
  onEdit, 
  onViewRecipe,
  onToggleFavorite,
  isFavorite = () => false,
  onAddToShoppingList,
  isInShoppingList = () => false
}: MealListProps) {
  const { t } = useTranslation();
  const groupedMeals = meals.reduce((acc, meal) => {
    const category = meal.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(meal);
    return acc;
  }, {} as Record<string, Meal[]>);

  const categoryOrder: ('breakfast' | 'lunch' | 'dinner' | 'snack')[] = [
    'breakfast',
    'lunch',
    'dinner',
    'snack',
  ];

  if (meals.length === 0) {
    return (
      <div className="bg-card rounded-2xl shadow-sm p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-full mb-4">
          <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{t('mealList.noMeals')}</h3>
        <p className="text-muted-foreground">{t('mealList.startTracking')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categoryOrder.map((category) => {
        const categoryMeals = groupedMeals[category] || [];
        if (categoryMeals.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
              {category}
            </h3>
            <div className="space-y-3">
              {categoryMeals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onViewRecipe={onViewRecipe}
                  onToggleFavorite={onToggleFavorite}
                  isFavorite={isFavorite(meal.recipe?.id || '')}
                  onAddToShoppingList={onAddToShoppingList}
                  isInShoppingList={isInShoppingList(meal)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
