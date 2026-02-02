import { useCallback } from 'react';
import useLocalStorage from './useLocalStorage';
import { ShoppingList, ShoppingItem } from '../types/recipes';
import { v4 as uuidv4 } from 'uuid';
import { Meal } from '../types';

const SHOPPING_LIST_STORAGE_KEY = 'act_shopping_list';

interface UseShoppingListReturn {
  shoppingList: ShoppingList | null;
  generateListFromMeals: (meals: Meal[], weekStartDate: string) => ShoppingList;
  addMealToShoppingList: (meal: Meal) => void;
  addIngredientToShoppingList: (name: string, amount: number, unit: string, category: ShoppingItem['category']) => void;
  toggleItemCheck: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  addCustomItem: (name: string, category: ShoppingItem['category']) => void;
  clearList: () => void;
  getUncheckedCount: () => number;
  isItemInList: (itemName: string) => boolean;
}

const CATEGORY_ORDER: ShoppingItem['category'][] = [
  'produce', 'dairy', 'meat', 'frozen', 'pantry', 'other'
];

function getCategoryFromIngredient(ingredientName: string): ShoppingItem['category'] {
  const name = ingredientName.toLowerCase();

  const produceKeywords = ['apple', 'banana', 'orange', 'lettuce', 'tomato', 'onion', 'garlic', 'pepper', 'carrot', 'broccoli', 'spinach', 'kale', 'cucumber', 'zucchini', 'potato', 'sweet potato', 'mushroom', 'avocado', 'lemon', 'lime', 'herb', 'basil', 'cilantro', 'parsley'];
  const dairyKeywords = ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'sour cream', 'cottage cheese', 'parmesan', 'mozzarella', 'cheddar'];
  const meatKeywords = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'bacon', 'sausage', 'turkey', 'lamb', 'steak', 'ground'];
  const frozenKeywords = ['frozen', 'ice cream'];
  const pantryKeywords = ['rice', 'pasta', 'bread', 'flour', 'sugar', 'oil', 'olive oil', 'vinegar', 'sauce', 'soy sauce', 'chicken broth', 'beef broth', 'canned', 'beans', 'lentils', 'chickpeas', 'oats', 'cereal', 'granola', 'nut', 'almond', 'walnut', 'peanut', 'honey', 'maple syrup'];

  if (produceKeywords.some((k) => name.includes(k))) return 'produce';
  if (dairyKeywords.some((k) => name.includes(k))) return 'dairy';
  if (meatKeywords.some((k) => name.includes(k))) return 'meat';
  if (frozenKeywords.some((k) => name.includes(k))) return 'frozen';
  if (pantryKeywords.some((k) => name.includes(k))) return 'pantry';
  return 'other';
}

export function useShoppingList(): UseShoppingListReturn {
  const [shoppingList, setShoppingList] = useLocalStorage<ShoppingList | null>(SHOPPING_LIST_STORAGE_KEY, null);

  const generateListFromMeals = useCallback((meals: Meal[], weekStartDate: string): ShoppingList => {
    const ingredientMap: Record<string, ShoppingItem> = {};

    // Process all meals and aggregate ingredients
    meals.forEach((meal) => {
      if (!meal.recipe?.ingredients) return;

      meal.recipe.ingredients.forEach((ingredient) => {
        const ingredientName = ingredient.name ?? '';
        const ingredientUnit = ingredient.unit ?? '';
        const key = `${ingredientName.toLowerCase()}_${ingredientUnit.toLowerCase()}`;

        if (ingredientMap[key]) {
          // Update existing item
          ingredientMap[key].amount += ingredient.amount;
          if (!ingredientMap[key].sourceRecipeIds.includes(meal.id)) {
            ingredientMap[key].sourceRecipeIds.push(meal.id);
          }
          if (!ingredientMap[key].recipeNames.includes(meal.name || meal.recipe?.title || 'Unknown Meal')) {
            ingredientMap[key].recipeNames.push(meal.name || meal.recipe?.title || 'Unknown Meal');
          }
        } else {
          // Create new item
          ingredientMap[key] = {
            id: uuidv4(),
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            category: getCategoryFromIngredient(ingredient.name),
            checked: false,
            sourceRecipeIds: [meal.id],
            recipeNames: [meal.name || meal.recipe?.title || 'Unknown Meal'],
          };
        }
      });
    });

    // Sort by category then by name
    const sortedItems = Object.values(ingredientMap).sort((a, b) => {
      const categoryDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
      if (categoryDiff !== 0) return categoryDiff;
      return a.name.localeCompare(b.name);
    });

    const newList: ShoppingList = {
      id: uuidv4(),
      weekStartDate,
      items: sortedItems,
      generatedAt: new Date().toISOString(),
    };

    setShoppingList(newList);
    return newList;
  }, [setShoppingList]);

  // Add a single meal's ingredients to the shopping list
  const addMealToShoppingList = useCallback((meal: Meal) => {
    setShoppingList((prev) => {
      const currentItems = prev?.items || [];
      const recipeName = meal.recipe?.title || meal.foodName;

      // If no shopping list exists yet, create one with the meal's ingredients
      if (!prev) {
        const items: ShoppingItem[] = meal.recipe?.ingredients.map((ing) => ({
          id: uuidv4(),
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          category: ing.category,
          checked: false,
          sourceRecipeIds: [meal.id],
          recipeNames: [recipeName],
        })) || [];

        // Also add the main food item as an ingredient if no recipe
        if (!meal.recipe && meal.foodName) {
          items.push({
            id: uuidv4(),
            name: meal.foodName,
            amount: 1,
            unit: meal.servingSize || 'serving',
            category: getCategoryFromIngredient(meal.foodName),
            checked: false,
            sourceRecipeIds: [meal.id],
            recipeNames: [recipeName],
          });
        }

        return {
          id: uuidv4(),
          weekStartDate: new Date().toISOString().split('T')[0] ?? new Date().toISOString(),
          items,
          generatedAt: new Date().toISOString(),
        };
      }

      // Merge with existing list
      const updatedItems = [...currentItems];

      // Add ingredients from recipe
      if (meal.recipe?.ingredients) {
        meal.recipe.ingredients.forEach((ing) => {
          const ingName = ing.name ?? '';
          const ingUnit = ing.unit ?? '';
          const existingIndex = updatedItems.findIndex(
            (item) => (item.name ?? '').toLowerCase() === ingName.toLowerCase() && (item.unit ?? '').toLowerCase() === ingUnit.toLowerCase()
          );

          if (existingIndex >= 0) {
            // Merge with existing item
            const itemToUpdate = updatedItems[existingIndex];
            if (itemToUpdate) {
              updatedItems[existingIndex] = {
                ...itemToUpdate,
                amount: itemToUpdate.amount + ing.amount,
                sourceRecipeIds: [...new Set([...itemToUpdate.sourceRecipeIds, meal.id])],
                recipeNames: [...new Set([...itemToUpdate.recipeNames, recipeName])],
              };
            }
          } else {
            // Add new item
            updatedItems.push({
              id: uuidv4(),
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              category: ing.category,
              checked: false,
              sourceRecipeIds: [meal.id],
              recipeNames: [recipeName],
            });
          }
        });
      }

      // Also add the main food item if no recipe
      if (!meal.recipe && meal.foodName) {
        const mealFoodName = meal.foodName ?? '';
        const existingIndex = updatedItems.findIndex(
          (item) => (item.name ?? '').toLowerCase() === mealFoodName.toLowerCase()
        );

        if (existingIndex >= 0) {
          const itemToUpdate = updatedItems[existingIndex];
          if (itemToUpdate) {
            updatedItems[existingIndex] = {
              ...itemToUpdate,
              amount: itemToUpdate.amount + 1,
              sourceRecipeIds: [...new Set([...itemToUpdate.sourceRecipeIds, meal.id])],
              recipeNames: [...new Set([...itemToUpdate.recipeNames, recipeName])],
            };
          } else {
            updatedItems.push({
              id: uuidv4(),
              name: meal.foodName,
              amount: 1,
              unit: meal.servingSize || 'serving',
              category: getCategoryFromIngredient(meal.foodName),
              checked: false,
              sourceRecipeIds: [meal.id],
              recipeNames: [recipeName],
            });
          }
        }
      }

      // Sort by category then by name
      const sortedItems = updatedItems.sort((a, b) => {
        const categoryDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
        if (categoryDiff !== 0) return categoryDiff;
        return a.name.localeCompare(b.name);
      });

      return {
        ...prev,
        items: sortedItems,
        generatedAt: new Date().toISOString(),
      };
    });
  }, [setShoppingList]);

  // Add a single ingredient to the shopping list
  const addIngredientToShoppingList = useCallback((
    name: string,
    amount: number,
    unit: string,
    category: ShoppingItem['category']
  ) => {
    setShoppingList((prev) => {
      const currentItems = prev?.items || [];


      // Need to handle potential undefined access safely due to noUncheckedIndexedAccess



      const existingIndex = currentItems.findIndex(
        (item) => (item.name ?? '').toLowerCase() === (name ?? '').toLowerCase() && (item.unit ?? '').toLowerCase() === (unit ?? '').toLowerCase()
      );

      let updatedItems: ShoppingItem[] = [];

      if (existingIndex >= 0) {
        updatedItems = [...currentItems];
        const existingItem = updatedItems[existingIndex];
        if (existingItem) {
          updatedItems[existingIndex] = {
            ...existingItem,
            amount: existingItem.amount + amount,
          };
        }
      } else {
        updatedItems = [...currentItems, {
          id: uuidv4(),
          name,
          amount,
          unit,
          category,
          checked: false,
          sourceRecipeIds: [],
          recipeNames: ['Custom Item'],
        }];
      }

      // Sort by category then by name
      const sortedItems = updatedItems.sort((a, b) => {
        const categoryDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
        if (categoryDiff !== 0) return categoryDiff;
        return a.name.localeCompare(b.name);
      });

      if (!prev) {
        return {
          id: uuidv4(),
          weekStartDate: new Date().toISOString().split('T')[0] ?? new Date().toISOString(),
          items: sortedItems,
          generatedAt: new Date().toISOString(),
        };
      }

      return {
        ...prev,
        items: sortedItems,
        generatedAt: new Date().toISOString(),
      };
    });
  }, [setShoppingList]);

  // Check if an item is already in the shopping list
  const isItemInList = useCallback((itemName: string): boolean => {
    if (!shoppingList) return false;
    return shoppingList.items.some(
      (item) => (item.name ?? '').toLowerCase() === (itemName ?? '').toLowerCase()
    );
  }, [shoppingList]);

  const toggleItemCheck = useCallback((itemId: string) => {
    setShoppingList((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        ),
      };
    });
  }, [setShoppingList]);

  const removeItem = useCallback((itemId: string) => {
    setShoppingList((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      };
    });
  }, [setShoppingList]);

  const addCustomItem = useCallback((name: string, category: ShoppingItem['category']) => {
    setShoppingList((prev) => {
      if (!prev) {
        return {
          id: uuidv4(),
          weekStartDate: new Date().toISOString().split('T')[0] ?? new Date().toISOString(),
          items: [{
            id: uuidv4(),
            name,
            amount: 1,
            unit: 'pcs',
            category,
            checked: false,
            sourceRecipeIds: [],
            recipeNames: ['Custom Item'],
          }],
          generatedAt: new Date().toISOString(),
        };
      }
      return {
        ...prev,
        items: [...prev.items, {
          id: uuidv4(),
          name,
          amount: 1,
          unit: 'pcs',
          category,
          checked: false,
          sourceRecipeIds: [],
          recipeNames: ['Custom Item'],
        }],
      };
    });
  }, [setShoppingList]);

  const clearList = useCallback(() => {
    setShoppingList(null);
  }, [setShoppingList]);

  const getUncheckedCount = useCallback(() => {
    if (!shoppingList) return 0;
    return shoppingList.items.filter((item) => !item.checked).length;
  }, [shoppingList]);

  return {
    shoppingList,
    generateListFromMeals,
    addMealToShoppingList,
    addIngredientToShoppingList,
    toggleItemCheck,
    removeItem,
    addCustomItem,
    clearList,
    getUncheckedCount,
    isItemInList,
  };
}
