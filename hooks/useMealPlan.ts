import { useEffect, useRef, useState } from "react";
import {
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from "react-native";
import { useFlowStore } from "../state/flowStore";
import { generateMealPlan } from "../lib/llm/client";
import type { WeeklyPlan } from "../lib/mealPlan";
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
 * Orchestrates the LLM workflow (generate → validate → retry) and the
 * day pager (selector ↔ horizontal scroll sync).
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
  const [selectedDay, setSelectedDay] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (status !== "loading") return;
    let cancelled = false;
    generateMealPlan({ budget, dietaryNeeds, nutritionalGoals })
      .then((result) => {
        if (cancelled) return;
        cache = {
          key: requestKey,
          plan: result.plan,
          totalCost: result.totalCost,
        };
        setPlan(result.plan);
        setTotalCost(result.totalCost);
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("[useMealPlan] generation failed:", error);
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
