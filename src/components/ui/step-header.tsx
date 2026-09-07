import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "./back-button";
import { ProgressBar } from "./progress-bar";
import { CONTENT_WIDTH, HEADER } from "../../lib/theme";
import { useColors } from "../../lib/colors";

interface StepHeaderProps {
  /** 0..1 — wizard step fraction (25/50/75) */
  progress: number;
  /** Step title (Figma "Frame 12", 32pt) */
  title: string;
}

/**
 * Wizard header (screens 02–04): back button + progress bar row, then the
 * step title. Rendered by the `(wizard)` Stack via its `header` screen
 * option. A custom native-stack header lays out from y=0 of the screen, so
 * the top safe-area inset is applied HERE (pattern recommended by React
 * Navigation for custom headers) — the header always clears the notch /
 * status bar / Dynamic Island, on every device. The extra 20pt is the Figma
 * gap between status bar (62) and header content (82).
 */
export function StepHeader({ progress, title }: StepHeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + (HEADER.top - 62) }]}
    >
      <View style={styles.row}>
        <BackButton onPress={() => router.back()} />
        <ProgressBar progress={progress} />
      </View>
      <Text
        className="font-promo-bold"
        style={[styles.title, { color: colors.text }]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CONTENT_WIDTH,
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: HEADER.backButtonSize,
  },
  title: {
    marginTop: HEADER.gap,
    fontSize: HEADER.titleSize,
    lineHeight: HEADER.titleLineHeight,
  },
});
