import { useState } from "react";
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
 * Selected state (from the updated Sara design): light-green background
 * #E9FEF2 with a 4px inside border #49DD76; label stays black.
 */
export function OptionCard({
  emoji,
  label,
  selected,
  onPress,
}: OptionCardProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.card,
        selected && styles.selected,
        pressed && { opacity: 0.85 },
      ]}
    >
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text className="font-promo-semibold" style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: OPTION_GRID.cardWidth,
    height: OPTION_GRID.cardHeight,
    flexShrink: 1,
    minWidth: 0,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  selected: {
    backgroundColor: "#E9FEF2",
    borderWidth: 4,
    borderColor: "#49DD76",
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
});
