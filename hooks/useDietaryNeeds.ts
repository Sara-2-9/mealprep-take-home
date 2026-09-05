import { useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { useFlowStore, type DietaryNeed } from "../state/flowStore";

export interface DietaryOption {
  id: DietaryNeed;
  label: string;
  emoji?: string;
}

/** Options exactly as in Figma screen 03 (grid order, row by row). */
export const DIETARY_OPTIONS: DietaryOption[] = [
  { id: "none", label: "None" },
  { id: "veggie", label: "Veggie", emoji: "🥕" },
  { id: "vegan", label: "Vegan", emoji: "🌱" },
  { id: "pescatarian", label: "Pescatarian", emoji: "🐟" },
  { id: "gluten-free", label: "Gluten free", emoji: "🌾" },
  { id: "dairy-free", label: "Dairy free", emoji: "🥛" },
];

/**
 * Business logic for screen 03 — dietary needs selection.
 * CTA stays disabled (per Figma) until the user makes an explicit choice,
 * including "None".
 */
export function useDietaryNeeds() {
  const router = useRouter();
  const selected = useFlowStore((s) => s.dietaryNeeds);
  const toggle = useFlowStore((s) => s.toggleDietaryNeed);

  const canContinue = useMemo(() => selected.length > 0, [selected]);

  const goBack = useCallback(() => router.back(), [router]);
  const goNext = useCallback(() => {
    if (canContinue) router.push("/nutritional-goals");
  }, [canContinue, router]);

  return {
    options: DIETARY_OPTIONS,
    selected,
    toggle,
    canContinue,
    goBack,
    goNext,
  };
}
