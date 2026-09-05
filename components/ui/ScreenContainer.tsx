import { memo, type ReactNode } from "react";
import { View, StyleSheet, useWindowDimensions, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SCREEN_PADDING_X, CONTENT_WIDTH, HEADER, CTA } from "../../lib/theme";

interface ScreenContainerProps {
  children: ReactNode;
  /** Screen background — cream for 01–04, primary green for 05 */
  backgroundColor?: string;
  style?: ViewStyle;
}

/**
 * Shared screen shell mapping the Figma 393x852 canvas to the device:
 * header content starts at y=82 (status bar 62 + 20), CTA keeps its 57px
 * bottom margin above the home indicator. On devices wider than the 393pt
 * canvas the 353pt content column is centered instead of left-anchored.
 */
export const ScreenContainer = memo(function ScreenContainer({
  children,
  backgroundColor = "#FDFFFB",
  style,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const paddingHorizontal = Math.max(SCREEN_PADDING_X, (width - CONTENT_WIDTH) / 2);
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor,
          paddingTop: insets.top + (HEADER.top - 62),
          paddingBottom: insets.bottom + (CTA.bottom - 34),
          paddingHorizontal,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});
