import type { ModelMessage } from "ai";
import { buildPromptBasket } from "../filters";
import type { Product } from "../types";
import type { DietaryNeed, NutritionalGoal } from "../../state/flow-store";

/**
 * Prompt construction for the meal-plan LLM workflow (v2: 3 meals/day).
 * The basket keeps the ingredient list compact (department variety,
 * budget-friendly, goal-ranked) so the whole catalog never hits the prompt.
 * Basket lines carry macros, Nutri-Score and allergens so the model can
 * actually reason about the nutritional goals when composing recipes.
 */

const NEED_LABELS: Record<DietaryNeed, string> = {
  none: "no dietary restrictions",
  veggie: "vegetarian (no meat, no fish)",
  vegan: "vegan (no animal products)",
  pescatarian: "pescatarian (fish allowed, no meat)",
  "gluten-free": "gluten-free",
  "dairy-free": "dairy-free (lactose intolerant)",
};

const GOAL_LABELS: Record<NutritionalGoal, string> = {
  none: "no specific nutritional goal",
  "high-protein": "high protein",
  "low-sugar": "low sugar",
  "low-fat": "low fat",
  "low-carbs": "low carbohydrates",
  "low-salt": "low salt",
};

function describe(selection: string[], labels: Record<string, string>): string {
  const active = selection.filter((v) => v !== "none");
  if (selection.includes("none") || active.length === 0) return "none";
  return active.map((v) => labels[v] ?? v).join(", ");
}

/**
 * Compact one-line product card:
 * `id | name qty | €pack | €/kg | P/C/F g per 100g | nutri-score | allergens`
 */
function formatBasketLine(p: Product): string {
  const qty = p.quantity ? ` ${p.quantity}` : "";
  const unit = p.unitPrice
    ? ` | €${p.unitPrice.amount.toFixed(2)}/${p.unitPrice.unit}`
    : "";
  const n = p.nutrition;
  const macros = n
    ? ` | P${n.proteins100g ?? 0}/C${n.carbohydrates100g ?? 0}/F${n.fat100g ?? 0}g per 100g`
    : "";
  const ns = p.nutriScore ? ` | nutri-score ${p.nutriScore}` : "";
  const allergens = p.allergens?.length
    ? ` | allergens: ${p.allergens.map((a) => a.name).join(", ")}`
    : "";
  return `${p.id} | ${p.name}${qty} | €${p.price.amount.toFixed(2)}${unit}${macros}${ns}${allergens}`;
}

export interface MealPlanRequest {
  budget: number;
  dietaryNeeds: DietaryNeed[];
  nutritionalGoals: NutritionalGoal[];
}

export function buildMealPlanMessages({
  budget,
  dietaryNeeds,
  nutritionalGoals,
}: MealPlanRequest): ModelMessage[] {
  const basket = buildPromptBasket(dietaryNeeds, nutritionalGoals);
  const lines = basket.map(formatBasketLine).join("\n");

  const system = [
    "You are the meal-planning engine of MealPrep, an app that builds weekly",
    "meal plans from a real supermarket catalog (Esselunga, Italy).",
    "You reply ONLY with a JSON array of day objects matching the provided",
    "schema — no wrapper object, no prose.",
    "",
    "Rules:",
    "- Exactly 7 days (Monday…Sunday), THREE meals per day:",
    "  - breakfast: quick recipes, 5–15 minutes, simple and fast.",
    "  - lunch: medium recipes, 15–30 minutes, satisfying midday meals.",
    "  - dinner: main recipes, 15–45 minutes, more elaborate evening meals.",
    "- All meals are for 2 servings.",
    "- Ingredients MUST come from the provided catalog list: reference each",
    "  with its exact productId only — names are resolved locally by the app.",
    '- For each ingredient set `amount` (human-readable, e.g. "400g") and',
    "  `grams` = grams of product actually used (ml ≈ g for liquids).",
    "  Base `grams` on the pack sizes: you cannot use 50g of a 1kg pack.",
    "- Keep recipes compact: 2–10 ingredients and 3–8 steps per meal.",
    "- Pantry economics: each DISTINCT product costs its FULL pack price",
    "  (€pack) exactly once — reusing it in other meals is free. If recipes",
    "  need more than one pack holds, a whole extra pack is charged.",
    "- Costs are computed programmatically from catalog pack prices —",
    "  NEVER estimate or output prices yourself.",
    `- HARD CONSTRAINT: the weekly total = Σ pack prices of distinct`,
    `  products must be ≤ €${budget}. Few versatile products beat many`,
    "  different ones: reuse opened packs across meals (pasta → lasagna).",
    "- Never use more grams of a product across the whole week than its",
    "  pack contains, unless another whole pack still fits the budget.",
    "- Variety with headroom: if the pantry total is well under budget,",
    "  spend the margin opening another versatile product instead of",
    "  reusing the same one a third time.",
    "- Prefer packs that appear in at least 2 meals — opening a pack",
    "  for a single meal is allowed, leftovers carry over to next week.",
    "- When nutritional goals are set, prefer products whose macros (P/C/F",
    "  per 100g) and Nutri-Score support them.",
    "- NEVER use a product whose allergens conflict with the dietary needs.",
    "- Steps are plain instructions WITHOUT leading numbers (numbering is UI).",
    "- Vary cuisines and departments across the week; avoid repeating mains.",
    "- Vary meals across the day: breakfast should be lighter, lunch medium,",
    "  dinner the most substantial.",
  ].join("\n");

  const user = [
    `Weekly budget: €${budget}.`,
    `Dietary needs: ${describe(dietaryNeeds, NEED_LABELS)}.`,
    `Nutritional goals: ${describe(nutritionalGoals, GOAL_LABELS)}.`,
    "",
    "Catalog basket (id | product pack | €pack | €/kg | macros | nutri-score | allergens):",
    lines,
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/** Feedback message appended on retry when validation fails */
export function buildRetryMessage(reason: string): ModelMessage {
  return {
    role: "user",
    content: `The previous plan was rejected: ${reason}. Regenerate the full 7-day plan fixing this.`,
  };
}
