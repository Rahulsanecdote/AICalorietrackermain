import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

const STORAGE_KEYS = {
  settings: "nutriai_settings_v2",
  meals: "nutriai_meals_v2",
  mealPlans: "nutriai_meal_plans_v1",
  pantry: "nutriai_pantry_v1",
}

const [inputPath, userId, outputPath] = process.argv.slice(2)

if (!inputPath || !userId) {
  console.error("Usage: node scripts/migrate-local-export.mjs <export.json> <user_id> [output.sql]")
  process.exit(1)
}

const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"))
const payload = raw.data ?? raw

const meals = payload.meals ?? payload[STORAGE_KEYS.meals] ?? []
const settings = payload.settings ?? payload[STORAGE_KEYS.settings] ?? null
const mealPlans = payload.mealPlans ?? payload[STORAGE_KEYS.mealPlans] ?? []
const pantry = payload[STORAGE_KEYS.pantry] ?? null

const sql = []
sql.push("begin;")
sql.push(`-- Migration generated from ${path.basename(inputPath)}`)
sql.push(`-- User ID: ${userId}`)

if (settings) {
  sql.push(
    [
      "insert into public.user_settings (",
      "user_id, daily_calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g,",
      "age, weight_kg, height_cm, activity_level, goal, dietary_preferences",
      ") values (",
      `${quote(userId)},`,
      `${number(settings.dailyCalorieGoal)},`,
      `${number(settings.proteinGoal_g)},`,
      `${number(settings.carbsGoal_g)},`,
      `${number(settings.fatGoal_g)},`,
      `${nullableNumber(settings.age)},`,
      `${nullableNumber(settings.weight)},`,
      `${nullableNumber(settings.height)},`,
      `${nullableString(settings.activityLevel)},`,
      `${nullableString(settings.goal)},`,
      `${arrayLiteral(settings.dietaryPreferences)}`,
      ")",
      "on conflict (user_id) do update set",
      "daily_calorie_goal = excluded.daily_calorie_goal,",
      "protein_goal_g = excluded.protein_goal_g,",
      "carbs_goal_g = excluded.carbs_goal_g,",
      "fat_goal_g = excluded.fat_goal_g,",
      "age = excluded.age,",
      "weight_kg = excluded.weight_kg,",
      "height_cm = excluded.height_cm,",
      "activity_level = excluded.activity_level,",
      "goal = excluded.goal,",
      "dietary_preferences = excluded.dietary_preferences;",
    ].join(" ")
  )
}

for (const meal of meals) {
  sql.push(
    [
      "insert into public.meals (",
      "id, user_id, logged_at, category, description, food_name, serving_size,",
      "calories, protein_g, carbs_g, fat_g",
      ") values (",
      `${quote(meal.id || crypto.randomUUID())},`,
      `${quote(userId)},`,
      `${timestamp(meal.timestamp)},`,
      `${quote(meal.category)},`,
      `${quote(meal.description)},`,
      `${quote(meal.foodName)},`,
      `${quote(meal.servingSize)},`,
      `${number(meal.nutrition?.calories)},`,
      `${number(meal.nutrition?.protein_g)},`,
      `${number(meal.nutrition?.carbs_g)},`,
      `${number(meal.nutrition?.fat_g)}`,
      ");",
    ].join(" ")
  )
}

for (const plan of mealPlans) {
  const planId = plan.id || crypto.randomUUID()
  const sourceType = plan.sourceType === "pantry_based" ? "pantry_based" : "generic"

  sql.push(
    [
      "insert into public.meal_plans (",
      "id, user_id, plan_date, target_calories, summary, total_protein_g,",
      "total_carbs_g, total_fat_g, macro_ratio_protein, macro_ratio_carbs,",
      "macro_ratio_fat, accuracy_variance, source_type, regeneration_count, created_at",
      ") values (",
      `${quote(planId)},`,
      `${quote(userId)},`,
      `${dateLiteral(plan.date)},`,
      `${number(plan.targetCalories)},`,
      `${nullableString(plan.summary)},`,
      `${number(plan.totalMacros?.protein)},`,
      `${number(plan.totalMacros?.carbs)},`,
      `${number(plan.totalMacros?.fat)},`,
      `${number(plan.macroRatio?.protein)},`,
      `${number(plan.macroRatio?.carbs)},`,
      `${number(plan.macroRatio?.fat)},`,
      `${nullableNumber(plan.accuracyVariance)},`,
      `${quote(sourceType)},`,
      `${nullableNumber(plan.regenerationCount)},`,
      `${timestamp(plan.createdAt)}`,
      ");",
    ].join(" ")
  )

  for (const meal of plan.meals || []) {
    const mealSectionId = crypto.randomUUID()
    sql.push(
      [
        "insert into public.meal_plan_meals (",
        "id, meal_plan_id, meal_type, time_estimate, total_calories, total_protein_g, total_carbs_g, total_fat_g",
        ") values (",
        `${quote(mealSectionId)},`,
        `${quote(planId)},`,
        `${quote(meal.type)},`,
        `${nullableString(meal.timeEstimate)},`,
        `${number(meal.totalCalories)},`,
        `${number(meal.totalProtein)},`,
        `${number(meal.totalCarbs)},`,
        `${number(meal.totalFat)}`,
        ");",
      ].join(" ")
    )

    for (const item of meal.items || []) {
      sql.push(
        [
          "insert into public.meal_plan_items (",
          "id, meal_plan_meal_id, name, weight_grams, calories, protein_g, carbs_g, fat_g,",
          "fiber_g, emoji, is_from_pantry",
          ") values (",
          `${quote(item.id || crypto.randomUUID())},`,
          `${quote(mealSectionId)},`,
          `${quote(item.name)},`,
          `${number(item.weightGrams)},`,
          `${number(item.calories)},`,
          `${number(item.protein)},`,
          `${number(item.carbs)},`,
          `${number(item.fat)},`,
          `${nullableNumber(item.micronutrients?.fiber)},`,
          `${nullableString(item.emoji)},`,
          `${booleanLiteral(item.isFromPantry)}`,
          ");",
        ].join(" ")
      )
    }
  }

  const usedPantry = plan.usedPantry || pantry
  if (usedPantry) {
    sql.push(
      [
        "insert into public.meal_plan_pantry (meal_plan_id, breakfast, lunch, dinner, snacks)",
        "values (",
        `${quote(planId)},`,
        `${nullableString(usedPantry.breakfast)},`,
        `${nullableString(usedPantry.lunch)},`,
        `${nullableString(usedPantry.dinner)},`,
        `${nullableString(usedPantry.snacks)}`,
        ") on conflict (meal_plan_id) do update set",
        "breakfast = excluded.breakfast,",
        "lunch = excluded.lunch,",
        "dinner = excluded.dinner,",
        "snacks = excluded.snacks;",
      ].join(" ")
    )
  }
}

sql.push("commit;")

const output = sql.join("\n")
if (outputPath) {
  fs.writeFileSync(outputPath, output, "utf8")
  console.log(`SQL written to ${outputPath}`)
} else {
  console.log(output)
}

function quote(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function nullableString(value) {
  if (value === undefined || value === null || value === "") return "null"
  return quote(value)
}

function number(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return "0"
  return `${n}`
}

function nullableNumber(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return "null"
  return `${n}`
}

function booleanLiteral(value) {
  return value ? "true" : "false"
}

function dateLiteral(value) {
  if (!value) return "current_date"
  return `${quote(value)}::date`
}

function timestamp(value) {
  if (!value) return "now()"
  return `${quote(value)}::timestamptz`
}

function arrayLiteral(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return "array[]::text[]"
  }
  const escaped = value.map((item) => quote(item)).join(",")
  return `array[${escaped}]::text[]`
}
