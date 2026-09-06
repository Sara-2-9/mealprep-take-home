import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Mask, Rect, Text as SvgText, G } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { CONTENT_WIDTH } from "../../lib/theme";
import { useColors } from "../../lib/colors";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const HEIGHT = 134;
const SHINE_WIDTH = 140;
const TRAVEL = CONTENT_WIDTH + SHINE_WIDTH;

interface BudgetValueProps {
  value: number;
}

/**
 * Big budget value (96pt) as in Figma: solid ink text with a green shine
 * sweep — the Figma node is literally named "TextAnimationSliding": a
 * linear-gradient rectangle (transparent → #34C759 → transparent) sliding
 * horizontally across the glyphs. Implemented as an SVG mask: the text
 * shape clips the animated gradient rect, no extra native deps needed.
 */
export function BudgetValue({ value }: BudgetValueProps) {
  const colors = useColors();
  const shineX = useSharedValue(-SHINE_WIDTH);

  useEffect(() => {
    shineX.value = withRepeat(
      withDelay(
        900,
        withTiming(CONTENT_WIDTH, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [shineX]);

  const shineProps = useAnimatedProps(() => ({ x: shineX.value }));

  const label = `€${value}`;
  const centerX = CONTENT_WIDTH / 2;
  const baselineY = 102; // visually centers the 96pt Promo glyphs in the 134pt box

  return (
    <View style={styles.wrap}>
      <Svg width={CONTENT_WIDTH} height={HEIGHT}>
        <Defs>
          <LinearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#34C759" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#34C759" stopOpacity="1" />
            <Stop offset="1" stopColor="#34C759" stopOpacity="0" />
          </LinearGradient>
          <Mask id="glyphs">
            <SvgText
              x={centerX}
              y={baselineY}
              textAnchor="middle"
              fontFamily="Promo-Bold"
              fontSize={96}
              fill="#FFFFFF"
            >
              {label}
            </SvgText>
          </Mask>
        </Defs>

        {/* Base text (shine sweep identical in both modes; only this
            base color changes: dark ink in light mode, white in dark) */}
        <SvgText
          x={centerX}
          y={baselineY}
          textAnchor="middle"
          fontFamily="Promo-Bold"
          fontSize={96}
          fill={colors.budgetValue}
        >
          {label}
        </SvgText>

        {/* Shine sweep, clipped to the glyph shapes */}
        <G mask="url(#glyphs)">
          <AnimatedRect
            animatedProps={shineProps}
            y={0}
            width={SHINE_WIDTH}
            height={HEIGHT}
            fill="url(#shine)"
          />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
});
