import { View, Text, StyleSheet } from "react-native";
import { ScreenContainer } from "../../components/ui/screen-container";
import { BudgetSlider } from "../../components/ui/budget-slider";
import { BudgetValue } from "../../components/ui/budget-value";
import { CTAButton } from "../../components/ui/cta-button";
import { useBudgetSelection } from "../../hooks/use-budget-selection";
import { useColors } from "../../lib/colors";

/**
 * Screen 02 — Budget selection. Weekly budget, EUR 25–150, step 5.
 * The big value renders through BudgetValue (masked green shine sweep,
 * faithful to the Figma "TextAnimationSliding" node). Back button, progress
 * bar and step title live in the wizard Stack header (StepHeader).
 */
export default function BudgetScreen() {
  const { budget, setBudget, goNext } = useBudgetSelection();
  const colors = useColors();

  return (
    <ScreenContainer withTopInset={false}>
      <View style={styles.center}>
        <BudgetValue value={budget} />
        <Text
          className="font-promo-medium"
          style={[styles.perWeek, { color: colors.textSecondary }]}
        >
          per week
        </Text>
        <View style={styles.sliderWrap}>
          <BudgetSlider value={budget} onChange={setBudget} />
        </View>
      </View>

      <View style={styles.cta}>
        <CTAButton label="Continue" onPress={goNext} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  perWeek: {
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
    marginTop: -18,
  },
  sliderWrap: {
    marginTop: 60,
  },
  cta: {
    alignItems: "center",
  },
});
