import React, { useEffect, useRef, useState } from "react";
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
import { useTheme } from "@/src/context/ThemeContext"; // ✅ Custom theme hook

interface Props {
  onSearchTextChange?: (text: string) => void;
}

export default function TopHeader({ onSearchTextChange }: Props) {
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const { navigationTheme, dark } = useTheme(); // ✅ Use dark flag
  const { colors } = navigationTheme;

  useEffect(() => {
    const backAction = () => {
      if (searching) {
        setSearching(false);
        onSearchTextChange?.("");
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
    onSearchTextChange?.("");
  };

  return (
    <View
      style={[
        styles.topBar,
        {
          borderBottomColor: colors.border,
          backgroundColor: dark ? "#1f1f1f" : colors.background, // ✅ dark mode fix
        },
      ]}
    >
      {!searching ? (
        <>
          <Text style={[styles.logo, { color: colors.primary }]}>
            <Feather name="bookmark" size={24} color={colors.primary} /> Taggy
          </Text>
          <TouchableOpacity onPress={() => setSearching(true)}>
            <Ionicons name="search" size={24} color={colors.text} />
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
              },
            ]}
            placeholder="Search..."
            placeholderTextColor={colors.text}
            onChangeText={onSearchTextChange}
          />
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </>
      )}
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
    fontSize: 22,
    fontWeight: "bold",
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },
});
