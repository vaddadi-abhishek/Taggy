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
import eventBus from "utils/eventBus";
import handleSocialConnect from "utils/socialAuthDispatcher";

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
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTokenStatus = async () => {
      const initialConnectedState: Record<string, boolean> = {};

      // Check each platform for existing tokens
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
      // Connect logic
      const result = await handleSocialConnect(item.key, true);
      if (result) {
        setConnected((prev) => ({ ...prev, [item.id]: true }));

        // 🔥 Emit event after connecting
        eventBus.emit("refreshFeed");
      }
    } else {
      // Show alert before disconnecting
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

                // 🔥 Emit event after disconnecting
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
      <View style={[styles.card, !isReddit && styles.disabledCard]}>
        <View style={styles.left}>
          <View style={styles.icon}>{platformIcons[item.key]}</View>
          <Text style={[styles.platform, !isReddit && styles.disabledText]}>
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
              style={[styles.buttonText, isConnected && styles.connectedText]}
            >
              {loading ? "Checking..." : isConnected ? "Disconnect" : "Connect"}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.comingSoon}>Coming Soon</Text>
        )}
      </View>
    );
  };


  return (
    <View style={styles.container}>
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

// ... (keep the same styles as before)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    color: "#222",
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 14,
    borderRadius: 12,
    elevation: 1,
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
    color: "#333",
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  connect: {
    backgroundColor: "#ccc",
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
    opacity: 0.5,
  },
  disabledText: {
    color: "#aaa",
  },
  comingSoon: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    fontWeight: "600",
  },
});
