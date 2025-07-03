// src/utils/XAuth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";

const {
  TWITTER_CLIENT_ID,
  TWITTER_CLIENT_SECRET,
} = Constants.expoConfig?.extra || {};

// const REDIRECT_URI = "taggy://redirect";
const REDIRECT_URI = AuthSession.makeRedirectUri({
  useProxy: true,
});

console.log("Twitter Redirect URI:", REDIRECT_URI);

const discovery = {
  authorizationEndpoint: "https://twitter.com/i/oauth2/authorize",
  tokenEndpoint: "https://api.twitter.com/2/oauth2/token",
};

const XAuth = async (shouldConnect: boolean): Promise<boolean> => {
  if (shouldConnect) {
    console.log("🔗 Twitter connecting...");

    const authRequestConfig = {
      clientId: TWITTER_CLIENT_ID,
      redirectUri: REDIRECT_URI,
      scopes: ["tweet.read", "users.read", "bookmark.read"],
      responseType: "code",
      usePKCE: true,
    };

    const request = new AuthSession.AuthRequest(authRequestConfig);

    try {
      await request.makeAuthUrlAsync(discovery);
      const result = await request.promptAsync(discovery, { useProxy: true });

      if (result.type === "success" && result.params.code) {
        const code = result.params.code;

        const tokenResponse = await fetch(discovery.tokenEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
              "Basic " +
              Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64"),
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: request.codeVerifier!,
          }).toString(),
        });

        const tokenData = await tokenResponse.json();
        console.log("✅ Twitter Token Response:", tokenData);

        if (tokenData.access_token) {
          await AsyncStorage.setItem("twitter_token", tokenData.access_token);
          await AsyncStorage.setItem("twitter_refresh", tokenData.refresh_token || "");
          console.log("✅ Twitter token saved in AsyncStorage");
          return true;
        } else {
          console.warn("❌ Twitter Token fetch failed:", tokenData);
          return false;
        }
      } else {
        console.warn("❌ Twitter OAuth failed or was cancelled:", result);
        return false;
      }
    } catch (error) {
      console.error("❌ Error during Twitter OAuth:", error);
      return false;
    }
  } else {
    console.log("🔌 Twitter disconnecting...");
    await AsyncStorage.removeItem("twitter_token");
    await AsyncStorage.removeItem("twitter_refresh");
    return true;
  }
};

export default XAuth;
