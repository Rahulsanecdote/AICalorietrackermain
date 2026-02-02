import { v4 as uuidv4 } from "uuid"
import type { DailyMealPlan } from "../types"
import { supabase } from "./supabaseClient"

export async function upsertMealPlan(userId: string, plan: DailyMealPlan): Promise<void> {
  const planPayload = {
    id: plan.id,
    user_id: userId,
    plan_date: plan.date,
    target_calories: plan.targetCalories,
    summary: plan.summary ?? null,
    total_protein_g: plan.totalMacros.protein,
    total_carbs_g: plan.totalMacros.carbs,
    total_fat_g: plan.totalMacros.fat,
    macro_ratio_protein: plan.macroRatio.protein,
    macro_ratio_carbs: plan.macroRatio.carbs,
    macro_ratio_fat: plan.macroRatio.fat,
    accuracy_variance: plan.accuracyVariance ?? null,
    source_type: plan.sourceType,
    regeneration_count: plan.regenerationCount ?? null,
    created_at: plan.createdAt,
  }

  const { error: planError } = await supabase
    .from("meal_plans")
    .upsert(planPayload, { onConflict: "user_id,plan_date" })
  if (planError) {
    // Check for common database errors
    if (planError.message.includes("relation") && planError.message.includes("does not exist")) {
      console.error("[supabaseMealPlans] Database table missing. Run migrations from /supabase/migrations/0001_init.sql")
      throw new Error("Database tables not set up. Please contact support or run database migrations.")
    }
    throw new Error(planError.message)
  }

  const { error: deleteMealsError } = await supabase
    .from("meal_plan_meals")
    .delete()
    .eq("meal_plan_id", plan.id)
  if (deleteMealsError) throw new Error(deleteMealsError.message)

  const mealSectionRows = []
  const itemRows = []

  for (const meal of plan.meals) {
    const mealSectionId = uuidv4()
    mealSectionRows.push({
      id: mealSectionId,
      meal_plan_id: plan.id,
      meal_type: meal.type,
      time_estimate: meal.timeEstimate ?? null,
      total_calories: meal.totalCalories,
      total_protein_g: meal.totalProtein,
      total_carbs_g: meal.totalCarbs,
      total_fat_g: meal.totalFat,
    })

    for (const item of meal.items) {
      itemRows.push({
        id: item.id ?? uuidv4(),
        meal_plan_meal_id: mealSectionId,
        name: item.name,
        weight_grams: item.weightGrams,
        calories: item.calories,
        protein_g: item.protein,
        carbs_g: item.carbs,
        fat_g: item.fat,
        fiber_g: item.micronutrients?.fiber ?? null,
        emoji: item.emoji ?? null,
        is_from_pantry: item.isFromPantry ?? false,
      })
    }
  }

  if (mealSectionRows.length > 0) {
    const { error: mealSectionError } = await supabase.from("meal_plan_meals").insert(mealSectionRows)
    if (mealSectionError) throw new Error(mealSectionError.message)
  }

  if (itemRows.length > 0) {
    const { error: itemError } = await supabase.from("meal_plan_items").insert(itemRows)
    if (itemError) throw new Error(itemError.message)
  }

  if (plan.usedPantry) {
    const { error: pantryError } = await supabase.from("meal_plan_pantry").upsert({
      meal_plan_id: plan.id,
      breakfast: plan.usedPantry.breakfast ?? null,
      lunch: plan.usedPantry.lunch ?? null,
      dinner: plan.usedPantry.dinner ?? null,
      snacks: plan.usedPantry.snacks ?? null,
    })
    if (pantryError) throw new Error(pantryError.message)
  } else {
    const { error: pantryDeleteError } = await supabase
      .from("meal_plan_pantry")
      .delete()
      .eq("meal_plan_id", plan.id)
    if (pantryDeleteError) throw new Error(pantryDeleteError.message)
  }
}

export async function fetchMealPlanForDate(userId: string, date: string): Promise<DailyMealPlan | null> {
  const { data: plan, error: planError } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_date", date)
    .maybeSingle()

  if (planError) {
    // Check for common database errors
    if (planError.message.includes("relation") && planError.message.includes("does not exist")) {
      console.error("[supabaseMealPlans] Database table missing. Run migrations from /supabase/migrations/0001_init.sql")
      throw new Error("Database tables not set up. Please contact support or run database migrations.")
    }
    throw new Error(planError.message)
  }
  if (!plan) return null

  const { data: meals, error: mealsError } = await supabase
    .from("meal_plan_meals")
    .select("*")
    .eq("meal_plan_id", plan.id)

  if (mealsError) throw new Error(mealsError.message)

  const mealIds = (meals ?? []).map((meal) => meal.id)
  let items: Array<Record<string, any>> = []

  if (mealIds.length > 0) {
    const { data: itemRows, error: itemsError } = await supabase
      .from("meal_plan_items")
      .select("*")
      .in("meal_plan_meal_id", mealIds)

    if (itemsError) throw new Error(itemsError.message)
    items = itemRows ?? []
  }

  const { data: pantry } = await supabase
    .from("meal_plan_pantry")
    .select("*")
    .eq("meal_plan_id", plan.id)
    .maybeSingle()

  const mealSections = (meals ?? []).map((meal) => ({
    type: meal.meal_type,
    items: (items ?? [])
      .filter((item) => item.meal_plan_meal_id === meal.id)
      .map((item) => ({
        id: item.id,
        name: item.name,
        weightGrams: Number(item.weight_grams),
        calories: item.calories,
        protein: Number(item.protein_g),
        carbs: Number(item.carbs_g),
        fat: Number(item.fat_g),
        micronutrients: item.fiber_g ? { fiber: Number(item.fiber_g) } : undefined,
        emoji: item.emoji ?? undefined,
        isFromPantry: item.is_from_pantry ?? false,
      })),
    totalCalories: meal.total_calories,
    totalProtein: Number(meal.total_protein_g),
    totalCarbs: Number(meal.total_carbs_g),
    totalFat: Number(meal.total_fat_g),
    timeEstimate: meal.time_estimate ?? undefined,
  }))

  return {
    id: plan.id,
    date: plan.plan_date ?? new Date().toISOString().split("T")[0],
    targetCalories: plan.target_calories,
    meals: mealSections,
    totalMacros: {
      protein: Number(plan.total_protein_g),
      carbs: Number(plan.total_carbs_g),
      fat: Number(plan.total_fat_g),
    },
    macroRatio: {
      protein: Number(plan.macro_ratio_protein),
      carbs: Number(plan.macro_ratio_carbs),
      fat: Number(plan.macro_ratio_fat),
    },
    summary: plan.summary ?? undefined,
    createdAt: plan.created_at,
    accuracyVariance: plan.accuracy_variance ?? undefined,
    sourceType: plan.source_type,
    usedPantry: pantry
      ? {
        breakfast: pantry.breakfast ?? "",
        lunch: pantry.lunch ?? "",
        dinner: pantry.dinner ?? "",
        snacks: pantry.snacks ?? "",
        updatedAt: pantry.updated_at ?? new Date().toISOString(),
      }
      : undefined,
    regenerationCount: plan.regeneration_count ?? undefined,
  }
}
