import { useState } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { CTA, CONTENT_WIDTH } from "../../lib/theme";
import { useColors } from "../../lib/colors";

interface CTAButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Primary flow button — Figma component "Button" (variants Default/Disabled).
 * 353x72, pill radius, primary green; disabled = surface bg + dimmed label.
 * Dark mode: label turns black on green (design reference), disabled track #2A2A2A.
 *
 * NOTE: style must stay a STATIC array — with NativeWind's cssInterop on
 * Pressable, function-form styles are dropped at runtime (background and
 * dimensions disappear). Pressed state is tracked via onPressIn/onPressOut.
 */
export function CTAButton({
  label,
  onPress,
  disabled = false,
}: CTAButtonProps) {
  const [pressed, setPressed] = useState(false);
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.base,
        disabled
          ? { backgroundColor: colors.surface }
          : { backgroundColor: colors.accent },
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        className="font-promo-semibold"
        style={[
          styles.label,
          { color: disabled ? colors.ctaDisabledLabel : colors.ctaLabel },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: CONTENT_WIDTH,
    height: CTA.height,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  label: {
    fontSize: CTA.fontSize,
    lineHeight: CTA.lineHeight,
    letterSpacing: CTA.letterSpacing,
  },
});
