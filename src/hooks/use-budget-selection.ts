import { useRouter } from "expo-router";
import { useFlowStore } from "../state/flow-store";

/**
 * Business logic for screen 02 — weekly budget selection.
 * Memoization is handled by the React Compiler (experiments.reactCompiler).
 */
export function useBudgetSelection() {
  const router = useRouter();
  const budget = useFlowStore((s) => s.budget);
  const setBudget = useFlowStore((s) => s.setBudget);

  const goBack = () => router.back();
  const goNext = () => router.push("/dietary-needs");

  return { budget, setBudget, goBack, goNext };
}
