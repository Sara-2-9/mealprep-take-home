import { memo } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { CTA, CONTENT_WIDTH } from "../../lib/theme";

interface CTAButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Primary flow button — Figma component "Button" (variants Default/Disabled).
 * 353x72, pill radius, primary green; disabled = surface bg + 18% label.
 */
export const CTAButton = memo(function CTAButton({
  label,
  onPress,
  disabled = false,
}: CTAButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        disabled ? styles.disabled : styles.enabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        className="font-promo"
        style={[styles.label, disabled ? styles.labelDisabled : styles.labelEnabled]}
      >
        {label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    width: CONTENT_WIDTH,
    height: CTA.height,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  enabled: { backgroundColor: "#34C759" },
  disabled: { backgroundColor: "#F2F2F7" },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  label: {
    fontSize: CTA.fontSize,
    lineHeight: CTA.lineHeight,
    letterSpacing: CTA.letterSpacing,
  },
  labelEnabled: { color: "#FFFFFF" },
  labelDisabled: { color: "rgba(60,60,67,0.18)" },
});
