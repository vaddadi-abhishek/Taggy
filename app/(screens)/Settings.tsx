import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
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
import Modal from "react-native-modal";

const SettingsScreen = () => {
  const { theme, mode, setThemeMode } = useTheme();
  const isDarkMode = theme === "dark";
  const styles = getStyles(isDarkMode);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

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
          try {
            await AsyncStorage.multiRemove(["reddit_token"]);
            router.replace("/");
          } catch (err) {
            console.error("Logout failed:", err);
            Alert.alert("Error", "Failed to logout properly.");
          }
        },
      },
    ]);
  };

  const handleClearTags = () => {
    Alert.alert("Clear Tags", "Delete all your created tags?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(["user_tags", "bookmark_tag_map"]);
            DeviceEventEmitter.emit("globalTagsCleared");
            eventBus.emit("refreshFeed");
            Alert.alert("Success", "All created tags are cleared.");
          } catch (error) {
            console.error("Failed to clear global tags:", error);
            Alert.alert("Error", "Failed to clear created tags.");
          }
        },
      },
    ]);
  };

  const selectTheme = async (newMode: string) => {
    setThemeMode(newMode);
    await AsyncStorage.setItem("theme_mode", newMode);
    setThemeModalVisible(false);
  };

  const handleExportBookmarks = async () => {
    try {
      const savedPostsRaw = await AsyncStorage.getItem("reddit_saved_posts");
      const userTagsRaw = await AsyncStorage.getItem("user_tags");

      const exportData = {
        reddit_saved_posts: JSON.parse(savedPostsRaw || "[]"),
        user_tags: JSON.parse(userTagsRaw || "{}"),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileUri = `${FileSystem.cacheDirectory}taggy-export.json`;

      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const shared = await Sharing.shareAsync(fileUri);

      if (shared) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }
    } catch (error) {
      console.error("Export failed:", error);
      Alert.alert("Error", "Failed to export your saved posts.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.section}>PREFERENCES</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push("/ConnectSocialMedia")}
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

          <TouchableOpacity style={styles.row} onPress={() => setThemeModalVisible(true)}>
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

        <Text style={styles.section}>MEDIA</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Feather name="video" size={22} color="#9b59b6" />
            <View style={[styles.textWrapper, { flex: 1 }]}>
              <Text style={styles.title}>Autoplay Videos</Text>
              <Text style={styles.sub}>
                {autoplayEnabled ? "Videos play automatically" : "Videos require tap"}
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

        <Text style={styles.section}>EXPORT</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleExportBookmarks}>
            <Feather name="upload" size={22} color="#2ecc71" />
            <View style={styles.textWrapper}>
              <Text style={styles.title}>Export Reddit Saved Posts</Text>
              <Text style={styles.sub}>Download all saved bookmarks & tags</Text>
            </View>
          </TouchableOpacity>
        </View>

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

      {/* Bottom Sheet Modal for Theme Selection */}
      <Modal
        isVisible={themeModalVisible}
        onBackdropPress={() => setThemeModalVisible(false)}
        style={{ justifyContent: "flex-end", margin: 0 }}
      >
        <View
          style={{
            backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingVertical: 16,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              textAlign: "center",
              color: isDarkMode ? "#fff" : "#333",
              marginBottom: 10,
            }}
          >
            Choose Theme
          </Text>

          {["light", "dark", "default"].map((modeOption) => {
            const isSelected = mode === modeOption;
            return (
              <TouchableOpacity
                key={modeOption}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  justifyContent: "space-between",
                }}
                onPress={() => selectTheme(modeOption)}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: isDarkMode ? "#fff" : "#222",
                    textTransform: "capitalize",
                  }}
                >
                  {modeOption === "default" ? "System Default" : modeOption}
                </Text>
                {isSelected && <Feather name="check" size={20} color="#9b59b6" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>
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
