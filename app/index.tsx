import globalStyles from '@/app/src/styles/globalStyles';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useRouter, useSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import { Buffer } from 'buffer';

const { TOKEN_ENDPOINT, REDDIT_CLIENT_ID } = Constants.expoConfig?.extra || {};

// 👇 Update this to your correct redirect URI
const REDIRECT_URI = AuthSession.makeRedirectUri({
  native: '', // Leave blank for managed workflow
  useProxy: false,
});

const discovery = {
  authorizationEndpoint: 'https://www.reddit.com/api/v1/authorize.compact',
  tokenEndpoint: TOKEN_ENDPOINT,
};

export default function IndexScreen() {
  const [loading, setLoading] = useState(true);
  const [authRequest, result, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: REDDIT_CLIENT_ID,
      scopes: ['identity', 'read', 'history', 'save'],
      redirectUri: REDIRECT_URI,
      responseType: 'code',
      usePKCE: true,
      extraParams: {
        duration: 'permanent',
      },
    },
    discovery
  );

  // ✅ Check token on load
  useEffect(() => {
    const checkExistingToken = async () => {
      const token = await AsyncStorage.getItem('reddit_token');
      if (token) {
        router.replace('/src/(screens)/Home');
      } else {
        setLoading(false);
      }
    };
    checkExistingToken();
  }, []);

  // ✅ Handle redirect result (token exchange)
  useEffect(() => {
    const handleRedirect = async () => {
      if (result?.type === 'success' && result.params.code) {
        const code = result.params.code;
        const creds = Buffer.from(`${REDDIT_CLIENT_ID}:`).toString('base64');

        try {
          const res = await fetch(discovery.tokenEndpoint, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${creds}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              redirect_uri: REDIRECT_URI,
            }).toString(),
          });

          const tokenData = await res.json();
          if (tokenData.access_token) {
            await AsyncStorage.setItem('reddit_token', tokenData.access_token);
            router.replace('/src/(screens)/Home');
          } else {
            console.error('❌ Failed to fetch token:', tokenData);
          }
        } catch (e) {
          console.error('❌ Reddit OAuth error:', e);
        }
      }
    };

    handleRedirect();
  }, [result]);

  const startRedditLogin = async () => {
    if (authRequest) {
      await promptAsync({ useProxy: false });
    }
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3573D1" />
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <View style={styles.viewText}>
        <Text style={styles.welcomeText}>Let's</Text>
        <Text style={styles.welcomeText}>Go</Text>
        <Text style={styles.paraText}>
          sailing across social media for saved posts.
        </Text>
      </View>

      <View style={styles.btnWrapper}>
        <TouchableOpacity style={styles.btnStyles} onPress={startRedditLogin}>
          <Image
            source={{
              uri: 'https://img.icons8.com/3d-fluency/375/reddit.png',
            }}
            style={styles.btnImg}
          />
          <Text style={styles.btnText}>Login with Reddit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewText: {
    flex: 1,
    justifyContent: 'center',
    paddingStart: 44,
  },
  welcomeText: {
    fontWeight: '800',
    fontSize: 48,
  },
  paraText: {
    width: 100,
  },
  btnWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
  },
  btnStyles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 21,
    borderRadius: 25,
    backgroundColor: '#3573D1',
  },
  btnImg: {
    width: 20,
    height: 20,
  },
  btnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '300',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
