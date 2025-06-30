import FloatingTagModal from "@/src/components/FloatingTagModal";
import { FontAwesome6 } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Pressable,
  DeviceEventEmitter,
} from "react-native";
import {
  addTagToBookmark,
  getTagsForBookmark,
  removeTagFromBookmark,
} from "@/src/utils/tagStorage";
import { getAutoplaySetting } from "@/src/utils/videoAutoPlay";
import { useTheme } from "@/src/context/ThemeContext"; // 👈 your ThemeContext

type Props = {
  image?: string;
  video?: string;
  source: "instagram" | "reddit" | "x" | "youtube";
  title: string;
  caption: string;
  tags: string[];
  url?: string;
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
  url,
}: Props) {
  const { navigationTheme } = useTheme(); // 👈 get theme
  const colors = navigationTheme.colors;

  const [showModal, setShowModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const aiTagBadgeRef = useRef<View>(null);
  const { width: screenWidth } = useWindowDimensions();
  const [mediaHeight, setMediaHeight] = useState(200);
  const [bookmarkTags, setBookmarkTags] = useState<string[]>(tags);
  const [autoplay, setAutoplay] = useState<boolean | null>(null);

  const player = useVideoPlayer(video || "", (p) => {
    p.loop = true;
    p.volume = 1.0;
  });

  useEffect(() => {
    getAutoplaySetting().then(setAutoplay);
  }, []);

  useEffect(() => {
    if (autoplay && player) {
      player.play();
    }
  }, [autoplay, player]);

  useEffect(() => {
    const fetchTags = async () => {
      const loadedTags = await getTagsForBookmark(title);
      setBookmarkTags([...new Set([...tags, ...loadedTags])]); 
    };

    fetchTags();

    const subscription = DeviceEventEmitter.addListener("globalTagsCleared", fetchTags);
    return () => subscription.remove();
  }, [title]);

  useEffect(() => {
    if (image) {
      Image.getSize(
        image,
        (width, height) => {
          const aspectRatio = Math.max(0.4, Math.min(1.0, height / width));
          setMediaHeight(screenWidth * aspectRatio);
        },
        () => setMediaHeight(200)
      );
    }
  }, [image, screenWidth]);

  useEffect(() => {
    getTagsForBookmark(title).then((loadedTags) => {
      setBookmarkTags([...new Set([...tags, ...loadedTags])]);
    });
  }, [title]);

  const handleAiTagPress = () => {
    aiTagBadgeRef.current?.measureInWindow((x, y, width) => {
      setModalPosition({ x: x + width / 2, y });
      setShowModal(true);
    });
  };

  const handleCardPress = () => {
    if (url) {
      Linking.openURL(url).catch((err) =>
        console.warn("Failed to open URL:", err)
      );
    }
  };

  const renderMedia = () => {
    if (video && autoplay !== null) {
      return (
        <View>
          <VideoView
            player={player}
            style={[
              styles.media,
              {
                height: mediaHeight,
                backgroundColor: navigationTheme.dark ? "#1a1a1a" : "#f2f2f2",
              },
            ]}
            allowsFullscreen
            allowsPictureInPicture
            isMuted={false}
            volume={1.0}
            useNativeControls
            shouldPlay={autoplay}
          />
          <View style={[styles.iconOverlay, { backgroundColor: colors.card }]}>
            {platformIcons[source]}
          </View>
        </View>
      );
    } else if (image) {
      return (
        <Pressable onPress={handleCardPress}>
          <Image
            source={{ uri: image }}
            style={[
              styles.media,
              {
                height: mediaHeight,
                backgroundColor: navigationTheme.dark ? "#1a1a1a" : "#f2f2f2",
              },
            ]}
            resizeMode="contain"
          />
          <View style={[styles.iconOverlay, { backgroundColor: colors.card }]}>
            {platformIcons[source]}
          </View>
        </Pressable>
      );
    }
    return null;
  };

  const shouldCardBeTappable = !video && (!image || image.length > 0);

  return (
    <Pressable
      onPress={shouldCardBeTappable ? handleCardPress : undefined}
      style={[styles.card, { backgroundColor: navigationTheme.dark ? "#2a2a2a" : colors.card, }]}
    >
      {renderMedia()}
      <View style={styles.textContent}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.caption, { color: colors.text }]}>{caption}</Text>

        <View style={styles.tagContainer}>
          {bookmarkTags.map((tag, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tagBadge, { backgroundColor: colors.border }]}
              onLongPress={() => {
                Alert.alert(
                  "Remove Tag",
                  `Do you want to remove the Tag: "${tag}"?`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Remove",
                      style: "destructive",
                      onPress: async () => {
                        await removeTagFromBookmark(title, tag);
                        setBookmarkTags((prev) => prev.filter((t) => t !== tag));
                      },
                    },
                  ]
                );
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            ref={aiTagBadgeRef}
            style={styles.aiTagBadge}
            onPress={handleAiTagPress}
            activeOpacity={1}
          >
            <Text style={styles.tagText}>Add Tag</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FloatingTagModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        position={modalPosition}
        onSubmit={async (newTag) => {
          if (!bookmarkTags.includes(newTag)) {
            await addTagToBookmark(title, newTag);
            setBookmarkTags((prev) => [newTag, ...prev]);
          }
        }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
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
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagBadge: {
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
