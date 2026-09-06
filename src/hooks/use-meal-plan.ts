import { useEffect, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";
import Animated, {
  runOnJS,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
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

/** Progressive rendering: partial snapshots flush to state at ~20 fps max */
const PARTIAL_FLUSH_MS = 50;

/**
 * Business logic for screen 05 — weekly meal plan.
 * Orchestrates the LLM workflow (streaming generate → validate → retry) and
 * the day pager (selector ↔ horizontal scroll sync).
 *
 * While the plan streams in, `partialDays` exposes per-day DayPlans as soon
 * as each day's name has arrived (null = still pending → skeleton), so the
 * UI fills in day by day instead of waiting for the full response.
 *
 * Pager sync runs on the UI thread: `scrollHandler` derives the active day
 * index inside a Reanimated worklet during the swipe itself (not at
 * momentum end) and only hops to JS when the index actually changes;
 * selector taps scroll via Reanimated's `scrollTo` on the same thread.
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
  const pagerRef = useAnimatedRef<Animated.ScrollView>();
  const lastScrolledIndex = useSharedValue(0);
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
          // Throttle: the smoothed stream emits small snapshots at a steady
          // cadence; re-rendering 7 cards per snapshot would waste frames.
          // Trailing chunks are covered by the final setPlan below.
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

  /**
   * Pager swipe → day selector, in real time. Runs as a UI-thread worklet;
   * crosses to JS only when the rounded index changes (≤7 distinct values).
   */
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const index = Math.max(
        0,
        Math.min(
          6,
          Math.round(event.contentOffset.x / MEAL_PLAN.cardStride),
        ),
      );
      if (index !== lastScrolledIndex.value) {
        lastScrolledIndex.value = index;
        runOnJS(setSelectedDay)(index);
      }
    },
  });

  /** Day selector tap → scroll the pager (UI-thread scrollTo) */
  const selectDay = (index: number) => {
    setSelectedDay(index);
    lastScrolledIndex.value = index;
    scrollTo(pagerRef, index * MEAL_PLAN.cardStride, 0, true);
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
    scrollHandler,
    /** Horizontal padding that centers the 337pt card with the Figma peek */
    pagerPadding: Math.max(
      MEAL_PLAN.cardPeek,
      (width - MEAL_PLAN.cardWidth) / 2,
    ),
  };
}
