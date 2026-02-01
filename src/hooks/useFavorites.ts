"use client"

import { useCallback, useMemo } from "react"
import useLocalStorage from "./useLocalStorage"
import type { Recipe } from "../types/recipes"
import { v4 as uuidv4 } from "uuid"

const FAVORITES_STORAGE_KEY = "act_favorites"

interface FavoriteMealItem {
  id: string
  type: "recipe" | "food"
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  emoji?: string
  recipeId?: string
  foodItemId?: string
  addedAt: string
}

interface UseFavoritesReturn {
  favorites: FavoriteMealItem[]
  isFavorite: (recipeId: string) => boolean
  isFoodItemFavorite: (foodItemId: string) => boolean
  toggleFavorite: (recipeId: string, mealPlanId?: string) => void
  toggleFoodItemFavorite: (item: {
    id: string
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    emoji?: string
  }) => void
  removeFoodItemFavorite: (foodItemId: string) => void
  removeRecipeFavorite: (recipeId: string) => void
  getFavoriteRecipes: (allRecipes: Recipe[]) => Recipe[]
  clearFavorites: () => void
  favoriteCount: number
}

export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useLocalStorage<FavoriteMealItem[]>(FAVORITES_STORAGE_KEY, [])

  const safeFavorites = useMemo(() => {
    if (!favorites || !Array.isArray(favorites)) return []
    return favorites.filter(
      (f): f is FavoriteMealItem =>
        f !== null &&
        f !== undefined &&
        typeof f === "object" &&
        typeof f.type === "string" &&
        (f.type === "recipe" || f.type === "food"),
    )
  }, [favorites])

  const isFavorite = useCallback(
    (recipeId: string): boolean => {
      return safeFavorites.some((f) => f.type === "recipe" && f.recipeId === recipeId)
    },
    [safeFavorites],
  )

  const isFoodItemFavorite = useCallback(
    (foodItemId: string): boolean => {
      return safeFavorites.some((f) => f.type === "food" && f.foodItemId === foodItemId)
    },
    [safeFavorites],
  )

  const toggleFavorite = useCallback(
    (recipeId: string, _mealPlanId?: string) => {
      setFavorites((prev) => {
        const safePrev = Array.isArray(prev) ? prev : []
        const existingIndex = safePrev.findIndex((f) => f?.type === "recipe" && f?.recipeId === recipeId)

        if (existingIndex >= 0) {
          return safePrev.filter((f) => f?.type !== "recipe" || f?.recipeId !== recipeId)
        } else {
          return [
            ...safePrev,
            {
              id: uuidv4(),
              type: "recipe" as const,
              name: "",
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              recipeId,
              addedAt: new Date().toISOString(),
            },
          ]
        }
      })
    },
    [setFavorites],
  )

  const toggleFoodItemFavorite = useCallback(
    (item: {
      id: string
      name: string
      calories: number
      protein: number
      carbs: number
      fat: number
      emoji?: string
    }) => {
      setFavorites((prev) => {
        const safePrev = Array.isArray(prev) ? prev : []
        const existingIndex = safePrev.findIndex((f) => f?.type === "food" && f?.foodItemId === item.id)

        if (existingIndex >= 0) {
          return safePrev.filter((f) => f?.type !== "food" || f?.foodItemId !== item.id)
        } else {
          return [
            ...safePrev,
            {
              id: uuidv4(),
              type: "food" as const,
              name: item.name,
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat,
              emoji: item.emoji,
              foodItemId: item.id,
              addedAt: new Date().toISOString(),
            },
          ]
        }
      })
    },
    [setFavorites],
  )

  const removeFoodItemFavorite = useCallback(
    (foodItemId: string) => {
      setFavorites((prev) => {
        const safePrev = Array.isArray(prev) ? prev : []
        return safePrev.filter((f) => f?.type !== "food" || f?.foodItemId !== foodItemId)
      })
    },
    [setFavorites],
  )

  const removeRecipeFavorite = useCallback(
    (recipeId: string) => {
      setFavorites((prev) => {
        const safePrev = Array.isArray(prev) ? prev : []
        return safePrev.filter((f) => f?.type !== "recipe" || f?.recipeId !== recipeId)
      })
    },
    [setFavorites],
  )

  const getFavoriteRecipes = useCallback(
    (allRecipes: Recipe[]): Recipe[] => {
      const favoriteIds = new Set(safeFavorites.filter((f) => f.type === "recipe").map((f) => f.recipeId))
      return allRecipes.filter((recipe) => favoriteIds.has(recipe.id))
    },
    [safeFavorites],
  )

  const clearFavorites = useCallback(() => {
    if (confirm("Are you sure you want to clear all favorites?")) {
      setFavorites([])
    }
  }, [setFavorites])

  const favoriteCount = useMemo(() => {
    return safeFavorites.length
  }, [safeFavorites])

  return {
    favorites: safeFavorites,
    isFavorite,
    isFoodItemFavorite,
    toggleFavorite,
    toggleFoodItemFavorite,
    removeFoodItemFavorite,
    removeRecipeFavorite,
    getFavoriteRecipes,
    clearFavorites,
    favoriteCount,
  }
}
