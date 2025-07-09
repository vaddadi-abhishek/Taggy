// utils/preloadIcons.ts
import * as SplashScreen from "expo-splash-screen";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";

export async function preloadIcons() {
  try {
    // Keep splash screen visible while loading
    await SplashScreen.preventAutoHideAsync();

    // Load all icon fonts
    await Promise.all([
      Ionicons.loadFont(),   // For Ionicons (used in TopHeader)
      Feather.loadFont(),    // For Feather (used in TopHeader)
      MaterialIcons.loadFont(), // For MaterialIcons (used in Settings)
    ]);

  } catch (error) {
    console.error("Icon preloading failed:", error);
  }
}