import { v4 as uuidv4 } from "uuid"
import type { DailyMealPlan, FoodItem, MealCategory, PantryData } from "@/types"
import type {
  MealPrepDayDraft,
  MealPrepDraft,
  MealPrepMealDraft,
  MealPrepMode,
  MealPrepOption,
  MealPrepShoppingItem,
  MealPrepSource,
  PrepBlock,
  PrepTask,
  SavedMealPrepPlan,
} from "@/types/mealPrep"

const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const
const MEAL_TYPES: MealCategory[] = ["breakfast", "lunch", "dinner", "snack"]

const CATEGORY_KEYWORDS: Record<MealPrepShoppingItem["category"], string[]> = {
  produce: ["apple", "banana", "lettuce", "spinach", "broccoli", "carrot", "tomato", "pepper", "avocado", "berries", "vegetable"],
  dairy: ["milk", "cheese", "yogurt", "butter", "egg", "cream"],
  meat: ["chicken", "beef", "pork", "fish", "salmon", "tuna", "shrimp", "turkey", "lamb", "tofu"],
  frozen: ["frozen", "ice"],
  pantry: ["rice", "oats", "bread", "pasta", "oil", "flour", "bean", "lentil", "quinoa", "nut", "seed"],
  other: [],
}

const deepCloneItems = (items: FoodItem[]): FoodItem[] => items.map((item) => ({ ...item }))

const parsePantryList = (value: string): string[] =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)

const mealTypeToPantryKey = (mealType: MealCategory): keyof PantryData => {
  switch (mealType) {
    case "breakfast":
      return "breakfast"
    case "lunch":
      return "lunch"
    case "dinner":
      return "dinner"
    default:
      return "snacks"
  }
}

const createOption = (label: string, source: MealPrepOption["source"], items: FoodItem[]): MealPrepOption => {
  const calories = items.reduce((sum, item) => sum + item.calories, 0)
  const protein = items.reduce((sum, item) => sum + item.protein, 0)
  const carbs = items.reduce((sum, item) => sum + item.carbs, 0)
  const fat = items.reduce((sum, item) => sum + item.fat, 0)

  return {
    id: uuidv4(),
    label,
    source,
    items,
    calories,
    protein,
    carbs,
    fat,
  }
}

const getMealOptions = (
  mealType: MealCategory,
  baseItems: FoodItem[],
  pantry: PantryData | null,
  strictPantryOnly: boolean,
): MealPrepOption[] => {
  const options: MealPrepOption[] = []

  options.push(createOption("Current plan", "plan", deepCloneItems(baseItems)))

  const pantryFoods = pantry ? parsePantryList(pantry[mealTypeToPantryKey(mealType)] ?? "") : []
  if (pantryFoods.length > 0) {
    const pantryItems = baseItems.map((item, index) => ({
      ...item,
      id: uuidv4(),
      name: pantryFoods[index % pantryFoods.length] ?? item.name,
    }))
    options.push(createOption("Pantry rotation", "pantry", pantryItems))
  }

  if (!strictPantryOnly) {
    const aiBalancedItems = baseItems.map((item) => ({
      ...item,
      id: uuidv4(),
      name: `${item.name} (balanced)`,
      calories: Math.max(40, Math.round(item.calories * 0.95)),
      protein: Math.max(0, Number((item.protein * 1.05).toFixed(1))),
      carbs: Math.max(0, Number((item.carbs * 0.95).toFixed(1))),
      fat: Math.max(0, Number((item.fat * 0.95).toFixed(1))),
    }))
    options.push(createOption("AI balanced", "ai", aiBalancedItems))
  }

  return options.slice(0, 4)
}

const createMealDraft = (
  mealType: MealCategory,
  baseItems: FoodItem[],
  pantry: PantryData | null,
  strictPantryOnly: boolean,
): MealPrepMealDraft => {
  const options = getMealOptions(mealType, baseItems, pantry, strictPantryOnly)
  const selectedOptionId = options[0]?.id ?? ""

  return {
    mealType,
    options,
    selectedOptionId,
    locked: false,
    enabled: true,
  }
}

const createDayDraft = (
  label: string,
  dateIso: string | undefined,
  plan: DailyMealPlan,
  pantry: PantryData | null,
  strictPantryOnly: boolean,
): MealPrepDayDraft => {
  const mealMap: Record<MealCategory, MealPrepMealDraft | null> = {
    breakfast: null,
    lunch: null,
    dinner: null,
    snack: null,
  }

  MEAL_TYPES.forEach((mealType) => {
    const section = plan.meals.find((meal) => meal.type === mealType)
    if (!section) {
      return
    }

    mealMap[mealType] = createMealDraft(mealType, section.items, pantry, strictPantryOnly)
  })

  return {
    id: uuidv4(),
    label,
    dateIso,
    meals: mealMap,
  }
}

const buildDailyDraft = (
  plan: DailyMealPlan,
  pantry: PantryData | null,
  source: MealPrepSource,
  strictPantryOnly: boolean,
): MealPrepDraft => {
  const dayLabel = new Date(plan.date).toLocaleDateString(undefined, { weekday: "long" })

  return {
    id: uuidv4(),
    source,
    mode: "daily",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    basePlanId: plan.id,
    strictPantryOnly,
    allowAddOns: !strictPantryOnly,
    days: [createDayDraft(dayLabel, plan.date, plan, pantry, strictPantryOnly)],
    prepBlocks: [],
    shopping: [],
    originalPlan: plan,
  }
}

const buildWeeklyDraft = (
  plan: DailyMealPlan,
  pantry: PantryData | null,
  source: MealPrepSource,
  strictPantryOnly: boolean,
): MealPrepDraft => {
  const start = new Date(plan.date)
  const days = WEEKDAY_LABELS.map((label, index) => {
    const dayDate = new Date(start)
    dayDate.setDate(start.getDate() + index)
    const dateIso = dayDate.toISOString().split("T")[0]
    return createDayDraft(label, dateIso, plan, pantry, strictPantryOnly)
  })

  return {
    id: uuidv4(),
    source,
    mode: "weekly",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    basePlanId: plan.id,
    strictPantryOnly,
    allowAddOns: !strictPantryOnly,
    days,
    prepBlocks: [],
    shopping: [],
    originalPlan: plan,
  }
}

export const createMealPrepDraft = (
  plan: DailyMealPlan,
  pantry: PantryData | null,
  source: MealPrepSource,
  mode: MealPrepMode,
  strictPantryOnly = false,
): MealPrepDraft => {
  if (mode === "weekly") {
    return buildWeeklyDraft(plan, pantry, source, strictPantryOnly)
  }
  return buildDailyDraft(plan, pantry, source, strictPantryOnly)
}

export const switchDraftMode = (draft: MealPrepDraft, mode: MealPrepMode): MealPrepDraft => {
  if (!draft.originalPlan || draft.mode === mode) {
    return draft
  }

  const recreated = createMealPrepDraft(
    draft.originalPlan,
    draft.originalPlan.usedPantry ?? null,
    draft.source,
    mode,
    draft.strictPantryOnly,
  )

  return {
    ...recreated,
    id: draft.id,
    createdAt: draft.createdAt,
    updatedAt: new Date().toISOString(),
  }
}

export const setStrictPantryMode = (draft: MealPrepDraft, strictPantryOnly: boolean): MealPrepDraft => {
  if (!draft.originalPlan) {
    return { ...draft, strictPantryOnly, allowAddOns: !strictPantryOnly }
  }

  const rebuilt = createMealPrepDraft(
    draft.originalPlan,
    draft.originalPlan.usedPantry ?? null,
    draft.source,
    draft.mode,
    strictPantryOnly,
  )

  return {
    ...rebuilt,
    id: draft.id,
    createdAt: draft.createdAt,
    updatedAt: new Date().toISOString(),
    allowAddOns: !strictPantryOnly,
  }
}

export const getSelectedOption = (meal: MealPrepMealDraft | null): MealPrepOption | null => {
  if (!meal) return null
  return meal.options.find((option) => option.id === meal.selectedOptionId) ?? meal.options[0] ?? null
}

export const computeDraftTotals = (draft: MealPrepDraft) => {
  const aggregate = draft.days.reduce(
    (totals, day) => {
      MEAL_TYPES.forEach((mealType) => {
        const mealDraft = day.meals[mealType]
        if (!mealDraft || !mealDraft.enabled) {
          return
        }

        const selected = getSelectedOption(mealDraft)
        if (!selected) {
          return
        }

        totals.calories += selected.calories
        totals.protein += selected.protein
        totals.carbs += selected.carbs
        totals.fat += selected.fat
        totals.mealCount += 1
      })

      return totals
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 },
  )

  return {
    calories: Math.round(aggregate.calories),
    protein: Math.round(aggregate.protein),
    carbs: Math.round(aggregate.carbs),
    fat: Math.round(aggregate.fat),
    mealCount: aggregate.mealCount,
  }
}

const createPrepTask = (
  category: PrepTask["category"],
  title: string,
  description: string,
  durationMinutes: number,
): PrepTask => ({
  id: uuidv4(),
  category,
  title,
  description,
  durationMinutes,
  completed: false,
})

const buildPrepBlocks = (draft: MealPrepDraft): PrepBlock[] => {
  const ingredientNames = new Set<string>()

  draft.days.forEach((day) => {
    MEAL_TYPES.forEach((mealType) => {
      const meal = day.meals[mealType]
      const selected = getSelectedOption(meal)
      if (!selected || !meal?.enabled) return
      selected.items.forEach((item) => ingredientNames.add(item.name.toLowerCase()))
    })
  })

  const ingredientCount = ingredientNames.size
  const baseChopDuration = Math.max(10, Math.min(45, ingredientCount * 3))
  const baseCookDuration = Math.max(15, Math.min(60, ingredientCount * 4))

  return [
    {
      id: uuidv4(),
      title: draft.mode === "weekly" ? "Sunday Batch" : "Primary Prep Block",
      subtitle: "Build core components for fast assembly",
      totalMinutes: baseChopDuration + baseCookDuration + 25,
      tasks: [
        createPrepTask("chop", "Chop produce", "Wash and chop vegetables for the first half of the plan.", baseChopDuration),
        createPrepTask("cook", "Cook core proteins", "Batch-cook proteins with minimal seasoning for flexible reuse.", baseCookDuration),
        createPrepTask("portion", "Portion into containers", "Split cooked components into meal-sized portions.", 15),
        createPrepTask("store", "Store + label", "Label containers by day/meal and refrigerate or freeze.", 10),
      ],
    },
    {
      id: uuidv4(),
      title: draft.mode === "weekly" ? "Midweek Refresh" : "Quick Refresh",
      subtitle: "Keep texture and flavor fresh",
      totalMinutes: 25,
      tasks: [
        createPrepTask("cook", "Cook quick add-ons", "Prepare a fresh side or sauce to avoid flavor fatigue.", 10),
        createPrepTask("portion", "Re-balance portions", "Adjust portions to stay aligned with daily targets.", 8),
        createPrepTask("store", "Rotate oldest containers", "Move older portions to the front for use first.", 7),
      ],
    },
  ]
}

const categorizeIngredient = (name: string): MealPrepShoppingItem["category"] => {
  const lower = name.toLowerCase()
  const category = (Object.keys(CATEGORY_KEYWORDS) as MealPrepShoppingItem["category"][]).find((candidate) =>
    CATEGORY_KEYWORDS[candidate].some((keyword) => lower.includes(keyword)),
  )

  return category ?? "other"
}

const buildPantrySet = (pantry: PantryData | null): Set<string> => {
  if (!pantry) {
    return new Set<string>()
  }

  const allFoods = [pantry.breakfast, pantry.lunch, pantry.dinner, pantry.snacks].flatMap((value) => parsePantryList(value))
  return new Set(allFoods.map((food) => food.trim().toLowerCase()))
}

const buildShoppingList = (draft: MealPrepDraft, pantry: PantryData | null): MealPrepShoppingItem[] => {
  const pantrySet = buildPantrySet(pantry)
  const merged = new Map<string, MealPrepShoppingItem>()

  draft.days.forEach((day) => {
    MEAL_TYPES.forEach((mealType) => {
      const meal = day.meals[mealType]
      const selected = getSelectedOption(meal)
      if (!selected || !meal?.enabled) {
        return
      }

      selected.items.forEach((item) => {
        const normalized = item.name.trim().toLowerCase()
        const key = `${normalized}-g`

        const existing = merged.get(key)
        const status: MealPrepShoppingItem["status"] = pantrySet.has(normalized) ? "have" : "buy"
        const sourceMeal = `${day.label} ${mealType}`

        if (existing) {
          existing.quantity = Number((existing.quantity + item.weightGrams).toFixed(1))
          if (!existing.sourceMeals.includes(sourceMeal)) {
            existing.sourceMeals.push(sourceMeal)
          }
          if (existing.status !== "buy" && status === "buy") {
            existing.status = "buy"
          }
          return
        }

        merged.set(key, {
          id: uuidv4(),
          name: item.name,
          quantity: Number(item.weightGrams.toFixed(1)),
          unit: "g",
          category: categorizeIngredient(item.name),
          sourceMeals: [sourceMeal],
          status,
        })
      })
    })
  })

  return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export const refreshDraftArtifacts = (draft: MealPrepDraft, pantry: PantryData | null): MealPrepDraft => {
  const prepBlocks = buildPrepBlocks(draft)
  const shopping = buildShoppingList(draft, pantry)

  return {
    ...draft,
    prepBlocks,
    shopping,
    updatedAt: new Date().toISOString(),
  }
}

export const createSavedPlanRecord = (draft: MealPrepDraft, name?: string): SavedMealPrepPlan => {
  const stamp = new Date().toISOString()
  const fallbackName = `Meal Prep ${new Date(stamp).toLocaleDateString()}`

  return {
    id: uuidv4(),
    name: name?.trim() ? name.trim() : fallbackName,
    createdAt: stamp,
    updatedAt: stamp,
    draft,
  }
}

const formatDate = (value: string | undefined) => {
  if (!value) return "N/A"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

export const draftToSummaryText = (saved: SavedMealPrepPlan): string => {
  const totals = computeDraftTotals(saved.draft)
  const lines: string[] = [
    `${saved.name}`,
    `Created: ${new Date(saved.createdAt).toLocaleString()}`,
    `Mode: ${saved.draft.mode}`,
    `Calories: ${totals.calories} kcal`,
    `Macros: P ${totals.protein}g | C ${totals.carbs}g | F ${totals.fat}g`,
    "",
    "Schedule:",
  ]

  saved.draft.days.forEach((day) => {
    lines.push(`- ${day.label} (${formatDate(day.dateIso)})`)
    MEAL_TYPES.forEach((mealType) => {
      const meal = day.meals[mealType]
      const selected = getSelectedOption(meal)
      if (!meal || !selected || !meal.enabled) {
        return
      }
      lines.push(`  • ${mealType}: ${selected.label}`)
    })
  })

  lines.push("", "Shopping")
  saved.draft.shopping.forEach((item) => {
    lines.push(`- ${item.name}: ${item.quantity}${item.unit} [${item.status}]`)
  })

  return lines.join("\n")
}

export const draftToShoppingCsv = (saved: SavedMealPrepPlan): string => {
  const header = "name,quantity,unit,status,category,sourceMeals"
  const rows = saved.draft.shopping.map((item) => {
    const source = `"${item.sourceMeals.join(" | ")}"`
    return `${item.name},${item.quantity},${item.unit},${item.status},${item.category},${source}`
  })
  return [header, ...rows].join("\n")
}

export const draftToCalendarIcs = (saved: SavedMealPrepPlan): string => {
  const formatUtc = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const now = formatUtc(new Date())
  const events = saved.draft.prepBlocks
    .map((block, index) => {
      const targetDate = saved.draft.days[index]?.dateIso ?? saved.draft.days[0]?.dateIso ?? new Date().toISOString().split("T")[0]
      const startDate = new Date(`${targetDate}T10:00:00`)
      const endDate = new Date(startDate.getTime() + block.totalMinutes * 60_000)
      const start = formatUtc(startDate)
      const end = formatUtc(endDate)
      return [
        "BEGIN:VEVENT",
        `UID:${uuidv4()}@nutriai`,
        `DTSTAMP:${now}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${block.title}`,
        `DESCRIPTION:${block.subtitle}`,
        "END:VEVENT",
      ].join("\n")
    })
    .join("\n")

  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NutriAI//MealPrep//EN", events, "END:VCALENDAR"].join("\n")
}
