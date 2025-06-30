import AntDesign from '@expo/vector-icons/AntDesign';
import { Tabs } from "expo-router";
import { useNavigationTheme } from "@/src/context/ThemeContext";

export default function RootLayout() {
  const navigationTheme = useNavigationTheme();
  const { colors } = navigationTheme;
  const customHeaderColor = navigationTheme.dark ? "#1f1f1f" : colors.card;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: customHeaderColor,
        },
        headerTitleStyle: {
          color: colors.text,
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen name="Home" options={{
        tabBarIcon: ({ color }) => (<AntDesign name="home" size={24} color={color} />),
        headerTitle: 'Home',
        headerShown: false
      }} />
      {/* Tags */}
      <Tabs.Screen name="Tags" options={{
        tabBarIcon: ({ color }) => (<AntDesign name="tagso" size={28} color={color} />),
        headerTitle: 'Tag Manager'
      }} />
      <Tabs.Screen name="ConnectSocialMedia" options={{
        tabBarIcon: ({ color }) => (<AntDesign name="pluscircleo" size={24} color={color} />),
        tabBarLabel: 'Connect',
        headerTitle: 'Connect Apps'
      }} />
      <Tabs.Screen name="Settings" options={{
        tabBarIcon: ({ color }) => (<AntDesign name="setting" size={24} color={color} />),
        headerTitle: 'Settings'
      }} />
    </Tabs>
  );
}
