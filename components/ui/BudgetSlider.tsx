import { memo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  BUDGET_MIN,
  BUDGET_MAX,
  BUDGET_STEP,
} from "../../state/flowStore";

const TRACK_WIDTH = 345;
const TRACK_HEIGHT = 16;
const THUMB_SIZE = 64;
const STEPS = (BUDGET_MAX - BUDGET_MIN) / BUDGET_STEP; // 25
const STEP_WIDTH = (TRACK_WIDTH - THUMB_SIZE) / STEPS;

interface BudgetSliderProps {
  value: number;
  onChange: (value: number) => void;
}

/**
 * Custom budget slider — the Figma file only has a placeholder for this
 * (documented gap). Track 345x16 surface pill, 64px thumb, green fill.
 * EUR 25–150 in EUR 5 steps with snap + haptic tick per step.
 */
export const BudgetSlider = memo(function BudgetSlider({
  value,
  onChange,
}: BudgetSliderProps) {
  const stepIndex = Math.round((value - BUDGET_MIN) / BUDGET_STEP);
  const position = useSharedValue(stepIndex * STEP_WIDTH);
  const start = useSharedValue(0);
  const lastStep = useSharedValue(stepIndex);

  const commit = useCallback(
    (step: number) => {
      onChange(BUDGET_MIN + step * BUDGET_STEP);
    },
    [onChange]
  );

  const tick = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  const pan = Gesture.Pan()
    .onBegin(() => {
      start.value = position.value;
    })
    .onUpdate((e) => {
      const raw = start.value + e.translationX;
      const clamped = Math.max(0, Math.min(raw, TRACK_WIDTH - THUMB_SIZE));
      const snapped = Math.round(clamped / STEP_WIDTH) * STEP_WIDTH;
      position.value = snapped;
      const step = Math.round(snapped / STEP_WIDTH);
      if (step !== lastStep.value) {
        lastStep.value = step;
        runOnJS(commit)(step);
        runOnJS(tick)();
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: position.value + THUMB_SIZE / 2,
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.container}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, fillStyle]} />
        </View>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  container: {
    width: TRACK_WIDTH,
    height: THUMB_SIZE,
    justifyContent: "center",
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: 99,
    backgroundColor: "#F2F2F7",
    overflow: "hidden",
    justifyContent: "center",
  },
  fill: {
    height: TRACK_HEIGHT,
    backgroundColor: "#34C759",
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 99,
    backgroundColor: "#F2F2F7",
    borderWidth: 2,
    borderColor: "#34C759",
  },
});
