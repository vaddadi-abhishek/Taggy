import { ThemeProvider, useNavigationTheme } from "@/src/context/ThemeContext";
import { Stack } from "expo-router";

export default function AppLayout() {
  const navTheme = useNavigationTheme();

  return (
    <ThemeProvider>
      <Stack theme={navTheme} screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
