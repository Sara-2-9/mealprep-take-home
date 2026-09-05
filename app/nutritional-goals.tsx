import { View, StyleSheet } from "react-native";
import { ScreenContainer } from "../components/ui/ScreenContainer";
import { FlowHeader } from "../components/ui/FlowHeader";
import { OptionCard } from "../components/ui/OptionCard";
import { CTAButton } from "../components/ui/CTAButton";
import { useNutritionalGoals } from "../hooks/useNutritionalGoals";
import { STEP_PROGRESS, OPTION_GRID } from "../lib/theme";

/**
 * Screen 04 — Nutritional goals selection. 2x3 option grid, multi-select
 * with exclusive "None".
 */
export default function NutritionalGoalsScreen() {
  const { options, selected, toggle, canContinue, goBack, goNext } =
    useNutritionalGoals();

  return (
    <ScreenContainer>
      <FlowHeader
        title="Any nutritional goals?"
        progress={STEP_PROGRESS.nutritionalGoals}
        onBack={goBack}
      />

      <View style={styles.grid}>
        {options.map((option) => (
          <OptionCard
            key={option.id}
            emoji={option.emoji}
            label={option.label}
            selected={selected.includes(option.id)}
            onPress={() => toggle(option.id)}
          />
        ))}
      </View>

      <View style={styles.cta}>
        <CTAButton label="Continue" onPress={goNext} disabled={!canContinue} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: OPTION_GRID.gap,
    rowGap: OPTION_GRID.gap,
    marginTop: OPTION_GRID.top - 175, // grid top 254, header ends ~175
    justifyContent: "space-between",
  },
  cta: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
});
