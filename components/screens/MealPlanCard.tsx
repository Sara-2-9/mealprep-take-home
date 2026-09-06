import { memo, useRef, useState } from "react";
import { Animated, View, Text, StyleSheet } from "react-native";
import type { DayPlan } from "../../lib/mealPlan";
import { MEAL_PLAN } from "../../lib/theme";
import { ClockIcon, ServingsIcon, CashIcon } from "../ui/MetaIcons";

interface MealPlanCardProps {
  day: DayPlan;
}

const SCROLLBAR_COLOR = "#E9FEF2";

/**
 * Screen 05 day card (Figma "Frame 31") — 337pt white card, padding 24.
 * Content per the updated design (05_Weekly_meal_plan-Sara):
 * day name → meal title → meta row → Ingredients (green bullets) →
 * Recipe (green-numbered steps in #E9FEF2 ellipses). Vertical scrolling
 * shows a custom #E9FEF2 scrollbar (RN's native indicator can't be tinted).
 */
export const MealPlanCard = memo(function MealPlanCard({ day }: MealPlanCardProps) {
  const { meal } = day;

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
    <View style={styles.card}>
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
        <Text className="font-promo-bold" style={styles.dayName}>
          {day.day}
        </Text>

        <View style={styles.mealBlock}>
          <Text className="font-promo-semibold" style={styles.mealName}>
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
          <Text className="font-promo-semibold" style={styles.sectionTitle}>
            Ingredients
          </Text>
          {meal.ingredients.map((ingredient, index) => (
            <View key={`${ingredient.productId}-${index}`} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text className="font-promo" style={styles.bodyText}>
                {ingredient.amount} {ingredient.name}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text className="font-promo-semibold" style={styles.sectionTitle}>
            Recipe
          </Text>
          {meal.steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepEllipse}>
                <Text className="font-promo-semibold" style={styles.stepNumber}>
                  {index + 1}
                </Text>
              </View>
              <Text className="font-promo" style={styles.bodyText}>
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
              height: indicatorH,
              opacity: indicatorOpacity,
              transform: [{ translateY }],
            },
          ]}
        />
      )}
    </View>
  );
});

const MetaItem = memo(function MetaItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <View style={styles.metaItem}>
      {icon}
      <Text className="font-promo" style={styles.metaText}>
        {label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: MEAL_PLAN.cardWidth,
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    color: "#000000",
  },
  mealBlock: {
    gap: 4,
  },
  mealName: {
    fontSize: 16,
    lineHeight: 22.3,
    color: "#000000",
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
    color: "rgba(60,60,67,0.6)",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 19.5,
    color: "#000000",
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
    backgroundColor: "#34C759",
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
    backgroundColor: SCROLLBAR_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: {
    fontSize: 12,
    lineHeight: 16,
    color: "#34C759",
  },
  bodyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: "#000000",
  },
  scrollbar: {
    position: "absolute",
    top: MEAL_PLAN.cardPadding,
    right: 8,
    width: 4,
    borderRadius: 2,
    backgroundColor: SCROLLBAR_COLOR,
  },
});
