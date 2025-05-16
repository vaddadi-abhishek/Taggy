import BookmarkCard from "@/app/src/components/BookMarkCard";
import TopHeader from "@/app/src/components/TopHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import eventBus from "utils/eventBus";

export default function HomeScreen() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [after, setAfter] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  // Fetch username once, store it
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

  // Fetch saved posts, pass after for pagination, append if after exists
  const loadSavedPosts = async (afterParam: string | null = null) => {
    try {
      const accessToken = await AsyncStorage.getItem("reddit_token");
      if (!accessToken) {
        setError("Reddit access token not found");
        setBookmarks([]);
        return;
      }

      let currentUsername = username;
      if (!currentUsername) {
        currentUsername = await fetchUsername(accessToken);
        setUsername(currentUsername);
      }

      if (!afterParam) {
        // First page: reset bookmarks and after
        setBookmarks([]);
        setAfter(null);
      }

      const url = `https://oauth.reddit.com/user/${currentUsername}/saved?limit=25${afterParam ? `&after=${afterParam}` : ""}`;

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

        if (post.title) {
          return {
            id: post.id || index,
            image: post.thumbnail?.startsWith("http")
              ? post.thumbnail
              : "https://tinyurl.com/4k5fhafn",
            source: "reddit",
            title: post.title || "Untitled",
            caption: post.selftext?.substring(0, 100) || "No description.",
            aiSummary: "Summary will be generated here",
            tags: ["reddit", post.subreddit],
          };
        } else if (post.body) {
          return {
            id: post.id || index,
            image: "https://tinyurl.com/2f5uh482",
            source: "reddit",
            title: `Comment on r/${post.subreddit}`,
            caption: post.body.substring(0, 100),
            aiSummary: "Summary will be generated here",
            tags: ["reddit", post.subreddit],
          };
        } else {
          return {
            id: post.id || index,
            image: "",
            source: "reddit",
            title: "Unknown saved item",
            caption: "No description available.",
            aiSummary: "Summary will be generated here",
            tags: ["reddit"],
          };
        }
      });

      if (afterParam) {
        setBookmarks((prev) => [...prev, ...parsed]); // Append next page
      } else {
        setBookmarks(parsed); // First page
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

  // Called when list end is reached
  const onEndReached = async () => {
    if (after && !loadingMore && !refreshing) {
      setLoadingMore(true);
      await loadSavedPosts(after);
      setLoadingMore(false);
    }
  };

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

  return (
    <View style={styles.container}>
      <TopHeader onSearchTextChange={(text) => console.log("Searching:", text)} />
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <BookmarkCard
            image={item.image}
            source={item.source}
            title={item.title}
            caption={item.caption}
            aiSummary={item.aiSummary}
            tags={item.tags}
          />
        )}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5} // Load more when scrolled 50% near bottom
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator size="small" color="#6200ee" /> : null
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  error: { color: "red", textAlign: "center", marginVertical: 10 },
});
