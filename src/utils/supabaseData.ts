import { supabase } from "./supabaseClient"
import type { Meal, UserSettings } from "../types"
import { normalizeSettings } from "./settingsNormalization"

export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) return null

  return normalizeSettings({
    dailyCalorieGoal: data.daily_calorie_goal,
    proteinGoal_g: data.protein_goal_g,
    carbsGoal_g: data.carbs_goal_g,
    fatGoal_g: data.fat_goal_g,
    age: data.age ?? undefined,
    weight: data.weight_kg ?? undefined,
    height: data.height_cm ?? undefined,
    activityLevel: data.activity_level ?? undefined,
    goal: data.goal ?? undefined,
    dietaryPreferences: data.dietary_preferences ?? [],
  })
}

export async function upsertUserSettings(userId: string, settings: UserSettings): Promise<void> {
  const { error } = await supabase.from("user_settings").upsert({
    user_id: userId,
    daily_calorie_goal: settings.dailyCalorieGoal,
    protein_goal_g: settings.proteinGoal_g,
    carbs_goal_g: settings.carbsGoal_g,
    fat_goal_g: settings.fatGoal_g,
    age: settings.age ?? null,
    weight_kg: settings.weight ?? null,
    height_cm: settings.height ?? null,
    activity_level: settings.activityLevel ?? null,
    goal: settings.goal ?? null,
    dietary_preferences: settings.dietaryPreferences ?? [],
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function fetchMeals(userId: string): Promise<Meal[]> {
  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    description: row.description,
    foodName: row.food_name,
    servingSize: row.serving_size,
    nutrition: {
      calories: row.calories,
      protein_g: Number(row.protein_g),
      carbs_g: Number(row.carbs_g),
      fat_g: Number(row.fat_g),
    },
    timestamp: row.logged_at,
    category: row.category,
  }))
}

export async function insertMeal(userId: string, meal: Meal): Promise<void> {
  const { error } = await supabase.from("meals").insert({
    id: meal.id,
    user_id: userId,
    logged_at: meal.timestamp,
    category: meal.category,
    description: meal.description,
    food_name: meal.foodName,
    serving_size: meal.servingSize,
    calories: meal.nutrition.calories,
    protein_g: meal.nutrition.protein_g,
    carbs_g: meal.nutrition.carbs_g,
    fat_g: meal.nutrition.fat_g,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function updateMeal(userId: string, meal: Meal): Promise<void> {
  const { error } = await supabase
    .from("meals")
    .update({
      logged_at: meal.timestamp,
      category: meal.category,
      description: meal.description,
      food_name: meal.foodName,
      serving_size: meal.servingSize,
      calories: meal.nutrition.calories,
      protein_g: meal.nutrition.protein_g,
      carbs_g: meal.nutrition.carbs_g,
      fat_g: meal.nutrition.fat_g,
    })
    .eq("id", meal.id)
    .eq("user_id", userId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function deleteMeal(userId: string, mealId: string): Promise<void> {
  const { error } = await supabase.from("meals").delete().eq("id", mealId).eq("user_id", userId)

  if (error) {
    throw new Error(error.message)
  }
}
