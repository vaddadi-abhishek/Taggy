import BookmarkCard from "@/src/components/BookMarkCard";
import TopHeader from "@/src/components/TopHeader";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSearch } from "@/src/context/SearchContext";
import { FlashList, ViewToken } from "@shopify/flash-list";

const AnimatedBookmarkItem = ({
  item,
  index,
  isVisible,
  autoplay,
}: {
  item: any;
  index: number;
  isVisible: boolean;
  autoplay: boolean;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 30,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 30,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      key={`${item.id}-${(item.localTags || []).join(",")}`}
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <BookmarkCard
        images={item.images}
        video={item.video}
        isRedditGif={item.isRedditGif}
        source={item.source}
        title={item.title}
        caption={item.caption}
        tags={[...(item.tags || []), ...(item.localTags || [])]}
        url={item.url}
        isVisible={isVisible}
        autoplay={autoplay}
      />
    </Animated.View>
  );
};

export default function HomeScreen() {
  const { colors } = useTheme().navigationTheme;
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const listRef = useRef<FlashList<any>>(null);
  const [autoplay, setAutoplay] = useState(true);

  const { searchQuery, searchFilter } = useSearch();

  const loadSavedFromStorage = async () => {
    try {
      const data = await AsyncStorage.getItem("reddit_saved_posts");
      if (data) {
        const parsed = JSON.parse(data);
        setBookmarks(parsed);
      } else {
        setBookmarks([]);
      }
    } catch (err) {
      console.error("Error loading saved posts from AsyncStorage", err);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem("autoplay_videos").then((value) => {
      if (value !== null) setAutoplay(value === "true");
    });

    loadSavedFromStorage();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedFromStorage();
    setRefreshing(false);
  };

  const normalize = (text: string) =>
    (text || "").toLowerCase().replace(/[^a-z0-9 ]/gi, "");

  const filtered = bookmarks.filter((item) => {
    const q = normalize(searchQuery);
    const allTags = [...(item.tags || []), ...(item.localTags || [])].map(normalize);
    const title = normalize(item.title);
    const caption = normalize(item.caption);

    if (searchFilter === "Tags") return allTags.some((tag) => tag.includes(q));
    if (searchFilter === "Title") return title.includes(q);
    if (searchFilter === "Caption") return caption.includes(q);

    return (
      title.includes(q) ||
      caption.includes(q) ||
      allTags.some((tag) => tag.includes(q))
    );
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const ids = viewableItems.map((vi) => vi.item.id);
      setVisibleIds(ids);
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <TopHeader />

      <FlashList
        ref={listRef}
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedBookmarkItem
            item={item}
            index={index}
            isVisible={visibleIds.includes(item.id)}
            autoplay={autoplay}
          />
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        estimatedItemSize={300}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !refreshing && searchQuery.trim().length > 0 ? (
            <Text style={[styles.noResults, { color: colors.border }]}>
              No Results Found
            </Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  noResults: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    fontWeight: "300",
  },
});
