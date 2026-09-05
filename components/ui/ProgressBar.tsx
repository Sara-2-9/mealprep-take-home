import { memo, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { HEADER } from "../../lib/theme";

const { width, height, innerBarHeight, innerBarInset } = HEADER.progressBar;
const INNER_MAX = width - innerBarInset * 2;

interface ProgressBarProps {
  /** 0..1 — Figma LoadingBar variants are 25/50/75 */
  progress: number;
}

/**
 * Figma component "LoadingBar" — 315x20 surface pill; green fill with a white
 * inner bar (6px, 12px inset). Fill animates between steps.
 */
export const ProgressBar = memo(function ProgressBar({ progress }: ProgressBarProps) {
  const animated = useSharedValue(progress);

  useEffect(() => {
    animated.value = withTiming(progress, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animated]);

  const fillStyle = useAnimatedStyle(() => ({
    width: Math.max(animated.value * width, 0),
  }));

  const innerStyle = useAnimatedStyle(() => ({
    width: Math.max(animated.value * width - innerBarInset * 2, 0),
  }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fillStyle]}>
        <Animated.View style={[styles.inner, innerStyle]} />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  track: {
    width,
    height,
    borderRadius: 99,
    backgroundColor: "#F2F2F7",
    overflow: "hidden",
    justifyContent: "center",
  },
  fill: {
    height,
    borderRadius: 99,
    backgroundColor: "#34C759",
    justifyContent: "center",
  },
  inner: {
    height: innerBarHeight,
    marginLeft: innerBarInset,
    maxWidth: INNER_MAX,
    borderRadius: 99,
    backgroundColor: "#FFFFFF",
  },
});
