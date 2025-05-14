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
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (tag: string) => void;
  position: { x: number; y: number };
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const MODAL_WIDTH = 200;
const MODAL_HEIGHT = 180;

export default function FloatingTagModal({ visible, onClose, onSubmit, position }: Props) {
  const inputRef = useRef<TextInput>(null);
  const tagValue = useRef("");
  const pan = useRef(new Animated.ValueXY()).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Calculate safe position considering screen edges
  const getSafePosition = (x: number, y: number) => {
    let safeX = x - MODAL_WIDTH / 2;
    let safeY = y + 10;

    // Adjust for right edge
    if (safeX + MODAL_WIDTH > SCREEN_WIDTH - 10) {
      safeX = SCREEN_WIDTH - MODAL_WIDTH - 10;
    }
    // Adjust for left edge
    if (safeX < 10) {
      safeX = 10;
    }
    // Adjust for bottom edge (considering keyboard)
    const bottomSpace = SCREEN_HEIGHT - safeY - MODAL_HEIGHT;
    if (bottomSpace < keyboardHeight + 10) {
      safeY = SCREEN_HEIGHT - MODAL_HEIGHT - keyboardHeight - 10;
    }
    // Adjust for top edge
    if (safeY < 10) {
      safeY = 10;
    }

    return { x: safeX, y: safeY };
  };

  const safePosition = getSafePosition(position.x, position.y);

  // Pan responder for swipe-to-close gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dy: pan.y }], { useNativeDriver: false }),
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
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
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
    }
  }, [visible]);

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
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder="Enter tag..."
                    placeholderTextColor="#aaa"
                    onChangeText={(text) => (tagValue.current = text)}
                    onSubmitEditing={() => {
                      onSubmit(tagValue.current);
                      tagValue.current = "";
                      onClose();
                    }}
                  />
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                      onSubmit(tagValue.current);
                      tagValue.current = "";
                      onClose();
                    }}
                  >
                    <Text style={styles.buttonText}>Add</Text>
                  </TouchableOpacity>
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
    width: 200,
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
});