import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  BackHandler,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { useTheme } from "@/src/context/ThemeContext";

interface Props {
  onSearchTextChange?: (text: string) => void;
  onSearchTypeChange?: (type: "all" | "title" | "caption" | "tags") => void;
}

export default function TopHeader({ onSearchTextChange, onSearchTypeChange }: Props) {
  const [searching, setSearching] = useState(false);
  const [searchText, setSearchText] = useState("");
  const searchInputRef = useRef<TextInput>(null);
  const { navigationTheme, dark } = useTheme();
  const { colors } = navigationTheme;
  const [modalVisible, setModalVisible] = useState(false);
  const [searchType, setSearchType] = useState<"all" | "title" | "caption" | "tags">("all");

  useEffect(() => {
    const backAction = () => {
      if (searching) {
        handleClose();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [searching]);

  const handleClose = () => {
    setSearching(false);
    setSearchText("");
    onSearchTextChange?.("");
  };

  const selectSearchType = (type: "all" | "title" | "caption" | "tags") => {
    setSearchType(type);
    onSearchTypeChange?.(type);
    setModalVisible(false);
  };

  return (
    <View
      style={[
        styles.topBar,
        {
          borderBottomColor: colors.border,
          backgroundColor: dark ? "#1f1f1f" : colors.background,
        },
      ]}
    >
      {!searching ? (
        <>
          <Text style={[styles.logo, { color: colors.primary }]}>
            <Feather name="bookmark" size={24} color={colors.primary} /> Taggy
          </Text>

          <TouchableOpacity
            onPress={() => {
              setSearching(true);
              requestAnimationFrame(() => {
                setTimeout(() => {
                  searchInputRef.current?.focus();
                }, 50);
              });
            }}
          >
            <Feather name="search" size={22} color={colors.text} />
          </TouchableOpacity>

        </>
      ) : (
        <>
          <TextInput
            ref={searchInputRef}
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.card,
                color: colors.text,
                flex: 1,
              },
            ]}
            value={searchText}
            placeholder={`Search ${searchType}...`}
            placeholderTextColor={colors.text}
            onChangeText={(text) => {
              setSearchText(text);
              onSearchTextChange?.(text);
            }}
          />

          <TouchableOpacity onPress={() => setModalVisible(true)} style={{ marginLeft: 8 }}>
            <Text style={{ color: colors.text, fontSize: 12 }}>{searchType.toUpperCase()}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClose} style={{ marginLeft: 8 }}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </>
      )}

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {["all", "title", "caption", "tags"].map((type, i) => (
              <TouchableOpacity
                key={type}
                onPress={() => selectSearchType(type as any)}
                style={styles.modalOption}
              >
                <Text
                  style={{
                    color: searchType === type ? colors.primary : colors.text,
                    fontWeight: searchType === type ? "600" : "400",
                    fontSize: 16,
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
                {i !== 3 && (
                  <View style={[styles.separator, { backgroundColor: colors.border }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  logo: {
    fontSize: 20,
    fontWeight: "600",
  },
  searchInput: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: 250,
    borderRadius: 12,
    paddingVertical: 12,
    elevation: 5,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  separator: {
    height: 1,
    marginTop: 8,
    opacity: 0.5,
  },
});
