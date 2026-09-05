import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useFlowStore } from "../state/flowStore";

/**
 * Business logic for screen 02 — weekly budget selection.
 */
export function useBudgetSelection() {
  const router = useRouter();
  const budget = useFlowStore((s) => s.budget);
  const setBudget = useFlowStore((s) => s.setBudget);

  const goBack = useCallback(() => router.back(), [router]);
  const goNext = useCallback(() => router.push("/dietary-needs"), [router]);

  return { budget, setBudget, goBack, goNext };
}
