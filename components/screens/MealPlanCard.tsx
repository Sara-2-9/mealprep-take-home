import { memo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import type { DayPlan } from "../../lib/mealPlan";
import { MEAL_PLAN } from "../../lib/theme";
import { ClockIcon, ServingsIcon, CashIcon } from "../ui/MetaIcons";

interface MealPlanCardProps {
  day: DayPlan;
}

/**
 * Screen 05 day card (Figma "Frame 31") — 337pt white card, padding 24.
 * Content per the updated design (05_Weekly_meal_plan-Sara):
 * day name → meal title → meta row → Ingredients (green bullets) →
 * Recipe (green numbered steps). Scrolls vertically when content overflows.
 */
export const MealPlanCard = memo(function MealPlanCard({ day }: MealPlanCardProps) {
  const { meal } = day;
  return (
    <View style={styles.card}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text className="font-promo" style={styles.dayName}>
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
              <Text className="font-promo-semibold" style={styles.stepNumber}>
                {index + 1}
              </Text>
              <Text className="font-promo" style={styles.bodyText}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
  stepNumber: {
    fontSize: 14,
    lineHeight: 22,
    color: "#34C759",
    minWidth: 12,
  },
  bodyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: "#000000",
  },
});
