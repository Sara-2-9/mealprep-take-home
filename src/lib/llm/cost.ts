import { getProductById } from "../catalog";
import type { Product } from "../types";
import type { DayPlan, WeeklyPlan } from "../meal-plan";
import type { LLMDayPlan, LLMPlanMeal, LLMWeeklyPlan } from "./schema";

/**
 * Deterministic cost computation for LLM-generated plans (v2: 3 meals/day).
 * The model declares ingredient quantities in grams; prices come from the
 * catalog unit prices (€/kg, €/l) — never from the model itself. This makes
 * the budget validation real instead of trusting a self-reported number.
 */

const SERVINGS = 2;

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

export interface PricedDay {
  /** App-facing day with computed pricePerServing */
  day: DayPlan;
  /** productIds referenced by the day but missing from the catalog */
  unknownProductIds: string[];
}

/** Resolve a single LLM ingredient to a priced PlanIngredient. */
function resolveIngredient(ing: { productId: string; amount: string; grams: number }) {
  const product = getProductById(ing.productId);
  return {
    productId: ing.productId,
    name: product?.name ?? ing.productId,
    amount: ing.amount,
    grams: ing.grams,
  };
}

/**
 * Converts one raw LLM day into the app-facing DayPlan, computing
 * pricePerServing = Σ(grams × €/kg) / servings for each meal.
 * Ingredient names are resolved from the catalog by productId (output slimming).
 */
export function priceDay(llmDay: LLMDayPlan): PricedDay {
  const unknown: string[] = [];
  const meals = llmDay.meals.map((llmMeal) => {
    const ingredients = llmMeal.ingredients.map((ing) => {
      const product = getProductById(ing.productId);
      if (!product) {
        unknown.push(ing.productId);
      }
      return resolveIngredient(ing);
    });
    const pricePerServing = round2(mealCost(llmMeal) / SERVINGS);
    return {
      type: llmMeal.type,
      name: llmMeal.name,
      prepTimeMinutes: llmMeal.prepTimeMinutes,
      servings: SERVINGS,
      pricePerServing,
      ingredients,
      steps: llmMeal.steps,
    };
  });
  return {
    day: { day: llmDay.day, meals },
    unknownProductIds: unknown,
  };
}

/**
 * Converts raw LLM output into the app-facing WeeklyPlan, computing
 * pricePerServing = Σ(grams × €/kg) / servings for each meal.
 */
export function priceWeeklyPlan(llmPlan: LLMWeeklyPlan): PricedPlan {
  const unknown = new Set<string>();
  const days = llmPlan.days.map((day) => {
    const priced = priceDay(day);
    for (const id of priced.unknownProductIds) unknown.add(id);
    return priced.day;
  });
  return { plan: { days }, unknownProductIds: [...unknown] };
}
