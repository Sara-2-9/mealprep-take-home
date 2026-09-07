import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated as RNAnimated } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { DaySelector } from "../components/ui/day-selector";
import { MealPlanCard } from "../components/screens/meal-plan-card";
import { MealPlanCardSkeleton } from "../components/screens/meal-plan-card-skeleton";
import { useMealPlan } from "../hooks/use-meal-plan";
import { MEAL_PLAN, CONTENT_WIDTH, SCREEN_PADDING_X, WEEK_DAYS_FULL } from "../lib/theme";
import { useColors } from "../lib/colors";

/**
 * Screen 05 — Weekly meal plan (v2: 3 meals/day).
 * Green background (unchanged in dark mode), "Bon appetit!" title,
 * estimated-cost card, day selector and a horizontal day-card pager.
 * Final screen of the flow: no back button, no CTA.
 * The pager is an RN Animated.ScrollView: `scrollX` (native driver) feeds
 * the per-card parallax and the sliding day indicator; the swipe → active
 * day sync runs in the Animated.event listener (see use-meal-plan).
 */
export default function MealPlanScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const navigation = useNavigation();
  const {
    status,
    plan,
    streamedDays,
    displayedCost,
    selectedDay,
    selectDay,
    retry,
    pagerRef,
    scrollHandler,
    scrollX,
    pagerPadding,
  } = useMealPlan();

  // Disable swipe-back gesture on ALL parent navigators
  useEffect(() => {
    let parent = navigation.getParent();
    while (parent) {
      parent.setOptions({ gestureEnabled: false });
      parent = parent.getParent();
    }
    return () => {
      let p = navigation.getParent();
      while (p) {
        p.setOptions({ gestureEnabled: true });
        p = p.getParent();
      }
    };
  }, [navigation]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + (MEAL_PLAN.titleTop - 62) }]}>
      {/* Green screen in both modes → always dark status-bar icons */}
      <StatusBar style="dark" />

      <View style={styles.column}>
        <Text
          className="font-promo-bold"
          style={[styles.title, { color: colors.mealPlanTitle }]}
        >
          Bon appetit!
        </Text>

        <View style={[styles.costCard, { backgroundColor: colors.card }]}>
          <Text
            className="font-promo"
            style={[styles.costLabel, { color: colors.textSecondary }]}
          >
            Est. cost
          </Text>
          {status === "loading" ? (
            <View style={styles.costRow}>
              <CostValueSkeleton />
              <Text
                className="font-promo"
                style={[styles.costSuffix, { color: colors.text }]}
              >
                / week
              </Text>
            </View>
          ) : (
            <View style={styles.costRow}>
              <Text
                className="font-promo-bold"
                style={[styles.costValue, { color: colors.text }]}
              >
                €{Math.round(displayedCost)}
              </Text>
              <Text
                className="font-promo"
                style={[styles.costSuffix, { color: colors.text }]}
              >
                / week
              </Text>
            </View>
          )}
        </View>

        <View style={styles.dayRow}>
          <DaySelector
            selectedIndex={selectedDay}
            onSelect={selectDay}
            scrollX={scrollX}
            disabled={status === "error"}
          />
        </View>
      </View>

      <View style={styles.pagerArea}>
        {status === "error" ? (
          <View style={styles.errorWrap}>
            <ErrorCard onRetry={retry} />
          </View>
        ) : (
          <RNAnimated.ScrollView
            ref={pagerRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={MEAL_PLAN.cardStride}
            decelerationRate="fast"
            disableIntervalMomentum
            bounces={false}
            directionalLockEnabled
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: pagerPadding,
              gap: MEAL_PLAN.cardStride - MEAL_PLAN.cardWidth,
            }}
          >
            {/*
              Per-day streaming: while the plan generates, each day renders
              its complete card as soon as its element finishes; days still
              pending keep the skeleton. Every page gets the parallax.
            */}
            {status === "ready" && plan
              ? plan.days.map((day, index) => (
                  <ParallaxPage key={day.day} scrollX={scrollX} index={index}>
                    <MealPlanCard day={day} />
                  </ParallaxPage>
                ))
              : (streamedDays ?? WEEK_DAYS_FULL.map(() => null)).map(
                  (dayPlan, index) => (
                    <ParallaxPage
                      key={dayPlan?.day ?? WEEK_DAYS_FULL[index]}
                      scrollX={scrollX}
                      index={index}
                    >
                      {dayPlan ? (
                        <MealPlanCard day={dayPlan} />
                      ) : (
                        <MealPlanCardSkeleton />
                      )}
                    </ParallaxPage>
                  ),
                )}
          </RNAnimated.ScrollView>
        )}
      </View>
    </View>
  );
}

/**
 * Pager page wrapper — parallax driven by the shared `scrollX`:
 * the centered card is full opacity/scale, neighbours dim and shrink.
 * Bottom border-radius interpolates gradually: flat when centred,
 * rounded (24) when the card scales down as a neighbour.
 */
function ParallaxPage({
  scrollX,
  index,
  children,
}: {
  scrollX: RNAnimated.Value;
  index: number;
  children: React.ReactNode;
}) {
  const inputRange = [
    (index - 1) * MEAL_PLAN.cardStride,
    index * MEAL_PLAN.cardStride,
    (index + 1) * MEAL_PLAN.cardStride,
  ];
  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.72, 1, 0.72],
    extrapolate: "clamp",
  });
  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.96, 1, 0.96],
    extrapolate: "clamp",
  });

  // Reanimated shared value for border-radius (RN Animated can't interpolate it)
  const borderRadiusSV = useSharedValue(0);

  useEffect(() => {
    const id = scrollX.addListener(({ value }) => {
      const clamped = Math.min(
        Math.max((value - inputRange[0]) / (inputRange[2] - inputRange[0]), 0),
        1,
      );
      // 0 at centre (inputRange[1]), 1 at edges → 0-24 border radius
      const distFromCentre = Math.abs(clamped - 0.5) * 2; // 0 → 1
      borderRadiusSV.value = distFromCentre * 24;
    });
    return () => scrollX.removeListener(id);
  }, [scrollX, inputRange, borderRadiusSV]);

  const animatedBorderRadius = useAnimatedStyle(() => ({
    borderBottomLeftRadius: borderRadiusSV.value,
    borderBottomRightRadius: borderRadiusSV.value,
  }));

  return (
    <RNAnimated.View
      style={[styles.page, { opacity, transform: [{ scale }] }]}
    >
      <Animated.View style={[styles.pageInner, animatedBorderRadius]}>
        {children}
      </Animated.View>
    </RNAnimated.View>
  );
}

/** Pulsing placeholder for the Est. cost value while the plan generates. */
function CostValueSkeleton() {
  const colors = useColors();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.45, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.costSkeleton,
        { backgroundColor: colors.surface },
        pulse,
      ]}
    />
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  const [pressed, setPressed] = useState(false);
  const colors = useColors();
  return (
    <View style={[styles.errorCard, { backgroundColor: colors.card }]}>
      <Text
        className="font-promo-semibold"
        style={[styles.errorTitle, { color: colors.text }]}
      >
        Something went wrong
      </Text>
      <Text
        className="font-promo"
        style={[styles.errorText, { color: colors.textSecondary }]}
      >
        {"We couldn't generate your meal plan. Check your connection and try again."}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onRetry();
        }}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          styles.retryButton,
          { backgroundColor: colors.accent },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text
          className="font-promo"
          style={[styles.retryLabel, { color: colors.ctaLabel }]}
        >
          Try again
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#34C759",
  },
  column: {
    width: CONTENT_WIDTH,
    alignSelf: "center",
    paddingHorizontal: 0,
  },
  title: {
    fontSize: MEAL_PLAN.titleSize,
    lineHeight: MEAL_PLAN.titleLineHeight,
    textAlign: "center",
  },
  costCard: {
    height: MEAL_PLAN.costCardHeight,
    marginTop: MEAL_PLAN.costCardTop - MEAL_PLAN.titleTop - 56, // 12
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  costLabel: {
    fontSize: 16,
    lineHeight: 22.4,
  },
  costRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  costValue: {
    fontSize: 24,
    lineHeight: 33.5,
  },
  costSuffix: {
    fontSize: 16,
    lineHeight: 22.4,
  },
  costSkeleton: {
    width: 96,
    height: 33.5,
    borderRadius: 99,
  },
  dayRow: {
    marginTop: MEAL_PLAN.dayRowTop - MEAL_PLAN.costCardTop - MEAL_PLAN.costCardHeight, // 12
  },
  pagerArea: {
    flex: 1,
    marginTop: MEAL_PLAN.cardTop - MEAL_PLAN.dayRowTop - MEAL_PLAN.dayCellHeight, // 32
    // No bottom margin: cards bleed to the screen edge (Figma cardTop 306 +
    // cardHeight 546 = 852) — hence the top-only corner radius.
  },
  page: {
    width: MEAL_PLAN.cardWidth,
    alignSelf: "stretch",
  },
  pageInner: {
    flex: 1,
    overflow: "hidden",
  },
  errorWrap: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING_X + 8,
  },
  errorCard: {
    flex: 1,
    borderRadius: MEAL_PLAN.cardRadius,
    alignItems: "center",
    justifyContent: "center",
    padding: MEAL_PLAN.cardPadding,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    lineHeight: 28,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    borderRadius: 99,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  retryLabel: {
    fontSize: 16,
    lineHeight: 22.4,
  },
});
