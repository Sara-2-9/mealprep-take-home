import { useEffect, useRef, useState } from "react";
import { Animated, useWindowDimensions, type ScrollView } from "react-native";
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
 * Business logic for screen 05 — weekly meal plan (v2: 3 meals/day).
 * Orchestrates the LLM workflow (streaming generate → validate → retry) and
 * the day pager (selector ↔ horizontal scroll sync).
 *
 * While the plan streams in, `streamedDays` exposes each day as a COMPLETE,
 * fully priced DayPlan the moment its element finishes (null = still
 * pending → skeleton). Within each day, meals appear sequentially with a
 * 500ms delay each for a progressive reveal effect.
 *
 * Pager scroll is tracked by `scrollX` (RN Animated.Value, native driver):
 * it feeds the per-card parallax (opacity/scale) and the sliding day
 * indicator. `scrollHandler` is an Animated.event whose listener derives
 * the active day index during the swipe itself (not at momentum end) and
 * updates JS state only when the rounded index actually changes.
 * Selector taps use the plain ScrollView `scrollTo` imperative API.
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
  const pagerRef = useRef<ScrollView>(null);
  /** Pager scroll position — drives parallax and the sliding day indicator */
  const [scrollX] = useState(() => new Animated.Value(0));
  const lastScrolledIndex = useRef(0);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (status !== "loading") return;
    let cancelled = false;
    setStreamedDays(null);
    generateMealPlan(
      { budget, dietaryNeeds, nutritionalGoals },
      {
        onDay: (day, index) => {
          if (cancelled) return;
          // Each element is a complete day with 3 meals.
          // First show the day with empty meals array (skeletons).
          setStreamedDays((prev) => {
            const base = prev ?? Array<DayPlan | null>(7).fill(null);
            const next = [...base];
            next[index] = { day: day.day, meals: [] };
            return next;
          });
          // Sequentially reveal each meal with a 500ms delay.
          day.meals.forEach((meal, mealIndex) => {
            setTimeout(() => {
              if (cancelled) return;
              setStreamedDays((prev) => {
                if (!prev) return prev;
                const next = [...prev];
                const existing = next[index];
                if (!existing) return next;
                next[index] = {
                  ...existing,
                  meals: [...existing.meals, meal],
                };
                return next;
              });
            }, (mealIndex + 1) * 500);
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
   * Pager swipe → scrollX (native driver) + day selector sync. The
   * listener runs on the JS thread and updates state only when the rounded
   * day index actually changes (≤7 distinct values).
   */
  const scrollHandler = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: true,
      listener: (event: { nativeEvent: { contentOffset: { x: number } } }) => {
        const index = Math.max(
          0,
          Math.min(
            6,
            Math.round(event.nativeEvent.contentOffset.x / MEAL_PLAN.cardStride),
          ),
        );
        if (index !== lastScrolledIndex.current) {
          lastScrolledIndex.current = index;
          setSelectedDay(index);
        }
      },
    },
  );

  /** Day selector tap → scroll the pager (imperative ScrollView API) */
  const selectDay = (index: number) => {
    setSelectedDay(index);
    lastScrolledIndex.current = index;
    pagerRef.current?.scrollTo({ x: index * MEAL_PLAN.cardStride, animated: true });
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
    scrollX,
    /** Horizontal padding that centers the 337pt card with the Figma peek */
    pagerPadding: Math.max(
      MEAL_PLAN.cardPeek,
      (width - MEAL_PLAN.cardWidth) / 2,
    ),
  };
}
