import AsyncStorage from "@react-native-async-storage/async-storage";

const TAG_STORAGE_KEY = "user_tags";
const BOOKMARK_TAG_MAP_KEY = "bookmark_tag_map";

const normalizeTag = (str: string) => str.trim().replace(/\s+/g, "").toLowerCase();

export const getAllTags = async (): Promise<string[]> => {
  const raw = await AsyncStorage.getItem(TAG_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const saveAllTags = async (tags: string[]) => {
  await AsyncStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(tags));
};

export const addGlobalTag = async (tag: string): Promise<boolean> => {
  if (tag.length < 3) return false;

  const tags = await getAllTags();
  const isDuplicate = tags.some((t) => normalizeTag(t) === normalizeTag(tag));
  if (isDuplicate) return false;

  const updated = [tag, ...tags];
  await saveAllTags(updated);
  return true;
};

export const deleteGlobalTag = async (tag: string) => {
  const tags = await getAllTags();
  const updated = tags.filter((t) => t !== tag);
  await saveAllTags(updated);

  const rawMap = await AsyncStorage.getItem(BOOKMARK_TAG_MAP_KEY);
  const map = rawMap ? JSON.parse(rawMap) : {};
  Object.keys(map).forEach((id) => {
    map[id] = map[id].filter((t: string) => t !== tag);
  });
  await AsyncStorage.setItem(BOOKMARK_TAG_MAP_KEY, JSON.stringify(map));
};

export const updateGlobalTag = async (oldTag: string, newTag: string): Promise<boolean> => {
  if (newTag.length < 3) return false;

  const tags = await getAllTags();
  const isDuplicate = tags.some((t) => normalizeTag(t) === normalizeTag(newTag));
  if (isDuplicate) return false;

  const updatedTags = tags.map((t) => (t === oldTag ? newTag : t));
  await saveAllTags(updatedTags);

  const rawMap = await AsyncStorage.getItem(BOOKMARK_TAG_MAP_KEY);
  const map = rawMap ? JSON.parse(rawMap) : {};
  Object.keys(map).forEach((id) => {
    map[id] = map[id].map((t: string) => (t === oldTag ? newTag : t));
  });
  await AsyncStorage.setItem(BOOKMARK_TAG_MAP_KEY, JSON.stringify(map));

  return true;
};

export const getTagsForBookmark = async (bookmarkId: string): Promise<string[]> => {
  const raw = await AsyncStorage.getItem(BOOKMARK_TAG_MAP_KEY);
  const map = raw ? JSON.parse(raw) : {};
  return map[bookmarkId] || [];
};

export const addTagToBookmark = async (bookmarkId: string, tag: string): Promise<string[]> => {
  const raw = await AsyncStorage.getItem(BOOKMARK_TAG_MAP_KEY);
  const map = raw ? JSON.parse(raw) : {};

  if (!map[bookmarkId]) map[bookmarkId] = [];
  if (!map[bookmarkId].includes(tag)) map[bookmarkId].unshift(tag);

  await AsyncStorage.setItem(BOOKMARK_TAG_MAP_KEY, JSON.stringify(map));
  return map[bookmarkId];
};

export async function removeTagFromBookmark(bookmarkId: string, tag: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(BOOKMARK_TAG_MAP_KEY);
    const parsed = data ? JSON.parse(data) : {};
    const tags: string[] = parsed[bookmarkId] || [];

    parsed[bookmarkId] = tags.filter((t) => t !== tag);
    await AsyncStorage.setItem(BOOKMARK_TAG_MAP_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.error("Failed to remove tag from bookmark:", e);
  }
}

export const getTagsWithCounts = async (): Promise<{ name: string; count: number }[]> => {
  const tags = await getAllTags();
  const rawMap = await AsyncStorage.getItem(BOOKMARK_TAG_MAP_KEY);
  const map = rawMap ? JSON.parse(rawMap) : {};

  const tagCounts: Record<string, number> = {};

  Object.values(map).forEach((tagList: string[]) => {
    tagList.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return tags.map((name) => ({
    name,
    count: tagCounts[name] || 0,
  }));
};

