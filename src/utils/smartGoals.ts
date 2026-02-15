import type {
  ActivityLevel,
  GoalAggressiveness,
  SexAtBirth,
  UserGoal,
} from "../types";
import { ACTIVITY_MULTIPLIERS } from "../constants";

export interface SmartGoalInput {
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: UserGoal;
  goalAggressiveness: GoalAggressiveness;
  sexAtBirth: SexAtBirth;
}

export interface MacroTargets {
  protein: number;
  carbs: number;
  fat: number;
}

export interface SmartGoalSummary {
  bmi: number;
  bmr: number;
  tdee: number;
  smartCalories: number;
  smartMacros: MacroTargets;
  warnings: string[];
}

const LB_PER_KG = 2.2046226218;
const CM_PER_INCH = 2.54;

const LOSS_DEFICITS: Record<Exclude<GoalAggressiveness, "lean">, number> = {
  mild: 0.1,
  standard: 0.18,
  aggressive: 0.25,
};

const GAIN_SURPLUS: Record<Exclude<GoalAggressiveness, "mild">, number> = {
  lean: 0.05,
  standard: 0.1,
  aggressive: 0.15,
};

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function safePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getNormalizedAggressiveness(
  goal: UserGoal,
  aggressiveness: GoalAggressiveness,
): GoalAggressiveness {
  if (goal === "maintain") {
    return "standard";
  }

  if (goal === "lose" && aggressiveness === "lean") {
    return "standard";
  }

  if (goal === "gain" && aggressiveness === "mild") {
    return "standard";
  }

  return aggressiveness;
}

export function computeBMI(weightKg: number, heightCm: number): number {
  const safeWeight = safePositive(weightKg, 70);
  const safeHeight = safePositive(heightCm, 175);
  const heightM = safeHeight / 100;
  return round(safeWeight / (heightM * heightM), 1);
}

export function computeBMR({
  age,
  weightKg,
  heightCm,
  sexAtBirth,
}: {
  age: number;
  weightKg: number;
  heightCm: number;
  sexAtBirth: SexAtBirth;
}): number {
  const safeAge = safePositive(age, 30);
  const safeWeight = safePositive(weightKg, 70);
  const safeHeight = safePositive(heightCm, 175);

  const male = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge + 5;
  const female = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge - 161;

  if (sexAtBirth === "male") return Math.round(male);
  if (sexAtBirth === "female") return Math.round(female);
  return Math.round((male + female) / 2);
}

export function computeTDEE({
  bmr,
  activityLevel,
}: {
  bmr: number;
  activityLevel: ActivityLevel;
}): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? ACTIVITY_MULTIPLIERS.moderately_active;
  return Math.round(safePositive(bmr, 1500) * multiplier);
}

export function computeSmartTargetCalories({
  tdee,
  goal,
  goalAggressiveness,
}: {
  tdee: number;
  goal: UserGoal;
  goalAggressiveness: GoalAggressiveness;
}): number {
  const safeTdee = safePositive(tdee, 2000);
  const normalizedAggressiveness = getNormalizedAggressiveness(goal, goalAggressiveness);

  if (goal === "maintain") {
    return Math.round(safeTdee);
  }

  if (goal === "lose") {
    const deficit = LOSS_DEFICITS[normalizedAggressiveness as keyof typeof LOSS_DEFICITS] ?? LOSS_DEFICITS.standard;
    return Math.round(safeTdee * (1 - deficit));
  }

  const surplus = GAIN_SURPLUS[normalizedAggressiveness as keyof typeof GAIN_SURPLUS] ?? GAIN_SURPLUS.standard;
  return Math.round(safeTdee * (1 + surplus));
}

export function computeMacroTargets({
  weightKg,
  goal,
  goalAggressiveness,
  calorieTarget,
}: {
  weightKg: number;
  goal: UserGoal;
  goalAggressiveness: GoalAggressiveness;
  calorieTarget: number;
}): MacroTargets {
  const safeWeight = safePositive(weightKg, 70);
  const safeCalories = safePositive(calorieTarget, 2000);
  const normalizedAggressiveness = getNormalizedAggressiveness(goal, goalAggressiveness);

  let proteinMultiplier = 1.6;
  if (goal === "lose") {
    if (normalizedAggressiveness === "mild") proteinMultiplier = 1.8;
    if (normalizedAggressiveness === "standard") proteinMultiplier = 2.0;
    if (normalizedAggressiveness === "aggressive") proteinMultiplier = 2.2;
  } else if (goal === "gain") {
    if (normalizedAggressiveness === "lean") proteinMultiplier = 1.6;
    if (normalizedAggressiveness === "standard") proteinMultiplier = 1.8;
    if (normalizedAggressiveness === "aggressive") proteinMultiplier = 2.0;
  }

  const protein = Math.round(safeWeight * proteinMultiplier);
  const fat = Math.round(safeWeight * 0.8);

  const proteinCalories = protein * 4;
  const fatCalories = fat * 9;
  const remainingCalories = Math.max(0, safeCalories - proteinCalories - fatCalories);
  const carbs = Math.round(remainingCalories / 4);

  return { protein, carbs, fat };
}

export function computeSmartGoalSummary(input: SmartGoalInput): SmartGoalSummary {
  const normalizedAggressiveness = getNormalizedAggressiveness(input.goal, input.goalAggressiveness);
  const bmi = computeBMI(input.weightKg, input.heightCm);
  const bmr = computeBMR({
    age: input.age,
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    sexAtBirth: input.sexAtBirth,
  });
  const tdee = computeTDEE({ bmr, activityLevel: input.activityLevel });
  const smartCalories = computeSmartTargetCalories({
    tdee,
    goal: input.goal,
    goalAggressiveness: normalizedAggressiveness,
  });
  const smartMacros = computeMacroTargets({
    weightKg: input.weightKg,
    goal: input.goal,
    goalAggressiveness: normalizedAggressiveness,
    calorieTarget: smartCalories,
  });

  const warnings: string[] = [];
  if (smartCalories < 1200) {
    warnings.push("This target is very low. Consider reducing your deficit.");
  }
  if (smartCalories > 4500) {
    warnings.push("This target is very high. Please verify your profile inputs.");
  }
  if (input.goal === "lose" && normalizedAggressiveness === "aggressive") {
    warnings.push("Aggressive weight-loss targets are harder to sustain long-term.");
  }

  return {
    bmi,
    bmr,
    tdee,
    smartCalories,
    smartMacros,
    warnings,
  };
}

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}

export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const safeCm = safePositive(cm, 175);
  const totalInches = safeCm / CM_PER_INCH;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches % 12);

  if (inches === 12) {
    feet += 1;
    inches = 0;
  }

  return { feet, inches };
}

export function ftInToCm(feet: number, inches: number): number {
  const safeFeet = Math.max(0, Math.floor(feet));
  const safeInches = Math.max(0, Math.min(11, Math.floor(inches)));
  return round((safeFeet * 12 + safeInches) * CM_PER_INCH, 1);
}

