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
 * Loading state of the day card (v2: 3 meals).
 * Shows skeleton blocks for each meal section with a pulsing animation.
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
        {/* Day name skeleton */}
        <Bar width={120} height={26} color={colors.surface} />

        {/* Meal 1 skeleton */}
        <View style={styles.mealBlock}>
          <Bar width={80} height={14} color={colors.surface} />
          <Bar width={200} height={16} color={colors.surface} />
          <View style={styles.section}>
            <Bar width={70} height={12} color={colors.surface} />
            <Bar color={colors.surface} />
            <Bar color={colors.surface} />
          </View>
        </View>

        {/* Meal 2 skeleton */}
        <View style={styles.mealBlock}>
          <Bar width={60} height={14} color={colors.surface} />
          <Bar width={180} height={16} color={colors.surface} />
          <View style={styles.section}>
            <Bar width={70} height={12} color={colors.surface} />
            <Bar color={colors.surface} />
            <Bar color={colors.surface} />
          </View>
        </View>

        {/* Meal 3 skeleton */}
        <View style={styles.mealBlock}>
          <Bar width={70} height={14} color={colors.surface} />
          <Bar width={220} height={16} color={colors.surface} />
          <View style={styles.section}>
            <Bar width={70} height={12} color={colors.surface} />
            <Bar color={colors.surface} />
            <Bar color={colors.surface} />
          </View>
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
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  content: {
    padding: MEAL_PLAN.cardPadding,
    gap: MEAL_PLAN.cardGap,
  },
  mealBlock: {
    gap: 8,
  },
  section: {
    gap: 8,
    marginTop: 4,
  },
  barFull: {
    alignSelf: "stretch",
  },
});
