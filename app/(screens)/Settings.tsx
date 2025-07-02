import React, { useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  DeviceEventEmitter,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import eventBus from "@/src/utils/eventBus"; 

const SettingsScreen = () => {
  const { theme, mode, setThemeMode } = useTheme();
  const isDarkMode = theme === "dark";
  const styles = getStyles(isDarkMode);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("autoplay_videos").then((value) => {
      if (value !== null) {
        setAutoplayEnabled(value === "true");
      }
    });
  }, []);

  const toggleAutoplay = async () => {
    const newValue = !autoplayEnabled;
    setAutoplayEnabled(newValue);
    await AsyncStorage.setItem("autoplay_videos", newValue.toString());
    eventBus.emit("autoplayChanged", newValue);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace("/");
        },
      },
    ]);
  };

  const handleClearTags = () => {
    Alert.alert("Clear Tags", "Delete all your global manual tags?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(["user_tags", "bookmark_tag_map"]);
            DeviceEventEmitter.emit("globalTagsCleared");
            eventBus.emit("refreshFeed");
            Alert.alert("Success", "Global manual tags cleared.");
          } catch (error) {
            console.error("Failed to clear global tags:", error);
            Alert.alert("Error", "Failed to clear global tags.");
          }
        },
      },
    ]);
  };

  const showThemeSelector = () => {
    Alert.alert(
      "Select Theme",
      "Choose your preferred appearance mode:",
      [
        {
          text: "Light",
          onPress: () => setThemeMode("light"),
        },
        {
          text: "Dark",
          onPress: () => setThemeMode("dark"),
        },
        {
          text: "Default (System)",
          onPress: () => setThemeMode("default"),
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Preferences */}
        <Text style={styles.section}>PREFERENCES</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push("/src/(screens)/ConnectSocialMedia")}
          >
            <MaterialIcons name="link" size={22} color="#3573D1" />
            <View style={styles.textWrapper}>
              <Text style={styles.title}>Connected Accounts</Text>
              <Text style={styles.sub}>Manage Reddit connection</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={handleClearTags}>
            <Feather name="tag" size={22} color="#E67E22" />
            <View style={styles.textWrapper}>
              <Text style={styles.title}>Clear All Tags</Text>
              <Text style={styles.sub}>Remove all saved manual tags</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={showThemeSelector}>
            <Feather name="moon" size={22} color="#8e44ad" />
            <View style={[styles.textWrapper, { flex: 1 }]}>
              <Text style={styles.title}>Theme</Text>
              <Text style={styles.sub}>
                {mode === "default"
                  ? "System Default"
                  : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Media */}
        <Text style={styles.section}>MEDIA</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Feather name="video" size={22} color="#9b59b6" />
            <View style={[styles.textWrapper, { flex: 1 }]}>
              <Text style={styles.title}>Autoplay Videos</Text>
              <Text style={styles.sub}>
                {autoplayEnabled
                  ? "Videos play automatically"
                  : "Videos require tap"}
              </Text>
            </View>
            <Switch
              value={autoplayEnabled}
              onValueChange={toggleAutoplay}
              thumbColor={autoplayEnabled ? "#9b59b6" : "#888"}
              trackColor={{ false: "#999", true: "#d6b3ff" }}
            />
          </View>
        </View>

        {/* About */}
        <Text style={styles.section}>ABOUT</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row}>
            <Feather name="info" size={22} color="#3498db" />
            <View style={styles.textWrapper}>
              <Text style={styles.title}>Version</Text>
              <Text style={styles.sub}>1.0.0</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              Alert.alert(
                "Privacy Policy",
                "Taggy is committed to protecting your privacy. This Privacy Policy explains how we handle your data, and we've made it easy to understand.",
                [
                  { text: "Close", style: "cancel" },
                  {
                    text: "Read More",
                    onPress: () => router.push("/PrivacyPolicy"),
                  },
                ]
              )
            }
          >
            <Feather name="shield" size={22} color="#27ae60" />
            <View style={styles.textWrapper}>
              <Text style={styles.title}>Privacy Policy</Text>
              <Text style={styles.sub}>Read our terms and policies</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Privacy & Security */}
        <Text style={styles.section}>PRIVACY & SECURITY</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleLogout}>
            <Feather name="log-out" size={22} color="#e74c3c" />
            <View style={styles.textWrapper}>
              <Text style={styles.title}>Logout</Text>
              <Text style={styles.sub}>Clear session and return to login</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? "#121212" : "#f7f7f7",
    },
    container: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    section: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#aaa" : "#999",
      marginBottom: 6,
      marginLeft: 4,
    },
    card: {
      backgroundColor: isDark ? "#1e1e1e" : "#fff",
      borderRadius: 16,
      padding: 12,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 6,
    },
    textWrapper: {
      marginLeft: 12,
    },
    title: {
      fontSize: 15,
      fontWeight: "500",
      color: isDark ? "#fff" : "#222",
    },
    sub: {
      fontSize: 12,
      color: isDark ? "#ccc" : "#777",
    },
  });
