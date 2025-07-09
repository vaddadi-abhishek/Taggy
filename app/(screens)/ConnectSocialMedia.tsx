import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import eventBus from "@/src/utils/eventBus";
import handleSocialConnect from "@/src/utils/socialAuthDispatcher";
import { useNavigationTheme, useTheme } from "@/src/context/ThemeContext";
import PlatformIcon from "@/src/components/PlatformIcon";
import { socialPlatforms } from "@/src/components/PlatformIcon";
import { useFocusEffect } from "@react-navigation/native";
import { checkXReconnectAllowed } from "@/src/utils/XAuth";



export default function ConnectSocialMedia() {
  const { theme } = useTheme();
  const navigationTheme = useNavigationTheme();
  const { colors } = navigationTheme;
  const isDark = theme === "dark";

  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const checkTokenStatus = async () => {
        const initialConnectedState: Record<string, boolean> = {};
        for (const platform of socialPlatforms) {
          const token = await AsyncStorage.getItem(`${platform.key}_token`);

          // OPTIONAL: validate token (advanced step below)
          initialConnectedState[platform.key] = !!token;
        }
        setConnected(initialConnectedState);
        setLoading(false);
      };

      checkTokenStatus();
    }, [])
  );

  const toggleConnect = async (item: (typeof socialPlatforms)[0]) => {
    const isConnected = connected[item.key];

    if (!isConnected) {
      // ✅ Check for X lockout before allowing reconnect
      if (item.key === "x") {
        const { allowed, remaining } = await checkXReconnectAllowed();
        if (!allowed) {
          Alert.alert("Hold on!", `You can connect X only after ${remaining}`);
          return;
        }
      }

      const result = await handleSocialConnect(item.key, true);
      if (result) {
        setConnected((prev) => ({ ...prev, [item.key]: true }));
        eventBus.emit("refreshFeed");
      }
    } else {
      Alert.alert(
        "Are you sure?",
        `If you disconnect ${item.name}, all your imported bookmarks and tags will be hidden.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes",
            style: "destructive",
            onPress: async () => {
              const result = await handleSocialConnect(item.key, false);
              if (result) {
                await AsyncStorage.removeItem(`${item.key}_token`);
                setConnected((prev) => ({ ...prev, [item.key]: false }));
                eventBus.emit("refreshFeed");
              }
            },
          },
        ]
      );
    }
  };

  const renderItem = ({ item }: { item: (typeof socialPlatforms)[0] }) => {
    const isConnected = connected[item.key];
    const isSupported = ["reddit", "x"].includes(item.key.toLowerCase());

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card },
          !isSupported && { backgroundColor: isDark ? "#121212" : "#f0f0f0" },
        ]}
      >
        <View style={styles.left}>
          <View style={styles.icon}>
            <PlatformIcon platform={item.key as any} />
          </View>
          <Text
            style={[
              styles.platform,
              { color: colors.primary },
              !isSupported && {
                backgroundColor: isDark ? "#121212" : "#f0f0f0",
              },
            ]}
          >
            {item.name}
          </Text>
        </View>

        {isSupported ? (
          <TouchableOpacity
            style={[
              styles.button,
              isConnected ? styles.connected : styles.connect,
            ]}
            onPress={() => toggleConnect(item)}
            disabled={loading}
          >
            <Text
              style={[
                styles.buttonText,
                isConnected && styles.connectedText,
              ]}
            >
              {loading ? "Checking..." : isConnected ? "Disconnect" : "Connect"}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.comingSoon, { color: isDark ? "#aaa" : "#666" }]}>
            Coming Soon
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={socialPlatforms}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    elevation: 2,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 10,
  },
  platform: {
    fontSize: 16,
    fontWeight: "500",
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  connect: {
    backgroundColor: "#999",
  },
  connected: {
    backgroundColor: "#b91010",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  connectedText: {
    color: "#fff",
  },
  comingSoon: {
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "600",
  },
});
