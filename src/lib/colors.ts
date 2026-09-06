import { useColorScheme } from "react-native";

/**
 * Light/dark color palettes. The mode follows the device setting
 * (app.json: userInterfaceStyle "automatic") — no in-app toggle per the
 * design references in `design/dark-mode/`.
 *
 * Dark-mode anchors from Sara's spec:
 * - screen background #121612, primary text white, text on green stays black
 * - ProgressBar/BudgetSlider track #2A2A2A (the shared `surface`)
 * - OptionCard selected background #1E2B24 (the shared `surfaceSelected`)
 * - the green shine sweep on the budget value is unchanged; only the base
 *   text turns white
 */
export interface Colors {
  /** Screen background, flow screens 01–04 */
  screenBackground: string;
  /** Primary text on the screen background */
  text: string;
  /** Secondary text ("per week", meta rows) */
  textSecondary: string;
  /** iOS-style surface: tracks, back circle, option cards, skeleton bars */
  surface: string;
  /** Selected/tinted surface: option card selected, step ellipses */
  surfaceSelected: string;
  /** Primary green (same in both modes) */
  accent: string;
  /** Lighter green (progress shine, selection border) */
  accentSoft: string;
  /** CTA label on the green button */
  ctaLabel: string;
  /** Disabled CTA label */
  ctaDisabledLabel: string;
  /** Big budget value base text (shine sweep unchanged) */
  budgetValue: string;
  /** "Bon appetit!" title on the green screen */
  mealPlanTitle: string;
  /** Cards on the green screen (cost card, day cards) */
  card: string;
  dayCellActiveBg: string;
  dayCellActiveLabel: string;
  dayCellInactiveBg: string;
  dayCellInactiveLabel: string;
  /** Meta icons stroke on day cards */
  metaIcon: string;
  /** StatusBar content style */
  statusBar: "dark" | "light";
}

export const LIGHT_COLORS: Colors = {
  screenBackground: "#FDFFFB",
  text: "#000000",
  textSecondary: "rgba(60,60,67,0.6)",
  surface: "#F2F2F7",
  surfaceSelected: "#E9FEF2",
  accent: "#34C759",
  accentSoft: "#49DD76",
  ctaLabel: "#FFFFFF",
  ctaDisabledLabel: "rgba(60,60,67,0.18)",
  budgetValue: "#1A1A1A",
  mealPlanTitle: "#FFFFFF",
  card: "#FFFFFF",
  dayCellActiveBg: "#000000",
  dayCellActiveLabel: "#FFFFFF",
  dayCellInactiveBg: "#FFFFFF",
  dayCellInactiveLabel: "#000000",
  metaIcon: "#3C3C43",
  statusBar: "dark",
};

export const DARK_COLORS: Colors = {
  screenBackground: "#121612",
  text: "#FFFFFF",
  textSecondary: "rgba(235,235,245,0.6)",
  surface: "#2A2A2A",
  surfaceSelected: "#1E2B24",
  accent: "#34C759",
  accentSoft: "#49DD76",
  ctaLabel: "#000000",
  ctaDisabledLabel: "rgba(255,255,255,0.2)",
  budgetValue: "#FFFFFF",
  mealPlanTitle: "#000000",
  card: "#121612",
  dayCellActiveBg: "#FFFFFF",
  dayCellActiveLabel: "#000000",
  dayCellInactiveBg: "#121612",
  dayCellInactiveLabel: "#FFFFFF",
  metaIcon: "#EBEBF5",
  statusBar: "light",
};

/** Current palette, resolved from the device appearance. */
export function useColors(): Colors {
  return useColorScheme() === "dark" ? DARK_COLORS : LIGHT_COLORS;
}
