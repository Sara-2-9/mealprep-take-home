import { describe, expect, test } from "bun:test";
import { weeklyPlanSchema, WEEK_DAY_NAMES, type LLMWeeklyPlan } from "./schema";

/** Minimal valid plan: 7 days, cheapest real catalog products. */
export function makeValidPlan(): LLMWeeklyPlan {
  return {
    days: WEEK_DAY_NAMES.map((day) => ({
      day,
      meal: {
        name: `Pasta dish ${day}`,
        prepTimeMinutes: 20,
        servings: 2,
        ingredients: [
          {
            productId: "8005121050271", // Penne, 1.78 €/kg
            amount: "160g",
            grams: 160,
          },
          {
            productId: "8003170094871", // Eggs, 3.59 €/kg
            amount: "2 eggs",
            grams: 110,
          },
        ],
        steps: ["Boil pasta", "Cook sauce", "Serve"],
      },
    })),
  };
}

describe("weeklyPlanSchema", () => {
  test("accepts a valid 7-day plan", () => {
    const result = weeklyPlanSchema.safeParse(makeValidPlan());
    expect(result.success).toBe(true);
  });

  test("rejects plans with fewer or more than 7 days", () => {
    const plan = makeValidPlan();
    expect(
      weeklyPlanSchema.safeParse({ days: plan.days.slice(0, 6) }).success,
    ).toBe(false);
    expect(
      weeklyPlanSchema.safeParse({ days: [...plan.days, plan.days[0]] })
        .success,
    ).toBe(false);
  });

  test("rejects a day outside the Monday…Sunday enum", () => {
    const plan = makeValidPlan();
    const bad = {
      ...plan,
      days: [{ ...plan.days[0], day: "Funday" }, ...plan.days.slice(1)],
    };
    expect(weeklyPlanSchema.safeParse(bad).success).toBe(false);
  });

  test("rejects grams below 1 and missing grams", () => {
    const plan = makeValidPlan();
    const zeroGrams = structuredClone(plan);
    zeroGrams.days[0].meal.ingredients[0].grams = 0;
    expect(weeklyPlanSchema.safeParse(zeroGrams).success).toBe(false);

    const noGrams = JSON.parse(JSON.stringify(plan));
    delete noGrams.days[0].meal.ingredients[0].grams;
    expect(weeklyPlanSchema.safeParse(noGrams).success).toBe(false);
  });

  test("rejects meals with fewer than 2 ingredients or 3 steps", () => {
    const plan = makeValidPlan();
    const fewIngredients = structuredClone(plan);
    fewIngredients.days[0].meal.ingredients = [
      fewIngredients.days[0].meal.ingredients[0],
    ];
    expect(weeklyPlanSchema.safeParse(fewIngredients).success).toBe(false);

    const fewSteps = structuredClone(plan);
    fewSteps.days[0].meal.steps = ["Boil pasta", "Serve"];
    expect(weeklyPlanSchema.safeParse(fewSteps).success).toBe(false);
  });

  test("caps recipes at 10 ingredients and 8 steps (output slimming)", () => {
    const plan = makeValidPlan();
    const manyIngredients = structuredClone(plan);
    manyIngredients.days[0].meal.ingredients = Array.from(
      { length: 11 },
      (_, i) => ({
        productId: "8005121050271",
        amount: "10g",
        grams: 10 + i,
      }),
    );
    expect(weeklyPlanSchema.safeParse(manyIngredients).success).toBe(false);

    const manySteps = structuredClone(plan);
    manySteps.days[0].meal.steps = Array.from({ length: 9 }, (_, i) => `Step ${i}`);
    expect(weeklyPlanSchema.safeParse(manySteps).success).toBe(false);
  });
});
