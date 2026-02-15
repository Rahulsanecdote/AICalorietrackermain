import { describe, expect, it } from "vitest";
import {
  cmToFtIn,
  computeBMI,
  computeBMR,
  computeMacroTargets,
  computeSmartGoalSummary,
  computeSmartTargetCalories,
  computeTDEE,
  ftInToCm,
  kgToLb,
  lbToKg,
} from "./smartGoals";

describe("smartGoals utilities", () => {
  it("computes BMI correctly", () => {
    expect(computeBMI(70, 175)).toBeCloseTo(22.9, 1);
  });

  it("computes BMR for male/female/generic", () => {
    const male = computeBMR({
      age: 30,
      weightKg: 70,
      heightCm: 175,
      sexAtBirth: "male",
    });
    const female = computeBMR({
      age: 30,
      weightKg: 70,
      heightCm: 175,
      sexAtBirth: "female",
    });
    const generic = computeBMR({
      age: 30,
      weightKg: 70,
      heightCm: 175,
      sexAtBirth: "unspecified",
    });

    expect(male).toBe(1649);
    expect(female).toBe(1483);
    expect(generic).toBe(1566);
  });

  it("computes TDEE with activity multiplier", () => {
    expect(computeTDEE({ bmr: 1566, activityLevel: "moderately_active" })).toBe(
      2427,
    );
  });

  it("computes calorie target by goal/aggressiveness", () => {
    expect(
      computeSmartTargetCalories({
        tdee: 2400,
        goal: "lose",
        goalAggressiveness: "mild",
      }),
    ).toBe(2160);
    expect(
      computeSmartTargetCalories({
        tdee: 2400,
        goal: "lose",
        goalAggressiveness: "aggressive",
      }),
    ).toBe(1800);
    expect(
      computeSmartTargetCalories({
        tdee: 2400,
        goal: "gain",
        goalAggressiveness: "lean",
      }),
    ).toBe(2520);
  });

  it("computes macro targets sanely", () => {
    const macros = computeMacroTargets({
      weightKg: 70,
      goal: "lose",
      goalAggressiveness: "standard",
      calorieTarget: 2000,
    });
    expect(macros.protein).toBe(140);
    expect(macros.fat).toBe(56);
    expect(macros.carbs).toBeGreaterThan(0);
  });

  it("creates summary and warnings", () => {
    const summary = computeSmartGoalSummary({
      age: 60,
      weightKg: 45,
      heightCm: 175,
      activityLevel: "sedentary",
      goal: "lose",
      goalAggressiveness: "aggressive",
      sexAtBirth: "female",
    });
    expect(summary.smartCalories).toBeLessThan(1200);
    expect(summary.warnings.length).toBeGreaterThan(0);
  });

  it("converts kg/lb round-trip", () => {
    const kg = 82.4;
    const lb = kgToLb(kg);
    const convertedKg = lbToKg(lb);
    expect(convertedKg).toBeCloseTo(kg, 6);
  });

  it("converts cm/ft+in round-trip", () => {
    const cm = 182.9;
    const { feet, inches } = cmToFtIn(cm);
    const convertedCm = ftInToCm(feet, inches);
    expect(convertedCm).toBeCloseTo(182.9, 0);
  });

  it("handles inch carry edge case", () => {
    const { feet, inches } = cmToFtIn(ftInToCm(5, 11) + 1.2);
    expect(feet).toBeGreaterThanOrEqual(5);
    expect(inches).toBeGreaterThanOrEqual(0);
    expect(inches).toBeLessThanOrEqual(11);
  });
});

