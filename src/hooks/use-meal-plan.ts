import { useEffect, useRef, useState } from "react";
import {
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from "react-native";
import { useFlowStore } from "../state/flow-store";
import { generateMealPlan } from "../lib/llm/client";
import { pricePartialDay } from "../lib/llm/cost";
import type { DayPlan, WeeklyPlan } from "../lib/meal-plan";
import { MEAL_PLAN, WEEK_DAYS_FULL } from "../lib/theme";

export type MealPlanStatus = "loading" | "ready" | "error";

interface CacheEntry {
  key: string;
  plan: WeeklyPlan;
  totalCost: number;
}

/** Keeps the generated plan when navigating away and back within a session */
let cache: CacheEntry | null = null;

/** Progressive rendering: partial snapshots flush to state at ~4 fps max */
const PARTIAL_FLUSH_MS = 250;

/**
 * Business logic for screen 05 — weekly meal plan.
 * Orchestrates the LLM workflow (streaming generate → validate → retry) and
 * the day pager (selector ↔ horizontal scroll sync).
 *
 * While the plan streams in, `partialDays` exposes per-day DayPlans as soon
 * as each day's name has arrived (null = still pending → skeleton), so the
 * UI fills in day by day instead of waiting for the full response.
 *
 * Memoization is handled by the React Compiler (experiments.reactCompiler).
 * The generation effect is written so that correctness never depends on
 * callback identity: it runs only while status === "loading".
 */
export function useMealPlan() {
  const budget = useFlowStore((s) => s.budget);
  const dietaryNeeds = useFlowStore((s) => s.dietaryNeeds);
  const nutritionalGoals = useFlowStore((s) => s.nutritionalGoals);

  const requestKey = JSON.stringify({ budget, dietaryNeeds, nutritionalGoals });
  const cached = cache?.key === requestKey ? cache : null;

  const [status, setStatus] = useState<MealPlanStatus>(
    cached ? "ready" : "loading",
  );
  const [plan, setPlan] = useState<WeeklyPlan | null>(cached?.plan ?? null);
  const [totalCost, setTotalCost] = useState<number | null>(
    cached?.totalCost ?? null,
  );
  const [partialDays, setPartialDays] = useState<(DayPlan | null)[] | null>(
    null,
  );
  const [selectedDay, setSelectedDay] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const lastPartialFlush = useRef(0);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (status !== "loading") return;
    let cancelled = false;
    setPartialDays(null);
    generateMealPlan(
      { budget, dietaryNeeds, nutritionalGoals },
      {
        onPartial: (partial) => {
          // Throttle: the stream emits a snapshot per few tokens; re-rendering
          // 7 cards per snapshot would waste frames. Trailing chunks are
          // covered by the final setPlan below.
          const now = Date.now();
          if (cancelled || now - lastPartialFlush.current < PARTIAL_FLUSH_MS) {
            return;
          }
          lastPartialFlush.current = now;
          setPartialDays(
            WEEK_DAYS_FULL.map((_, i) => pricePartialDay(partial.days?.[i])),
          );
        },
      },
    )
      .then((result) => {
        if (cancelled) return;
        cache = {
          key: requestKey,
          plan: result.plan,
          totalCost: result.totalCost,
        };
        setPlan(result.plan);
        setTotalCost(result.totalCost);
        setPartialDays(null);
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("[useMealPlan] generation failed:", error);
        setPartialDays(null);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [status, requestKey, budget, dietaryNeeds, nutritionalGoals]);

  /** Day selector tap → scroll the pager */
  const selectDay = (index: number) => {
    setSelectedDay(index);
    pagerRef.current?.scrollTo({
      x: index * MEAL_PLAN.cardStride,
      animated: true,
    });
  };

  /** Pager swipe → update the day selector */
  const onMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / MEAL_PLAN.cardStride,
    );
    setSelectedDay(Math.max(0, Math.min(6, index)));
  };

  return {
    status,
    plan,
    /** Per-day progressive plans while streaming (null entry = pending) */
    partialDays,
    /** Estimated weekly cost once ready, otherwise the selected budget */
    displayedCost: totalCost ?? budget,
    selectedDay,
    selectDay,
    retry: () => setStatus("loading"),
    pagerRef,
    onMomentumScrollEnd,
    /** Horizontal padding that centers the 337pt card with the Figma peek */
    pagerPadding: Math.max(
      MEAL_PLAN.cardPeek,
      (width - MEAL_PLAN.cardWidth) / 2,
    ),
  };
}
