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
 * Memoization is handled by the React Compiler (experiments.reactCompiler).
 */
export function useDietaryNeeds() {
  const router = useRouter();
  const selected = useFlowStore((s) => s.dietaryNeeds);
  const toggle = useFlowStore((s) => s.toggleDietaryNeed);

  const canContinue = selected.length > 0;

  const goBack = () => router.back();
  const goNext = () => {
    if (canContinue) router.push("/nutritional-goals");
  };

  return {
    options: DIETARY_OPTIONS,
    selected,
    toggle,
    canContinue,
    goBack,
    goNext,
  };
}
