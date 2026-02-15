import type { DailyMealPlan, FoodItem, MealCategory } from "./index"

export type MealPrepSource = "pantry" | "ai" | "saved"
export type MealPrepMode = "daily" | "weekly"

export interface MealPrepOption {
  id: string
  label: string
  source: MealPrepSource | "plan"
  items: FoodItem[]
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface MealPrepMealDraft {
  mealType: MealCategory
  options: MealPrepOption[]
  selectedOptionId: string
  locked: boolean
  enabled: boolean
}

export interface MealPrepDayDraft {
  id: string
  label: string
  dateIso?: string
  meals: Record<MealCategory, MealPrepMealDraft | null>
}

export interface PrepTask {
  id: string
  category: "chop" | "cook" | "portion" | "store"
  title: string
  description: string
  durationMinutes: number
  completed: boolean
}

export interface PrepBlock {
  id: string
  title: string
  subtitle: string
  totalMinutes: number
  tasks: PrepTask[]
}

export type ShoppingItemStatus = "have" | "buy" | "optional"

export interface MealPrepShoppingItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: "produce" | "dairy" | "meat" | "frozen" | "pantry" | "other"
  sourceMeals: string[]
  status: ShoppingItemStatus
}

export interface MealPrepDraft {
  id: string
  source: MealPrepSource
  mode: MealPrepMode
  createdAt: string
  updatedAt: string
  basePlanId: string | null
  strictPantryOnly: boolean
  allowAddOns: boolean
  days: MealPrepDayDraft[]
  prepBlocks: PrepBlock[]
  shopping: MealPrepShoppingItem[]
  originalPlan?: DailyMealPlan | null
}

export interface SavedMealPrepPlan {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  draft: MealPrepDraft
}
