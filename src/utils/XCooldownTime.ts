import AsyncStorage from "@react-native-async-storage/async-storage";

const X_CACHE_TIME_KEY = "x_cache_time";
const COOLDOWN_DURATION_MS = 1000 * 60 * 60 * 3; // 3 hours

// 🔄 Check if still in cooldown
export const isXInCooldown = async (): Promise<boolean> => {
  const lastFetchedStr = await AsyncStorage.getItem(X_CACHE_TIME_KEY);
  if (!lastFetchedStr) return false;

  const lastFetched = parseInt(lastFetchedStr, 10);
  const now = Date.now();

  return now - lastFetched < COOLDOWN_DURATION_MS;
};

// 🔄 Reset the cooldown (used after successful fetch)
export const resetXCooldown = async (): Promise<void> => {
  await AsyncStorage.setItem(X_CACHE_TIME_KEY, Date.now().toString());
};

// 🧹 Clear the cooldown manually (e.g. after connect)
export const clearXCooldown = async (): Promise<void> => {
  await AsyncStorage.removeItem(X_CACHE_TIME_KEY);
};
