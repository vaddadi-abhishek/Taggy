import BookmarkCard from "@/src/components/BookMarkCard";
import TopHeader from "@/src/components/TopHeader";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import eventBus from "@/src/utils/eventBus";
import debounce from "lodash.debounce";
import { getTagsForBookmark } from "@/src/utils/tagStorage";
import { useTheme } from "@/src/context/ThemeContext";
import { FlashList, ViewToken } from "@shopify/flash-list";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { checkXBookmarksVisible } from "@/src/utils/XAuth";
import generateBookmarkKey from "@/src/utils/generateBookmarkKey";
import { loadAllBookmarks, loadMoreBookmarks } from "@/src/utils/loadAllBookmarks";

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
  const [filteredBookmarks, setFilteredBookmarks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const listRef = useRef<FlashList<any>>(null);
  const [autoplay, setAutoplay] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchType, setSearchType] = useState<"all" | "title" | "caption" | "tags">("all");
  const searchTypeRef = useRef(searchType);

  useEffect(() => {
    AsyncStorage.getItem("autoplay_videos").then((val) => {
      if (val !== null) setAutoplay(val === "true");
    });

    eventBus.on("autoplayChanged", setAutoplay);
    const scrollToTopListener = () =>
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    eventBus.on("scrollToTop", scrollToTopListener);

    return () => {
      eventBus.off("autoplayChanged", setAutoplay);
      eventBus.off("scrollToTop", scrollToTopListener);
    };
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const ids = viewableItems.map((vi) => vi.item.id);
      setVisibleIds(ids);
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const handleSearch = async (
    text: string,
    data: any[] = bookmarks,
    type: "all" | "title" | "caption" | "tags" = searchType
  ) => {
    setSearchText(text);
    if (!text.trim()) return setFilteredBookmarks(data);

    const lower = text.toLowerCase();
    const results: any[] = [];

    for (const item of data) {
      const localTags = await getTagsForBookmark(item.title);
      const allTags = [...(item.tags || []), ...localTags].map((t) => t.toLowerCase());

      const title = item.title?.toLowerCase() || "";
      const caption = item.caption?.toLowerCase() || "";

      const match =
        type === "all"
          ? title.includes(lower) ||
          caption.includes(lower) ||
          allTags.some((t) => t.includes(lower))
          : type === "title"
            ? title.includes(lower)
            : type === "caption"
              ? caption.includes(lower)
              : allTags.some((t) => t.includes(lower));

      if (match) results.push({ ...item, localTags });
    }

    setFilteredBookmarks(results);
  };

  const handleSearchDebounced = useCallback(
    debounce((text: string, data?: any[]) => {
      if (!text.trim()) {
        setFilteredBookmarks(data || bookmarks);
      } else {
        handleSearch(text, data || bookmarks, searchTypeRef.current); // ✅ Always use latest
      }
    }, 300),
    [bookmarks]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const { posts } = await loadAllBookmarks(); // 🔥 Let loadAllBookmarks handle X logic


      const enriched = await Promise.all(
        posts.map(async (p) => {
          const localTags = await getTagsForBookmark(p.title);
          return { ...p, localTags };
        })
      );
      setBookmarks(enriched);
      handleSearchDebounced(searchText, enriched);
      setError(null);
    } catch (err) {
      console.error("❌ Error loading bookmarks:", err);
      setError("Failed to load bookmarks.");
    }
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (loadingMore || refreshing) return;

    setLoadingMore(true);
    try {
      const { newPosts } = await loadMoreBookmarks();
      const enriched = await Promise.all(
        newPosts.map(async (p) => {
          const localTags = await getTagsForBookmark(p.title);
          return { ...p, localTags };
        })
      );

      setBookmarks((prev) => {
        const updated = [...prev, ...enriched];
        handleSearchDebounced(searchText, updated);
        return updated;
      });
    } catch (err) {
      console.error("📉 loadMoreBookmarks error:", err);
    }
    setLoadingMore(false);
  };

  useEffect(() => {
    onRefresh();
  }, []);

  useEffect(() => {
    if (!searchText.trim()) setFilteredBookmarks(bookmarks);
  }, [searchText, bookmarks]);

  useEffect(() => {
    const updateTagsOnEvent = async () => {
      const updated = await Promise.all(
        bookmarks.map(async (b) => {
          const localTags = await getTagsForBookmark(b.title);
          return { ...b, localTags };
        })
      );
      setBookmarks(updated);
      handleSearchDebounced(searchText, updated);
    };

    eventBus.on("refreshFeed", updateTagsOnEvent);
    return () => eventBus.off("refreshFeed", updateTagsOnEvent);
  }, [bookmarks]);


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <TopHeader
          onSearchTextChange={(text) => {
            setSearchText(text);
            if (!text.trim()) {
              setFilteredBookmarks(bookmarks);
            }
            handleSearchDebounced(text);
          }}
          onSearchTypeChange={(type) => {
            setSearchType(type);
            searchTypeRef.current = type; // ✅ Update ref immediately
            handleSearchDebounced(searchText);
          }}


        />

        {error && <Text style={[styles.error, { color: colors.notification }]}>{error}</Text>}

        <FlashList
          ref={listRef}
          data={filteredBookmarks}
          keyExtractor={generateBookmarkKey}
          extraData={{ autoplay, visibleIds }}
          renderItem={({ item, index }) => (
            <AnimatedBookmarkItem
              item={item}
              index={index}
              isVisible={visibleIds.includes(item.id)}
              autoplay={autoplay}
            />
          )}
          estimatedItemSize={500}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={colors.primary} /> : null
          }
          ListEmptyComponent={
            !refreshing && searchText.trim().length > 0 ? (
              <Text style={[styles.noResults, { color: colors.border }]}>No Results</Text>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 80 }}
          removeClippedSubviews={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: {
    textAlign: "center",
    marginVertical: 10,
    fontSize: 14,
  },
  noResults: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    fontWeight: "300",
  },
});
