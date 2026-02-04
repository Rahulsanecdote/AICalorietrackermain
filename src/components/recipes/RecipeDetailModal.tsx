import { useState } from 'react';
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
        <div className="relative bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-border">
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
                className={`absolute top-3 left-3 p-2 rounded-full transition-colors ${isFavorite
                  ? 'bg-red-500 text-white'
                  : 'bg-card/20 hover:bg-card/30 text-white'
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
                  <span key={tag} className="px-2 py-0.5 bg-card/20 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-4 p-4 border-b border-border">
            <div className="text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold text-foreground">{totalTime}</p>
              <p className="text-xs text-muted-foreground">min total</p>
            </div>
            <div className="text-center">
              <ChefHat className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold text-foreground">{recipe.prepTimeMinutes}</p>
              <p className="text-xs text-muted-foreground">prep</p>
            </div>
            <div className="text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold text-foreground">{recipe.servings}</p>
              <p className="text-xs text-muted-foreground">servings</p>
            </div>
            <div className="text-center">
              <div className="w-5 h-5 mx-auto mb-1 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {recipe.caloriesPerServing}
                </span>
              </div>
              <p className="text-lg font-bold text-foreground">{recipe.caloriesPerServing}</p>
              <p className="text-xs text-muted-foreground">cal/serving</p>
            </div>
          </div>

          {/* Description */}
          {recipe.description && (
            <p className="px-4 py-3 text-muted-foreground text-sm border-b border-border">
              {recipe.description}
            </p>
          )}

          {/* Tabs */}
          <div className="flex border-b border-border">
            {(['ingredients', 'instructions', 'tips'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
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
                <h3 className="font-semibold text-foreground mb-3">Ingredients</h3>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient) => (
                    <li key={ingredient.id} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span className="text-foreground">
                        <strong>{ingredient.amount} {ingredient.unit}</strong> {ingredient.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Macros summary */}
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-foreground mb-2">Per Serving</h4>
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
                <h3 className="font-semibold text-foreground mb-3">Instructions</h3>
                <ol className="space-y-4">
                  {recipe.instructions.map((step) => (
                    <li key={step.order} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-primary flex items-center justify-center font-bold text-sm">
                        {step.order}
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground text-sm">{step.instruction}</p>
                        {step.durationMinutes && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
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
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Meal Prep Tips
                </h3>
                {recipe.prepTips && recipe.prepTips.length > 0 ? (
                  <ul className="space-y-3">
                    {recipe.prepTips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-foreground text-sm">{tip}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">No prep tips available for this recipe.</p>
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex gap-2 p-4 border-t border-border bg-muted/30">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
