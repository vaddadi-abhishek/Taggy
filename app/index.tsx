import globalStyles from '@/app/src/styles/globalStyles';
import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import handleSocialConnect from 'utils/socialAuthDispatcher';
import eventBus from 'utils/eventBus';
import { router } from 'expo-router';

export default function index() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('reddit_token');
      if (token) {
        router.replace('/src/(screens)/Home'); // 🔁 Replace so user can't go back
      } else {
        setIsChecking(false); // Show login UI
      }
    };
    checkToken();
  }, []);

  const handleRedditLogin = async () => {
    const result = await handleSocialConnect('reddit', true);
    if (result) {
      eventBus.emit('refreshFeed');
      router.replace('/src/(screens)/Home');
    }
  };

  if (isChecking) {
    // 🌀 Show loading while checking AsyncStorage
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
        <TouchableOpacity style={styles.btnStyles} onPress={handleRedditLogin}>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
});
