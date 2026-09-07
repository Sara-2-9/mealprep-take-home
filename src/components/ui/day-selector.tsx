import { useState } from "react";
import { Animated, View, Text, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { MEAL_PLAN, WEEK_DAYS } from "../../lib/theme";
import { useColors, type Colors } from "../../lib/colors";

/** Distance between day-cell centers: 47 cell + 4 gap */
const DAY_PITCH = MEAL_PLAN.dayCellWidth + MEAL_PLAN.dayCellGap; // 51

interface DaySelectorProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Pager scroll position — drives the sliding active-day indicator */
  scrollX: Animated.Value;
  /** Disables interaction (used only in the error state) */
  disabled?: boolean;
}

/**
 * Figma "Frame 30" — row of 7 day cells (47x40, r=12, gap 4) over static
 * white backgrounds, with an ink indicator (47x40, r=12) sliding under the
 * labels as the pager scrolls: translateX = scrollX mapped from
 * [0, cardStride*6] → [0, DAY_PITCH*6]. Cells stay transparent (zIndex 2)
 * so taps land above the indicator; the label turns white when its day is
 * active. Dark mode (on the unchanged green screen): indicator/labels
 * invert (white pill, black text).
 * NOTE: the Figma file swaps Wed/Thu; we keep calendar order.
 */
export function DaySelector({
  selectedIndex,
  onSelect,
  scrollX,
  disabled = false,
}: DaySelectorProps) {
  const colors = useColors();

  const indicatorTranslateX = scrollX.interpolate({
    inputRange: [0, MEAL_PLAN.cardStride * 6],
    outputRange: [0, DAY_PITCH * 6],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      {/* Static day backgrounds, underneath everything */}
      <View style={styles.backgrounds} pointerEvents="none">
        {WEEK_DAYS.map((day) => (
          <View
            key={day}
            style={[
              styles.cellBg,
              { backgroundColor: colors.dayCellInactiveBg },
            ]}
          />
        ))}
      </View>

      {/* Sliding active-day indicator — never intercepts touches */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.indicator,
          {
            backgroundColor: colors.dayCellActiveBg,
            transform: [{ translateX: indicatorTranslateX }],
          },
        ]}
      />

      {/* Transparent touch/label layer */}
      <View style={styles.row}>
        {WEEK_DAYS.map((day, index) => (
          <DayCell
            key={day}
            label={day}
            active={index === selectedIndex}
            disabled={disabled}
            colors={colors}
            onPress={() => onSelect(index)}
          />
        ))}
      </View>
    </View>
  );
}

function DayCell({
  label,
  active,
  disabled,
  colors,
  onPress,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  colors: Colors;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      disabled={disabled}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.cell, pressed && !disabled && { opacity: 0.7 }]}
    >
      <Text
        className="font-promo-medium"
        style={[
          styles.label,
          {
            color: active
              ? colors.dayCellActiveLabel
              : colors.dayCellInactiveLabel,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: MEAL_PLAN.dayCellHeight,
  },
  backgrounds: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: MEAL_PLAN.dayCellGap,
  },
  cellBg: {
    width: MEAL_PLAN.dayCellWidth,
    height: MEAL_PLAN.dayCellHeight,
    borderRadius: 12,
  },
  indicator: {
    position: "absolute",
    top: 0,
    left: 0,
    width: MEAL_PLAN.dayCellWidth,
    height: MEAL_PLAN.dayCellHeight,
    borderRadius: 12,
    zIndex: 1,
  },
  row: {
    flexDirection: "row",
    gap: MEAL_PLAN.dayCellGap,
    zIndex: 2,
  },
  cell: {
    width: MEAL_PLAN.dayCellWidth,
    height: MEAL_PLAN.dayCellHeight,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    lineHeight: 19.6,
  },
});
