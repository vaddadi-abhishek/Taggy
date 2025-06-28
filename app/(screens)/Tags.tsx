// src/screens/Tags.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getAllTags,
  addGlobalTag,
  deleteGlobalTag,
  updateGlobalTag,
} from "@/src/utils/tagStorage";

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
    const loaded = await getAllTags();
    setTags(loaded);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTags();
    setRefreshing(false);
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleAddPress = async () => {
    const newTag = searchText.trim();
    if (newTag.length < 3) return triggerShake();

    const success = await addGlobalTag(newTag);
    if (!success) return triggerShake();

    setTags((prev) => [newTag, ...prev]);
    setSearchText("");
  };

  const handleDelete = (tag: string) => {
    Alert.alert(
      "Delete Tag",
      `Are you sure you want to delete "${tag}"? This will remove it from all bookmarks.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteGlobalTag(tag);
            setTags((prev) => prev.filter((t) => t !== tag));
            if (editingTagIndex !== null && tags[editingTagIndex] === tag) {
              setEditingTagIndex(null);
              setEditedTagName("");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (index: number) => {
    setEditingTagIndex(index);
    setEditedTagName(tags[index]);
  };

  const handleSaveEdit = async (index: number) => {
    const newName = editedTagName.trim();
    if (newName.length < 3) return triggerShake();

    const oldName = tags[index];
    const success = await updateGlobalTag(oldName, newName);
    if (!success) return triggerShake();

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
