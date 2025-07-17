import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";

// Access environment variables from Constants.expoConfig.extra
const { AUTHORIZATION_ENDPOINT, TOKEN_ENDPOINT, REDDIT_CLIENT_ID } =
  Constants.expoConfig?.extra || {};

console.log([AUTHORIZATION_ENDPOINT, TOKEN_ENDPOINT, REDDIT_CLIENT_ID]);

// const REDIRECT_URI = "taggy://redirect"
const REDIRECT_URI = AuthSession.makeRedirectUri({
  useProxy: false,
});

console.log("REDIRECT URI:", REDIRECT_URI);

const discovery = {
  authorizationEndpoint: AUTHORIZATION_ENDPOINT,
  tokenEndpoint: TOKEN_ENDPOINT,
};

const redditAuth = async (shouldConnect: boolean): Promise<boolean> => {
  if (shouldConnect) {
    console.log("🔗 Reddit connecting...");

    const encodedCreds = Buffer.from(`${REDDIT_CLIENT_ID}:`).toString("base64");

    const authRequestConfig = {
      clientId: REDDIT_CLIENT_ID,
      scopes: ["identity", "read", "history", "save"],
      redirectUri: REDIRECT_URI,
      responseType: "code",
      usePKCE: false,
      extraParams: {
        duration: "permanent",
      },
    };

    const request = new AuthSession.AuthRequest(authRequestConfig);

    try {
      await request.makeAuthUrlAsync(discovery);
      const result = await request.promptAsync(discovery, { useProxy: false });

      if (result.type === "success" && result.params.code) {
        const code = result.params.code;

        const tokenResponse = await fetch(discovery.tokenEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Basic ${encodedCreds}`,
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

        if (tokenData.access_token) {
          await AsyncStorage.setItem("reddit_token", tokenData.access_token);
          if (tokenData.refresh_token) {
            await AsyncStorage.setItem("reddit_refresh_token", tokenData.refresh_token);
          }
          const expiryTime = Date.now() + tokenData.expires_in * 1000;
          await AsyncStorage.setItem("reddit_token_expiry", expiryTime.toString());
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
    await AsyncStorage.multiRemove([
      "reddit_token",
      "reddit_refresh_token",
      "reddit_token_expiry",
    ]);
    return true;
  }
};

export const getValidAccessToken = async (): Promise<string | null> => {
  const accessToken = await AsyncStorage.getItem("reddit_token");
  const expiry = await AsyncStorage.getItem("reddit_token_expiry");

  if (accessToken && expiry && parseInt(expiry) > Date.now()) {
    return accessToken;
  }

  const refreshToken = await AsyncStorage.getItem("reddit_refresh_token");
  if (!refreshToken) return null;

  console.log("🔄 Refreshing Reddit token...");

  const encodedCreds = Buffer.from(`${REDDIT_CLIENT_ID}:`).toString("base64");

  try {
    const response = await fetch(discovery.tokenEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodedCreds}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });

    const tokenData = await response.json();
    if (tokenData.access_token) {
      await AsyncStorage.setItem("reddit_token", tokenData.access_token);
      const newExpiry = Date.now() + tokenData.expires_in * 1000;
      await AsyncStorage.setItem("reddit_token_expiry", newExpiry.toString());
      return tokenData.access_token;
    } else {
      console.error("❌ Failed to refresh Reddit token:", tokenData);
      return null;
    }
  } catch (err) {
    console.error("❌ Error refreshing token:", err);
    return null;
  }
};

export default redditAuth;
