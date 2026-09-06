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
import { ScreenContainer } from "../components/ui/screen-container";
import { CTAButton } from "../components/ui/cta-button";

/**
 * Screen 01 — Lander. Pixel-perfect shell; the central assets are our creative
 * ownership per the brief: hero image + floating emojis with a gentle
 * Reanimated float loop (each emoji offset in phase).
 *
 * Geometry: the Figma canvas (393×852) places the 200×200 hero at (97,312)
 * with the 40px emojis scattered around it. Both live inside a fixed-size
 * 353×400 "stage" that is centered as ONE unit in the available space —
 * so on any device height the emojis stay glued around the hero instead of
 * anchoring to the container top. Canvas → stage conversion: origin (16,160).
 */
const STAGE = { width: 353, height: 400 } as const;
const HERO = { size: 200, top: 312 - 160, left: (STAGE.width - 200) / 2 } as const;

const EMOJIS: { char: string; top: number; left: number; delay: number }[] = [
  { char: "🍎", top: 190 - 160, left: 48 - 16, delay: 0 },
  { char: "🥩", top: 173 - 160, left: 214 - 16, delay: 400 },
  { char: "🥕", top: 277 - 160, left: 292 - 16, delay: 800 },
  { char: "🧀", top: 310 - 160, left: 16 - 16, delay: 1200 },
  { char: "🫒", top: 428 - 160, left: 284 - 16, delay: 1600 },
  { char: "🌽", top: 448 - 160, left: 53 - 16, delay: 2000 },
  { char: "🍆", top: 485 - 160, left: 174 - 16, delay: 2400 },
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
        <View style={styles.stage}>
          {EMOJIS.map((e) => (
            <FloatingEmoji key={e.char} {...e} />
          ))}
          <Image
            source={require("../../assets/images/lander-hero.png")}
            style={styles.hero}
            resizeMode="cover"
          />
        </View>
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
  stage: {
    width: STAGE.width,
    height: STAGE.height,
  },
  hero: {
    position: "absolute",
    top: HERO.top,
    left: HERO.left,
    width: HERO.size,
    height: HERO.size,
    borderRadius: 24,
  },
  emoji: {
    position: "absolute",
    fontSize: 40,
    width: 46,
    height: 46,
    lineHeight: 48,
    zIndex: 1,
  },
  cta: {
    alignItems: "center",
  },
});
