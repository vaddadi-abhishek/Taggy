import { FontAwesome6 } from "@expo/vector-icons";
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

const socialPlatforms = [
  { id: "1", name: "Reddit", key: "reddit" },
  { id: "2", name: "Twitter", key: "twitter" },
  { id: "3", name: "Instagram", key: "instagram" },
];

const platformIcons: Record<string, JSX.Element> = {
  reddit: <FontAwesome6 name="reddit" size={22} color="#FF4500" />,
  twitter: <FontAwesome6 name="x-twitter" size={22} color="#000000" />,
  instagram: <FontAwesome6 name="instagram" size={22} color="#E1306C" />,
};

export default function ConnectSocialMedia() {
  const { theme } = useTheme();
  const navigationTheme = useNavigationTheme();
  const { colors } = navigationTheme;
  const isDark = theme === "dark";

  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTokenStatus = async () => {
      const initialConnectedState: Record<string, boolean> = {};
      for (const platform of socialPlatforms) {
        const token = await AsyncStorage.getItem(`${platform.key}_token`);
        initialConnectedState[platform.id] = !!token;
      }
      setConnected(initialConnectedState);
      setLoading(false);
    };

    checkTokenStatus();
  }, []);

  const toggleConnect = async (item: (typeof socialPlatforms)[0]) => {
    const isConnected = connected[item.id];

    if (!isConnected) {
      const result = await handleSocialConnect(item.key, true);
      if (result) {
        setConnected((prev) => ({ ...prev, [item.id]: true }));
        eventBus.emit("refreshFeed");
      }
    } else {
      Alert.alert(
        "Are you sure?",
        `If you disconnect ${item.name}, all your imported bookmarks and tags will be lost.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes",
            style: "destructive",
            onPress: async () => {
              const result = await handleSocialConnect(item.key, false);
              if (result) {
                await AsyncStorage.removeItem(`${item.key}_token`);
                setConnected((prev) => ({ ...prev, [item.id]: false }));
                eventBus.emit("refreshFeed");
              }
            },
          },
        ]
      );
    }
  };

  const renderItem = ({ item }: { item: (typeof socialPlatforms)[0] }) => {
    const isConnected = connected[item.id];
    const isReddit = item.key === "reddit";

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card },
          !isReddit && styles.disabledCard,
        ]}
      >
        <View style={styles.left}>
          <View style={styles.icon}>{platformIcons[item.key]}</View>
          <Text
            style={[
              styles.platform,
              { color: colors.text },
              !isReddit && styles.disabledText,
            ]}
          >
            {item.name}
          </Text>
        </View>

        {isReddit ? (
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
          <Text
            style={[
              styles.comingSoon,
              { color: isDark ? "#aaa" : "#666" },
            ]}
          >
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
        keyExtractor={(item) => item.id}
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
  disabledCard: {
    backgroundColor: "#121212",
  },
  disabledText: {
    color: "#444",
  },
  comingSoon: {
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "600",
  },
});
