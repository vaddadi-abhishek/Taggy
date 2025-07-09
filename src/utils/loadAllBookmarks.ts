import fetchRedditPosts from "@/src/utils/reddit/fetchRedditPosts";
import fetchXBookmarks from "@/src/utils/x/fetchXBookmarks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTagsForBookmark } from "@/src/utils/tagStorage";
import { isXInCooldown, resetXCooldown } from "@/src/utils/XCooldownTime";

let currentRedditAfter: string | null = null;
let currentRedditUsername: string | null = null;

export const loadAllBookmarks = async (): Promise<{
  posts: any[];
  redditAfter: string | null;
  redditUsername: string | null;
}> => {
  // 🚀 Fetch Reddit bookmarks
  const redditRes = await fetchRedditPosts();

  // 🐦 Fetch X bookmarks (handle cooldown/cache fallback)
  let xRes = null;
  let fetchedFreshX = false;

  const xToken = await AsyncStorage.getItem("x_token");
  if (xToken) {
    const inCooldown = await isXInCooldown();
    if (!inCooldown) {
      xRes = await fetchXBookmarks();
      fetchedFreshX = true;
      console.log("🔹 X bookmarks fetched fresh:", xRes?.posts?.length);
    } else {
      console.log("🧊 In X cooldown — using cache");
      xRes = await getCachedXPosts();
    }
  } else {
    console.log("⛔ Skipping X — not connected");
  }

  // 🔄 Save Reddit pagination info
  currentRedditAfter = redditRes.after;
  currentRedditUsername = redditRes.username;

  // 🔁 Merge and deduplicate posts
  const allPosts = [
    ...redditRes.posts,
    ...(xRes?.posts || []),
  ];
  const seen = new Set();
  const uniquePosts = allPosts.filter((p) => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  });

  // 🕒 Update cooldown if fresh X fetched
  if (fetchedFreshX) {
    await resetXCooldown();
  }

  return {
    posts: uniquePosts,
    redditAfter: redditRes.after,
    redditUsername: redditRes.username,
  };
};

export const loadMoreBookmarks = async (): Promise<{
  newPosts: any[];
  redditAfter: string | null;
}> => {
  const out: any[] = [];

  if (currentRedditAfter && currentRedditUsername) {
    const redditMore = await fetchRedditPosts(currentRedditAfter, currentRedditUsername);
    currentRedditAfter = redditMore.after;

    const enrichedReddit = await Promise.all(
      redditMore.posts.map(async (p) => {
        const localTags = await getTagsForBookmark(p.title);
        return { ...p, localTags };
      })
    );

    out.push(...enrichedReddit);
  }

  return {
    newPosts: out,
    redditAfter: currentRedditAfter,
  };
};

const getCachedXPosts = async (): Promise<{ posts: any[] }> => {
  try {
    const cached = await AsyncStorage.getItem("x_bookmarks_storage");
    if (!cached) return { posts: [] };
    const parsed = JSON.parse(cached);
    return { posts: Object.values(parsed) };
  } catch (err) {
    console.error("❌ Failed to read cached X posts:", err);
    return { posts: [] };
  }
};
