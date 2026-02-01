import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Shuffle, Heart, ShoppingCart } from 'lucide-react';
import { FoodItem } from '../types';
import { getMeasurementDisplay } from '../utils/foodMeasurements';

interface EditableFoodItemProps {
  item: FoodItem;
  onUpdateWeight: (newWeight: number) => void;
  accentColor: string;
  onSwapFood?: (itemId: string) => void;
  onAddToShoppingList?: (item: FoodItem) => void;
  onToggleFavorite?: (item: FoodItem) => void;
  isFavorite?: boolean;
  isInShoppingList?: boolean;
  isSwapping?: boolean;
}

export default function EditableFoodItem({
  item,
  onUpdateWeight,

  onSwapFood,
  onAddToShoppingList,
  onToggleFavorite,
  isFavorite = false,
  isInShoppingList = false,
  isSwapping = false
}: EditableFoodItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [valueInput, setValueInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);



  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmit = () => {
    const newValue = parseFloat(valueInput);
    if (!isNaN(newValue) && newValue > 0) {
      // Input is already in grams, use directly
      if (newValue !== item.weightGrams) {
        onUpdateWeight(newValue);
      }
    }
    setValueInput('');
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setValueInput('');
      setIsEditing(false);
    }
  };

  const handleClick = () => {
    setIsEditing(true);
    // When editing, show grams (what backend expects)
    setValueInput(item.weightGrams.toString());
  };

  const formatNumber = (num: number) => {
    return num % 1 === 0 ? num.toString() : num.toFixed(1);
  };

  return (
    <div className="bg-white/80 rounded-xl p-3 border border-white/50 hover:border-white/70 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {/* Food Emoji */}
          <span className="text-xl">{item.emoji}</span>

          {/* Food Name */}
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{item.name}</h4>
          </div>

          {/* Intuitive Measurement */}
          <div className="flex items-center gap-1">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  ref={inputRef}
                  id={`food-value-${item.id}`}
                  name={`food-value-${item.id}`}
                  type="number"
                  step="1"
                  autoComplete="off"
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  onBlur={handleSubmit}
                  onKeyDown={handleKeyPress}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="1000"
                />
                <span className="text-xs text-gray-500">g</span>
              </div>
            ) : (
              <button
                onClick={handleClick}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors group"
                title="Click to edit amount"
              >
                <span className="text-sm font-medium text-gray-700">
                  {getMeasurementDisplay(item)}
                </span>
                <Edit2 className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nutrition Info */}
      <div className="mt-2 flex items-center justify-between">
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div className="text-center">
            <div className="font-semibold text-gray-900">{formatNumber(item.calories)}</div>
            <div className="text-gray-500">cal</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">{formatNumber(item.protein)}g</div>
            <div className="text-gray-500">protein</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-amber-600">{formatNumber(item.carbs)}g</div>
            <div className="text-gray-500">carbs</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-red-600">{formatNumber(item.fat)}g</div>
            <div className="text-gray-500">fat</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Favorite Button */}
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(item)}
              className={`p-1.5 rounded-lg transition-colors ${isFavorite
                ? 'text-red-500 bg-red-50'
                : 'text-gray-400 hover:text-red-400 hover:bg-red-50'
                }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* Shopping Cart Button */}
          {onAddToShoppingList && (
            <button
              onClick={() => onAddToShoppingList(item)}
              className={`p-1.5 rounded-lg transition-colors ${isInShoppingList
                ? 'text-purple-600 bg-purple-50'
                : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50'
                }`}
              title={isInShoppingList ? 'In shopping list' : 'Add to shopping list'}
            >
              <ShoppingCart className={`w-4 h-4 ${isInShoppingList ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* Swap Food Button */}
          {onSwapFood && (
            <button
              onClick={() => onSwapFood(item.id)}
              disabled={isSwapping}
              className={`p-1 rounded transition-colors ${isSwapping
                ? 'text-purple-600 bg-purple-50 animate-pulse'
                : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                }`}
              title="Swap food"
            >
              {isSwapping ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <Shuffle className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Micronutrients */}
      {item.micronutrients && item.micronutrients.fiber && (
        <div className="mt-2 text-xs text-gray-500">
          Fiber: {formatNumber(item.micronutrients.fiber)}g
        </div>
      )}
    </div>
  );
}
