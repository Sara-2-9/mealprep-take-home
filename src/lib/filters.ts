import { getCatalog } from "./catalog";
import type { Product } from "./types";
import type { DietaryNeed, NutritionalGoal } from "../state/flow-store";

/**
 * Catalog filter pipeline (Phase 3, step 20):
 * dietary needs + nutritional goals → candidate product subset for the
 * LLM prompt basket. Hard filters come from dietary needs; nutritional
 * goals act as a preference score used when ranking the basket.
 */

/** Departments never used for meal planning (breakfast items come from "colazione") */
const NON_MEAL_DEPARTMENTS = new Set([
  "bevande",
  "infanzia",
  "snack",
  "vini-birre",
]);

/** Hard department exclusions per dietary need */
const EXCLUDED_DEPARTMENTS: Record<Exclude<DietaryNeed, "none">, string[]> = {
  veggie: ["carne", "pesce", "salumi"],
  vegan: ["carne", "pesce", "salumi", "latticini"],
  pescatarian: ["carne", "salumi"],
  "gluten-free": ["panetteria"],
  "dairy-free": [],
};

/** Hard allergen exclusions per dietary need */
const EXCLUDED_ALLERGENS: Record<Exclude<DietaryNeed, "none">, string[]> = {
  veggie: ["en:fish"],
  vegan: ["en:fish", "en:milk", "en:eggs"],
  pescatarian: [],
  "gluten-free": ["en:gluten"],
  "dairy-free": ["en:milk"],
};

/** Dairy-free keeps eggs: drop every latticini category except Eggs */
const DAIRY_FREE_KEPT_CATEGORIES = new Set(["Eggs"]);

/** Categories that almost always contain gluten (belt & braces on top of allergens) */
const GLUTEN_CATEGORIES = new Set(["Pasta", "Flours", "Couscous", "Bakery"]);

/** Nutritional thresholds per 100g, matched against catalog nutrition data */
const GOAL_THRESHOLDS: Record<
  Exclude<NutritionalGoal, "none">,
  (p: Product) => boolean
> = {
  "high-protein": (p) => (p.nutrition?.proteins100g ?? 0) >= 10,
  "low-sugar": (p) => (p.nutrition?.sugars100g ?? 0) <= 5,
  "low-fat": (p) => (p.nutrition?.fat100g ?? 0) <= 3,
  "low-carbs": (p) => (p.nutrition?.carbohydrates100g ?? 0) <= 10,
  "low-salt": (p) => (p.nutrition?.salt100g ?? 99) <= 0.3,
};

function hasAllergen(p: Product, allergen: string): boolean {
  return (p.allergens ?? []).some((a) => a.id === allergen);
}

/** Hard pass/fail for a single product given the selected dietary needs */
export function matchesDietaryNeeds(p: Product, needs: DietaryNeed[]): boolean {
  if (NON_MEAL_DEPARTMENTS.has(p.department.id)) return false;
  const categoryName = p.category?.name ?? "";
  for (const need of needs) {
    if (need === "none") continue;
    if (EXCLUDED_DEPARTMENTS[need].includes(p.department.id)) {
      // dairy-free keeps the Eggs category out of latticini
      if (!(need === "dairy-free" && DAIRY_FREE_KEPT_CATEGORIES.has(categoryName))) {
        return false;
      }
    }
    if (EXCLUDED_ALLERGENS[need].some((a) => hasAllergen(p, a))) return false;
    if (need === "gluten-free" && GLUTEN_CATEGORIES.has(categoryName)) {
      return false;
    }
  }
  return true;
}

/** Preference score (0..N) — how many nutritional goals the product satisfies */
export function goalScore(p: Product, goals: NutritionalGoal[]): number {
  let score = 0;
  for (const goal of goals) {
    if (goal !== "none" && GOAL_THRESHOLDS[goal](p)) score += 1;
  }
  return score;
}

/**
 * Candidate subset after dietary filtering — the full prompt basket is
 * built from this by `lib/llm/prompt.ts`.
 */
export function filterCatalog(needs: DietaryNeed[]): Product[] {
  return getCatalog().filter((p) => matchesDietaryNeeds(p, needs));
}

/**
 * Prompt basket: best-ranked products per department, keeping department
 * variety so the LLM can compose realistic recipes. Ranking: goal score
 * desc, then price asc (budget-friendly bias).
 */
export function buildPromptBasket(
  needs: DietaryNeed[],
  goals: NutritionalGoal[],
  perDepartment = 15,
): Product[] {
  const candidates = filterCatalog(needs);
  const byDepartment = new Map<string, Product[]>();
  for (const p of candidates) {
    const list = byDepartment.get(p.department.id) ?? [];
    list.push(p);
    byDepartment.set(p.department.id, list);
  }
  const basket: Product[] = [];
  for (const list of byDepartment.values()) {
    list.sort((a, b) => {
      const scoreDiff = goalScore(b, goals) - goalScore(a, goals);
      if (scoreDiff !== 0) return scoreDiff;
      return a.price.amount - b.price.amount;
    });
    basket.push(...list.slice(0, perDepartment));
  }
  return basket;
}
