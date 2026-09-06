/**
 * Data model of the LLM-generated weekly meal plan (screen 05).
 * Mirrors the structured-output JSON schema in `lib/llm/schema.ts`.
 */

export interface PlanIngredient {
  /** Product id from the Esselunga catalog */
  productId: string;
  name: string;
  /** Human-readable amount, e.g. "400g", "2 cloves" */
  amount: string;
}

export interface PlanMeal {
  name: string;
  prepTimeMinutes: number;
  servings: number;
  /** Estimated cost per serving in EUR */
  pricePerServing: number;
  ingredients: PlanIngredient[];
  steps: string[];
}

export interface DayPlan {
  /** Full English day name, "Monday" … "Sunday" */
  day: string;
  meal: PlanMeal;
}

export interface WeeklyPlan {
  days: DayPlan[];
}

/** Weekly estimated cost = Σ pricePerServing × servings */
export function weeklyCost(plan: WeeklyPlan): number {
  return plan.days.reduce(
    (sum, d) => sum + d.meal.pricePerServing * d.meal.servings,
    0,
  );
}
