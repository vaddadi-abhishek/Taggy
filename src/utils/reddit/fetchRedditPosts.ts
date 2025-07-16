import AsyncStorage from "@react-native-async-storage/async-storage";
import parseRedditPosts from "@/src/utils/reddit/parseRedditPosts";
import { getValidAccessToken } from "@/src/utils/RedditAuth";

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

    const url = `https://oauth.reddit.com/user/${username}/saved?limit=25${
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

      // If error is due to expired token, clear saved token
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
    const posts = parseRedditPosts(json.data.children);

    return {
      posts,
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
