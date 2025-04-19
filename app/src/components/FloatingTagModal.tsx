import React, { useEffect, useRef } from "react";
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
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (tag: string) => void;
  position: { x: number; y: number };
}

export default function FloatingTagModal({ visible, onClose, onSubmit, position }: Props) {
  const inputRef = useRef<TextInput>(null);
  const tagValue = useRef("");

  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.modalBox, { top: position.y + 10, left: position.x - 150 }]}>
              <Text style={styles.label}>Create new tag</Text>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Enter tag..."
                placeholderTextColor="#aaa"
                onChangeText={(text) => (tagValue.current = text)}
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
            </Animated.View>
          </TouchableWithoutFeedback>
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
