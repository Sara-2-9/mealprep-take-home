import { z } from "zod";

/**
 * Zod schema for the LLM-generated weekly meal plan — the single source of
 * truth for the structured output. Passed to the AI SDK `Output.array()`
 * specification (`dayPlanSchema` as the element schema), which converts it to
 * the provider's native structured-output
 * format (OpenAI strict JSON schema) and validates the response at runtime.
 *
 * The model declares quantities in grams; the app recomputes prices
 * deterministically from catalog unit prices (`lib/llm/cost.ts`), so no
 * price field is part of the model output.
 *
 * v2: 3 meals per day (breakfast, lunch, dinner). Servings are always 2
 * and omitted from the output to save tokens.
 */

export const WEEK_DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const planIngredientSchema = z.object({
  productId: z.string().describe("Exact product id from the catalog basket"),
  amount: z
    .string()
    .describe('Human-readable amount for display, e.g. "400g", "2 cloves"'),
  grams: z
    .number()
    .min(1)
    .describe(
      "Grams of product actually used in the recipe (ml ≈ g for liquids). Drives exact cost computation.",
    ),
  // NOTE: no `name` field — output slimming. Names are resolved locally
  // from the catalog via productId (lib/llm/cost.ts), saving ~2 tokens per
  // ingredient per day on the critical output path.
});

export const planMealSchema = z.object({
  type: z.enum(MEAL_TYPES).describe("Meal type: breakfast, lunch, or dinner"),
  name: z.string(),
  prepTimeMinutes: z.number(),
  // servings omitted from output — always 2, computed server-side
  // Capped to keep the streamed output (and thus time-to-full-plan) small.
  ingredients: z.array(planIngredientSchema).min(2).max(10),
  steps: z.array(z.string()).min(3).max(8),
});

export const dayPlanSchema = z.object({
  day: z.enum(WEEK_DAY_NAMES),
  meals: z.array(planMealSchema).min(3).max(3).describe("Exactly 3 meals: breakfast, lunch, dinner"),
});

export const weeklyPlanSchema = z.object({
  days: z.array(dayPlanSchema).min(7).max(7),
});

/** Raw model output — no prices, they are computed in code. */
export type LLMPlanIngredient = z.infer<typeof planIngredientSchema>;
export type LLMPlanMeal = z.infer<typeof planMealSchema>;
export type LLMDayPlan = z.infer<typeof dayPlanSchema>;
export type LLMWeeklyPlan = z.infer<typeof weeklyPlanSchema>;
