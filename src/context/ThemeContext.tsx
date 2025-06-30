// ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  Theme as NavigationTheme,
} from "@react-navigation/native";

type ThemeMode = "light" | "dark" | "default";

const ThemeContext = createContext<{
  theme: "light" | "dark";
  mode: ThemeMode;
  navigationTheme: NavigationTheme;
  setThemeMode: (mode: ThemeMode) => void;
}>({
  theme: "light",
  mode: "light",
  navigationTheme: NavigationLightTheme,
  setThemeMode: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>("default");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [navigationTheme, setNavigationTheme] = useState(NavigationLightTheme);

  const applyTheme = (newMode: ThemeMode) => {
    const resolved =
      newMode === "default"
        ? Appearance.getColorScheme() === "dark"
          ? "dark"
          : "light"
        : newMode;

    setTheme(resolved);
    setNavigationTheme(
      resolved === "dark" ? NavigationDarkTheme : NavigationLightTheme
    );
  };

  const setThemeMode = async (newMode: ThemeMode) => {
    setMode(newMode);
    await AsyncStorage.setItem("theme_preference", newMode);
    applyTheme(newMode);
  };

  useEffect(() => {
    AsyncStorage.getItem("theme_preference").then((stored) => {
      const pref = (stored || "default") as ThemeMode;
      setMode(pref);
      applyTheme(pref);
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, mode, navigationTheme, setThemeMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export const useNavigationTheme = () => useContext(ThemeContext).navigationTheme;
