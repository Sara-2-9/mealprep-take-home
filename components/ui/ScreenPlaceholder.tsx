import { View, Text } from "react-native";

interface ScreenPlaceholderProps {
  step: string;
  title: string;
}

/** Temporary shell for Phase 0 — replaced by pixel-perfect screens in Phase 2. */
export function ScreenPlaceholder({ step, title }: ScreenPlaceholderProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <Text className="font-promo-bold text-3xl text-black">{step}</Text>
      <Text className="font-promo text-lg text-neutral-500 mt-2 text-center">
        {title}
      </Text>
    </View>
  );
}
