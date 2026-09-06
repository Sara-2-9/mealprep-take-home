import { afterEach, describe, expect, test } from "bun:test";
import type { ModelMessage } from "ai";
import {
  generateMealPlan,
  MealPlanError,
  validatePlan,
  type PlanGenerator,
  type PlanStreamer,
} from "./client";
import { weeklyCost, type DayPlan } from "../meal-plan";
import { makeValidPlan } from "./schema.test";
import type { LLMWeeklyPlan } from "./schema";

const REQUEST = {
  budget: 80,
  dietaryNeeds: [] as never[],
  nutritionalGoals: [] as never[],
};

/** Valid fixture: ~€4.97/week, well under an €80 budget. */
const VALID = makeValidPlan;

/** Same meals but 900 kg of pasta per day — blows any budget. */
function overBudgetPlan(): LLMWeeklyPlan {
  const plan = structuredClone(makeValidPlan());
  for (const day of plan.days) day.meal.ingredients[0].grams = 900_000;
  return plan;
}

function planWithUnknownId(): LLMWeeklyPlan {
  const plan = makeValidPlan();
  plan.days[0].meal.ingredients[0].productId = "0000000000000";
  return plan;
}

describe("generateMealPlan", () => {
  test("returns the plan with a deterministic catalog-based cost", async () => {
    const calls: ModelMessage[][] = [];
    const generate: PlanGenerator = async (messages) => {
      calls.push(messages);
      return VALID().days;
    };
    const result = await generateMealPlan(REQUEST, { generate });
    expect(calls).toHaveLength(1);
    expect(result.plan.days).toHaveLength(7);
    // penne 160g×1.78 + eggs 110g×3.59 = 0.6797 €/meal → ×7 days
    expect(result.totalCost).toBeCloseTo(round7(), 2);
    expect(result.plan.days[0].meal.pricePerServing).toBeGreaterThan(0);
  });

  test("retries once with feedback when the plan exceeds the budget", async () => {
    const seen: ModelMessage[][] = [];
    let attempt = 0;
    const generate: PlanGenerator = async (messages) => {
      seen.push(messages);
      return ++attempt === 1 ? overBudgetPlan().days : VALID().days;
    };
    const result = await generateMealPlan(REQUEST, { generate });
    expect(seen).toHaveLength(2);
    // Second call receives: system, user, assistant(rejected plan), user(feedback)
    expect(seen[1]).toHaveLength(4);
    expect(seen[1][2].role).toBe("assistant");
    expect(seen[1][3].role).toBe("user");
    expect(seen[1][3].content as string).toContain("exceeds the €80 budget");
    expect(result.totalCost).toBeCloseTo(round7(), 2);
  });

  test("rejects plans with hallucinated productIds, then throws", async () => {
    const seen: ModelMessage[][] = [];
    const generate: PlanGenerator = async (messages) => {
      seen.push(messages);
      return planWithUnknownId().days;
    };
    const error = await generateMealPlan(REQUEST, { generate }).catch((e) => e);
    expect(seen).toHaveLength(2); // one retry, then give up
    expect(error).toBeInstanceOf(MealPlanError);
    expect(error.code).toBe("invalid-plan");
    expect(error.message).toContain("unknown productIds");
    expect(error.message).toContain("0000000000000");
  });

  test("rejects plans that don't contain exactly 7 days", async () => {
    const generate: PlanGenerator = async () => VALID().days.slice(0, 6);
    const error = await generateMealPlan(REQUEST, { generate }).catch((e) => e);
    expect(error).toBeInstanceOf(MealPlanError);
    expect(error.code).toBe("invalid-plan");
    expect(error.message).toContain("exactly 7");
  });

  test("throws MealPlanError(missing-key) without an API key", async () => {
    const saved = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    delete process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    const error = await generateMealPlan(REQUEST).catch((e) => e);
    process.env.EXPO_PUBLIC_OPENAI_API_KEY = saved;
    expect(error).toBeInstanceOf(MealPlanError);
    expect(error.code).toBe("missing-key");
  });

  test("propagates generator failures", async () => {
    const generate: PlanGenerator = async () => {
      throw new MealPlanError("Network unreachable", "network");
    };
    const error = await generateMealPlan(REQUEST, { generate }).catch((e) => e);
    expect(error.code).toBe("network");
  });
});

describe("generateMealPlan (streaming, per-day elements)", () => {
  /**
   * Fake streamer mirroring Output.array's elementStream: each yielded item
   * is a COMPLETE, schema-valid day; output resolves the full array.
   */
  function fakeStreamer(): { stream: PlanStreamer; calls: ModelMessage[][] } {
    const calls: ModelMessage[][] = [];
    return {
      calls,
      stream: (messages) => {
        calls.push(messages);
        return {
          days: (async function* () {
            for (const day of VALID().days) yield day;
          })(),
          output: Promise.resolve(VALID().days),
        };
      },
    };
  }

  test("emits each complete day via onDay, then returns the full plan", async () => {
    const { stream, calls } = fakeStreamer();
    const received: { day: DayPlan; index: number }[] = [];
    const result = await generateMealPlan(REQUEST, {
      stream,
      onDay: (day, index) => received.push({ day, index }),
    });
    expect(calls).toHaveLength(1);
    expect(received).toHaveLength(7);
    expect(received.map((r) => r.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    // Each streamed day is complete and priced — renderable as a full card
    expect(received[0].day.meal.pricePerServing).toBeGreaterThan(0);
    expect(received[0].day.meal.ingredients[0].name.length).toBeGreaterThan(0);
    expect(result.plan.days).toHaveLength(7);
    expect(result.totalCost).toBeCloseTo(round7(), 2);
  });

  test("works without an onDay callback", async () => {
    const { stream } = fakeStreamer();
    const result = await generateMealPlan(REQUEST, { stream });
    expect(result.plan.days).toHaveLength(7);
  });

  test("maps streamer failures to MealPlanError", async () => {
    const stream: PlanStreamer = () => ({
      days: (async function* () {
        yield VALID().days[0]; // one complete day before the failure
      })(),
      output: Promise.reject(new MealPlanError("Network unreachable", "network")),
    });
    const error = await generateMealPlan(REQUEST, {
      stream,
      onDay: () => {},
    }).catch((e) => e);
    expect(error).toBeInstanceOf(MealPlanError);
    expect(error.code).toBe("network");
  });
});

describe("validatePlan", () => {
  test("accepts a priced plan under budget", () => {
    const generate: PlanGenerator = async () => VALID().days;
    return generateMealPlan(REQUEST, { generate }).then(({ plan }) => {
      expect(validatePlan(plan, 80)).toBeNull();
    });
  });

  test("rejects duplicate days", () => {
    return generateMealPlan(REQUEST, {
      generate: async () => {
        const days = VALID().days;
        days[1].day = "Monday";
        return days;
      },
    }).then(
      () => {
        throw new Error("should have retried");
      },
      (e: MealPlanError) => {
        expect(e.message).toContain('duplicate day "Monday"');
      },
    );
  });

  test("weeklyCost uses computed prices, not model claims", async () => {
    const { plan, totalCost } = await generateMealPlan(REQUEST, {
      generate: async () => VALID().days,
    });
    expect(totalCost).toBeCloseTo(weeklyCost(plan), 5);
  });
});

function round7(): number {
  const perMeal = (160 / 1000) * 1.78 + (110 / 1000) * 3.59;
  const perServing = Math.round((perMeal / 2) * 100) / 100;
  return Math.round(perServing * 2 * 7 * 100) / 100;
}

afterEach(() => {
  // no-op: placeholder for future global cleanup
});
