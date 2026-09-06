import { create } from "zustand";

export const BUDGET_MIN = 25;
export const BUDGET_MAX = 150;
export const BUDGET_STEP = 5;
/** Default matches the Figma placeholder (€82) snapped to the €5 grid */
export const BUDGET_DEFAULT = 80;

/** Dietary needs as per Figma screen 03 */
export type DietaryNeed =
  | "none"
  | "veggie"
  | "vegan"
  | "pescatarian"
  | "gluten-free"
  | "dairy-free";

/** Nutritional goals as per Figma screen 04 */
export type NutritionalGoal =
  | "none"
  | "high-protein"
  | "low-sugar"
  | "low-fat"
  | "low-carbs"
  | "low-salt";

interface FlowState {
  /** Weekly budget in EUR */
  budget: number;
  dietaryNeeds: DietaryNeed[];
  nutritionalGoals: NutritionalGoal[];
  setBudget: (budget: number) => void;
  toggleDietaryNeed: (need: DietaryNeed) => void;
  toggleNutritionalGoal: (goal: NutritionalGoal) => void;
  reset: () => void;
}

const initialState = {
  budget: BUDGET_DEFAULT,
  dietaryNeeds: [] as DietaryNeed[],
  nutritionalGoals: [] as NutritionalGoal[],
};

/** "none" is exclusive: selecting it clears the rest; selecting another clears it. */
function toggleExclusive<T extends string>(list: T[], item: T, noneValue: T): T[] {
  if (item === noneValue) {
    return list.includes(noneValue) ? [] : [noneValue];
  }
  const withoutNone = list.filter((v) => v !== noneValue);
  return withoutNone.includes(item)
    ? withoutNone.filter((v) => v !== item)
    : [...withoutNone, item];
}

export const useFlowStore = create<FlowState>((set) => ({
  ...initialState,
  setBudget: (budget) => set({ budget }),
  toggleDietaryNeed: (need) =>
    set((state) => ({
      dietaryNeeds: toggleExclusive(state.dietaryNeeds, need, "none"),
    })),
  toggleNutritionalGoal: (goal) =>
    set((state) => ({
      nutritionalGoals: toggleExclusive(state.nutritionalGoals, goal, "none"),
    })),
  reset: () => set(initialState),
}));
