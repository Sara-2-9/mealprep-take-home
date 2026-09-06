import type { WeeklyPlan } from "../mealPlan";

/**
 * Structured-output JSON schema for the weekly meal plan.
 * Used with OpenAI `response_format: { type: "json_schema" }` (strict mode),
 * so every field is required and `additionalProperties` is false.
 */
export const WEEKLY_PLAN_SCHEMA = {
  name: "weekly_meal_plan",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["days"],
    properties: {
      days: {
        type: "array",
        minItems: 7,
        maxItems: 7,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["day", "meal"],
          properties: {
            day: {
              type: "string",
              enum: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ],
            },
            meal: {
              type: "object",
              additionalProperties: false,
              required: [
                "name",
                "prepTimeMinutes",
                "servings",
                "pricePerServing",
                "ingredients",
                "steps",
              ],
              properties: {
                name: { type: "string" },
                prepTimeMinutes: { type: "number" },
                servings: { type: "number" },
                pricePerServing: { type: "number" },
                ingredients: {
                  type: "array",
                  minItems: 2,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["productId", "name", "amount"],
                    properties: {
                      productId: { type: "string" },
                      name: { type: "string" },
                      amount: { type: "string" },
                    },
                  },
                },
                steps: {
                  type: "array",
                  minItems: 3,
                  items: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

/** Parses the model's JSON content into a WeeklyPlan (throws on bad JSON) */
export function parseWeeklyPlan(content: string): WeeklyPlan {
  const parsed = JSON.parse(content) as WeeklyPlan;
  if (!Array.isArray(parsed.days) || parsed.days.length !== 7) {
    throw new Error("Plan must contain exactly 7 days");
  }
  return parsed;
}
