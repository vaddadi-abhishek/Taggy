import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
import Constants from "expo-constants";

// Extract from env
const { X_CLIENT_ID, X_AUTHORIZATION_ENDPOINT, X_TOKEN_ENDPOINT } =
  Constants.expoConfig?.extra || {};

console.log("🔐 X Auth Endpoints:", [X_CLIENT_ID, X_AUTHORIZATION_ENDPOINT, X_TOKEN_ENDPOINT]);

const REDIRECT_URI = AuthSession.makeRedirectUri({
  useProxy: false,
});

console.log("🔀 X Redirect URI:", REDIRECT_URI);

const discovery = {
  authorizationEndpoint: X_AUTHORIZATION_ENDPOINT,
  tokenEndpoint: X_TOKEN_ENDPOINT,
};

const generateCodeVerifier = async () => {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Buffer.from(randomBytes).toString("base64url");
};

const generateCodeChallenge = async (verifier: string) => {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  return digest.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const xAuth = async (shouldConnect: boolean): Promise<boolean> => {
  if (shouldConnect) {
    console.log("🔗 Connecting to X...");

    const codeVerifier = await generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const authRequestConfig = {
      clientId: X_CLIENT_ID,
      scopes: ["tweet.read", "users.read", "offline.access", "bookmark.read"],
      redirectUri: REDIRECT_URI,
      responseType: "code",
      codeChallenge,
      codeChallengeMethod: "S256",
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
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: X_CLIENT_ID,
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: codeVerifier,
          }).toString(),
        });

        const tokenData = await tokenResponse.json();
        console.log("✅ X Token Response:", tokenData);

        if (tokenData.access_token) {
          await AsyncStorage.setItem("x_token", tokenData.access_token);
          if (tokenData.refresh_token) {
            await AsyncStorage.setItem("x_refresh_token", tokenData.refresh_token);
          }
          const expiryTime = Date.now() + tokenData.expires_in * 1000;
          await AsyncStorage.setItem("x_token_expiry", expiryTime.toString());
          return true;
        } else {
          console.warn("❌ X token fetch failed:", tokenData);
          return false;
        }
      } else {
        console.warn("❌ X OAuth failed or was cancelled:", result);
        return false;
      }
    } catch (error) {
      console.error("❌ X OAuth error:", error);
      return false;
    }
  } else {
    console.log("🔌 Disconnecting X...");
    await AsyncStorage.multiRemove(["x_token", "x_refresh_token", "x_token_expiry"]);
    return true;
  }
};

export const getValidXAccessToken = async (): Promise<string | null> => {
  const accessToken = await AsyncStorage.getItem("x_token");
  const expiry = await AsyncStorage.getItem("x_token_expiry");

  if (accessToken && expiry && parseInt(expiry) > Date.now()) {
    return accessToken;
  }

  const refreshToken = await AsyncStorage.getItem("x_refresh_token");
  if (!refreshToken) return null;

  console.log("🔄 Refreshing X token...");

  try {
    const response = await fetch(discovery.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: X_CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });

    const tokenData = await response.json();
    if (tokenData.access_token) {
      await AsyncStorage.setItem("x_token", tokenData.access_token);
      const newExpiry = Date.now() + tokenData.expires_in * 1000;
      await AsyncStorage.setItem("x_token_expiry", newExpiry.toString());
      return tokenData.access_token;
    } else {
      console.error("❌ Failed to refresh X token:", tokenData);
      return null;
    }
  } catch (err) {
    console.error("❌ Error refreshing X token:", err);
    return null;
  }
};

export default xAuth;
