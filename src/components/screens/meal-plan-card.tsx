import { useRef, useState } from "react";
import { Animated, View, Text, StyleSheet } from "react-native";
import type { DayPlan } from "../../lib/meal-plan";
import { MEAL_PLAN } from "../../lib/theme";
import { useColors } from "../../lib/colors";
import { ClockIcon, ServingsIcon, CashIcon } from "../ui/meta-icons";

interface MealPlanCardProps {
  day: DayPlan;
}

/** Ingredient pill (fixed palette from the spec, both modes) */
const PILL = { background: "#DDF5E3", text: "#174D25" } as const;

/**
 * Screen 05 day card (Figma "Frame 31") — 337pt sheet, top corners r=24,
 * bleeding to the bottom screen edge; padding 24 (bottom 48).
 * Content: day name → meal title → meta row → Ingredients (green pills,
 * "amount · name") → Recipe (numbered steps, ink number on surface circle).
 * Vertical scrolling shows a custom primary-green scrollbar (RN's native
 * indicator can't be tinted). Dark mode: #121612 card, white text.
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
          className="font-promo-semibold"
          style={[styles.dayName, { color: colors.text }]}
        >
          {day.day}
        </Text>

        <Text
          className="font-promo-semibold"
          style={[styles.mealName, { color: colors.text }]}
          numberOfLines={2}
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
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  content: {
    padding: MEAL_PLAN.cardPadding, // 24
    paddingBottom: 48,
  },
  dayName: {
    fontSize: 24,
    lineHeight: 33,
  },
  mealName: {
    marginTop: 28,
    fontSize: 16,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 17,
  },
  sectionTitle: {
    marginTop: 28,
    fontSize: 14,
    lineHeight: 19,
  },
  ingredientList: {
    gap: 8,
    marginTop: 12,
  },
  ingredientPill: {
    alignSelf: "flex-start",
    backgroundColor: PILL.background,
    borderRadius: 999,
    borderCurve: "continuous",
    minHeight: 22,
    paddingHorizontal: 10,
    paddingVertical: 3,
    justifyContent: "center",
  },
  ingredientText: {
    color: PILL.text,
    fontSize: 12,
    lineHeight: 16,
  },
  stepList: {
    gap: 14,
    marginTop: 12,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 12,
    lineHeight: 16,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  scrollbar: {
    position: "absolute",
    top: MEAL_PLAN.cardPadding,
    right: 8,
    width: 4,
    borderRadius: 2,
  },
});
