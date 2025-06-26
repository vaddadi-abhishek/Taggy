import AsyncStorage from "@react-native-async-storage/async-storage";

export const getAutoplaySetting = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem("autoplay_videos");
  return value === "true"; // Default fallback if null
};
