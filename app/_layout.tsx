import "../global.css";
import "../polyfills";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Promo-Thin": require("../assets/fonts/Promo-Thin.ttf"),
    "Promo-ExtraLight": require("../assets/fonts/Promo-ExtraLight.ttf"),
    "Promo-UltraLight": require("../assets/fonts/Promo-UltraLight.ttf"),
    "Promo-Light": require("../assets/fonts/Promo-Light.ttf"),
    "Promo-Regular": require("../assets/fonts/Promo-Regular.ttf"),
    "Promo-Normal": require("../assets/fonts/Promo-Normal.ttf"),
    "Promo-Medium": require("../assets/fonts/Promo-Medium.ttf"),
    "Promo-SemiBold": require("../assets/fonts/Promo-SemiBold.ttf"),
    "Promo-Bold": require("../assets/fonts/Promo-Bold.ttf"),
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="budget" />
        <Stack.Screen name="dietary-needs" />
        <Stack.Screen name="nutritional-goals" />
        <Stack.Screen name="meal-plan" />
      </Stack>
    </GestureHandlerRootView>
  );
}
