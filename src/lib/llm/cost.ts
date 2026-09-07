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

/** A step is renderable only if it contains at least one letter. */
const HAS_LETTER = /[A-Za-zÀ-ÖØ-öø-ÿ]/;

/** Trimmed step, or null when empty / symbols-only. */
export function cleanStep(step: string): string | null {
  const trimmed = step.trim();
  return HAS_LETTER.test(trimmed) ? trimmed : null;
}

/** Round to euro cents. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Parse a catalog `quantity` string ("620 g", "1,5 l", "2 x 180 g", "140g")
 * into grams (ml ≈ g for liquids, matching the cost convention).
 * Returns null when the format is not a weight/volume (pieces, garbage).
 */
export function parsePackGrams(
  quantity: string | undefined,
): number | null {
  if (!quantity) return null;
  const q = quantity.trim().toLowerCase().replace(",", ".");
  const toGrams = (n: number, unit: string): number | null => {
    switch (unit) {
      case "g":
      case "gr":
      case "grammi":
        return n;
      case "kg":
        return n * 1000;
      case "ml":
      case "l":
      case "lt":
      case "litro":
      case "litri":
        return n * (unit === "ml" ? 1 : 1000);
      case "cl":
        return n * 10;
      default:
        return null;
    }
  };
  const UNIT = "(kg|grammi|gr|g|cl|ml|lt|litri|litro|l)";
  // Multi-pack: "2 x 180 g" → total grams
  const multi = q.match(
    new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*x\\s*(\\d+(?:\\.\\d+)?)\\s*${UNIT}`),
  );
  if (multi) {
    const grams = toGrams(parseFloat(multi[2]), multi[3]);
    return grams === null ? null : grams * parseFloat(multi[1]);
  }
  const single = q.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${UNIT}\\b`));
  if (single) return toGrams(parseFloat(single[1]), single[2]);
  // Bare number ("620") → assume grams
  const bare = q.match(/^(\d+(?:\.\d+)?)$/);
  if (bare) return parseFloat(bare[1]);
  return null;
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
      // Sanitize: the UI never renders empty / symbols-only steps, even
      // mid-stream before final validation. validatePlan rejects meals
      // left with fewer than 3 valid steps, so this can't hide bad plans.
      steps: llmMeal.steps
        .map((s) => cleanStep(s))
        .filter((s): s is string => s !== null),
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

export interface PantryItem {
  productId: string;
  name: string;
  /** Whole packs charged (ceil of total grams used / pack size) */
  packs: number;
  /** Full pack price in EUR */
  packPrice: number;
  /** packs × packPrice, rounded to cents */
  totalPrice: number;
}

/**
 * Shopping list derived deterministically from the plan: distinct products
 * in first-use order, each charged per whole pack. When the recipes need
 * more than one pack holds, whole extra packs are charged.
 */
export function shoppingList(plan: WeeklyPlan): PantryItem[] {
  const usedGrams = new Map<string, number>();
  const order: string[] = [];
  for (const day of plan.days) {
    for (const meal of day.meals) {
      for (const ing of meal.ingredients) {
        if (!usedGrams.has(ing.productId)) order.push(ing.productId);
        usedGrams.set(
          ing.productId,
          (usedGrams.get(ing.productId) ?? 0) + ing.grams,
        );
      }
    }
  }
  return order.map((id) => {
    const product = getProductById(id);
    const packGrams = product ? parsePackGrams(product.quantity) : null;
    const packs =
      packGrams && packGrams > 0
        ? Math.max(1, Math.ceil((usedGrams.get(id) ?? 0) / packGrams - 1e-9))
        : 1;
    const packPrice = product?.price.amount ?? 0;
    return {
      productId: id,
      name: product?.name ?? id,
      packs,
      packPrice,
      totalPrice: round2(packs * packPrice),
    };
  });
}

/**
 * Weekly total = Σ whole-pack prices of distinct products: the actual money
 * the user spends. Per-meal grams-based prices stay display-only.
 */
export function pantryCost(plan: WeeklyPlan): number {
  return round2(
    shoppingList(plan).reduce((sum, item) => sum + item.totalPrice, 0),
  );
}

/**
 * Products opened for a single meal only (distinct day+meal-type count < 2).
 * Opening a pack for one meal is waste; the plan must reuse it or drop it.
 * A product listed twice in the same meal counts once.
 */
export function singleUseProducts(
  plan: WeeklyPlan,
): { productId: string; name: string }[] {
  const mealsByProduct = new Map<string, Set<string>>();
  const names = new Map<string, string>();
  for (const day of plan.days) {
    for (const meal of day.meals) {
      const key = `${day.day}|${meal.type}`;
      for (const ing of meal.ingredients) {
        if (!mealsByProduct.has(ing.productId)) {
          mealsByProduct.set(ing.productId, new Set());
          names.set(ing.productId, ing.name);
        }
        mealsByProduct.get(ing.productId)!.add(key);
      }
    }
  }
  const bad: { productId: string; name: string }[] = [];
  for (const [id, meals] of mealsByProduct) {
    if (meals.size < 2) bad.push({ productId: id, name: names.get(id) ?? id });
  }
  return bad;
}
