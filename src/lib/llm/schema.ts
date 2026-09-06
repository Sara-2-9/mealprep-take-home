import { z } from "zod";

/**
 * Zod schema for the LLM-generated weekly meal plan — the single source of
 * truth for the structured output. Passed to the AI SDK `Output.object()`
 * specification, which converts it to the provider's native structured-output
 * format (OpenAI strict JSON schema) and validates the response at runtime.
 *
 * The model declares quantities in grams; the app recomputes prices
 * deterministically from catalog unit prices (`lib/llm/cost.ts`), so no
 * price field is part of the model output.
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

export const planIngredientSchema = z.object({
  productId: z.string().describe("Exact product id from the catalog basket"),
  name: z.string().describe("Exact product name from the catalog basket"),
  amount: z
    .string()
    .describe('Human-readable amount for display, e.g. "400g", "2 cloves"'),
  grams: z
    .number()
    .min(1)
    .describe(
      "Grams of product actually used in the recipe (ml ≈ g for liquids). Drives exact cost computation.",
    ),
});

export const planMealSchema = z.object({
  name: z.string(),
  prepTimeMinutes: z.number(),
  servings: z.number(),
  ingredients: z.array(planIngredientSchema).min(2),
  steps: z.array(z.string()).min(3),
});

export const dayPlanSchema = z.object({
  day: z.enum(WEEK_DAY_NAMES),
  meal: planMealSchema,
});

export const weeklyPlanSchema = z.object({
  days: z.array(dayPlanSchema).min(7).max(7),
});

/** Raw model output — no prices, they are computed in code. */
export type LLMPlanIngredient = z.infer<typeof planIngredientSchema>;
export type LLMPlanMeal = z.infer<typeof planMealSchema>;
export type LLMDayPlan = z.infer<typeof dayPlanSchema>;
export type LLMWeeklyPlan = z.infer<typeof weeklyPlanSchema>;
