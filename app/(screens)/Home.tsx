import BookmarkCard from "@/src/components/BookMarkCard";
import TopHeader from "@/src/components/TopHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import eventBus from "@/src/utils/eventBus";
import debounce from "lodash.debounce";
import { getTagsForBookmark } from "@/src/utils/tagStorage";
import { refreshAccessToken } from "@/src/utils/RedditAuth";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const AnimatedBookmarkItem = ({ item, index }: { item: any; index: number }) => {
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
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <BookmarkCard
        image={item.image}
        video={item.video}
        source={item.source}
        title={item.title}
        caption={item.caption}
        tags={item.tags}
        url={item.url}
      />
    </Animated.View>
  );
};

export default function HomeScreen() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [after, setAfter] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  const fetchUsername = async (token: string) => {
    const userResponse = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "taggy-app/1.0 (by u/South_Pencil)",
      },
    });
    if (!userResponse.ok) throw new Error("Failed to fetch user info");
    const userData = await userResponse.json();
    return userData.name;
  };

  const loadSavedPosts = async (afterParam: string | null = null) => {
    try {
      let accessToken = await AsyncStorage.getItem("reddit_token");

      if (!accessToken) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          accessToken = await AsyncStorage.getItem("reddit_token");
        } else {
          setError("Please, Connect Your Reddit Account 😄");
          setBookmarks([]);
          setFilteredBookmarks([]);
          return;
        }
      }

      let currentUsername = username;
      if (!currentUsername) {
        currentUsername = await fetchUsername(accessToken);
        setUsername(currentUsername);
      }

      if (!afterParam) {
        setBookmarks([]);
        setAfter(null);
      }

      const url = `https://oauth.reddit.com/user/${currentUsername}/saved?limit=25${
        afterParam ? `&after=${afterParam}` : ""
      }`;

      const savedResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "taggy-app/1.0 (by u/South_Pencil)",
        },
      });

      if (!savedResponse.ok) {
        const errData = await savedResponse.json();
        console.error("Failed to fetch saved posts:", errData);
        setError("Failed to fetch saved posts.");
        return;
      }

      const savedJson = await savedResponse.json();
      const posts = savedJson.data.children;
      const newAfter = savedJson.data.after;

      const parsed = posts.map((item: any, index: number) => {
        const post = item.data;
        const isVideo =
          post.is_video &&
          (post.media?.reddit_video?.dash_url || post.media?.reddit_video?.hls_url);
        const videoUrl =
          post.media?.reddit_video?.hls_url ||
          post.media?.reddit_video?.fallback_url ||
          post.media?.reddit_video?.dash_url ||
          null;
        const highResImage = post.preview?.images?.[0]?.source?.url?.replaceAll("&amp;", "&");
        const permalink = post.permalink ? `https://www.reddit.com${post.permalink}` : null;

        if (post.title) {
          return {
            id: post.id || index,
            image: !isVideo ? highResImage : undefined,
            video: isVideo ? videoUrl : null,
            source: "reddit",
            title: post.title || "Untitled",
            caption: post.selftext?.substring(0, 100) || "No description.",
            tags: ["reddit", post.subreddit],
            url: permalink,
          };
        } else if (post.body) {
          return {
            id: post.id || index,
            image: !isVideo ? highResImage : undefined,
            video: isVideo ? videoUrl : null,
            source: "reddit",
            title: `Comment on r/${post.subreddit}`,
            caption: post.body.substring(0, 100),
            tags: ["reddit", post.subreddit],
            url: permalink,
          };
        } else {
          return {
            id: post.id || index,
            image: !isVideo ? highResImage : undefined,
            video: isVideo ? videoUrl : null,
            source: "reddit",
            title: "Unknown saved item",
            caption: "No description available.",
            tags: ["reddit"],
            url: permalink,
          };
        }
      });

      if (afterParam) {
        setBookmarks((prev) => {
          const updated = [...prev, ...parsed];
          handleSearchDebounced(searchText, updated);
          return updated;
        });
      } else {
        setBookmarks(parsed);
        handleSearchDebounced(searchText, parsed);
      }

      setAfter(newAfter);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Could not fetch Reddit data.");
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
    if (!text.trim()) {
      setFilteredBookmarks(data);
      return;
    }

    const lowerText = text.toLowerCase();
    const filtered: any[] = [];

    for (const item of data) {
      const localTags = await getTagsForBookmark(item.title);
      const allTags = [...(item.tags || []), ...localTags];
      const searchContent = `${item.title} ${item.caption} ${allTags.join(" ")}`.toLowerCase();

      if (searchContent.includes(lowerText)) {
        filtered.push(item);
      }
    }

    setFilteredBookmarks(filtered);
  };

  const handleSearchDebounced = useCallback(
    debounce((text: string, data?: any[]) => {
      handleSearch(text, data || bookmarks);
    }, 300),
    [bookmarks]
  );

  useEffect(() => {
    onRefresh();
    const refreshListener = () => {
      loadSavedPosts(null);
    };
    eventBus.on("refreshFeed", refreshListener);
    return () => {
      eventBus.off("refreshFeed", refreshListener);
    };
  }, []);

  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredBookmarks(bookmarks);
    }
  }, [searchText, bookmarks]);

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <TopHeader
          onSearchTextChange={(text) => {
            setSearchText(text);
            handleSearchDebounced(text);
          }}
        />
      </SafeAreaView>
      {error && <Text style={styles.error}>{error}</Text>}

      <AnimatedFlatList
        data={filteredBookmarks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <AnimatedBookmarkItem item={item} index={index} />
        )}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !refreshing && searchText.trim().length > 0 ? (
            <Text style={styles.noResults}>No Results</Text>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color="#6200ee" />
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  error: { color: "red", textAlign: "center", marginVertical: 10 },
  noResults: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
    fontSize: 16,
    fontWeight: "300",
  },
});
