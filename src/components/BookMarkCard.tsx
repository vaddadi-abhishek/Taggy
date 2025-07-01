import FloatingTagModal from "@/src/components/FloatingTagModal";
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
  Animated,
  DeviceEventEmitter,
  ActivityIndicator,
} from "react-native";
import {
  addTagToBookmark,
  getTagsForBookmark,
  removeTagFromBookmark,
} from "@/src/utils/tagStorage";
import { getAutoplaySetting } from "@/src/utils/videoAutoPlay";
import { useTheme } from "@/src/context/ThemeContext";
import Toast from 'react-native-toast-message';

type Props = {
  images?: string[];
  video?: string;
  isRedditGif?: boolean;
  source: "instagram" | "reddit" | "x" | "youtube";
  title: string;
  caption: string;
  tags: string[];
  url?: string;
  isVisible: boolean;
};

const platformIcons: Record<string, JSX.Element> = {
  instagram: (
    <Image
      source={{ uri: "https://img.icons8.com/?size=100&id=Xy10Jcu1L2Su&format=png&color=000000" }}
      style={{ width: 22, height: 22 }}
      resizeMode="contain"
    />
  ),
  reddit: (
    <Image
      source={{ uri: "https://img.icons8.com/?size=100&id=gxDo9YXCsacn&format=png&color=000000" }}
      style={{ width: 22, height: 22 }}
      resizeMode="contain"
    />
  ),
  x: (
    <Image
      source={{ uri: "https://img.icons8.com/?size=100&id=phOKFKYpe00C&format=png&color=ffffff" }}
      style={{ width: 22, height: 22 }}
      resizeMode="contain"
    />
  ),
  youtube: (
    <Image
      source={{ uri: "https://img.icons8.com/?size=100&id=qLVB1tIe9Ts9&format=png&color=000000" }}
      style={{ width: 22, height: 22 }}
      resizeMode="contain"
    />
  ),
};

export default function BookmarkCard({
  images,
  video,
  isRedditGif,
  source,
  title,
  caption,
  tags,
  url,
  isVisible,
}: Props) {
  const { navigationTheme } = useTheme(); // 👈 get theme
  const colors = navigationTheme.colors;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [showModal, setShowModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const aiTagBadgeRef = useRef<View>(null);
  const { width: screenWidth } = useWindowDimensions();
  const [mediaHeight, setMediaHeight] = useState(200);
  const [bookmarkTags, setBookmarkTags] = useState<string[]>(tags);
  const [autoplay, setAutoplay] = useState<boolean | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageHeights, setImageHeights] = useState<number[]>([]);

  const handleScrollTo = (index: number) => {
    if (images && index >= 0 && index < images.length) {
      // Direction: 1 for forward, -1 for backward
      const direction = index > activeIndex ? 1 : -1;

      // Reset and animate
      slideAnim.setValue(direction * screenWidth);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();

      setActiveIndex(index);
    }
  };


  const player = useVideoPlayer(video || "", (p) => {
    p.loop = true;
    p.volume = 1.0;
  });

  useEffect(() => {
    getAutoplaySetting().then(setAutoplay);
  }, []);

  useEffect(() => {
    if (!player || autoplay === null) return;

    if (isVisible && autoplay) {
      player.play();
    } else {
      player.pause();
    }
  }, [isVisible, autoplay, player]);


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
    if (!images || images.length === 0) return;

    const promises = images.map((uri) => {
      return new Promise<number>((resolve) => {
        Image.getSize(
          uri,
          (w, h) => {
            const ratio = h / w;
            const scaledHeight = Math.min(screenWidth * ratio, 450); // Max height cap
            resolve(scaledHeight);
          },
          () => resolve(200) // fallback height
        );
      });
    });

    Promise.all(promises).then(setImageHeights);
  }, [images, screenWidth]);



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
    const isGif = isRedditGif || (typeof video === "string" && /v\.redd\.it.*\.mp4/.test(video));
    const isVideo = video && !isRedditGif;
    const hasImages = images && images.length > 0;

    if (isGif && autoplay !== null) {
      return (
        <View>
          <VideoView
            player={player}
            style={[styles.media, { height: mediaHeight }]}
            isMuted
            allowsFullscreen={false}
            useNativeControls={false}
            shouldPlay={autoplay}
            style={[
              styles.media,
              {
                height: mediaHeight,
                backgroundColor: navigationTheme.dark ? "#1a1a1a" : "#f2f2f2",
              },
            ]}
          />
          <View style={[styles.iconOverlay, { backgroundColor: colors.card }]}>
            {platformIcons[source]}
          </View>
        </View>
      );
    }

    if (isVideo && autoplay !== null) {
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
            isMuted={false}
            allowsFullscreen
            allowsPictureInPicture
            useNativeControls
            shouldPlay={autoplay}
          />
          <View style={[styles.iconOverlay, { backgroundColor: colors.card }]}>
            {platformIcons[source]}
          </View>
        </View>
      );
    }

    if (hasImages) {
      if (imageHeights.length !== images.length) {
        return (
          <View
            style={{
              width: screenWidth,
              height: 200,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        );
      }

      const maxImageHeight = Math.max(...imageHeights);
      const currentImage = images[activeIndex];

      return (
        <View style={{ position: "relative", height: maxImageHeight }}>
          <Animated.View
            style={{
              width: screenWidth,
              height: maxImageHeight,
              transform: [{ translateX: slideAnim }],
            }}
          >
            <Image
              source={{ uri: currentImage }}
              resizeMode="cover"
              style={{
                width: screenWidth,
                height: maxImageHeight,
                backgroundColor: navigationTheme.dark ? "#1a1a1a" : "#f2f2f2",
              }}
            />
          </Animated.View>

          {images.length > 1 && activeIndex > 0 && (
            <TouchableOpacity
              onPress={() => handleScrollTo(activeIndex - 1)}
              style={[styles.scrollButton, { left: 10 }]}
            >
              <Text style={styles.scrollButtonText}>‹</Text>
            </TouchableOpacity>
          )}
          {images.length > 1 && activeIndex < images.length - 1 && (
            <TouchableOpacity
              onPress={() => handleScrollTo(activeIndex + 1)}
              style={[styles.scrollButton, { right: 10 }]}
            >
              <Text style={styles.scrollButtonText}>›</Text>
            </TouchableOpacity>
          )}

          <View style={[styles.iconOverlay, { backgroundColor: colors.card }]}>
            {platformIcons[source]}
          </View>
        </View>
      );
    }

    return null;
  };


  const shouldCardBeTappable = !video && (!images || images.length > 0);

  return (
    <Pressable
      style={[styles.card, { backgroundColor: navigationTheme.dark ? "#2a2a2a" : colors.card, }]}
    >
      {renderMedia()}
      <View style={styles.textContent}>
        <Pressable onPress={handleCardPress} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>
        </Pressable>

        <Pressable onPress={handleCardPress} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
          <Text style={[styles.caption, { color: colors.text }]}>
            {caption}
          </Text>
        </Pressable>
        <View style={styles.tagContainer}>
          {bookmarkTags.map((tag, index) => (
            <TouchableOpacity
              key={index}
              style={styles.tagBadge}
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
              <Text style={styles.tagText}>{tag}</Text>
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
            setBookmarkTags((prev) => [...new Set([newTag, ...prev])]);
            Toast.show({
              type: 'success',
              text1: 'Tag added!',
              position: 'bottom',
              visibilityTime: 1500,
            });
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
    backgroundColor: "grey",
  },
  aiTagBadge: {
    backgroundColor: "royalblue",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#fff",
  },
  scrollButton: {
    position: "absolute",
    top: "50%",
    zIndex: 10,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    transform: [{ translateY: -20 }],
  },
  scrollButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
});
