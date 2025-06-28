import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (tag: string) => void;
  position: { x: number; y: number };
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const MODAL_WIDTH = 200;
const MODAL_HEIGHT = 220;

const TAG_STORAGE_KEY = "user_tags";

export default function FloatingTagModal({
  visible,
  onClose,
  onSubmit,
  position,
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const tagValue = useRef("");
  const pan = useRef(new Animated.ValueXY()).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [storedTags, setStoredTags] = useState<string[]>([]);

  const getSafePosition = (x: number, y: number) => {
    let safeX = x - MODAL_WIDTH / 2;
    let safeY = y + 10;

    if (safeX + MODAL_WIDTH > SCREEN_WIDTH - 10) {
      safeX = SCREEN_WIDTH - MODAL_WIDTH - 10;
    }
    if (safeX < 10) {
      safeX = 10;
    }
    const bottomSpace = SCREEN_HEIGHT - safeY - MODAL_HEIGHT;
    if (bottomSpace < keyboardHeight + 10) {
      safeY = SCREEN_HEIGHT - MODAL_HEIGHT - keyboardHeight - 10;
    }
    if (safeY < 10) {
      safeY = 10;
    }

    return { x: safeX, y: safeY };
  };

  const safePosition = getSafePosition(position.x, position.y);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          onClose();
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
      AsyncStorage.getItem(TAG_STORAGE_KEY)
        .then((data) => {
          if (data) setStoredTags(JSON.parse(data));
        })
        .catch((err) => console.log("Failed to load tags", err));
    }
  }, [visible]);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const toCamelCase = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  };

  const addTagToStorage = async (tag: string) => {
    try {
      const existingData = await AsyncStorage.getItem(TAG_STORAGE_KEY);
      const existingTags = existingData ? JSON.parse(existingData) : [];
      const newTagCamel = toCamelCase(tag);

      const isDuplicate = existingTags.some(
        (t: string) => toCamelCase(t) === newTagCamel
      );

      if (isDuplicate) {
        triggerShake();
        return false;
      }

      const updated = [tag, ...existingTags];
      await AsyncStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (e) {
      console.log("Failed to save tag", e);
      return false;
    }
  };

  const handleSubmit = async () => {
    const tag = tagValue.current.trim();
    if (tag.length < 3) {
      triggerShake();
      return;
    }

    const added = await addTagToStorage(tag);
    if (!added) return;

    onSubmit(tag);
    tagValue.current = "";
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            <Animated.View
              style={[
                styles.modalBox,
                {
                  top: safePosition.y,
                  left: safePosition.x,
                  transform: [{ translateY: pan.y }],
                },
              ]}
              {...panResponder.panHandlers}
            >
              <TouchableWithoutFeedback onPress={() => {}}>
                <View>
                  <Text style={styles.label}>Create new tag</Text>
                  <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                    <TextInput
                      ref={inputRef}
                      style={styles.input}
                      placeholder="Enter tag..."
                      placeholderTextColor="#aaa"
                      onChangeText={(text) => (tagValue.current = text)}
                      onSubmitEditing={handleSubmit}
                    />
                  </Animated.View>
                  <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Add</Text>
                  </TouchableOpacity>

                  {storedTags.length > 0 && (
                    <>
                      <Text style={styles.existingLabel}>Your tags</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tagList}
                      >
                        {storedTags.map((tag) => (
                          <TouchableOpacity
                            key={tag}
                            style={styles.tagChip}
                            onPress={() => {
                              onSubmit(tag);
                              onClose();
                            }}
                          >
                            <Text style={styles.tagText}>{tag}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalBox: {
    position: "absolute",
    width: MODAL_WIDTH,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#7c3aed",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  existingLabel: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "nowrap",
    marginTop: 6,
  },
  tagChip: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
});
