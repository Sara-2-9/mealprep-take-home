import { useCallback, useEffect, useRef, useState } from "react";
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
 */
export function useMealPlan() {
  const budget = useFlowStore((s) => s.budget);
  const dietaryNeeds = useFlowStore((s) => s.dietaryNeeds);
  const nutritionalGoals = useFlowStore((s) => s.nutritionalGoals);

  const requestKey = JSON.stringify({ budget, dietaryNeeds, nutritionalGoals });

  const [status, setStatus] = useState<MealPlanStatus>(
    cache?.key === requestKey ? "ready" : "loading",
  );
  const [plan, setPlan] = useState<WeeklyPlan | null>(
    cache?.key === requestKey ? cache.plan : null,
  );
  const [totalCost, setTotalCost] = useState<number | null>(
    cache?.key === requestKey ? cache.totalCost : null,
  );
  const [selectedDay, setSelectedDay] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();

  const generate = useCallback(async () => {
    setStatus("loading");
    try {
      const result = await generateMealPlan({
        budget,
        dietaryNeeds,
        nutritionalGoals,
      });
      cache = { key: requestKey, plan: result.plan, totalCost: result.totalCost };
      setPlan(result.plan);
      setTotalCost(result.totalCost);
      setStatus("ready");
    } catch (error) {
      console.warn("[useMealPlan] generation failed:", error);
      setStatus("error");
    }
    // requestKey captures budget/dietaryNeeds/nutritionalGoals
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  useEffect(() => {
    if (cache?.key !== requestKey) {
      generate();
    }
  }, [requestKey, generate]);

  /** Day selector tap → scroll the pager */
  const selectDay = useCallback((index: number) => {
    setSelectedDay(index);
    pagerRef.current?.scrollTo({ x: index * MEAL_PLAN.cardStride, animated: true });
  }, []);

  /** Pager swipe → update the day selector */
  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(
        event.nativeEvent.contentOffset.x / MEAL_PLAN.cardStride,
      );
      setSelectedDay(Math.max(0, Math.min(6, index)));
    },
    [],
  );

  return {
    status,
    plan,
    /** Estimated weekly cost once ready, otherwise the selected budget */
    displayedCost: totalCost ?? budget,
    selectedDay,
    selectDay,
    retry: generate,
    pagerRef,
    onMomentumScrollEnd,
    /** Horizontal padding that centers the 337pt card with the Figma peek */
    pagerPadding: Math.max(
      MEAL_PLAN.cardPeek,
      (width - MEAL_PLAN.cardWidth) / 2,
    ),
  };
}
