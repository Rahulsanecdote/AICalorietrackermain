import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Meal, MealCategory } from '../types';

interface EditMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meal: Meal) => void;
  meal: Meal | null;
}

const categoryOptions: { value: MealCategory; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

export default function EditMealModal({
  isOpen,
  onClose,
  onSave,
  meal,
}: EditMealModalProps) {
  const [localMeal, setLocalMeal] = useState<Meal | null>(null);

  useEffect(() => {
    if (meal) {
      setLocalMeal({ ...meal });
    }
  }, [meal]);

  if (!isOpen || !localMeal) return null;

  const handleSave = () => {
    onSave(localMeal);
    onClose();
  };

  const handleNutritionChange = (field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setLocalMeal({
      ...localMeal,
      nutrition: {
        ...localMeal.nutrition,
        [field]: numValue,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Edit Meal</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          <div>
            <label htmlFor="edit-meal-food-name" className="block text-sm font-medium text-foreground mb-2">
              Food Name
            </label>
            <input
              id="edit-meal-food-name"
              name="edit-meal-food-name"
              type="text"
              autoComplete="off"
              value={localMeal.foodName}
              onChange={(e) =>
                setLocalMeal({ ...localMeal, foodName: e.target.value })
              }
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="edit-meal-description" className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <input
              id="edit-meal-description"
              name="edit-meal-description"
              type="text"
              autoComplete="off"
              value={localMeal.description}
              onChange={(e) =>
                setLocalMeal({ ...localMeal, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-foreground mb-2">
              Category
            </span>
            <div className="flex gap-2 flex-wrap">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setLocalMeal({ ...localMeal, category: option.value })
                  }
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    localMeal.category === option.value
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-accent text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="edit-meal-serving-size" className="block text-sm font-medium text-foreground mb-2">
              Serving Size
            </label>
            <input
              id="edit-meal-serving-size"
              name="edit-meal-serving-size"
              type="text"
              autoComplete="off"
              value={localMeal.servingSize}
              onChange={(e) =>
                setLocalMeal({ ...localMeal, servingSize: e.target.value })
              }
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Nutritional Values
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-meal-calories" className="block text-sm text-muted-foreground mb-1">
                  Calories
                </label>
                <input
                  id="edit-meal-calories"
                  name="edit-meal-calories"
                  type="number"
                  autoComplete="off"
                  value={localMeal.nutrition.calories}
                  onChange={(e) => handleNutritionChange('calories', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="edit-meal-protein" className="block text-sm text-muted-foreground mb-1">
                  Protein (g)
                </label>
                <input
                  id="edit-meal-protein"
                  name="edit-meal-protein"
                  type="number"
                  autoComplete="off"
                  value={localMeal.nutrition.protein_g}
                  onChange={(e) => handleNutritionChange('protein_g', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="edit-meal-carbs" className="block text-sm text-muted-foreground mb-1">
                  Carbs (g)
                </label>
                <input
                  id="edit-meal-carbs"
                  name="edit-meal-carbs"
                  type="number"
                  autoComplete="off"
                  value={localMeal.nutrition.carbs_g}
                  onChange={(e) => handleNutritionChange('carbs_g', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="edit-meal-fat" className="block text-sm text-muted-foreground mb-1">
                  Fat (g)
                </label>
                <input
                  id="edit-meal-fat"
                  name="edit-meal-fat"
                  type="number"
                  autoComplete="off"
                  value={localMeal.nutrition.fat_g}
                  onChange={(e) => handleNutritionChange('fat_g', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
