import {
  AISDKError,
  generateText,
  NoOutputGeneratedError,
  Output,
  streamText,
  type DeepPartial,
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
 * Meal-plan LLM workflow on the Vercel AI SDK (Phase 3, step 22; streaming
 * added in the latency pass).
 *
 * Default path: `streamText` + `Output.object` — partial plan snapshots are
 * forwarded via `onPartial` so screen 05 can render days progressively while
 * the model is still generating (perceived-latency win; the full wait is
 * dominated by output-token generation). On Hermes, streaming requires
 * `expo/fetch` (RN's default fetch buffers the whole response).
 *
 * The provider is swappable by changing one line (or the
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

/** Progressive plan shape while streaming (every field may be missing). */
export type PartialWeeklyPlan = DeepPartial<LLMWeeklyPlan>;

export interface PlanStream {
  /** Deep-partial plan snapshots as tokens arrive. */
  partials: AsyncIterable<PartialWeeklyPlan>;
  /** Resolves with the complete, schema-validated plan. */
  output: Promise<LLMWeeklyPlan>;
}

/**
 * Streaming counterpart of PlanGenerator — injectable so tests can drive the
 * streaming path without network.
 */
export type PlanStreamer = (messages: ModelMessage[]) => PlanStream;

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

function outputSpec() {
  return Output.object({
    schema: weeklyPlanSchema,
    name: "weekly_meal_plan",
    description:
      "7-day dinner plan built exclusively from the provided supermarket catalog",
  });
}

/** AI SDK 7: system messages go in the dedicated option, not in `messages`. */
function splitSystem(messages: ModelMessage[]) {
  const systemMessage = messages.find((m) => m.role === "system");
  return {
    system:
      typeof systemMessage?.content === "string"
        ? systemMessage.content
        : undefined,
    conversation: messages.filter((m) => m.role !== "system"),
  };
}

function createOpenAIGenerator(apiKey: string): PlanGenerator {
  const openai = createOpenAI({ apiKey });
  return async (messages) => {
    const { system, conversation } = splitSystem(messages);
    try {
      const result = await generateText({
        model: openai(MODEL_ID),
        system,
        messages: conversation,
        output: outputSpec(),
        temperature: 0.7,
        maxRetries: 2,
      });
      return result.output;
    } catch (error) {
      throw toMealPlanError(error);
    }
  };
}

const isReactNative =
  typeof navigator !== "undefined" &&
  (navigator as { product?: string }).product === "ReactNative";

function createOpenAIStreamer(apiKey: string): PlanStreamer {
  // expo/fetch is streaming-capable on Hermes; outside RN (bun tests/scripts)
  // the global fetch streams natively.
  const fetchImpl = isReactNative
    ? // Conditional require: expo/fetch only exists in the RN runtime
      (require("expo/fetch").fetch as unknown as typeof globalThis.fetch)
    : undefined;
  const openai = createOpenAI(
    fetchImpl ? { apiKey, fetch: fetchImpl } : { apiKey },
  );
  return (messages) => {
    const { system, conversation } = splitSystem(messages);
    const result = streamText({
      model: openai(MODEL_ID),
      system,
      messages: conversation,
      output: outputSpec(),
      temperature: 0.7,
      maxRetries: 2,
    });
    return {
      partials: result.partialOutputStream,
      output: Promise.resolve(result.output).catch((error: unknown) => {
        throw toMealPlanError(error);
      }),
    };
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

export interface GenerateMealPlanOptions {
  /** One-shot (non-streaming) generator — tests inject this. */
  generate?: PlanGenerator;
  /** Streaming generator — tests inject this; defaults to OpenAI + expo/fetch. */
  stream?: PlanStreamer;
  /** Called with deep-partial plan snapshots as tokens stream in. */
  onPartial?: (partial: PartialWeeklyPlan) => void;
}

export async function generateMealPlan(
  request: MealPlanRequest,
  options: GenerateMealPlanOptions = {},
): Promise<MealPlanResult> {
  const { generate, onPartial } = options;
  let stream = options.stream;
  if (!generate && !stream) {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey || apiKey.startsWith("sk-your")) {
      throw new MealPlanError("Missing OpenAI API key (.env)", "missing-key");
    }
    stream = createOpenAIStreamer(apiKey);
  }

  const messages: ModelMessage[] = [...buildMealPlanMessages(request)];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let llmPlan: LLMWeeklyPlan;
    try {
      if (generate) {
        llmPlan = await generate(messages);
      } else {
        const { partials, output } = stream!(messages);
        if (onPartial) {
          for await (const partial of partials) {
            onPartial(partial);
          }
        }
        llmPlan = await output;
      }
    } catch (error) {
      throw toMealPlanError(error);
    }

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
