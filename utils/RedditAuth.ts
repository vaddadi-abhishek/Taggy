import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import * as AuthSession from "expo-auth-session";
import Constants from 'expo-constants';

// Access environment variables from Constants.expoConfig.extra
const { AUTHORIZATION_ENDPOINT, TOKEN_ENDPOINT, REDDIT_CLIENT_ID } = Constants.expoConfig?.extra || {};
  
console.log([AUTHORIZATION_ENDPOINT, TOKEN_ENDPOINT, REDDIT_CLIENT_ID])


const printAsyncStorage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(keys);

    items.forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
  } catch (error) {
    console.error('Error printing AsyncStorage data:', error);
  }
};

printAsyncStorage();

const REDIRECT_URI = AuthSession.makeRedirectUri({
  native: "taggy://redirect", // Ensure this matches your actual app scheme
  useProxy: true, // Ensures it works in Expo Go
});

const discovery = {
  authorizationEndpoint: AUTHORIZATION_ENDPOINT,
  tokenEndpoint: TOKEN_ENDPOINT,
};

export const redditAuth = async (shouldConnect: boolean): Promise<boolean> => {
  if (shouldConnect) {
    console.log("🔗 Reddit connecting...");

    const encodedCreds = Buffer.from(`${REDDIT_CLIENT_ID}:`).toString("base64");

    const authRequestConfig = {
      clientId: REDDIT_CLIENT_ID,
      scopes: ["identity", "read", "history", "save"],
      redirectUri: REDIRECT_URI,
      responseType: "code",
      usePKCE: true,
      extraParams: {
        duration: "permanent",
      },
    };

    const request = new AuthSession.AuthRequest(authRequestConfig);

    try {
      await request.makeAuthUrlAsync(discovery); // 🔧 required before promptAsync
      const result = await request.promptAsync(discovery, { useProxy: true });

      if (result.type === "success" && result.params.code) {
        const code = result.params.code;

        const tokenResponse = await fetch(discovery.tokenEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Basic ${encodedCreds}`, // This should include client secret if required
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
          }).toString(),
        });

        const tokenData = await tokenResponse.json();
        console.log("✅ Reddit Token Response:", tokenData);

        // Save token for future use (like fetching saved posts)
        if (tokenData.access_token) {
          await AsyncStorage.setItem("reddit_token", tokenData.access_token);
          console.log("✅ Token stored in AsyncStorage");
          return true;
        } else {
          console.warn("❌ Token fetch failed:", tokenData);
          return false;
        }
      } else {
        console.warn("❌ Reddit OAuth failed or was cancelled:", result);
        return false;
      }
    } catch (error) {
      console.error("❌ Error during Reddit OAuth:", error);
      return false;
    }
  } else {
    console.log("🔌 Reddit disconnecting...");
    // Optionally clear stored tokens here
    await AsyncStorage.removeItem("reddit_token");
    return true;
  }
};
