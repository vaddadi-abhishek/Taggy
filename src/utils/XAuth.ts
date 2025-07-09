// src/utils/XAuth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import { isXInCooldown, clearXCooldown } from "@/src/utils/XCooldownTime";

const {
  TWITTER_CLIENT_ID,
  TWITTER_CLIENT_SECRET,
} = Constants.expoConfig?.extra || {};

const REDIRECT_URI = AuthSession.makeRedirectUri({ useProxy: true });

const discovery = {
  authorizationEndpoint: "https://twitter.com/i/oauth2/authorize",
  tokenEndpoint: "https://api.twitter.com/2/oauth2/token",
};

const X_DISCONNECT_KEY = "@x_disconnect_time";
const LOCKOUT_DURATION = 18 * 60 * 1000; // 18 minutes

// 🔍 Check if reconnect is allowed after disconnect
export const checkXReconnectAllowed = async (): Promise<{ allowed: boolean; remaining?: string }> => {
  const disconnectTimeStr = await AsyncStorage.getItem(X_DISCONNECT_KEY);
  if (!disconnectTimeStr) return { allowed: true };

  const disconnectTime = parseInt(disconnectTimeStr, 10);
  const elapsed = Date.now() - disconnectTime;

  if (elapsed >= LOCKOUT_DURATION) return { allowed: true };

  const remainingMs = LOCKOUT_DURATION - elapsed;
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  const formatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return { allowed: false, remaining: formatted };
};

// 👁️ Check if X bookmarks should be visible (token + cooldown logic)
export const checkXBookmarksVisible = async (): Promise<boolean> => {
  const token = await AsyncStorage.getItem("x_token");
  if (!token) {
    console.log("🛑 X disconnected — no token found");
    return false;
  }

  const cooldown = await isXInCooldown();
  console.log("🕒 X cooldown check —", cooldown ? "still cooling" : "allowed");
  return !cooldown;
};


// 🔐 Connect or disconnect from X (Twitter)
const XAuth = async (shouldConnect: boolean): Promise<boolean> => {
  if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
    console.warn("❌ Missing Twitter credentials");
    return false;
  }

  if (shouldConnect) {
    const { allowed, remaining } = await checkXReconnectAllowed();
    if (!allowed) {
      throw new Error(`You can connect only after ${remaining}`);
    }

    const authRequestConfig = {
      clientId: TWITTER_CLIENT_ID,
      redirectUri: REDIRECT_URI,
      scopes: ["tweet.read", "users.read", "bookmark.read"],
      responseType: "code",
      usePKCE: true,
    };

    const request = new AuthSession.AuthRequest(authRequestConfig);

    try {
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
        if (tokenData.access_token) {
          await AsyncStorage.setItem("x_token", tokenData.access_token);
          await AsyncStorage.setItem("x_refresh", tokenData.refresh_token || "");
          await AsyncStorage.setItem("x_token_timestamp", Date.now().toString());

          // ✅ Clear disconnect lock
          await AsyncStorage.removeItem(X_DISCONNECT_KEY);

          // 🔧 NEW: Clear cooldown time
          await clearXCooldown();
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
    // 🔌 Disconnect flow
    console.log("🔌 Disconnecting X...");
    await AsyncStorage.removeItem("x_token");
    await AsyncStorage.removeItem("x_refresh");
    await AsyncStorage.removeItem("x_token_timestamp");
    await AsyncStorage.removeItem("x_cache_time");
    await AsyncStorage.setItem(X_DISCONNECT_KEY, Date.now().toString());
    return true;
  }
};

export default XAuth;
