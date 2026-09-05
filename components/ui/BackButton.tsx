import { memo, useState } from "react";
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
export const BackButton = memo(function BackButton({ onPress }: BackButtonProps) {
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
          d="M12.5 5 L7.5 10 L12.5 15"
          stroke="#000000"
          strokeWidth={1.67}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Pressable>
  );
});

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
