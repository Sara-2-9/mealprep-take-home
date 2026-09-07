import {
  AISDKError,
  generateText,
  NoOutputGeneratedError,
  Output,
  streamText,
  type ModelMessage,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  pantryCost,
  priceDay,
  priceWeeklyPlan,
  shoppingList,
  type PantryItem,
} from "./cost";
import type { DayPlan, WeeklyPlan } from "../meal-plan";
import {
  dayPlanSchema,
  weeklyPlanSchema,
  type LLMDayPlan,
  type LLMWeeklyPlan,
} from "./schema";
import {
  buildMealPlanMessages,
  buildRetryMessage,
  type MealPlanRequest,
} from "./prompt";

/**
 * Meal-plan LLM workflow on the Vercel AI SDK (Phase 3, step 22; streaming
 * added in the latency pass, switched to per-day elements after).
 *
 * Default path: `streamText` + `Output.array` — the model generates a bare
 * JSON array of 7 day objects and `elementStream` emits each day ONLY when
 * it is complete and schema-validated. Screen 05 renders a full card per
 * element (skeletons for the days still pending), so the UI fills in one
 * day at a time instead of flickering with token-level partial objects.
 * On Hermes, streaming requires `expo/fetch` (RN's default fetch buffers
 * the whole response).
 *
 * The provider is swappable by changing one line (or the
 * EXPO_PUBLIC_MEALPLAN_MODEL env var). Domain validation (catalog ids, real
 * budget computed from catalog prices) stays custom, with one retry carrying
 * the rejection reason back to the model.
 */

const MODEL_ID = process.env.EXPO_PUBLIC_MEALPLAN_MODEL ?? "gpt-4o-mini";
// 3 attempts: pack-based planning is a harder task, the extra retry is cheap
// next to a full 21-meal generation.
const MAX_ATTEMPTS = 3;

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
 * One LLM round-trip: messages in, schema-validated days out (Monday…Sunday
 * order, as a bare array). Injectable so tests can drive the
 * retry/validation loop without network.
 */
export type PlanGenerator = (
  messages: ModelMessage[],
) => Promise<LLMDayPlan[]>;

export interface PlanStream {
  /** Complete, schema-validated day elements, emitted as each day finishes. */
  days: AsyncIterable<LLMDayPlan>;
  /** Resolves with the complete, schema-validated day array. */
  output: Promise<LLMDayPlan[]>;
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
  return Output.array({
    element: dayPlanSchema,
    minItems: 7,
    maxItems: 7,
    name: "weekly_meal_plan",
    description:
      "7-day meal plan (Monday…Sunday) with breakfast, lunch, and dinner — built exclusively from the provided supermarket catalog",
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
      // elementStream: each item is a COMPLETE day, already validated
      // against dayPlanSchema — no token-level partials to smooth.
      days: result.elementStream,
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
  // Budget is pantry-based: whole packs the user must actually buy.
  const list = shoppingList(plan);
  const total = pantryCost(plan);
  if (total > budget) {
    return (
      `pantry cost €${total.toFixed(2)} (${list.length} packs) exceeds ` +
      `the €${budget} budget — use fewer distinct products and reuse ` +
      `opened packs across meals`
    );
  }
  // NOTE: single-use packs are soft-only (prompt guidance). Leftovers carry
  // over to next week's pantry, so a product used once is not a rejection
  // reason as long as the pantry total fits the budget. singleUseProducts()
  // stays exported for the future leftovers feature.
  return null;
}

export interface MealPlanResult {
  plan: WeeklyPlan;
  /** Weekly total in EUR = Σ whole-pack prices of distinct products */
  totalCost: number;
  /** Shopping list backing the total, in first-use order */
  shoppingList: PantryItem[];
}

export interface GenerateMealPlanOptions {
  /** One-shot (non-streaming) generator — tests inject this. */
  generate?: PlanGenerator;
  /** Streaming generator — tests inject this; defaults to OpenAI + expo/fetch. */
  stream?: PlanStreamer;
  /** Called as each day finishes streaming: priced DayPlan + index (0–6). */
  onDay?: (day: DayPlan, index: number) => void;
}

export async function generateMealPlan(
  request: MealPlanRequest,
  options: GenerateMealPlanOptions = {},
): Promise<MealPlanResult> {
  const { generate, onDay } = options;
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
    let llmDays: LLMDayPlan[];
    try {
      if (generate) {
        llmDays = await generate(messages);
      } else {
        const { days, output } = stream!(messages);
        // Forward each COMPLETE day as it finishes (priced, so the card is
        // fully renderable on arrival). On retry the elements re-emit and
        // simply overwrite the same indices.
        let index = 0;
        for await (const element of days) {
          if (onDay) onDay(priceDay(element).day, index);
          index++;
        }
        llmDays = await output;
      }
    } catch (error) {
      throw toMealPlanError(error);
    }

    // Defense in depth: the SDK enforces min/max 7 items on the wire, but
    // injected generators are held to the same contract explicitly.
    const parsed = weeklyPlanSchema.safeParse({ days: llmDays });
    const priced = parsed.success ? priceWeeklyPlan(parsed.data) : null;
    const rejection = !priced
      ? "plan must contain exactly 7 valid days (Monday…Sunday)"
      : priced.unknownProductIds.length > 0
        ? `unknown productIds: ${priced.unknownProductIds.join(", ")} — ` +
          "use only ids from the catalog basket"
        : validatePlan(priced.plan, request.budget);
    if (!rejection && priced) {
      return {
        plan: priced.plan,
        totalCost: pantryCost(priced.plan),
        shoppingList: shoppingList(priced.plan),
      };
    }
    if (attempt === MAX_ATTEMPTS) {
      throw new MealPlanError(`Invalid plan: ${rejection}`, "invalid-plan");
    }
    messages.push({ role: "assistant", content: JSON.stringify(llmDays) });
    messages.push(buildRetryMessage(rejection!));
  }
  // Unreachable — loop either returns or throws
  throw new MealPlanError("Unexpected workflow state", "invalid-plan");
}
