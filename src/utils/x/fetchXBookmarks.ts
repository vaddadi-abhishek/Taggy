import AsyncStorage from "@react-native-async-storage/async-storage";
import parseXBookmarks from "@/src/utils/x/parseXBookmarks";
import { Alert } from "react-native";

const STORAGE_KEY = "x_bookmarks_storage";
const TOKEN_TIMESTAMP_KEY = "x_token_timestamp";

const fetchXUserId = async (token: string): Promise<string | null> => {
  const res = await fetch("https://api.twitter.com/2/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return null;
  const json = await res.json();
  return json.data?.id;
};

const fetchXBookmarks = async (
  paginationToken: string | null = null,
  existingUserId: string | null = null
): Promise<{
  posts: any[];
  nextToken: string | null;
  userId: string | null;
  error?: string;
}> => {
  try {
    const accessToken = await AsyncStorage.getItem("x_token");
    if (!accessToken) {
      return {
        posts: [],
        nextToken: null,
        userId: null,
        error: "Please connect your X account.",
      };
    }

    // ✅ Token expiry check (24hr)
    const tokenTimestamp = await AsyncStorage.getItem(TOKEN_TIMESTAMP_KEY);
    if (tokenTimestamp && Date.now() - parseInt(tokenTimestamp) > 24 * 60 * 60 * 1000) {
      Alert.alert("Session expired", "Please reconnect your X account.");
      return {
        posts: [],
        nextToken: null,
        userId: null,
        error: "Token expired.",
      };
    }

    // 🚀 Fetch fresh data
    let userId = existingUserId;
    if (!userId) {
      userId = await fetchXUserId(accessToken);
      if (!userId) {
        Alert.alert("X Login Expired", "Please reconnect your X account.");
        return {
          posts: [],
          nextToken: null,
          userId: null,
          error: "Unauthorized",
        };
      }
    }

    const url = `https://api.twitter.com/2/users/${userId}/bookmarks?max_results=100&tweet.fields=created_at,text,attachments,author_id,entities&expansions=attachments.media_keys,author_id&media.fields=url,preview_image_url,type&user.fields=username${paginationToken ? `&pagination_token=${paginationToken}` : ""}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status === 401) {
      Alert.alert("X Login Expired", "Please reconnect your X account.");
      return {
        posts: [],
        nextToken: null,
        userId,
        error: "Unauthorized",
      };
    }

    const json = await response.json();

    if (!json.data) {
      // fallback to saved storage
      const fallbackRaw = await AsyncStorage.getItem(STORAGE_KEY);
      if (fallbackRaw) {
        const fallbackMap = JSON.parse(fallbackRaw);
        return {
          posts: Object.values(fallbackMap),
          nextToken: null,
          userId,
          error: "Using saved bookmarks.",
        };
      }

      return {
        posts: [],
        nextToken: null,
        userId,
        error: "No bookmarks found.",
      };
    }

    const newPosts = parseXBookmarks(json);

    // ✅ Merge with existing saved storage
    const existingRaw = await AsyncStorage.getItem(STORAGE_KEY);
    const existingMap: Record<string, any> = existingRaw ? JSON.parse(existingRaw) : {};

    const updatedMap: Record<string, any> = {};

    // ✅ Add new posts first
    for (const post of newPosts) {
      updatedMap[post.id] = existingMap[post.id]
        ? {
            ...post,
            tags: existingMap[post.id].tags ?? post.tags,
          }
        : post;
    }

    // 🔁 Add remaining old posts after
    for (const [id, post] of Object.entries(existingMap)) {
      if (!updatedMap[id]) {
        updatedMap[id] = post;
      }
    }

    const mergedArray = Object.values(updatedMap);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMap));
    await AsyncStorage.setItem("x_cache_time", Date.now().toString());

    return {
      posts: mergedArray,
      nextToken: json.meta?.next_token || null,
      userId,
    };
  } catch (error) {
    console.error("❌ Error fetching X bookmarks:", error);

    const fallbackRaw = await AsyncStorage.getItem(STORAGE_KEY);
    if (fallbackRaw) {
      const fallbackMap = JSON.parse(fallbackRaw);
      return {
        posts: Object.values(fallbackMap),
        nextToken: null,
        userId: existingUserId,
        error: "Using saved bookmarks.",
      };
    }

    return {
      posts: [],
      nextToken: null,
      userId: existingUserId,
      error: "Could not fetch X bookmarks.",
    };
  }
};

export default fetchXBookmarks;
