import { buildPromptBasket } from "../filters";
import type { Product } from "../types";
import type { DietaryNeed, NutritionalGoal } from "../../state/flowStore";
import type { ChatMessage } from "./schema";

/**
 * Prompt construction for the meal-plan LLM workflow.
 * The basket keeps the ingredient list compact (department variety,
 * budget-friendly, goal-ranked) so the whole catalog never hits the prompt.
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

function formatBasketLine(p: Product): string {
  const qty = p.quantity ? ` ${p.quantity}` : "";
  return `${p.id} | ${p.name}${qty} | €${p.price.amount.toFixed(2)}`;
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
}: MealPlanRequest): ChatMessage[] {
  const basket = buildPromptBasket(dietaryNeeds, nutritionalGoals);
  const lines = basket.map(formatBasketLine).join("\n");

  const system = [
    "You are the meal-planning engine of MealPrep, an app that builds weekly",
    "dinner plans from a real supermarket catalog (Esselunga, Italy).",
    "You reply ONLY with JSON matching the provided schema.",
    "",
    "Rules:",
    "- Exactly 7 days (Monday…Sunday), one dinner recipe per day.",
    "- Recipes must be simple home cooking, 15–45 minutes, 2 servings.",
    "- Ingredients MUST come from the provided catalog list: reference each",
    "  with its exact productId and product name, plus a realistic amount.",
    "- Steps are plain instructions WITHOUT leading numbers (numbering is UI).",
    "- pricePerServing = estimated ingredient cost of one serving in EUR,",
    "  computed from the catalog prices and the amounts actually used.",
    `- HARD CONSTRAINT: the weekly total (Σ pricePerServing × servings) must`,
    `  be ≤ €${budget}. Prefer cheaper products when in doubt.`,
    "- Vary cuisines and departments across the week; avoid repeating mains.",
  ].join("\n");

  const user = [
    `Weekly budget: €${budget}.`,
    `Dietary needs: ${describe(dietaryNeeds, NEED_LABELS)}.`,
    `Nutritional goals: ${describe(nutritionalGoals, GOAL_LABELS)}.`,
    "",
    "Catalog basket (id | product | pack price):",
    lines,
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/** Feedback message appended on retry when validation fails */
export function buildRetryMessage(reason: string): ChatMessage {
  return {
    role: "user",
    content: `The previous plan was rejected: ${reason}. Regenerate the full 7-day plan fixing this.`,
  };
}
