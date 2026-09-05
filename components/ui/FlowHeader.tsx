import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { BackButton } from "./BackButton";
import { ProgressBar } from "./ProgressBar";
import { HEADER, CONTENT_WIDTH } from "../../lib/theme";

interface FlowHeaderProps {
  title: string;
  /** 0..1 progress for the LoadingBar */
  progress: number;
  onBack: () => void;
}

/**
 * Shared header of flow screens 02–04 (Figma "Frame 12"):
 * back button + progress bar row (gap 10), then the 32pt title. Block top = 82.
 */
export const FlowHeader = memo(function FlowHeader({
  title,
  progress,
  onBack,
}: FlowHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <BackButton onPress={onBack} />
        <ProgressBar progress={progress} />
      </View>
      <Text className="font-promo" style={styles.title}>
        {title}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: CONTENT_WIDTH,
    gap: HEADER.gap,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: HEADER.backButtonSize,
  },
  title: {
    fontSize: HEADER.titleSize,
    lineHeight: HEADER.titleLineHeight,
    color: "#000000",
  },
});
