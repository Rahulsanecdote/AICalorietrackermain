import React, { useState } from 'react';
import { Recipe } from '../../types/recipes';
import { X, Clock, Users, ChefHat, Lightbulb, Share2 } from 'lucide-react';

interface RecipeDetailModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
}

type TabType = 'ingredients' | 'instructions' | 'tips';

export default function RecipeDetailModal({
  recipe,
  isOpen,
  onClose,
  onToggleFavorite,
  isFavorite = false,
}: RecipeDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ingredients');

  if (!isOpen) return null;

  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: `Check out this recipe: ${recipe.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(`${recipe.title}\n\n${recipe.description}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header Image */}
          <div className="relative h-48 bg-gradient-to-br from-indigo-400 to-purple-500">
            {recipe.imageUrl && (
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Favorite button */}
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className={`absolute top-3 left-3 p-2 rounded-full transition-colors ${
                  isFavorite
                    ? 'bg-red-500 text-white'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill={isFavorite ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
            )}

            {/* Title and badges */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h2 className="text-2xl font-bold mb-2">{recipe.title}</h2>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100">
            <div className="text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-gray-400" />
              <p className="text-lg font-bold text-gray-900">{totalTime}</p>
              <p className="text-xs text-gray-500">min total</p>
            </div>
            <div className="text-center">
              <ChefHat className="w-5 h-5 mx-auto mb-1 text-gray-400" />
              <p className="text-lg font-bold text-gray-900">{recipe.prepTimeMinutes}</p>
              <p className="text-xs text-gray-500">prep</p>
            </div>
            <div className="text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-gray-400" />
              <p className="text-lg font-bold text-gray-900">{recipe.servings}</p>
              <p className="text-xs text-gray-500">servings</p>
            </div>
            <div className="text-center">
              <div className="w-5 h-5 mx-auto mb-1 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-600">
                  {recipe.caloriesPerServing}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900">{recipe.caloriesPerServing}</p>
              <p className="text-xs text-gray-500">cal/serving</p>
            </div>
          </div>

          {/* Description */}
          {recipe.description && (
            <p className="px-4 py-3 text-gray-600 text-sm border-b border-gray-100">
              {recipe.description}
            </p>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(['ingredients', 'instructions', 'tips'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 overflow-y-auto max-h-80">
            {activeTab === 'ingredients' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Ingredients</h3>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient) => (
                    <li key={ingredient.id} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span className="text-gray-700">
                        <strong>{ingredient.amount} {ingredient.unit}</strong> {ingredient.name}
                      </span>
                    </li>
                  ))}
                </ul>
                
                {/* Macros summary */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Per Serving</h4>
                  <div className="flex gap-4 text-sm">
                    <span className="text-blue-600">
                      <strong>{recipe.macros.protein}g</strong> Protein
                    </span>
                    <span className="text-amber-600">
                      <strong>{recipe.macros.carbs}g</strong> Carbs
                    </span>
                    <span className="text-red-600">
                      <strong>{recipe.macros.fat}g</strong> Fat
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'instructions' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Instructions</h3>
                <ol className="space-y-4">
                  {recipe.instructions.map((step) => (
                    <li key={step.order} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                        {step.order}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 text-sm">{step.instruction}</p>
                        {step.durationMinutes && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {step.durationMinutes} min
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {activeTab === 'tips' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Meal Prep Tips
                </h3>
                {recipe.prepTips && recipe.prepTips.length > 0 ? (
                  <ul className="space-y-3">
                    {recipe.prepTips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-700 text-sm">{tip}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No prep tips available for this recipe.</p>
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex gap-2 p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
