import Svg, { Path, Circle } from "react-native-svg";
import { useColors } from "../../lib/colors";

/**
 * 16x16 meta icons for screen 05 — paths extracted 1:1 from the Figma
 * exports in `design/svg` (clock / user-user-03 / cash / chevron-big).
 * Stroke: themed ink at 60% opacity, width 1.333, round caps/joins
 * (chevron-big keeps its Figma 1.667 width on a 20x20 grid).
 *
 * NOTE: design/svg breakfast/lunch/dinner are embedded raster PNGs, not
 * stroke vectors, so they can't be tinted — the meal icons below are
 * stroke redraws (mug / bowl / cloche) in the same themed style.
 */
interface MetaIconProps {
  size?: number;
}

function useStroke() {
  const colors = useColors();
  return {
    stroke: colors.metaIcon,
    strokeOpacity: 0.6,
    strokeWidth: 1.333,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    fill: "none",
  } as const;
}

export function ClockIcon({ size = 16 }: MetaIconProps) {
  const stroke = useStroke();
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M8 5.333v3.211c0 .114.058.22.154.281L10 10m4.1-2A6.1 6.1 0 1 1 1.9 8a6.1 6.1 0 0 1 12.2 0"
        {...stroke}
      />
    </Svg>
  );
}

export function ServingsIcon({ size = 16 }: MetaIconProps) {
  const stroke = useStroke();
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M10.667 4.667a2.667 2.667 0 1 1-5.334 0 2.667 2.667 0 0 1 5.334 0M3.91 14h8.18c.687 0 1.243-.557 1.243-1.244a3.11 3.11 0 0 0-3.94-2.997l-.464.129a3.5 3.5 0 0 1-1.858 0l-.464-.129a3.11 3.11 0 0 0-3.94 2.997c0 .687.557 1.244 1.244 1.244"
        {...stroke}
      />
    </Svg>
  );
}

export function CashIcon({ size = 16 }: MetaIconProps) {
  const stroke = useStroke();
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M4 3.333v.534c0 .746 0 1.12-.145 1.405a1.34 1.34 0 0 1-.583.583C2.987 6 2.613 6 1.867 6h-.534M4 3.333h-.533c-.747 0-1.12 0-1.406.146-.25.127-.455.331-.582.582-.146.286-.146.659-.146 1.406V6M4 3.333h8m0 0h.533c.747 0 1.12 0 1.406.146.25.127.454.331.582.582.146.286.146.659.146 1.406V6M12 3.333v.534c0 .746 0 1.12-.145 1.405.128.25.332.455.583.583.285.145.659.145 1.405.145h.534M4 12.667v-.534c0-.746 0-1.12-.145-1.405a1.33 1.33 0 0 0-.583-.583C2.987 10 2.613 10 1.867 10h-.534M4 12.667h-.533c-.747 0-1.12 0-1.406-.146a1.33 1.33 0 0 0-.582-.582c-.146-.286-.146-.659-.146-1.406V10M4 12.667h8m0 0h.533c.747 0 1.12 0 1.406.146.25-.128.454-.332.582-.582.146-.286.146-.659.146-1.406V10M12 12.667v-.534c0-.746 0-1.12-.145-1.405a1.34 1.34 0 0 1 .583-.583c.285-.145.659-.145 1.405-.145h.534M1.333 10V6m13.334 4V6M8 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4"
        {...stroke}
      />
    </Svg>
  );
}

/**
 * Meal-type icons (16x16) — used in the MealItem header to visually
 * distinguish breakfast, lunch, and dinner. Stroke redraws in the same
 * themed style as clock/cash: mug with steam (breakfast), soup bowl
 * with steam (lunch), serving cloche (dinner).
 */
export function BreakfastIcon({ size = 16 }: MetaIconProps) {
  const stroke = useStroke();
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M4 7h7v3a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7ZM11 8h.8a1.7 1.7 0 0 1 0 3.4H11M6.5 5.2c0-.9.9-.9.9-1.9M8.8 5.2c0-.9.9-.9.9-1.9M3 14.5h9"
        {...stroke}
      />
    </Svg>
  );
}

export function LunchIcon({ size = 16 }: MetaIconProps) {
  const stroke = useStroke();
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M2.5 9.5h11c0 2.6-2.5 4.5-5.5 4.5s-5.5-1.9-5.5-4.5ZM6.5 6.8c0-.9.9-.9.9-1.9M9.3 6.8c0-.9.9-.9.9-1.9"
        {...stroke}
      />
    </Svg>
  );
}

export function DinnerIcon({ size = 16 }: MetaIconProps) {
  const stroke = useStroke();
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M3.5 11a4.5 4.5 0 0 1 9 0M8 4.7v1.1M2.5 11h11M3.5 13.8h9"
        {...stroke}
      />
      <Circle cx="8" cy="4" r="0.9" {...stroke} />
    </Svg>
  );
}

/**
 * Expand/collapse chevron — Figma `chevron-big_chevron-big-left` geometry
 * transposed to point down, on its original 20x20 grid (width 1.667).
 * Color adapted to the other icons: themed ink at 60% opacity.
 * Rotate 180° for the expanded (up) state.
 */
export function ChevronDownIcon({ size = 16 }: MetaIconProps) {
  const colors = useColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path
        d="M15 7.5a25.5 25.5 0 0 0-4.574 4.848.67.67 0 0 1-.85 0A25.5 25.5 0 0 1 5 7.5"
        stroke={colors.metaIcon}
        strokeOpacity={0.6}
        strokeWidth={1.667}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
