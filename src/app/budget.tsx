import { View, Text, StyleSheet } from "react-native";
import { ScreenContainer } from "../components/ui/screen-container";
import { FlowHeader } from "../components/ui/flow-header";
import { BudgetSlider } from "../components/ui/budget-slider";
import { BudgetValue } from "../components/ui/budget-value";
import { CTAButton } from "../components/ui/cta-button";
import { useBudgetSelection } from "../hooks/use-budget-selection";
import { STEP_PROGRESS } from "../lib/theme";

/**
 * Screen 02 — Budget selection. Weekly budget, EUR 25–150, step 5.
 * The big value renders through BudgetValue (masked green shine sweep,
 * faithful to the Figma "TextAnimationSliding" node).
 */
export default function BudgetScreen() {
  const { budget, setBudget, goBack, goNext } = useBudgetSelection();

  return (
    <ScreenContainer>
      <FlowHeader
        title="What's your budget?"
        progress={STEP_PROGRESS.budget}
        onBack={goBack}
      />

      <View style={styles.center}>
        <BudgetValue value={budget} />
        <Text className="font-promo-medium" style={styles.perWeek}>
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
    color: "rgba(60,60,67,0.6)",
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
