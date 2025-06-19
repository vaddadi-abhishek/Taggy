import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { router } from "expo-router";

const SettingsScreen = () => {
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
    Alert.alert("Clear Tags", "Delete all your manual tags?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("manual_tags");
          Alert.alert("Success", "All tags cleared.");
        },
      },
    ]);
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
        </View>

        {/* About */}
        <Text style={styles.section}>ABOUT</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row}>
            <Feather name="info" size={22} color="#3498db" />
            <View style={styles.textWrapper}>
              <Text style={styles.title}>Version</Text>
              <Text style={styles.sub}>
                {Application.nativeApplicationVersion || "1.0.0"}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              Alert.alert("Coming Soon", "Privacy Policy will be added soon.")
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  section: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#fff",
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
    color: "#222",
  },
  sub: {
    fontSize: 12,
    color: "#777",
  },
});
