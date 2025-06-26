import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  BackHandler,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";

interface Props {
  onSearchTextChange?: (text: string) => void;
}

export default function HomeHeader({ onSearchTextChange }: Props) {
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const backAction = () => {
      if (searching) {
        setSearching(false);
        onSearchTextChange?.(""); // <-- Clear search text on back
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
      const focusInput = () => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 50); // slight delay after layout
        });
      };
      focusInput();
    }
  }, [searching]);


  const handleClose = () => {
    setSearching(false);
    onSearchTextChange?.(""); // <-- Clear search text on close
  };

  return (
    <View style={styles.topBar}>
      {!searching ? (
        <>
          <Text style={styles.logo}>
            <Feather name="bookmark" size={24} color="#7c3aed" />
            Taggy
          </Text>
          <TouchableOpacity onPress={() => setSearching(true)}>
            <Ionicons name="search" size={24} color="black" />
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#888"
            onChangeText={onSearchTextChange}
          />
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color="black" />
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
    borderBottomColor: "#eee",
  },
  logo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#7c3aed",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },
});
