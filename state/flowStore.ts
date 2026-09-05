import { create } from "zustand";

export const BUDGET_MIN = 25;
export const BUDGET_MAX = 150;
export const BUDGET_STEP = 5;
export const BUDGET_DEFAULT = 75;

export type DietaryNeed =
  | "vegetarian"
  | "vegan"
  | "gluten-free"
  | "lactose-free";

export type NutritionalGoal =
  | "high-protein"
  | "low-carb"
  | "low-fat"
  | "balanced";

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

export const useFlowStore = create<FlowState>((set) => ({
  ...initialState,
  setBudget: (budget) => set({ budget }),
  toggleDietaryNeed: (need) =>
    set((state) => ({
      dietaryNeeds: state.dietaryNeeds.includes(need)
        ? state.dietaryNeeds.filter((n) => n !== need)
        : [...state.dietaryNeeds, need],
    })),
  toggleNutritionalGoal: (goal) =>
    set((state) => ({
      nutritionalGoals: state.nutritionalGoals.includes(goal)
        ? state.nutritionalGoals.filter((g) => g !== goal)
        : [...state.nutritionalGoals, goal],
    })),
  reset: () => set(initialState),
}));
