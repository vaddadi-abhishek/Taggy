import FloatingTagModal from "@/app/src/components/FloatingTagModal";
import { FontAwesome6 } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  image?: string;
  video?: string;
  source: "instagram" | "reddit" | "x" | "youtube";
  title: string;
  caption: string;
  tags: string[];
  aiSummary: string;
};

const platformIcons: Record<string, JSX.Element> = {
  instagram: <FontAwesome6 name="instagram" size={18} color="#E1306C" />,
  reddit: <FontAwesome6 name="reddit" size={18} color="#FF4500" />,
  x: <FontAwesome6 name="x-twitter" size={18} color="#000" />,
  youtube: <FontAwesome6 name="youtube" size={18} color="#FF0000" />,
};

export default function BookmarkCard({
  image,
  video,
  source,
  title,
  caption,
  tags,
  aiSummary,
}: Props) {
  const [showSummary, setShowSummary] = useState(false);
  const [typedSummary, setTypedSummary] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const aiTagBadgeRef = useRef<View>(null);

  const player = useVideoPlayer(video || "", (p) => {
    p.loop = true;
  });

  useEffect(() => {
    let index = 0;
    let timer: NodeJS.Timeout;

    if (showSummary) {
      setTypedSummary("");
      timer = setInterval(() => {
        if (index < aiSummary.length) {
          setTypedSummary((prev) => prev + aiSummary.charAt(index));
          index++;
        } else {
          clearInterval(timer);
        }
      }, 15);
    } else {
      setTypedSummary("");
    }

    return () => clearInterval(timer);
  }, [showSummary]);

  const handleAiTagPress = () => {
    aiTagBadgeRef.current?.measureInWindow((x, y, width, height) => {
      setModalPosition({ x: x + width / 2, y });
    });
    setShowModal(true);
  };

  const handleTagModalSubmit = (newTag: string) => {
    console.log("New tag added:", newTag);
    // Backend call or state update
  };

  const renderMedia = () => {
    if (video && player) {
      return (
        <View style={{ width: "100%", aspectRatio: 16 / 9 }}>
          <VideoView
            player={player}
            style={styles.media}
            allowsFullscreen
            allowsPictureInPicture
          />
          <View style={styles.iconOverlay}>{platformIcons[source]}</View>
        </View>
      );
    } else if (image) {
      return (
        <View>
          <Image source={{ uri: image }} style={styles.media} />
          <View style={styles.iconOverlay}>{platformIcons[source]}</View>
        </View>
      );
    }
    // No media (no video, no image) - render nothing
    return null;
  };

  return (
    <View style={styles.card}>
      {renderMedia()}
      <View style={styles.textContent}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.caption}>{caption}</Text>

        <TouchableOpacity
          style={styles.aiBadge}
          onPress={() => setShowSummary(!showSummary)}
        >
          <Text style={styles.aiBadgeText}>AI Summarize</Text>
        </TouchableOpacity>

        {showSummary && (
          <Text style={styles.aiSummaryText}>{typedSummary}</Text>
        )}

        <View style={styles.tagContainer}>
          {tags.map((tag, index) => (
            <View key={index} style={styles.tagBadge}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          <TouchableOpacity
            ref={aiTagBadgeRef}
            style={styles.aiTagBadge}
            onPress={handleAiTagPress}
          >
            <Text style={styles.tagText}>Add Tag</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FloatingTagModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleTagModalSubmit}
        position={modalPosition}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    margin: 12,
    overflow: "hidden",
  },
  media: {
    width: "100%",
    height: 200,
  },
  iconOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  textContent: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  aiBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#d946ef",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  aiBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  aiSummaryText: {
    fontSize: 13,
    color: "#444",
    marginBottom: 10,
    lineHeight: 18,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagBadge: {
    backgroundColor: "#eee",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiTagBadge: {
    backgroundColor: "#fde68a",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
