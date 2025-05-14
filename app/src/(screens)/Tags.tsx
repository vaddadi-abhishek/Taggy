import FloatingTagModal from "@/app/src/components/FloatingTagModal";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const initialTags = ["AI", "React", "Tech", "Science"];

export default function TagsScreen() {
  const [tags, setTags] = useState(initialTags);
  const [searchText, setSearchText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const addButtonRef = useRef<TouchableOpacity>(null);
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  const handleDelete = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleEdit = (tag: string) => {
    console.log("Edit tag:", tag);
  };

  const handleAddPress = () => {
    // Try to position near the Add button
    if (addButtonRef.current) {
      addButtonRef.current.measureInWindow((x, y, width, height) => {
        setModalPosition({
          x: x + width / 2, // Center of the button
          y: y + height, // Bottom of the button
        });
        setShowModal(true);
      });
    } else {
      // Fallback to center position
      setModalPosition({
        x: screenWidth / 2,
        y: screenHeight / 2,
      });
      setShowModal(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search + Add */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tags..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity
          ref={addButtonRef}
          style={styles.addButton}
          onPress={handleAddPress}
        >
          <Ionicons name="add-circle-outline" size={22} color="#fff" />
          <Text style={styles.addText}>Add Tag</Text>
        </TouchableOpacity>
      </View>

      {/* Tag Count */}
      <Text style={styles.subheading}>Your Tags ({tags.length})</Text>

      {/* Tag List */}
      <ScrollView>
        {tags
          .filter((tag) => tag.toLowerCase().includes(searchText.toLowerCase()))
          .map((tag, index) => (
            <View key={index} style={styles.tagRow}>
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleEdit(tag)}>
                  <Ionicons name="create-outline" size={20} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(tag)}>
                  <Ionicons name="trash-outline" size={20} color="#ff5252" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
      </ScrollView>

      {/* Floating Modal */}
      <FloatingTagModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={(tagName) => {
          if (tagName.trim()) {
            setTags((prev) => [...prev, tagName]);
          }
          setShowModal(false);
        }}
        position={modalPosition}
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
  tagBadge: {
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
});
