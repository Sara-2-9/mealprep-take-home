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
import { useColors } from "../lib/colors";

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
 *
 * The raw Figma scatter is asymmetric (cluster bbox center sits ~15px left
 * and ~8px above the stage center), so we re-center the cluster's bounding
 * box on the stage rect and center the hero on the stage: composition
 * center ≡ stage center ≡ screen center, horizontally and vertically.
 * Everything is computed from EMOJIS, so the pieces can never drift apart.
 */
const STAGE = { width: 353, height: 400 } as const;
const EMOJI_BOX = 46; // emoji layout box, see styles.emoji

// Figma canvas (393×852) → stage (353×400):
// Bag Figma center (197, 412) → stage center (176.5, 200)
// Scene origin: (20.5, 212)
const EMOJIS: { char: string; top: number; left: number; delay: number }[] = [
  { char: "🍎", top: 60, left: 51.5, delay: 0 },     // Figma (72, 272)
  { char: "🥩", top: 43, left: 217.5, delay: 400 },  // Figma (238, 255)
  { char: "🥕", top: 147, left: 295.5, delay: 800 }, // Figma (316, 359)
  { char: "🧀", top: 180, left: 8.5, delay: 1200 },  // Figma (29, 392)
  { char: "🫒", top: 298, left: 287.5, delay: 1600 },// Figma (308, 510)
  { char: "🌽", top: 318, left: 56.5, delay: 2000 }, // Figma (77, 530)
  { char: "🍆", top: 355, left: 177.5, delay: 2400 },// Figma (198, 567)
];

const clusterBBox = {
  minLeft: Math.min(...EMOJIS.map((e) => e.left)),
  maxRight: Math.max(...EMOJIS.map((e) => e.left)) + EMOJI_BOX,
  minTop: Math.min(...EMOJIS.map((e) => e.top)),
  maxBottom: Math.max(...EMOJIS.map((e) => e.top)) + EMOJI_BOX,
};
const CLUSTER_OFFSET = {
  x:
    (STAGE.width - (clusterBBox.maxRight - clusterBBox.minLeft)) / 2 -
    clusterBBox.minLeft,
  y:
    (STAGE.height - (clusterBBox.maxBottom - clusterBBox.minTop)) / 2 -
    clusterBBox.minTop,
};
const CENTERED_EMOJIS = EMOJIS.map((e) => ({
  ...e,
  left: e.left + CLUSTER_OFFSET.x,
  top: e.top + CLUSTER_OFFSET.y,
}));

const HERO = {
  size: 200,
  left: (STAGE.width - 200) / 2,
  top: (STAGE.height - 240) / 2,
} as const;

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
  const colors = useColors();

  return (
    <ScreenContainer>
      <Text className="font-promo-bold" style={[styles.logo, { color: colors.text }]}>
        MealPrep
      </Text>

      <View style={styles.heroArea}>
        <View style={styles.stage}>
          {CENTERED_EMOJIS.map((e) => (
            <FloatingEmoji key={e.char} {...e} />
          ))}
          <Image
            // Transparent-background bag: works on both the cream light
            // background and the #121612 dark one
            source={require("../../assets/images/lander-hero-without-bg.png")}
            style={styles.hero}
            resizeMode="contain"
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
    width: EMOJI_BOX,
    height: EMOJI_BOX,
    lineHeight: 48,
    zIndex: 1,
  },
  cta: {
    alignItems: "center",
  },
});
