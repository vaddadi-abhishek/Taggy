import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  BackHandler,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { useTheme } from "@/src/context/ThemeContext";
import { useSearch } from "@/src/context/SearchContext";

export default function TopHeader() {
  const searchInputRef = useRef<TextInput>(null);
  const { navigationTheme, dark } = useTheme();
  const { colors } = navigationTheme;

  const {
    searchQuery,
    setSearchQuery,
    searching,
    setSearching,
    searchFilter,
    setSearchFilter,
  } = useSearch();

  useEffect(() => {
    const backAction = () => {
      if (searching) {
        setSearching(false);
        setSearchQuery("");
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [searching]);

  useEffect(() => {
    if (searching) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      });
    }
  }, [searching]);

  const handleClose = () => {
    setSearching(false);
    setSearchQuery("");
  };

  const filters: ("All" | "Tags" | "Title" | "Caption")[] = ["All", "Tags", "Title", "Caption"];

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
        <View style={styles.headerRow}>
          <Text style={[styles.logo, { color: colors.primary }]}>
            <Feather name="bookmark" size={22} color={colors.primary} /> Taggy
          </Text>
          <TouchableOpacity onPress={() => setSearching(true)}>
            <Ionicons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <View style={styles.searchRow}>
            <TextInput
              ref={searchInputRef}
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                },
              ]}
              placeholder="Search..."
              placeholderTextColor={colors.text}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={handleClose} style={{ marginLeft: 8 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setSearchFilter(filter)}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor:
                      searchFilter === filter ? colors.primary : colors.card,
                  },
                ]}
              >
                <Text
                  style={{
                    color: searchFilter === filter ? "#fff" : colors.text,
                    fontWeight: "600",
                    fontSize: 12,
                  }}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: 22,
    fontWeight: "bold",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
});
