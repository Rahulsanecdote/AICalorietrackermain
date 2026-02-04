import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingList, ShoppingItem } from '../../types/recipes';
import { Check, Copy, Trash2, Plus, ShoppingCart } from 'lucide-react';

interface ShoppingListViewProps {
  shoppingList: ShoppingList;
  onToggleItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onAddCustomItem: (name: string, category: ShoppingItem['category']) => void;
  onClearList: () => void;
  onClose?: () => void;
}

const CATEGORY_LABELS: Record<ShoppingItem['category'], string> = {
  produce: 'Produce',
  dairy: 'Dairy & Eggs',
  meat: 'Meat & Seafood',
  frozen: 'Frozen',
  pantry: 'Pantry',
  other: 'Other',
};

const CATEGORY_COLORS: Record<ShoppingItem['category'], string> = {
  produce: 'bg-green-100 text-green-800 border-green-200',
  dairy: 'bg-blue-100 text-blue-800 border-blue-200',
  meat: 'bg-destructive/20 text-red-800 border-red-200',
  frozen: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  pantry: 'bg-amber-100 text-amber-800 border-amber-200',
  other: 'bg-accent text-foreground border-border',
};

export default function ShoppingListView({
  shoppingList,
  onToggleItem,
  onRemoveItem,
  onAddCustomItem,
  onClearList,
  onClose,
}: ShoppingListViewProps) {
  const { t } = useTranslation();
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ShoppingItem['category']>('other');
  const [showAddForm, setShowAddForm] = useState(false);

  // Handle null or undefined shoppingList
  if (!shoppingList) {
    return (
      <div className="bg-card rounded-2xl shadow-lg border border-border p-6 text-center">
        <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-muted-foreground">{t('shopping.noShoppingList')}</p>
        <p className="text-sm text-muted-foreground mt-1">{t('shopping.generateFromMealPlan')}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-accent text-foreground rounded-lg text-sm hover:bg-accent"
          >
            {t('shopping.goBack')}
          </button>
        )}
      </div>
    );
  }

  // Group items by category
  const itemsByCategory = shoppingList.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<ShoppingItem['category'], ShoppingItem[]>);

  const checkedCount = shoppingList.items.filter((item) => item.checked).length;
  const totalCount = shoppingList.items.length;

  const copyToClipboard = () => {
    const text = shoppingList.items
      .map((item) => `${item.checked ? '✓' : '○'} ${item.amount} ${item.unit} ${item.name}`)
      .join('\n');
    navigator.clipboard.writeText(text);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim()) {
      onAddCustomItem(newItemName.trim(), newItemCategory);
      setNewItemName('');
      setShowAddForm(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="text-lg font-semibold">{t('shopping.shoppingList') || 'Shopping List'}</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-card/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-sm text-white/80 mt-1">
          Generated {new Date(shoppingList.generatedAt).toLocaleDateString()} • {checkedCount}/{totalCount} items
        </p>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-card/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-card rounded-full transition-all duration-300"
            style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 p-3 border-b border-border">
        <button
          onClick={copyToClipboard}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent hover:bg-accent rounded-lg text-sm font-medium text-foreground transition-colors"
        >
          <Copy className="w-4 h-4" />
          {t('shopping.copyList') || 'Copy List'}
        </button>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent hover:bg-accent rounded-lg text-sm font-medium text-foreground transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('shopping.addItem') || 'Add Item'}
        </button>
        <button
          onClick={onClearList}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-destructive/20 rounded-lg text-sm font-medium text-destructive transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="p-3 bg-card border-b border-border">
          <div className="flex gap-2">
            <input
              id="shopping-item-name"
              name="shopping-item-name"
              type="text"
              autoComplete="off"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Item name"
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <select
              id="shopping-item-category"
              name="shopping-item-category"
              autoComplete="off"
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as ShoppingItem['category'])}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* Shopping Items */}
      <div className="max-h-[60vh] overflow-y-auto">
        {/* Sort categories in the correct order */}
        {(['produce', 'dairy', 'meat', 'frozen', 'pantry', 'other'] as ShoppingItem['category'][]).map((category) => {
          const items = itemsByCategory[category];
          if (!items || items.length === 0) return null;

          return (
            <div key={category} className="border-b border-border last:border-0">
              <div className="px-4 py-2 bg-card flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[category]}`}>
                  {CATEGORY_LABELS[category]}
                </span>
                <span className="text-xs text-muted-foreground">{items.length} items</span>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-card transition-colors ${item.checked ? 'bg-card' : ''
                      }`}
                  >
                    <button
                      onClick={() => onToggleItem(item.id)}
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${item.checked
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-border hover:border-green-400'
                        }`}
                    >
                      {item.checked && <Check className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${item.checked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {item.amount} {item.unit} {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        For: {item.recipeNames.slice(0, 2).join(', ')}
                        {item.recipeNames.length > 2 && ` +${item.recipeNames.length - 2} more`}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[item.category]}`}>
                      {CATEGORY_LABELS[item.category]}
                    </span>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {shoppingList.items.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>{t('shopping.noItems') || 'No items in your shopping list'}</p>
            <p className="text-sm mt-1">{t('shopping.addMealsFirst') || 'Add meals to your plan first'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
