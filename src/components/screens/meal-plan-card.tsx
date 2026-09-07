import { useState, useCallback, useEffect, Fragment } from "react";
import {
  Animated,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import type { DayPlan, PlanMeal, MealType } from "../../lib/meal-plan";
import { MEAL_PLAN } from "../../lib/theme";
import { useColors, type Colors } from "../../lib/colors";
import {
  BreakfastIcon,
  LunchIcon,
  DinnerIcon,
  ChevronDownIcon,
} from "../ui/meta-icons";

interface MealPlanCardProps {
  day: DayPlan;
}

/** Ingredient pill (fixed palette from the spec, both modes) */
const PILL = { background: "#DDF5E3", text: "#174D25" } as const;

/** Meal type labels for display */
const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

/** Meal type icons */
function MealTypeIcon({ type, size = 16 }: { type: MealType; size?: number }) {
  switch (type) {
    case "breakfast":
      return <BreakfastIcon size={size} />;
    case "lunch":
      return <LunchIcon size={size} />;
    case "dinner":
      return <DinnerIcon size={size} />;
  }
}

/**
 * Screen 05 day card (v2: 3 meals per day).
 * Vertical list of expandable MealItem components. All meals are expanded
 * by default; the user can collapse individual meals.
 */
export function MealPlanCard({ day }: MealPlanCardProps) {
  const colors = useColors();

  const [scrollY] = useState(() => new Animated.Value(0));
  const [indicatorOpacity] = useState(() => new Animated.Value(0));
  const [contentH, setContentH] = useState(0);
  const [viewH, setViewH] = useState(0);

  const scrollable = contentH > viewH + 1 && viewH > 0;
  const trackH = Math.max(viewH - MEAL_PLAN.cardPadding * 2, 0);
  const indicatorH = scrollable
    ? Math.max((viewH / contentH) * trackH, 24)
    : 0;
  const translateY = scrollY.interpolate({
    inputRange: [0, Math.max(contentH - viewH, 1)],
    outputRange: [0, Math.max(trackH - indicatorH, 0)],
    extrapolate: "clamp",
  });

  const showIndicator = () => {
    if (!scrollable) return;
    Animated.timing(indicatorOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };
  const hideIndicator = () => {
    Animated.timing(indicatorOpacity, {
      toValue: 0,
      duration: 400,
      delay: 500,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        onScrollBeginDrag={showIndicator}
        onMomentumScrollBegin={showIndicator}
        onScrollEndDrag={hideIndicator}
        onMomentumScrollEnd={hideIndicator}
        onLayout={(e) => setViewH(e.nativeEvent.layout.height)}
        onContentSizeChange={(_, h) => setContentH(h)}
      >
        <Text
          className="font-promo-semibold"
          style={[styles.dayName, { color: colors.text }]}
        >
          {day.day}
        </Text>

        {day.meals.map((meal, index) => (
          <Fragment key={meal.type}>
            <MealItem
              meal={meal}
              colors={colors}
              animationDelay={index * 500}
            />
            {index < day.meals.length - 1 && (
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.textSecondary },
                ]}
              />
            )}
          </Fragment>
        ))}
      </Animated.ScrollView>

      {scrollable && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.scrollbar,
            {
              backgroundColor: colors.accent,
              height: indicatorH,
              opacity: indicatorOpacity,
              transform: [{ translateY }],
            },
          ]}
        />
      )}
    </View>
  );
}

/**
 * Single meal item — expandable/collapsible with animated content height.
 * Shows a header with icon, name, meta, and an expand arrow.
 * When expanded, shows ingredients and recipe steps.
 */
function MealItem({
  meal,
  colors,
  animationDelay,
}: {
  meal: PlanMeal;
  colors: Colors;
  animationDelay: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const [contentHeight] = useState(() => new Animated.Value(1));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  // Entrance animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: animationDelay,
      useNativeDriver: true,
    }).start();
  }, [animationDelay, fadeAnim]);

  // Expand/collapse animation
  const toggle = useCallback(() => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(contentHeight, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start(() => setExpanded((prev) => !prev));
  }, [expanded, contentHeight]);

  const rotate = contentHeight.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const maxHeight = contentHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 800],
  });

  return (
    <Animated.View
      style={[
        styles.mealContainer,
        { opacity: fadeAnim },
      ]}
    >
      {/* Header — always visible, tap to expand/collapse */}
      <Pressable onPress={toggle} style={styles.mealHeader}>
        <View style={styles.mealHeaderLeft}>
          <MealTypeIcon type={meal.type} />
          <View style={styles.mealHeaderInfo}>
            <Text
              className="font-promo-semibold"
              style={[styles.mealTypeName, { color: colors.text }]}
            >
              {MEAL_TYPE_LABELS[meal.type]}
            </Text>
            <Text
              className="font-promo"
              style={[styles.mealMeta, { color: colors.textSecondary }]}
            >
              {meal.prepTimeMinutes}min · {meal.servings} servings · €
              {meal.pricePerServing.toFixed(2)}/serving
            </Text>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDownIcon />
        </Animated.View>
      </Pressable>

      {/* Collapsible content */}
      <Animated.View style={{ maxHeight, overflow: "hidden" }}>
        <View style={styles.mealContent}>
          <Text
            className="font-promo-semibold"
            style={[styles.mealName, { color: colors.text }]}
            numberOfLines={2}
          >
            {meal.name}
          </Text>

          <Text
            className="font-promo-semibold"
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Ingredients
          </Text>
          <View style={styles.ingredientList}>
            {meal.ingredients.map((ingredient, index) => (
              <View
                key={`${ingredient.productId}-${index}`}
                style={styles.ingredientPill}
              >
                <Text
                  className="font-promo"
                  style={styles.ingredientText}
                  numberOfLines={1}
                >
                  {ingredient.amount} · {ingredient.name}
                </Text>
              </View>
            ))}
          </View>

          <Text
            className="font-promo-semibold"
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Recipe
          </Text>
          <View style={styles.stepList}>
            {meal.steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepNumber,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Text
                    className="font-promo-semibold"
                    style={[styles.stepNumberText, { color: colors.text }]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text
                  className="font-promo"
                  style={[styles.stepText, { color: colors.text }]}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  content: {
    padding: MEAL_PLAN.cardPadding,
    paddingBottom: 48,
  },
  dayName: {
    fontSize: 24,
    lineHeight: 33,
    marginBottom: 16,
  },
  mealContainer: {
    paddingBottom: 4,
  },
  /** Hairline between meals — same gray as the meta details (textSecondary) */
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  mealHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  mealHeaderInfo: {
    flex: 1,
  },
  mealTypeName: {
    fontSize: 14,
    lineHeight: 20,
  },
  mealMeta: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  mealContent: {
    paddingTop: 4,
  },
  mealName: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6,
  },
  ingredientList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  ingredientPill: {
    backgroundColor: PILL.background,
    borderRadius: 999,
    borderCurve: "continuous",
    minHeight: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    justifyContent: "center",
  },
  ingredientText: {
    color: PILL.text,
    fontSize: 11,
    lineHeight: 15,
  },
  stepList: {
    gap: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 10,
    lineHeight: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  scrollbar: {
    position: "absolute",
    top: MEAL_PLAN.cardPadding,
    right: 8,
    width: 4,
    borderRadius: 2,
  },
});
