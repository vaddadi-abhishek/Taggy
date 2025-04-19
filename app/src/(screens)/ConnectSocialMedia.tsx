import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";

const socialPlatforms = [
  { id: "1", name: "Reddit", key: "reddit" },
  { id: "2", name: "Twitter", key: "twitter" },
  { id: "3", name: "YouTube", key: "youtube" },
  { id: "4", name: "Instagram", key: "instagram" },
];

const platformIcons: Record<string, JSX.Element> = {
  reddit: <FontAwesome6 name="reddit" size={22} color="#FF4500" />,
  twitter: <FontAwesome6 name="x-twitter" size={22} color="#000000" />,
  youtube: <FontAwesome6 name="youtube" size={22} color="#FF0000" />,
  instagram: <FontAwesome6 name="instagram" size={22} color="#E1306C" />,
};

export default function ConnectSocialMedia() {
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  const toggleConnect = (id: string) => {
    setConnected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderItem = ({ item }: { item: typeof socialPlatforms[0] }) => {
    const isConnected = connected[item.id];

    return (
      <View style={styles.card}>
        <View style={styles.left}>
          <View style={styles.icon}>{platformIcons[item.key]}</View>
          <Text style={styles.platform}>{item.name}</Text>
        </View>
        <TouchableOpacity
          style={[styles.button, isConnected ? styles.connected : styles.connect]}
          onPress={() => toggleConnect(item.id)}
        >
          <Text style={[styles.buttonText, isConnected && styles.connectedText]}>
            {isConnected ? "Connected" : "Connect"}
          </Text>
        </TouchableOpacity>
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
    backgroundColor: "#10b981",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  connectedText: {
    color: "#fff",
  },
});
