import { supabase, isSupabaseConfigured } from "./supabaseClient"
import type { Meal, UserSettings } from "../types"
import { normalizeSettings } from "./settingsNormalization"
import { getLocalDateKeyFromTimestamp } from "./dateHelpers"

export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  if (!isSupabaseConfigured) {
    console.warn("[supabaseData] Supabase not configured, returning null for settings")
    return null
  }
  
  try {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (error) {
      console.error("[supabaseData] Error fetching user settings:", error.message)
      return null // Return null instead of throwing
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
      sexAtBirth: data.sex_at_birth ?? undefined,
      calorieGoalMode: data.calorie_goal_mode ?? undefined,
      manualCalorieGoal: data.manual_calorie_goal ?? undefined,
      goalAggressiveness: data.goal_aggressiveness ?? undefined,
      weightUnit: data.weight_unit ?? undefined,
      heightUnit: data.height_unit ?? undefined,
      dietaryPreferences: data.dietary_preferences ?? [],
    })
  } catch (error) {
    console.error("[supabaseData] Unexpected error fetching settings:", error)
    return null
  }
}

export async function upsertUserSettings(userId: string, settings: UserSettings): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn("[supabaseData] Supabase not configured, skipping settings upsert")
    return
  }
  
  try {
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
      sex_at_birth: settings.sexAtBirth ?? null,
      calorie_goal_mode: settings.calorieGoalMode ?? null,
      manual_calorie_goal: settings.manualCalorieGoal ?? null,
      goal_aggressiveness: settings.goalAggressiveness ?? null,
      weight_unit: settings.weightUnit ?? null,
      height_unit: settings.heightUnit ?? null,
      dietary_preferences: settings.dietaryPreferences ?? [],
    })

    if (error) {
      console.error("[supabaseData] Error upserting settings:", error.message)
    }
  } catch (error) {
    console.error("[supabaseData] Unexpected error upserting settings:", error)
  }
}

export async function fetchMeals(userId: string): Promise<Meal[]> {
  if (!isSupabaseConfigured) {
    console.warn("[supabaseData] Supabase not configured, returning empty meals")
    return []
  }
  
  try {
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })

    if (error) {
      console.error("[supabaseData] Error fetching meals:", error.message)
      return [] // Return empty array instead of throwing
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
  } catch (error) {
    console.error("[supabaseData] Unexpected error fetching meals:", error)
    return []
  }
}

export async function insertMeal(userId: string, meal: Meal): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn("[supabaseData] Supabase not configured, skipping meal insert")
    return
  }
  
  try {
    const mealDate = getLocalDateKeyFromTimestamp(meal.timestamp)

    const { error } = await supabase.from("meals").insert({
      id: meal.id,
      user_id: userId,
      logged_at: meal.timestamp,
      meal_date: mealDate,
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
      console.error("[supabaseData] Error inserting meal:", error.message)
    }
  } catch (error) {
    console.error("[supabaseData] Unexpected error inserting meal:", error)
  }
}

export async function updateMeal(userId: string, meal: Meal): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn("[supabaseData] Supabase not configured, skipping meal update")
    return
  }
  
  try {
    const mealDate = getLocalDateKeyFromTimestamp(meal.timestamp)

    const { error } = await supabase
      .from("meals")
      .update({
        logged_at: meal.timestamp,
        meal_date: mealDate,
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
      console.error("[supabaseData] Error updating meal:", error.message)
    }
  } catch (error) {
    console.error("[supabaseData] Unexpected error updating meal:", error)
  }
}

export async function deleteMeal(userId: string, mealId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn("[supabaseData] Supabase not configured, skipping meal delete")
    return
  }
  
  try {
    const { error } = await supabase.from("meals").delete().eq("id", mealId).eq("user_id", userId)

    if (error) {
      console.error("[supabaseData] Error deleting meal:", error.message)
    }
  } catch (error) {
    console.error("[supabaseData] Unexpected error deleting meal:", error)
  }
}
