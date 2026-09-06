import {
  AISDKError,
  generateText,
  NoOutputGeneratedError,
  Output,
  type ModelMessage,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { weeklyCost, type WeeklyPlan } from "../meal-plan";
import { priceWeeklyPlan, round2 } from "./cost";
import { weeklyPlanSchema, type LLMWeeklyPlan } from "./schema";
import {
  buildMealPlanMessages,
  buildRetryMessage,
  type MealPlanRequest,
} from "./prompt";

/**
 * Meal-plan LLM workflow on the Vercel AI SDK (Phase 3, step 22).
 * `generateText` + `Output.object` gives schema-validated, typed output from
 * the Zod schema; the provider is swappable by changing one line (or the
 * EXPO_PUBLIC_MEALPLAN_MODEL env var). Domain validation (catalog ids, real
 * budget computed from catalog prices) stays custom, with one retry carrying
 * the rejection reason back to the model.
 */

const MODEL_ID = process.env.EXPO_PUBLIC_MEALPLAN_MODEL ?? "gpt-4o-mini";
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

/**
 * One LLM round-trip: messages in, schema-validated plan out.
 * Injectable so tests can drive the retry/validation loop without network.
 */
export type PlanGenerator = (
  messages: ModelMessage[],
) => Promise<LLMWeeklyPlan>;

function toMealPlanError(error: unknown): MealPlanError {
  if (error instanceof MealPlanError) return error;
  if (NoOutputGeneratedError.isInstance(error)) {
    return new MealPlanError(
      "The model returned an unusable plan",
      "invalid-plan",
    );
  }
  // React Native fetch failures surface as TypeError ("Network request failed")
  if (error instanceof TypeError) {
    return new MealPlanError("Network unreachable", "network");
  }
  if (AISDKError.isInstance(error)) {
    return new MealPlanError(error.message, "api");
  }
  return new MealPlanError("Unexpected LLM error", "api");
}

function createOpenAIGenerator(apiKey: string): PlanGenerator {
  const openai = createOpenAI({ apiKey });
  return async (messages) => {
    // AI SDK 7: system messages are not allowed in `messages` — they go in
    // the dedicated `system` option.
    const systemMessage = messages.find((m) => m.role === "system");
    const conversation = messages.filter((m) => m.role !== "system");
    try {
      const result = await generateText({
        model: openai(MODEL_ID),
        system:
          typeof systemMessage?.content === "string"
            ? systemMessage.content
            : undefined,
        messages: conversation,
        output: Output.object({
          schema: weeklyPlanSchema,
          name: "weekly_meal_plan",
          description:
            "7-day dinner plan built exclusively from the provided supermarket catalog",
        }),
        temperature: 0.7,
        maxRetries: 2,
      });
      return result.output;
    } catch (error) {
      throw toMealPlanError(error);
    }
  };
}

/** Returns a rejection reason, or null when the plan is valid */
export function validatePlan(plan: WeeklyPlan, budget: number): string | null {
  const days = new Set<string>();
  for (const day of plan.days) {
    if (days.has(day.day)) return `duplicate day "${day.day}"`;
    days.add(day.day);
  }
  const total = weeklyCost(plan);
  if (total > budget) {
    return `weekly cost €${total.toFixed(2)} exceeds the €${budget} budget`;
  }
  return null;
}

export interface MealPlanResult {
  plan: WeeklyPlan;
  /** Weekly cost in EUR, computed from catalog prices */
  totalCost: number;
}

export async function generateMealPlan(
  request: MealPlanRequest,
  generate?: PlanGenerator,
): Promise<MealPlanResult> {
  if (!generate) {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey || apiKey.startsWith("sk-your")) {
      throw new MealPlanError("Missing OpenAI API key (.env)", "missing-key");
    }
    generate = createOpenAIGenerator(apiKey);
  }

  const messages: ModelMessage[] = [...buildMealPlanMessages(request)];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const llmPlan = await generate(messages);
    const { plan, unknownProductIds } = priceWeeklyPlan(llmPlan);
    const rejection =
      unknownProductIds.length > 0
        ? `unknown productIds: ${unknownProductIds.join(", ")} — ` +
          "use only ids from the catalog basket"
        : validatePlan(plan, request.budget);
    if (!rejection) {
      return { plan, totalCost: round2(weeklyCost(plan)) };
    }
    if (attempt === MAX_ATTEMPTS) {
      throw new MealPlanError(`Invalid plan: ${rejection}`, "invalid-plan");
    }
    messages.push({ role: "assistant", content: JSON.stringify(llmPlan) });
    messages.push(buildRetryMessage(rejection));
  }
  // Unreachable — loop either returns or throws
  throw new MealPlanError("Unexpected workflow state", "invalid-plan");
}
