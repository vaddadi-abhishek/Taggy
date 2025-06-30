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

  // ✅ On load, check if Reddit is already connected
  useEffect(() => {
    const checkRedditToken = async () => {
      const token = await AsyncStorage.getItem('reddit_token');
      if (token) {
        router.replace('/Home');
      } else {
        setLoading(false);
      }
    };
    checkRedditToken();
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
