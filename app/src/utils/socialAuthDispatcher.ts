import AsyncStorage from "@react-native-async-storage/async-storage";
import InstagramAuth from "utils/InstagramAuth";
import redditAuth from "utils/RedditAuth";
import XAuth from "utils/XAuth";
import YoutubeAuth from "utils/YoutubeAuth";

const handleSocialConnect = async (
  platform: string,
  shouldConnect: boolean
): Promise<boolean> => {
  const tokenKey = `${platform}_token`;

  if (!shouldConnect) {
    // Disconnect flow: clear token
    await AsyncStorage.removeItem(tokenKey);
    return true;
  }

  // Connect flow: check existing token
  const existingToken = await AsyncStorage.getItem(tokenKey);
  if (existingToken) {
    console.log(`[${platform}] Already connected, skipping OAuth.`);
    return true;
  }

  // Perform platform-specific auth only if not connected
  let token: string | null = null;

  switch (platform) {
    case "reddit":
      token = await redditAuth(true);
      break;
    case "twitter":
      token = await XAuth(true);
      break;
    case "youtube":
      token = await YoutubeAuth(true);
      break;
    case "instagram":
      token = await InstagramAuth(true);
      break;
    default:
      console.warn(`No auth handler for ${platform}`);
      return false;
  }

  // Check and store returned token
  if (token) {
    await AsyncStorage.setItem(tokenKey, token);
    return true;
  }

  return false;
};

export default handleSocialConnect;
