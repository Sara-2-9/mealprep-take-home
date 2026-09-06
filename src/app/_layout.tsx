import "../../global.css";
import "../polyfills";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Stack, usePathname, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "../components/ui/back-button";
import { ProgressBar } from "../components/ui/progress-bar";
import { CONTENT_WIDTH, HEADER, STEP_PROGRESS } from "../lib/theme";

SplashScreen.preventAutoHideAsync();

/**
 * Flow progress per route — drives the FIXED header below. The header lives
 * in the layout (not in the screens), so the ProgressBar never unmounts
 * during stack transitions and animates 25→50→75 in place.
 */
const ROUTE_PROGRESS: Record<string, number> = {
  "/budget": STEP_PROGRESS.budget,
  "/dietary-needs": STEP_PROGRESS.dietaryNeeds,
  "/nutritional-goals": STEP_PROGRESS.nutritionalGoals,
};

/**
 * Persistent flow header (Figma "Frame 12" row): back button + progress bar.
 * Rendered as an overlay above the Stack on screens 02–04; screens render
 * only their title (FlowTitle). Screen titles slide with the transition,
 * the chrome stays put.
 */
function FixedFlowHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const progress = ROUTE_PROGRESS[pathname];
  if (progress === undefined) return null;
  return (
    <View
      pointerEvents="box-none"
      style={[styles.header, { paddingTop: insets.top + (HEADER.top - 62) }]}
    >
      <View style={styles.headerRow}>
        <BackButton onPress={() => router.back()} />
        <ProgressBar progress={progress} />
      </View>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Promo-Thin": require("../../assets/fonts/Promo-Thin.ttf"),
    "Promo-ExtraLight": require("../../assets/fonts/Promo-ExtraLight.ttf"),
    "Promo-UltraLight": require("../../assets/fonts/Promo-UltraLight.ttf"),
    "Promo-Light": require("../../assets/fonts/Promo-Light.ttf"),
    "Promo-Regular": require("../../assets/fonts/Promo-Regular.ttf"),
    "Promo-Normal": require("../../assets/fonts/Promo-Normal.ttf"),
    "Promo-Medium": require("../../assets/fonts/Promo-Medium.ttf"),
    "Promo-SemiBold": require("../../assets/fonts/Promo-SemiBold.ttf"),
    "Promo-Bold": require("../../assets/fonts/Promo-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      {/*
        Transition glitch fix (iOS 26): the default native-stack push uses the
        new card-style transition with rounded corners, and the native screen
        view is transparent by default — so during the slide the underlying
        screen flashes through the corner gaps. `simple_push` restores the
        classic full-screen slide (no corner radius), and an opaque
        `contentStyle` background per screen kills any residual transparency
        flicker. `animationMatchesGesture` makes the interactive swipe-back
        use the same full-screen slide — iOS would otherwise force the
        card-style system transition for gesture-driven pops. The root view
        gets the same background as a last safety net behind the stack.
      */}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "simple_push",
          animationMatchesGesture: true,
          contentStyle: { backgroundColor: "#FDFFFB" },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="budget" />
        <Stack.Screen name="dietary-needs" />
        <Stack.Screen name="nutritional-goals" />
        <Stack.Screen
          name="meal-plan"
          options={{ contentStyle: { backgroundColor: "#34C759" } }}
        />
      </Stack>
      <FixedFlowHeader />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FDFFFB",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: CONTENT_WIDTH,
    height: HEADER.backButtonSize,
  },
});
