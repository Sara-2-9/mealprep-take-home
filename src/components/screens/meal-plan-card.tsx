import { useRef, useState } from "react";
import { Animated, View, Text, StyleSheet } from "react-native";
import type { DayPlan } from "../../lib/meal-plan";
import { MEAL_PLAN } from "../../lib/theme";
import { useColors } from "../../lib/colors";
import { ClockIcon, ServingsIcon, CashIcon } from "../ui/meta-icons";

interface MealPlanCardProps {
  day: DayPlan;
}

/**
 * Screen 05 day card (Figma "Frame 31") — 337pt card, padding 24.
 * Content per the updated design (05_Weekly_meal_plan-Sara):
 * day name → meal title → meta row → Ingredients (green bullets) →
 * Recipe (green-numbered steps in tinted ellipses). Vertical scrolling
 * shows a custom tinted scrollbar (RN's native indicator can't be tinted).
 * Dark mode: #121612 card, white text, #1E2B24 ellipses/scrollbar.
 */
export function MealPlanCard({ day }: MealPlanCardProps) {
  const { meal } = day;
  const colors = useColors();

  const scrollY = useRef(new Animated.Value(0)).current;
  const indicatorOpacity = useRef(new Animated.Value(0)).current;
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
          className="font-promo-bold"
          style={[styles.dayName, { color: colors.text }]}
        >
          {day.day}
        </Text>

        <View style={styles.mealBlock}>
          <Text
            className="font-promo-semibold"
            style={[styles.mealName, { color: colors.text }]}
          >
            {meal.name}
          </Text>
          <View style={styles.metaRow}>
            <MetaItem icon={<ClockIcon />} label={`${meal.prepTimeMinutes} min`} />
            <MetaItem icon={<ServingsIcon />} label={`${meal.servings} servings`} />
            <MetaItem
              icon={<CashIcon />}
              label={`€${meal.pricePerServing.toFixed(2)} / serving`}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text
            className="font-promo-semibold"
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Ingredients
          </Text>
          {meal.ingredients.map((ingredient, index) => (
            <View key={`${ingredient.productId}-${index}`} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: colors.accent }]} />
              <Text
                className="font-promo"
                style={[styles.bodyText, { color: colors.text }]}
              >
                {ingredient.amount} {ingredient.name}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text
            className="font-promo-semibold"
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Recipe
          </Text>
          {meal.steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View
                style={[
                  styles.stepEllipse,
                  { backgroundColor: colors.surfaceSelected },
                ]}
              >
                <Text
                  className="font-promo-semibold"
                  style={[styles.stepNumber, { color: colors.accent }]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                className="font-promo"
                style={[styles.bodyText, { color: colors.text }]}
              >
                {step}
              </Text>
            </View>
          ))}
        </View>
      </Animated.ScrollView>

      {scrollable && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.scrollbar,
            {
              backgroundColor: colors.surfaceSelected,
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

function MetaItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.metaItem}>
      {icon}
      <Text
        className="font-promo"
        style={[styles.metaText, { color: colors.textSecondary }]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: MEAL_PLAN.cardWidth,
    flex: 1,
    borderRadius: MEAL_PLAN.cardRadius,
    overflow: "hidden",
  },
  content: {
    padding: MEAL_PLAN.cardPadding,
    gap: MEAL_PLAN.cardGap,
  },
  dayName: {
    fontSize: 24,
    lineHeight: 33.4,
  },
  mealBlock: {
    gap: 4,
  },
  mealName: {
    fontSize: 16,
    lineHeight: 22.3,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 16.9,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 19.5,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingLeft: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingLeft: 4,
  },
  stepEllipse: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: {
    fontSize: 12,
    lineHeight: 16,
  },
  bodyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  scrollbar: {
    position: "absolute",
    top: MEAL_PLAN.cardPadding,
    right: 8,
    width: 4,
    borderRadius: 2,
  },
});
