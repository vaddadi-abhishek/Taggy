import AsyncStorage from "@react-native-async-storage/async-storage";
import parseRedditPosts from "@/src/utils/reddit/parseRedditPosts";
import { getValidAccessToken } from "@/src/utils/RedditAuth";

const SAVED_POSTS_KEY = "reddit_saved_posts";

const fetchUsername = async (token: string): Promise<string> => {
  const res = await fetch("https://oauth.reddit.com/api/v1/me", {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "taggy-app/1.0 (by u/South_Pencil)",
    },
  });

  if (!res.ok) throw new Error("Failed to fetch Reddit user");

  const data = await res.json();
  return data.name;
};

const readSavedPosts = async (): Promise<any[]> => {
  try {
    const raw = await AsyncStorage.getItem(SAVED_POSTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeSavedPosts = async (posts: any[]) => {
  await AsyncStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(posts));
};

const mergePosts = (existing: any[], incoming: any[]): any[] => {
  const existingIds = new Set(existing.map((p) => p.id));
  return [...existing, ...incoming.filter((p) => !existingIds.has(p.id))];
};

const fetchRedditPosts = async (
  after: string | null = null,
  existingUsername: string | null = null
): Promise<{
  posts: any[];
  after: string | null;
  username: string | null;
  error?: string;
}> => {
  try {
    const accessToken = await getValidAccessToken();

    if (!accessToken) {
      return {
        posts: [],
        after: null,
        username: null,
        error: "Please connect your Reddit account 😄",
      };
    }

    let username = existingUsername;
    if (!username) {
      username = await fetchUsername(accessToken);
    }

    const url = `https://oauth.reddit.com/user/${username}/saved?limit=100${
      after ? `&after=${after}` : ""
    }`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "taggy-app/1.0 (by u/South_Pencil)",
      },
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("Reddit API error:", errData);

      if (response.status === 401) {
        await AsyncStorage.multiRemove([
          "reddit_token",
          "reddit_refresh_token",
          "reddit_token_expiry",
        ]);
      }

      return {
        posts: [],
        after: null,
        username,
        error: "Failed to fetch Reddit saved posts.",
      };
    }

    const json = await response.json();
    const newPosts = parseRedditPosts(json.data.children);

    const existingPosts = await readSavedPosts();
    const mergedPosts = mergePosts(existingPosts, newPosts);
    await writeSavedPosts(mergedPosts);

    return {
      posts: mergedPosts,
      after: json.data.after,
      username,
    };
  } catch (error) {
    console.error("❌ Error fetching Reddit posts:", error);
    return {
      posts: [],
      after: null,
      username: existingUsername,
      error: "Could not fetch Reddit data.",
    };
  }
};

export default fetchRedditPosts;
