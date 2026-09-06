import { getProductById } from "../catalog";
import type { Product } from "../types";
import type { WeeklyPlan } from "../mealPlan";
import type { LLMPlanMeal, LLMWeeklyPlan } from "./schema";

/**
 * Deterministic cost computation for LLM-generated plans.
 * The model declares ingredient quantities in grams; prices come from the
 * catalog unit prices (€/kg, €/l) — never from the model itself. This makes
 * the budget validation real instead of trusting a self-reported number.
 */

/** Round to euro cents. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Cost of `grams` of a product in EUR. */
function productCost(product: Product, grams: number): number {
  const unit = product.unitPrice;
  if (unit && (unit.unit === "kg" || unit.unit === "l")) {
    // ml ≈ g for liquids
    return (grams / 1000) * unit.amount;
  }
  // 264 catalog products have no unit price: conservatively charge the pack.
  return product.price.amount;
}

/**
 * Cost of one ingredient in EUR, or null when the productId is not in the
 * catalog (hallucinated id — the plan must be rejected).
 */
export function ingredientCost(
  productId: string,
  grams: number,
): number | null {
  const product = getProductById(productId);
  if (!product) return null;
  return productCost(product, grams);
}

/** Total ingredient cost of a meal in EUR (all servings). */
export function mealCost(meal: LLMPlanMeal): number {
  return meal.ingredients.reduce(
    (sum, ing) => sum + (ingredientCost(ing.productId, ing.grams) ?? 0),
    0,
  );
}

export interface PricedPlan {
  /** App-facing plan with computed pricePerServing */
  plan: WeeklyPlan;
  /** productIds referenced by the plan but missing from the catalog */
  unknownProductIds: string[];
}

/**
 * Converts raw LLM output into the app-facing WeeklyPlan, computing
 * pricePerServing = Σ(grams × €/kg) / servings for each meal.
 */
export function priceWeeklyPlan(llmPlan: LLMWeeklyPlan): PricedPlan {
  const unknown = new Set<string>();
  const days = llmPlan.days.map((day) => {
    const ingredients = day.meal.ingredients.map((ing) => {
      if (ingredientCost(ing.productId, ing.grams) === null) {
        unknown.add(ing.productId);
      }
      return {
        productId: ing.productId,
        name: ing.name,
        amount: ing.amount,
        grams: ing.grams,
      };
    });
    const pricePerServing = round2(mealCost(day.meal) / day.meal.servings);
    return {
      day: day.day,
      meal: {
        name: day.meal.name,
        prepTimeMinutes: day.meal.prepTimeMinutes,
        servings: day.meal.servings,
        pricePerServing,
        ingredients,
        steps: day.meal.steps,
      },
    };
  });
  return { plan: { days }, unknownProductIds: [...unknown] };
}
