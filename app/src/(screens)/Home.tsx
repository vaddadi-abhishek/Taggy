import BookmarkCard from "@/app/src/components/BookMarkCard";
import TopHeader from "@/app/src/components/TopHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (text: string) => {
    console.log("Searching:", text);
  };

  const loadSavedPosts = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("reddit_token");
      console.log(accessToken);
      if (!accessToken) {
        setError("Reddit access token not found");
        setBookmarks([]); // 🔄 Clear bookmarks on logout
        return;
      }

      setBookmarks([]); // 🧹 Clear previous bookmarks before loading new ones

      // Step 1: Get logged-in username
      const userResponse = await fetch("https://oauth.reddit.com/api/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "taggy-app/1.0 (by u/South_Pencil)",
        },
      });

      if (!userResponse.ok) {
        const errData = await userResponse.json();
        console.error("Failed to fetch user info:", errData);
        setError("Failed to fetch user info.");
        return;
      }

      const userData = await userResponse.json();
      const username = userData.name;
      console.log("Logged-in Reddit username:", username);

      // Step 2: Get saved posts
      const savedResponse = await fetch(
        `https://oauth.reddit.com/user/${username}/saved`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "User-Agent": "taggy-app/1.0 (by u/South_Pencil)",
          },
        }
      );

      if (!savedResponse.ok) {
        const errData = await savedResponse.json();
        console.error("Failed to fetch saved posts:", errData);
        setError("Failed to fetch saved posts.");
        return;
      }

      const savedJson = await savedResponse.json();
      const posts = savedJson.data.children;

      const parsed = posts.map((item: any, index: number) => {
        const post = item.data;

        if (post.title) {
          // It's a post
          return {
            id: post.id || index,
            image: post.thumbnail?.startsWith("http") ? post.thumbnail : "https://tinyurl.com/4k5fhafn",
            source: "reddit",
            title: post.title || "Untitled",
            caption: post.selftext?.substring(0, 100) || "No description.",
            aiSummary: "Summary will be generated here",
            tags: ["reddit", post.subreddit],
          };
        } else if (post.body) {
          // It's a comment
          return {
            id: post.id || index,
            image: "https://tinyurl.com/2f5uh482", // comments have no thumbnail
            source: "reddit",
            title: `Comment on r/${post.subreddit}`,
            caption: post.body.substring(0, 100),
            aiSummary: "Summary will be generated here",
            tags: ["reddit", post.subreddit],
          };
        } else {
          // Fallback for unknown types
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

      setBookmarks(parsed);
      setError(null); // ✅ Clear old error on success
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Could not fetch Reddit data.");
    }
  };

  useEffect(() => {
    loadSavedPosts();
  }, []);

  return (
    <View style={styles.container}>
      <TopHeader onSearchTextChange={handleSearch} />
      <ScrollView>
        <View style={{ paddingBottom: 80 }}>
          {error && <Text style={styles.error}>{error}</Text>}
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              image={bookmark.image}
              source={bookmark.source}
              title={bookmark.title}
              caption={bookmark.caption}
              aiSummary={bookmark.aiSummary}
              tags={bookmark.tags}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
});
