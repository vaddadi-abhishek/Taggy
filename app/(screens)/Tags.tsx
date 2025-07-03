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
  Modal,
} from "react-native";
import {
  getAllTags,
  addGlobalTag,
  deleteGlobalTag,
  updateGlobalTag,
} from "@/src/utils/tagStorage";
import { useTheme } from "@/src/context/ThemeContext";
import eventBus from "@/src/utils/eventBus";

export default function TagsScreen() {
  const theme = useTheme();
  const { colors } = theme.navigationTheme;

  const [tags, setTags] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTagName, setEditingTagName] = useState("");
  const [editingTagIndexModal, setEditingTagIndexModal] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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
    const handler = () => loadTags();
    eventBus.on("refreshFeed", handler);
    loadTags();
    return () => {
      eventBus.off("refreshFeed", handler);
    };
  }, []);

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
            setEditModalVisible(false);
            setEditingTagName("");
            setEditingTagIndexModal(null);
          },
        },
      ]
    );
  };

  const handleEdit = (index: number) => {
    setIsEditing(true);
    setEditingTagName(tags[index]);
    setEditingTagIndexModal(index);
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    const newName = editingTagName.trim();
    if (newName.length < 3) return triggerShake();

    if (isEditing && editingTagIndexModal !== null) {
      const oldName = tags[editingTagIndexModal];
      const success = await updateGlobalTag(oldName, newName);
      if (!success) return triggerShake();

      const updated = [...tags];
      updated[editingTagIndexModal] = newName;
      setTags(updated);
    } else {
      const success = await addGlobalTag(newName);
      if (!success) return triggerShake();
      setTags((prev) => [newName, ...prev]);
    }

    setEditModalVisible(false);
    setEditingTagName("");
    setEditingTagIndexModal(null);
    setIsEditing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.searchRow, { transform: [{ translateX: shakeAnim }] }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="Search Tags"
          placeholderTextColor={colors.text}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            style={styles.clearIcon}
            onPress={() => setSearchText("")}
          >
            <Ionicons name="close-circle" size={20} color="#aaa" />
          </TouchableOpacity>
        )}
      </Animated.View>

      <Text style={[styles.subheading, { color: colors.text }]}>
        Your Tags ({tags.length})
      </Text>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {tags
          .filter((tag) => tag.toLowerCase().includes(searchText.toLowerCase()))
          .map((tag, index) => (
            <View
              key={tag}
              style={[
                styles.tagRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleEdit(index)}>
                  <Ionicons name="create-outline" size={20} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(tag)}>
                  <Ionicons name="trash-outline" size={20} color="#ff5252" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
      </ScrollView>

      {/* Floating + Button */}
      <TouchableOpacity
        style={styles.floatingAddButton}
        onPress={() => {
          setIsEditing(false);
          setEditingTagName("");
          setEditingTagIndexModal(null);
          setEditModalVisible(true);
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setEditModalVisible(false);
          setEditingTagName("");
          setEditingTagIndexModal(null);
          setIsEditing(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isEditing ? "Edit Tag" : "Add Tag"}
            </Text>

            <TextInput
              value={editingTagName}
              onChangeText={setEditingTagName}
              placeholder="Enter tag name"
              placeholderTextColor={colors.border}
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#f87171" }]}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingTagName("");
                  setEditingTagIndexModal(null);
                  setIsEditing(false);
                }}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={editingTagName.trim().length < 3}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor:
                      editingTagName.trim().length < 3 ? "#9ca3af" : "#4ade80",
                  },
                ]}
                onPress={handleSave}
              >
                <Text style={styles.modalBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  searchRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
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
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  floatingAddButton: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#6366f1",
    padding: 14,
    borderRadius: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  searchInputWrapper: {
    flex: 1,
    position: "relative",
  },
  clearIcon: {
    position: "absolute",
    right: 10,
    top: 10,
  },
});
