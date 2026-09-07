import { Platform, StyleSheet, View } from "react-native";
import { Stack, usePathname } from "expo-router";
import { StepHeader } from "../../components/ui/step-header";
import { useColors } from "../../lib/colors";
import { STEP_PROGRESS } from "../../lib/theme";

/**
 * Step progress + title per wizard route, keyed by pathname.
 */
const steps: Record<string, { progress: number; title: string }> = {
  "/budget": { progress: STEP_PROGRESS.budget, title: "What's your budget?" },
  "/dietary-needs": {
    progress: STEP_PROGRESS.dietaryNeeds,
    title: "Any dietary needs?",
  },
  "/nutritional-goals": {
    progress: STEP_PROGRESS.nutritionalGoals,
    title: "Any nutritional goals?",
  },
};

/**
 * Wizard flow (screens 02–04). The StepHeader is rendered ONCE by this
 * layout, in normal flow above the Stack — it never unmounts during
 * push/pop inside the group, so the chrome (back + progress bar + title)
 * stays fixed while screens slide underneath and the ProgressBar animates
 * 25→50→75 in place. Popping from budget back to the lander happens at the
 * ROOT stack level, so the whole group (header included) slides away with
 * the transition — no lingering overlap with the lander.
 *
 * `simple_push` (iOS) restores the classic full-screen slide: the default
 * card-style transition has rounded corners and a transparent screen view,
 * so the underlying screen flashes through during the slide (iOS 26).
 * `animationMatchesGesture` keeps the interactive swipe-back on the same
 * animation; the opaque `contentStyle` kills residual transparency flicker.
 */
export default function WizardLayout() {
  const colors = useColors();
  const pathname = usePathname();
  const step = steps[pathname] ?? steps["/budget"];

  return (
    <View
      style={[styles.root, { backgroundColor: colors.screenBackground }]}
    >
      <StepHeader progress={step.progress} title={step.title} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: Platform.OS === "ios" ? "simple_push" : "ios_from_right",
          animationMatchesGesture: true,
          // Disable the black dimming view (alpha 0.1) that simple_push puts
          // over the outgoing screen: the wizard header is FIXED above the
          // Stack, so dimming only the screen content would show a color
          // mismatch between header and content during transitions.
          fullScreenGestureShadowEnabled: false,
          contentStyle: { backgroundColor: colors.screenBackground },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
