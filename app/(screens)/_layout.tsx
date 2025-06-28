import AntDesign from '@expo/vector-icons/AntDesign';
import { Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs>
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
