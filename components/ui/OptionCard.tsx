import { memo } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { OPTION_GRID } from "../../lib/theme";

interface OptionCardProps {
  emoji?: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * Option card of the 2x3 grid (screens 03/04) — 168.5x104, radius 20.
 * Selected state is not in Figma (documented gap): we use the app's active-state
 * language — black background + white text, matching the day-cell active state.
 */
export const OptionCard = memo(function OptionCard({
  emoji,
  label,
  selected,
  onPress,
}: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && { opacity: 0.85 },
      ]}
    >
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text
        className="font-promo"
        style={[styles.label, selected && styles.labelSelected]}
      >
        {label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: OPTION_GRID.cardWidth,
    height: OPTION_GRID.cardHeight,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  selected: {
    backgroundColor: "#000000",
  },
  emoji: {
    fontSize: OPTION_GRID.emojiSize,
    lineHeight: OPTION_GRID.emojiSize * 1.2,
  },
  label: {
    fontSize: OPTION_GRID.labelSize,
    lineHeight: OPTION_GRID.labelLineHeight,
    color: "#000000",
  },
  labelSelected: {
    color: "#FFFFFF",
  },
});
