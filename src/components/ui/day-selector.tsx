import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { MEAL_PLAN, WEEK_DAYS } from "../../lib/theme";

interface DaySelectorProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Disables interaction (used only in the error state) */
  disabled?: boolean;
}

/**
 * Figma "Frame 30" — row of 7 day cells (47x40, r=12, gap 4).
 * Active: black bg, white text. Inactive: white bg, 1px surface border.
 * NOTE: the Figma file swaps Wed/Thu; we keep calendar order.
 */
export function DaySelector({
  selectedIndex,
  onSelect,
  disabled = false,
}: DaySelectorProps) {
  return (
    <View style={styles.row}>
      {WEEK_DAYS.map((day, index) => (
        <DayCell
          key={day}
          label={day}
          active={index === selectedIndex}
          disabled={disabled}
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
  onPress,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
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
        active ? styles.cellActive : styles.cellInactive,
        pressed && !disabled && { opacity: 0.7 },
      ]}
    >
      <Text
        className="font-promo-medium"
        style={[styles.label, active ? styles.labelActive : styles.labelInactive]}
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
    alignItems: "center",
    justifyContent: "center",
  },
  cellActive: {
    backgroundColor: "#000000",
  },
  cellInactive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F2F2F7",
  },
  label: {
    fontSize: 14,
    lineHeight: 19.6,
  },
  labelActive: {
    color: "#FFFFFF",
  },
  labelInactive: {
    color: "#000000",
  },
});
