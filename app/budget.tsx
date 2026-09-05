import { View, Text, StyleSheet } from "react-native";
import { ScreenContainer } from "../components/ui/ScreenContainer";
import { FlowHeader } from "../components/ui/FlowHeader";
import { BudgetSlider } from "../components/ui/BudgetSlider";
import { CTAButton } from "../components/ui/CTAButton";
import { useBudgetSelection } from "../hooks/useBudgetSelection";
import { STEP_PROGRESS } from "../lib/theme";

/**
 * Screen 02 — Budget selection. Weekly budget, EUR 25–150, step 5.
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
        <Text className="font-promo" style={styles.value}>
          €{budget}
        </Text>
        <Text className="font-promo" style={styles.perWeek}>
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
  value: {
    fontSize: 96,
    lineHeight: 133.5,
    color: "#1A1A1A",
    textAlign: "center",
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
