import { View, StyleSheet } from "react-native";
import { ScreenContainer } from "../../components/ui/screen-container";
import { OptionCard } from "../../components/ui/option-card";
import { CTAButton } from "../../components/ui/cta-button";
import { useNutritionalGoals } from "../../hooks/use-nutritional-goals";
import { OPTION_GRID } from "../../lib/theme";

/**
 * Screen 04 — Nutritional goals selection. 2x3 option grid, multi-select
 * with exclusive "None". Back button, progress bar and step title live in
 * the wizard Stack header (StepHeader).
 */
export default function NutritionalGoalsScreen() {
  const { options, selected, toggle, canContinue, goNext } =
    useNutritionalGoals();

  return (
    <ScreenContainer withTopInset={false}>
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
