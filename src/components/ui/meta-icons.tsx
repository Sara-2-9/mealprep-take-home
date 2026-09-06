import Svg, { Path } from "react-native-svg";
import { useColors } from "../../lib/colors";

/**
 * 16x16 meta icons for screen 05 — paths extracted 1:1 from the Figma
 * exports in `design/svg` (clock / user-user-03 / cash).
 * Stroke: themed ink at 60% opacity, width 1.333, round caps/joins.
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
