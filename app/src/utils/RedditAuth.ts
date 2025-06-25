import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import * as AuthSession from "expo-auth-session";
import Constants from 'expo-constants';

const { AUTHORIZATION_ENDPOINT, TOKEN_ENDPOINT, REDDIT_CLIENT_ID } = Constants.expoConfig?.extra || {};

const REDIRECT_URI = AuthSession.makeRedirectUri({
  native: "",
  useProxy: false,
});

const discovery = {
  authorizationEndpoint: AUTHORIZATION_ENDPOINT,
  tokenEndpoint: TOKEN_ENDPOINT,
};

const REDDIT_TOKEN_KEY = "reddit_token";
const REDDIT_REFRESH_KEY = "reddit_refresh_token";

const saveTokens = async (access_token: string, refresh_token?: string) => {
  await AsyncStorage.setItem(REDDIT_TOKEN_KEY, access_token);
  if (refresh_token) {
    await AsyncStorage.setItem(REDDIT_REFRESH_KEY, refresh_token);
  }
};

const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = await AsyncStorage.getItem(REDDIT_REFRESH_KEY);
  if (!refreshToken) return false;

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

    const data = await response.json();
    console.log("🔁 Refreshed Token:", data);

    if (data.access_token) {
      await saveTokens(data.access_token, data.refresh_token);
      return true;
    }
  } catch (err) {
    console.error("❌ Failed to refresh token:", err);
  }
  return false;
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
      usePKCE: true,
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
          await saveTokens(tokenData.access_token, tokenData.refresh_token);
          return true;
        } else {
          console.warn("❌ Token fetch failed:", tokenData);
          return false;
        }
      } else {
        console.warn("❌ Reddit OAuth failed or cancelled:", result);
        return false;
      }
    } catch (error) {
      console.error("❌ Reddit OAuth Error:", error);
      return false;
    }
  } else {
    console.log("🔌 Reddit disconnecting...");
    await AsyncStorage.multiRemove([REDDIT_TOKEN_KEY, REDDIT_REFRESH_KEY]);
    return true;
  }
};

// 👇 Expose both auth + refresh logic
export { redditAuth as default, refreshAccessToken };
