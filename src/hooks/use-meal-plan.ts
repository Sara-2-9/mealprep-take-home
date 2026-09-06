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
import type { DayPlan, WeeklyPlan } from "../lib/meal-plan";
import { MEAL_PLAN } from "../lib/theme";

export type MealPlanStatus = "loading" | "ready" | "error";

interface CacheEntry {
  key: string;
  plan: WeeklyPlan;
  totalCost: number;
}

/** Keeps the generated plan when navigating away and back within a session */
let cache: CacheEntry | null = null;

/**
 * Business logic for screen 05 — weekly meal plan.
 * Orchestrates the LLM workflow (streaming generate → validate → retry) and
 * the day pager (selector ↔ horizontal scroll sync).
 *
 * While the plan streams in, `streamedDays` exposes each day as a COMPLETE,
 * fully priced DayPlan the moment its element finishes (null = still
 * pending → skeleton), so the UI fills in one card at a time.
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
  const [streamedDays, setStreamedDays] = useState<(DayPlan | null)[] | null>(
    null,
  );
  const [selectedDay, setSelectedDay] = useState(0);
  const pagerRef = useAnimatedRef<Animated.ScrollView>();
  const lastScrolledIndex = useSharedValue(0);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (status !== "loading") return;
    let cancelled = false;
    setStreamedDays(null);
    generateMealPlan(
      { budget, dietaryNeeds, nutritionalGoals },
      {
        onDay: (day, index) => {
          // Each element is a complete, priced day: drop it into its slot.
          if (cancelled) return;
          setStreamedDays((prev) => {
            const base = prev ?? Array<DayPlan | null>(7).fill(null);
            const next = [...base];
            next[index] = day;
            return next;
          });
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
        setStreamedDays(null);
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("[useMealPlan] generation failed:", error);
        setStreamedDays(null);
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
    /** Per-day complete plans while streaming (null entry = pending) */
    streamedDays,
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
