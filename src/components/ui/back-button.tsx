import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { HEADER } from "../../lib/theme";

interface BackButtonProps {
  onPress: () => void;
}

/**
 * Figma component "Icon" — 28x28 surface circle, chevron-left stroke 1.67.
 */
export function BackButton({ onPress }: BackButtonProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.circle, pressed && { opacity: 0.7 }]}
    >
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Path
          d="M12.5 15a25.5 25.5 0 0 1-4.848-4.574.67.67 0 0 1 0-.85A25.5 25.5 0 0 1 12.5 5"
          stroke="#000000"
          strokeWidth={1.667}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: HEADER.backButtonSize,
    height: HEADER.backButtonSize,
    borderRadius: 99,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
});
