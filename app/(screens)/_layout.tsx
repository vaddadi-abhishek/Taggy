import AntDesign from '@expo/vector-icons/AntDesign';
import { Tabs } from "expo-router";
import { TouchableOpacity } from "react-native";
import { useNavigationTheme } from "@/src/context/ThemeContext";
import eventBus from "@/src/utils/eventBus";
import { SearchProvider } from "@/src/context/SearchContext";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  const navigationTheme = useNavigationTheme();
  const { colors } = navigationTheme;
  const customHeaderColor = navigationTheme.dark ? "#1f1f1f" : colors.card;

  return (
    <SearchProvider>
      <Toast />
      <Tabs
        screenOptions={({ route, navigation }) => {
          const isHomeTab = route.name === "Home";

          return {
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
            // 🧠 Custom tab bar button only for Home
            tabBarButton: (props) => {
              if (isHomeTab) {
                const state = navigation.getState();
                const isFocused = state.routes[state.index].name === "Home";

                return (
                  <TouchableOpacity
                    {...props}
                    onPress={() => {
                      if (isFocused) {
                        eventBus.emit("scrollToTop");
                      }
                      props.onPress?.();
                    }}
                  />
                );
              }

              // Default for other tabs
              return <TouchableOpacity {...props} />;
            },
          };
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            tabBarIcon: ({ color }) => (
              <AntDesign name="home" size={24} color={color} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="Tags"
          options={{
            tabBarIcon: ({ color }) => (
              <AntDesign name="tagso" size={28} color={color} />
            ),
            headerTitle: 'Tag Manager',
          }}
        />
        <Tabs.Screen
          name="ConnectSocialMedia"
          options={{
            tabBarIcon: ({ color }) => (
              <AntDesign name="pluscircleo" size={24} color={color} />
            ),
            tabBarLabel: 'Connect',
            headerTitle: 'Connect Apps',
          }}
        />
        <Tabs.Screen
          name="Settings"
          options={{
            tabBarIcon: ({ color }) => (
              <AntDesign name="setting" size={24} color={color} />
            ),
            headerTitle: 'Settings',
          }}
        />
      </Tabs>
    </SearchProvider>

  );
}
