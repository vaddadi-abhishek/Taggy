import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import handleSocialConnect from '@/src/utils/socialAuthDispatcher';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const shuffleArray = (arr: string[]) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function IndexScreen() {
  const [loading, setLoading] = useState(true);
  const [randomLogos] = useState(() =>
    shuffleArray([
      'https://img.icons8.com/?size=100&id=gxDo9YXCsacn&format=png&color=000000',
      'https://img.icons8.com/?size=100&id=oaaSr6h7kwm6&format=png&color=000000',
      'https://img.icons8.com/?size=100&id=3fxG1r3aX8Qo&format=png&color=000000',
      'https://img.icons8.com/?size=100&id=h0Wy3Nu7mqbq&format=png&color=000000',
      'https://img.icons8.com/?size=100&id=d6lKoTbA1g1G&format=png&color=000000',
      'https://img.icons8.com/?size=100&id=5twNojKL5zU7&format=png&color=000000',
      'https://img.icons8.com/?size=100&id=3psXjDzSpADv&format=png&color=000000',
      'https://img.icons8.com/?size=100&id=qLVB1tIe9Ts9&format=png&color=000000',
    ])
  );

  const floatAnims = useRef(randomLogos.map(() => new Animated.Value(0))).current;
  const [positions, setPositions] = useState(() => {
    const slotWidth = SCREEN_WIDTH / randomLogos.length;
    const slots = Array.from({ length: randomLogos.length }, (_, i) => i * slotWidth + slotWidth / 4);
    const shuffledSlots = shuffleArray(slots);

    return randomLogos.map((_, i) => ({
      left: shuffledSlots[i],
      delay: Math.random() * 3000,
      duration: 8000 + Math.random() * 4000,
    }));
  });

  const animateLogo = (i: number, newDuration?: number, newDelay?: number) => {
    floatAnims[i].setValue(0);
    Animated.timing(floatAnims[i], {
      toValue: 1,
      duration: newDuration ?? positions[i].duration,
      delay: newDelay ?? positions[i].delay,
      useNativeDriver: true,
    }).start(() => animateLogo(i)); // loop
  };

  const randomizeSingleLogo = (i: number) => {
    const newDuration = 6000 + Math.random() * 5000;
    const newDelay = Math.random() * 1000;
    const updatedPositions = [...positions];
    updatedPositions[i] = {
      ...updatedPositions[i],
      duration: newDuration,
      delay: newDelay,
    };
    setPositions(updatedPositions);
    animateLogo(i, newDuration, newDelay); // re-animate with new config
  };

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

  useEffect(() => {
    positions.forEach((_, i) => animateLogo(i));
  }, []);

  const startRedditLogin = async () => {
    const connected = await handleSocialConnect('reddit', true);
    if (connected) {
      router.replace('/Home');
    } else {
      console.warn('❌ Reddit login failed');
    }
  };

  const renderFloatingLogos = () =>
    randomLogos.map((uri, i) => {
      const translateY = floatAnims[i].interpolate({
        inputRange: [0, 1],
        outputRange: [SCREEN_HEIGHT + 50, -60],
      });

      return (
        <TouchableOpacity
          key={i}
          onPress={() => randomizeSingleLogo(i)}
          activeOpacity={0.8}
          style={[styles.floatingTouchable, { left: positions[i].left }]}
        >
          <Animated.Image
            source={{ uri }}
            style={[
              styles.floatingIcon,
              {
                transform: [{ translateY }],
                opacity: 0.5,
              },
            ]}
          />
        </TouchableOpacity>
      );
    });

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3573D1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>{renderFloatingLogos()}</View>

      <View style={styles.viewText}>
        <Text style={styles.welcomeText}>Let's</Text>
        <Text style={styles.welcomeText}>Go</Text>
        <Text style={styles.paraText}>
          Organize your saved posts across all social media platforms.
        </Text>
      </View>

      <View style={styles.btnWrapper}>
        <TouchableOpacity style={styles.fullBtn} onPress={startRedditLogin}>
          <Image
            source={{
              uri: 'https://img.icons8.com/?size=100&id=gxDo9YXCsacn&format=png&color=000000',
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
    width: 200,
  },
  btnWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    gap: 16,
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
  floatingIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  floatingTouchable: {
    position: 'absolute',
  },
});
