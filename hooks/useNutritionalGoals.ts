import { useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { useFlowStore, type NutritionalGoal } from "../state/flowStore";

export interface GoalOption {
  id: NutritionalGoal;
  label: string;
  emoji?: string;
}

/** Options exactly as in Figma screen 04 (grid order, row by row). */
export const GOAL_OPTIONS: GoalOption[] = [
  { id: "none", label: "None" },
  { id: "high-protein", label: "High protein", emoji: "🥩" },
  { id: "low-sugar", label: "Low sugar", emoji: "🍯" },
  { id: "low-fat", label: "Low fat", emoji: "🫑" },
  { id: "low-carbs", label: "Low carbs", emoji: "🍝" },
  { id: "low-salt", label: "Low salt", emoji: "🧂" },
];

/**
 * Business logic for screen 04 — nutritional goals selection.
 */
export function useNutritionalGoals() {
  const router = useRouter();
  const selected = useFlowStore((s) => s.nutritionalGoals);
  const toggle = useFlowStore((s) => s.toggleNutritionalGoal);

  const canContinue = useMemo(() => selected.length > 0, [selected]);

  const goBack = useCallback(() => router.back(), [router]);
  const goNext = useCallback(() => {
    if (canContinue) router.push("/meal-plan");
  }, [canContinue, router]);

  return {
    options: GOAL_OPTIONS,
    selected,
    toggle,
    canContinue,
    goBack,
    goNext,
  };
}
