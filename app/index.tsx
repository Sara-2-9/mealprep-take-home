import { useEffect } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { ScreenContainer } from "../components/ui/ScreenContainer";
import { CTAButton } from "../components/ui/CTAButton";

/**
 * Screen 01 — Lander. Pixel-perfect shell; the central assets are our creative
 * ownership per the brief: hero image + floating emojis with a gentle
 * Reanimated float loop (each emoji offset in phase).
 */
const EMOJIS: { char: string; top: number; left: number; delay: number }[] = [
  { char: "🍎", top: 190, left: 48, delay: 0 },
  { char: "🥩", top: 173, left: 214, delay: 400 },
  { char: "🥕", top: 277, left: 292, delay: 800 },
  { char: "🧀", top: 310, left: 16, delay: 1200 },
  { char: "🫒", top: 428, left: 284, delay: 1600 },
  { char: "🌽", top: 448, left: 53, delay: 2000 },
  { char: "🍆", top: 485, left: 174, delay: 2400 },
];

function FloatingEmoji({
  char,
  top,
  left,
  delay,
}: (typeof EMOJIS)[number]) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-12, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    );
  }, [delay, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text style={[styles.emoji, { top, left }, style]}>
      {char}
    </Animated.Text>
  );
}

export default function LanderScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <Text className="font-promo-bold" style={styles.logo}>
        MealPrep
      </Text>

      <View style={styles.heroArea}>
        {EMOJIS.map((e) => (
          <FloatingEmoji key={e.char} {...e} />
        ))}
        <Image
          source={require("../assets/images/lander-hero.png")}
          style={styles.hero}
          resizeMode="cover"
        />
      </View>

      <View style={styles.cta}>
        <CTAButton
          label="Create your meal plan"
          onPress={() => router.push("/budget")}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontSize: 48,
    lineHeight: 66.8,
    color: "#000000",
    textAlign: "center",
  },
  heroArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    width: 200,
    height: 200,
    borderRadius: 24,
  },
  emoji: {
    position: "absolute",
    fontSize: 40,
    width: 40,
    height: 40,
    lineHeight: 48,
    zIndex: 1,
  },
  cta: {
    alignItems: "center",
  },
});
