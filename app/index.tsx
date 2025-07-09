import React, { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import handleSocialConnect from '@/src/utils/socialAuthDispatcher';

export default function IndexScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      const redditToken = await AsyncStorage.getItem('reddit_token');

      if (redditToken) {
        router.replace('/Home');
      } else {
        setLoading(false);
      }
    };
    checkToken();
  }, []);

  const startRedditLogin = async () => {
    const connected = await handleSocialConnect('reddit', true);
    if (connected) {
      router.replace('/Home');
    } else {
      console.warn('❌ Reddit login failed');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3573D1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.viewText}>
        <Text style={styles.welcomeText}>Let's</Text>
        <Text style={styles.welcomeText}>Go</Text>
        <Text style={styles.paraText}>
          Organize your saved posts across all social media posts.
        </Text>
      </View>

      <View style={styles.btnWrapper}>
        <TouchableOpacity style={styles.fullBtn} onPress={startRedditLogin}>
          <Image
            source={{ uri: 'https://img.icons8.com/?size=100&id=gxDo9YXCsacn&format=png&color=000000' }}
            style={styles.btnImg}
          />
          <Text style={styles.btnText}>Login with Reddit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    width: 200,
  },
  btnWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    gap: 16, // gap between buttons
  },

  fullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 250,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3573D1',
    gap: 10,
  },

  btnImg: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
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
