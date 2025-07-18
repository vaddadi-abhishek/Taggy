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
  } catch (err) {
    console.error("❌ Failed to read from AsyncStorage:", err);
    return [];
  }
};

const writeSavedPosts = async (posts: any[]) => {
  await AsyncStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(posts));
};

const mergePosts = (existing: any[], incoming: any[]): any[] => {
  const existingIds = new Set(existing.map((p) => p.id));
  const newPosts = incoming.filter((p) => !existingIds.has(p.id));

  newPosts.forEach((p) => {
    if (!p.savedAt) p.savedAt = Date.now();
  });

  return [...newPosts, ...existing]; // new at top
};

const fetchAllSavedPosts = async (username: string, token: string): Promise<any[]> => {
  let all: any[] = [];
  let after: string | null = null;

  while (true) {
    const url = `https://oauth.reddit.com/user/${username}/saved?limit=100${after ? `&after=${after}` : ""}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "taggy-app/1.0 (by u/South_Pencil)",
      },
    });

    if (!res.ok) break;

    const json = await res.json();
    const children = json?.data?.children || [];

    console.log("📦 Total fetched in this batch:", children.length, "AFTER =", json?.data?.after);

    all.push(...children);
    after = json?.data?.after;
    if (!after) break;
  }

  return parseRedditPosts(all);
};

const fetchRedditPosts = async (
  tokenOverride: string | null = null,
  afterOverride: string | null = null
): Promise<{
  posts: any[];
  after: string | null;
  username: string | null;
  error?: string;
}> => {
  try {
    const accessToken = tokenOverride || await getValidAccessToken();

    if (!accessToken) {
      return {
        posts: [],
        after: null,
        username: null,
        error: "Please connect your Reddit account 😄",
      };
    }

    const username = await fetchUsername(accessToken);
    const existingPosts = await readSavedPosts();

    let allNewPosts: any[] = [];
    let after: string | null = afterOverride;

    if (existingPosts.length === 0) {
      console.log("📥 First login — fetching all saved Reddit posts...");
      allNewPosts = await fetchAllSavedPosts(username, accessToken);
    } else {
      const url = `https://oauth.reddit.com/user/${username}/saved?limit=100${after ? `&after=${after}` : ""}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "taggy-app/1.0 (by u/South_Pencil)",
        },
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error("❌ Reddit API error:", errData);

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
      allNewPosts = parseRedditPosts(json?.data?.children || []);
      after = json?.data?.after || null;
    }

    const mergedPosts = mergePosts(existingPosts, allNewPosts);
    await writeSavedPosts(mergedPosts);

    return {
      posts: mergedPosts,
      after,
      username,
    };
  } catch (error) {
    console.error("❌ Error fetching Reddit posts:", error);
    return {
      posts: [],
      after: null,
      username: null,
      error: "Could not fetch Reddit data.",
    };
  }
};

export default fetchRedditPosts;
