import { getProductById } from "../catalog";
import { weeklyCost, type WeeklyPlan } from "../mealPlan";
import {
  WEEKLY_PLAN_SCHEMA,
  parseWeeklyPlan,
  type ChatCompletionResponse,
  type ChatMessage,
} from "./schema";
import { buildMealPlanMessages, buildRetryMessage, type MealPlanRequest } from "./prompt";

/**
 * OpenAI client for the meal-plan workflow (Phase 3, step 22).
 * Chat Completions + strict JSON schema, programmatic validation of the
 * result (catalog ids + budget) and one retry with feedback on violations.
 */

const ENDPOINT = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";
const MAX_ATTEMPTS = 2;

export class MealPlanError extends Error {
  constructor(
    message: string,
    readonly code: "missing-key" | "network" | "api" | "invalid-plan",
  ) {
    super(message);
    this.name = "MealPlanError";
  }
}

async function callOpenAI(
  apiKey: string,
  messages: ChatMessage[],
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        response_format: { type: "json_schema", json_schema: WEEKLY_PLAN_SCHEMA },
        temperature: 0.7,
      }),
    });
  } catch {
    throw new MealPlanError("Network unreachable", "network");
  }

  const body = (await response.json()) as ChatCompletionResponse;
  if (!response.ok) {
    throw new MealPlanError(
      body.error?.message ?? `OpenAI error ${response.status}`,
      "api",
    );
  }
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new MealPlanError("Empty model response", "api");
  return content;
}

/** Returns a rejection reason, or null when the plan is valid */
export function validatePlan(plan: WeeklyPlan, budget: number): string | null {
  const days = new Set<string>();
  for (const day of plan.days) {
    if (days.has(day.day)) return `duplicate day "${day.day}"`;
    days.add(day.day);
    for (const ingredient of day.meal.ingredients) {
      if (!getProductById(ingredient.productId)) {
        return `unknown productId ${ingredient.productId} ("${ingredient.name}")`;
      }
    }
  }
  const total = weeklyCost(plan);
  if (total > budget) {
    return `weekly cost €${total.toFixed(2)} exceeds the €${budget} budget`;
  }
  return null;
}

export interface MealPlanResult {
  plan: WeeklyPlan;
  /** Weekly estimated cost, EUR */
  totalCost: number;
}

export async function generateMealPlan(
  request: MealPlanRequest,
): Promise<MealPlanResult> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-your")) {
    throw new MealPlanError("Missing OpenAI API key (.env)", "missing-key");
  }

  const messages = buildMealPlanMessages(request);
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const content = await callOpenAI(apiKey, messages);
    let plan: WeeklyPlan;
    try {
      plan = parseWeeklyPlan(content);
    } catch {
      throw new MealPlanError("Unparseable model response", "invalid-plan");
    }
    const rejection = validatePlan(plan, request.budget);
    if (!rejection) {
      return { plan, totalCost: weeklyCost(plan) };
    }
    if (attempt === MAX_ATTEMPTS) {
      throw new MealPlanError(`Invalid plan: ${rejection}`, "invalid-plan");
    }
    messages.push({ role: "assistant", content });
    messages.push(buildRetryMessage(rejection));
  }
  // Unreachable — loop either returns or throws
  throw new MealPlanError("Unexpected workflow state", "invalid-plan");
}
