import "../../global.css";
import "../polyfills";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

SplashScreen.preventAutoHideAsync();

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
        gets the same cream background as a last safety net behind the stack.
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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FDFFFB",
  },
});
