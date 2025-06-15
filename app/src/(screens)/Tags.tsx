import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const TAG_STORAGE_KEY = "user_tags";

// Normalize a tag string to camelCase for comparison
const normalizeTag = (str: string) => str.replace(/\s+/g, '').toLowerCase();

export default function TagsScreen() {
  const [tags, setTags] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editedTagName, setEditedTagName] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const loadTags = async () => {
    try {
      const stored = await AsyncStorage.getItem(TAG_STORAGE_KEY);
      if (stored) setTags(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to load tags", e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTags();
    setRefreshing(false);
  };

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(tags)).catch((e) =>
      console.error("Failed to save tags", e)
    );
  }, [tags]);

  const handleDelete = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    if (editingTagIndex !== null && tags[editingTagIndex] === tag) {
      setEditingTagIndex(null);
      setEditedTagName("");
    }
  };

  const handleAddPress = () => {
    const newTag = searchText.trim();
    const newTagNormalized = normalizeTag(newTag);

    if (newTag.length < 3) {
      triggerShake();
      return;
    }

    const tagExists = tags.some(
      (t) => normalizeTag(t) === newTagNormalized
    );

    if (tagExists) {
      triggerShake();
      return;
    }

    setTags((prev) => [newTag, ...prev]);
    setSearchText("");
  };

  const handleEdit = (index: number) => {
    setEditingTagIndex(index);
    setEditedTagName(tags[index]);
  };

  const handleSaveEdit = (index: number) => {
    const newName = editedTagName.trim();
    const newNameNormalized = normalizeTag(newName);

    if (newName.length < 3) {
      triggerShake();
      return;
    }

    const tagExists = tags.some(
      (t, i) => i !== index && normalizeTag(t) === newNameNormalized
    );

    if (tagExists) {
      triggerShake();
      return;
    }

    const updated = [...tags];
    updated[index] = newName;
    setTags(updated);
    setEditingTagIndex(null);
    setEditedTagName("");
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.searchRow, { transform: [{ translateX: shakeAnim }] }]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Add or Search Tags"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
          <Ionicons name="add-circle-outline" size={22} color="#fff" />
          <Text style={styles.addText}>Add Tag</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.subheading}>Your Tags ({tags.length})</Text>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {tags
          .filter((tag) => tag.toLowerCase().includes(searchText.toLowerCase()))
          .map((tag, index) => (
            <View key={tag} style={styles.tagRow}>
              <View style={{ flex: 1 }}>
                {editingTagIndex === index ? (
                  <TextInput
                    value={editedTagName}
                    onChangeText={setEditedTagName}
                    style={styles.editInput}
                    autoFocus
                    placeholder="Edit tag name"
                  />
                ) : (
                  <Text style={styles.tagText}>{tag}</Text>
                )}
              </View>
              <View style={styles.actions}>
                {editingTagIndex === index ? (
                  <TouchableOpacity onPress={() => handleSaveEdit(index)}>
                    <Ionicons name="checkmark-done" size={20} color="#4ade80" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => handleEdit(index)}>
                    <Ionicons name="create-outline" size={20} color="#888" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDelete(tag)}>
                  <Ionicons name="trash-outline" size={20} color="#ff5252" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  searchRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: "#6366f1",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 4,
  },
  subheading: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  editInput: {
    fontSize: 14,
    fontWeight: "500",
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginLeft: 12,
  },
});
