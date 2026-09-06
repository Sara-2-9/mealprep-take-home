import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { MEAL_PLAN, WEEK_DAYS } from "../../lib/theme";
import { useColors, type Colors } from "../../lib/colors";

interface DaySelectorProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Disables interaction (used only in the error state) */
  disabled?: boolean;
}

/**
 * Figma "Frame 30" — row of 7 day cells (47x40, r=12, gap 4).
 * Light mode: active = black bg/white text, inactive = white bg/black text.
 * Dark mode (on the unchanged green screen): active = white bg/black text,
 * inactive = #121612 bg/white text.
 * NOTE: the Figma file swaps Wed/Thu; we keep calendar order.
 */
export function DaySelector({
  selectedIndex,
  onSelect,
  disabled = false,
}: DaySelectorProps) {
  const colors = useColors();
  return (
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
      style={[
        styles.cell,
        {
          backgroundColor: active
            ? colors.dayCellActiveBg
            : colors.dayCellInactiveBg,
          borderColor: active ? "transparent" : colors.surface,
        },
        pressed && !disabled && { opacity: 0.7 },
      ]}
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
  row: {
    flexDirection: "row",
    gap: MEAL_PLAN.dayCellGap,
  },
  cell: {
    width: MEAL_PLAN.dayCellWidth,
    height: MEAL_PLAN.dayCellHeight,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    lineHeight: 19.6,
  },
});
