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
 * Memoization is handled by the React Compiler (experiments.reactCompiler).
 */
export function useNutritionalGoals() {
  const router = useRouter();
  const selected = useFlowStore((s) => s.nutritionalGoals);
  const toggle = useFlowStore((s) => s.toggleNutritionalGoal);

  const canContinue = selected.length > 0;

  const goBack = () => router.back();
  const goNext = () => {
    if (canContinue) router.push("/meal-plan");
  };

  return {
    options: GOAL_OPTIONS,
    selected,
    toggle,
    canContinue,
    goBack,
    goNext,
  };
}
