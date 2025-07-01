import BookmarkCard from "@/src/components/BookMarkCard";
import TopHeader from "@/src/components/TopHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import fetchRedditPosts from "@/src/utils/reddit/fetchRedditPosts";

const AnimatedBookmarkItem = ({
  item,
  index,
  isVisible,
}: {
  item: any;
  index: number;
  isVisible: boolean;
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
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <BookmarkCard
        images={item.images}
        video={item.video}
        isRedditGif={item.isRedditGif}
        source={item.source}
        title={item.title}
        caption={item.caption}
        tags={item.tags}
        url={item.url}
        isVisible={isVisible}
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
  const [after, setAfter] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [visibleIds, setVisibleIds] = useState<string[]>([]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const ids = viewableItems.map((vi) => vi.item.id);
      setVisibleIds(ids);
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const fetchUsername = async (token: string) => {
    const res = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "taggy-app/1.0 (by u/South_Pencil)",
      },
    });
    if (!res.ok) throw new Error("User fetch failed");
    const data = await res.json();
    return data.name;
  };

  const loadSavedPosts = async (afterParam: string | null = null) => {
    try {
      const { posts, after: newAfter, username: uname } = await fetchRedditPosts(afterParam, username);
      setUsername(uname);

      if (afterParam) {
        setBookmarks((prev) => {
          const updated = [...prev, ...posts];
          handleSearchDebounced(searchText, updated);
          return updated;
        });
      } else {
        setBookmarks(posts);
        handleSearchDebounced(searchText, posts);
      }

      setAfter(newAfter);
      setError(null);
    } catch (err: any) {
      if (err.message === "NO_AUTH") {
        setError("Please, Connect Your Reddit Account 😄");
        setBookmarks([]);
        setFilteredBookmarks([]);
      } else {
        console.error("Load error:", err);
        setError("Could not fetch Reddit data.");
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedPosts(null);
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (after && !loadingMore && !refreshing) {
      setLoadingMore(true);
      await loadSavedPosts(after);
      setLoadingMore(false);
    }
  };

  const handleSearch = async (text: string, data: any[] = bookmarks) => {
    setSearchText(text);
    if (!text.trim()) return setFilteredBookmarks(data);

    const lower = text.toLowerCase();
    const results: any[] = [];

    for (const item of data) {
      const localTags = await getTagsForBookmark(item.title);
      const allTags = [...(item.tags || []), ...localTags];
      const content = `${item.title} ${item.caption} ${allTags.join(" ")}`.toLowerCase();
      if (content.includes(lower)) results.push(item);
    }

    setFilteredBookmarks(results);
  };

  const handleSearchDebounced = useCallback(
    debounce((text: string, data?: any[]) => {
      handleSearch(text, data || bookmarks);
    }, 300),
    [bookmarks]
  );

  useEffect(() => {
    onRefresh();
    const refreshListener = async () => {
      console.log("↻ Feed refresh triggered by tab tap");
      setRefreshing(true);
      await loadSavedPosts(null);
      setRefreshing(false);
    };

    eventBus.on("refreshFeed", refreshListener);
    return () => {
      eventBus.off("refreshFeed", refreshListener);
    };
  }, []);

  useEffect(() => {
    if (!searchText.trim()) setFilteredBookmarks(bookmarks);
  }, [searchText, bookmarks]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView>
        <TopHeader
          onSearchTextChange={(text) => {
            setSearchText(text);
            handleSearchDebounced(text);
          }}
        />
      </SafeAreaView>

      {error && <Text style={[styles.error, { color: colors.notification }]}>{error}</Text>}

      <FlashList
        data={filteredBookmarks}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedBookmarkItem item={item} index={index} isVisible={visibleIds.includes(item.id)} />
        )}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        estimatedItemSize={300}
        extraData={visibleIds}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !refreshing && searchText.trim().length > 0 ? (
            <Text style={[styles.noResults, { color: colors.border }]}>No Results</Text>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator size="small" color={colors.primary} /> : null
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </View>
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
