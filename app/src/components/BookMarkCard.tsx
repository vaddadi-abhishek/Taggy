import FloatingTagModal from "@/app/src/components/FloatingTagModal";
import { FontAwesome6 } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

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
  const { width: screenWidth } = useWindowDimensions();
  const [mediaHeight, setMediaHeight] = useState(200);

  const player = useVideoPlayer(video || "", (p) => {
    p.loop = true;
  });

  // Typing animation for summary
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

  // Dynamic media height (image or video)
  useEffect(() => {
    const uri = image;
    if (uri) {
      Image.getSize(
        uri,
        (width, height) => {
          const MAX_ASPECT_RATIO = 1.0;
          const MIN_ASPECT_RATIO = 0.4;
          let aspectRatio = height / width;

          if (aspectRatio > MAX_ASPECT_RATIO) aspectRatio = MAX_ASPECT_RATIO;
          if (aspectRatio < MIN_ASPECT_RATIO) aspectRatio = MIN_ASPECT_RATIO;

          setMediaHeight(screenWidth * aspectRatio);
        },
        (error) => {
          console.warn("Media size error:", error);
          setMediaHeight(200); // fallback
        }
      );
    }
  }, [image, screenWidth]);

  const handleAiTagPress = () => {
    aiTagBadgeRef.current?.measureInWindow((x, y, width, height) => {
      setModalPosition({ x: x + width / 2, y });
    });
    setShowModal(true);
  };

  const handleTagModalSubmit = (newTag: string) => {
    console.log("New tag added:", newTag);
    // Update state or backend
  };

  const renderMedia = () => {
    if (video && player) {
      return (
        <View>
          <VideoView
            player={player}
            style={[styles.media, { height: mediaHeight }]}
            allowsFullscreen
            allowsPictureInPicture
            isMuted={false}
            volume={1.0}
            shouldPlay={true}
          />
          <View style={styles.iconOverlay}>{platformIcons[source]}</View>
        </View>
      );
    } else if (image) {
      return (
        <View>
          <Image
            source={{ uri: image }}
            style={[styles.media, { height: mediaHeight }]}
            resizeMode="contain"
          />
          <View style={styles.iconOverlay}>{platformIcons[source]}</View>
        </View>
      );
    }
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
    backgroundColor: "#f2f2f2",
    alignSelf: "center",
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
