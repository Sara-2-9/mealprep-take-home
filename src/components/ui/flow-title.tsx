import { Text, StyleSheet } from "react-native";
import { HEADER } from "../../lib/theme";
import { useColors } from "../../lib/colors";

/**
 * Title of flow screens 02–04 (Figma "Frame 12", 32pt at y=130). The back
 * button + progress bar row above it lives in the FIXED header rendered by
 * the root layout (`_layout.tsx`) — screens own only the title, so it can
 * slide with the transition while the chrome stays put.
 */
export function FlowTitle({ children }: { children: string }) {
  const colors = useColors();
  return (
    <Text
      className="font-promo-bold"
      style={[styles.title, { color: colors.text }]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    // The fixed header row (28pt) + its 20pt gap push the title to y=130
    marginTop: HEADER.backButtonSize + HEADER.gap,
    fontSize: HEADER.titleSize,
    lineHeight: HEADER.titleLineHeight,
  },
});
