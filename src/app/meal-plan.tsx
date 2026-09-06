import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { DaySelector } from "../components/ui/day-selector";
import { MealPlanCard } from "../components/screens/meal-plan-card";
import { MealPlanCardSkeleton } from "../components/screens/meal-plan-card-skeleton";
import { useMealPlan } from "../hooks/use-meal-plan";
import { MEAL_PLAN, CONTENT_WIDTH, SCREEN_PADDING_X, WEEK_DAYS_FULL } from "../lib/theme";
import { useColors } from "../lib/colors";

/**
 * Screen 05 — Weekly meal plan. Green background (unchanged in dark mode),
 * "Bon appetit!" title, estimated-cost card, day selector and a horizontal
 * day-card pager. Final screen of the flow: no back button, no CTA.
 * The pager is an Animated.ScrollView: swipe → selector sync runs in a
 * Reanimated worklet on the UI thread (see use-meal-plan).
 */
export default function MealPlanScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
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
    pagerPadding,
  } = useMealPlan();

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
            // The value comes from the LLM plan — show a skeleton (same
            // pulse as the day cards) until the real cost is confirmed.
            <CostValueSkeleton />
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
            // Stay interactive while streaming: the pager is swipeable
            // (cards + skeletons), so the selector must drive it too —
            // disabling one input but not the other breaks consistency.
            // Disabled only in the error state, where the pager is gone.
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
          <Animated.ScrollView
            ref={pagerRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={MEAL_PLAN.cardStride}
            decelerationRate="fast"
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
              pending keep the skeleton.
            */}
            {status === "ready" && plan
              ? plan.days.map((day) => <MealPlanCard key={day.day} day={day} />)
              : (streamedDays ?? WEEK_DAYS_FULL.map(() => null)).map(
                  (dayPlan, index) =>
                    dayPlan ? (
                      <MealPlanCard key={dayPlan.day} day={dayPlan} />
                    ) : (
                      <MealPlanCardSkeleton key={WEEK_DAYS_FULL[index]} />
                    ),
                )}
          </Animated.ScrollView>
        )}
      </View>
    </View>
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
        We couldn't generate your meal plan. Check your connection and try again.
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
    height: 28,
    borderRadius: 99,
    marginTop: 4,
  },
  dayRow: {
    marginTop: MEAL_PLAN.dayRowTop - MEAL_PLAN.costCardTop - MEAL_PLAN.costCardHeight, // 12
  },
  pagerArea: {
    flex: 1,
    marginTop: MEAL_PLAN.cardTop - MEAL_PLAN.dayRowTop - MEAL_PLAN.dayCellHeight, // 32
    marginBottom: MEAL_PLAN.cardTop - MEAL_PLAN.dayRowTop - MEAL_PLAN.dayCellHeight, // 32, same as top
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
