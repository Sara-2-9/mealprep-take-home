import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { MEAL_PLAN } from "../../lib/theme";
import { useColors } from "../../lib/colors";

/**
 * Loading state of the day card — mirrors the skeleton design in the
 * original Figma frame (surface pill bars 289x16) with a soft pulse.
 */
export function MealPlanCardSkeleton() {
  const colors = useColors();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.45, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Animated.View style={[styles.content, pulse]}>
        <Bar width={120} height={26} color={colors.surface} />
        <View style={styles.mealBlock}>
          <Bar width={220} height={18} color={colors.surface} />
          <Bar width={255} height={14} color={colors.surface} />
        </View>
        <View style={styles.section}>
          <Bar width={100} height={16} color={colors.surface} />
          <Bar color={colors.surface} />
          <Bar color={colors.surface} />
          <Bar color={colors.surface} />
          <Bar color={colors.surface} />
        </View>
        <View style={styles.section}>
          <Bar width={70} height={16} color={colors.surface} />
          <Bar color={colors.surface} />
          <Bar color={colors.surface} />
          <Bar color={colors.surface} />
          <Bar color={colors.surface} />
        </View>
      </Animated.View>
    </View>
  );
}

function Bar({
  width,
  height = 16,
  color,
}: {
  width?: number;
  height?: number;
  color: string;
}) {
  return (
    <View
      style={[
        width !== undefined ? { width } : styles.barFull,
        { height, borderRadius: 99, backgroundColor: color },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    width: MEAL_PLAN.cardWidth,
    flex: 1,
    borderRadius: MEAL_PLAN.cardRadius,
    overflow: "hidden",
  },
  content: {
    padding: MEAL_PLAN.cardPadding,
    gap: MEAL_PLAN.cardGap,
  },
  mealBlock: {
    gap: 10,
  },
  section: {
    gap: 12,
  },
  barFull: {
    alignSelf: "stretch",
  },
});
