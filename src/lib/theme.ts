/**
 * Layout tokens extracted from Figma (file 6b7jS9TUz5qO7YAXvl98Pg).
 * All coordinates relative to the 393x852 canvas (iPhone 14/15/16).
 * Use these for pixel-perfect positioning; use tailwind classes for colors/radii.
 */

export const CANVAS = { width: 393, height: 852 } as const;

/** Horizontal screen margin; content width = 393 - 2*20 = 353 */
export const SCREEN_PADDING_X = 20;
export const CONTENT_WIDTH = 353;

/** Header block (back button + progress bar + title) */
export const HEADER = {
  top: 82,
  backButtonSize: 28,
  progressBar: { width: 315, height: 20, innerBarHeight: 6, innerBarInset: 12 },
  titleTop: 130,
  titleSize: 32,
  titleLineHeight: 44.5,
  gap: 20,
} as const;

/** Bottom CTA button */
export const CTA = {
  bottom: 852 - 723 - 72, // 57
  height: 72,
  fontSize: 20,
  lineHeight: 27.8,
  letterSpacing: 0.4,
} as const;

/** Option grid (screens 03 & 04): 2 columns x 3 rows */
export const OPTION_GRID = {
  top: 254,
  cardWidth: 168.5,
  cardHeight: 104,
  gap: 16,
  emojiSize: 32,
  labelSize: 16,
  labelLineHeight: 22.4,
} as const;

/** Screen 05 layout */
export const MEAL_PLAN = {
  titleTop: 82,
  titleSize: 40,
  titleLineHeight: 55.6,
  costCardTop: 150,
  costCardHeight: 72,
  dayRowTop: 234,
  dayCellWidth: 47,
  dayCellHeight: 40,
  dayCellGap: 4,
  cardTop: 306,
  cardWidth: 337,
  cardHeight: 546,
  cardRadius: 28,
  cardPadding: 24,
  cardGap: 28,
  /** Horizontal pager: side peek (28) + gap between cards (12) → stride 349 */
  cardPeek: 28,
  cardStride: 337 + 12,
  metaIconColor: "#3C3C43",
} as const;

/** Day labels in calendar order (the Figma file swaps Wed/Thu — we don't) */
export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const WEEK_DAYS_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/** Progress fraction per step (LoadingBar component: 25 / 50 / 75 / 100) */
export const STEP_PROGRESS = {
  budget: 0.25,
  dietaryNeeds: 0.5,
  nutritionalGoals: 0.75,
  mealPlan: 1,
} as const;
