import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
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
const ICON_SIZE = 40;
const SPEED = 1.2;

const shuffleArray = (arr: any[]) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getFixedVelocity = (index: number) => {
  const direction = index % 4;
  switch (direction) {
    case 0: return { vx: SPEED, vy: SPEED };
    case 1: return { vx: -SPEED, vy: SPEED };
    case 2: return { vx: SPEED, vy: -SPEED };
    case 3: return { vx: -SPEED, vy: -SPEED };
    default: return { vx: SPEED, vy: SPEED };
  }
};

export default function IndexScreen() {
  const [loading, setLoading] = useState(true);
  const [assetsReady, setAssetsReady] = useState(false);
  const [animationReady, setAnimationReady] = useState(false);
  const animationFrameId = useRef<number>();

  const [randomLogos] = useState(() =>
    shuffleArray([
      require('@/assets/icons/reddit.png'),
      require('@/assets/icons/x.png'),
      require('@/assets/icons/bookmark.png'),
      require('@/assets/icons/tag.png'),
    ])
  );

  const positions = useRef(
    randomLogos.map((_, index) => {
      const { vx, vy } = getFixedVelocity(index);
      return {
        x: new Animated.Value(Math.random() * (SCREEN_WIDTH - ICON_SIZE)),
        y: new Animated.Value(Math.random() * (SCREEN_HEIGHT - ICON_SIZE)),
        vx,
        vy,
        rotation: new Animated.Value(0),
        rotationAngle: 0,
      };
    })
  ).current;

  // ✅ Fix: Use Image.resolveAssetSource instead of Image.getSize
  useEffect(() => {
    if (assetsReady) return;

    let isMounted = true;

    const loadImages = async () => {
      await Promise.all(
        randomLogos.map(
          (asset) =>
            new Promise((resolve) => {
              try {
                Image.resolveAssetSource(asset);
                resolve(true);
              } catch (error) {
                console.warn('❌ Failed to resolve asset:', asset, error);
                resolve(true);
              }
            })
        )
      );

      if (isMounted) setAssetsReady(true);
    };

    loadImages();

    return () => {
      isMounted = false;
    };
  }, [randomLogos, assetsReady]);

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
    if (!assetsReady) return;
    const timer = setTimeout(() => {
      setAnimationReady(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [assetsReady]);

  useEffect(() => {
    if (!animationReady) return;

    const animate = () => {
      positions.forEach((logo, i) => {
        let newX = logo.x.__getValue() + logo.vx;
        let newY = logo.y.__getValue() + logo.vy;

        if (newX < 0 || newX > SCREEN_WIDTH - ICON_SIZE) {
          logo.vx *= -1;
          rotateLogo(i, 30);
        }
        if (newY < 0 || newY > SCREEN_HEIGHT - ICON_SIZE) {
          logo.vy *= -1;
          rotateLogo(i, 30);
        }

        for (let j = 0; j < positions.length; j++) {
          if (i !== j) {
            const dx = newX - positions[j].x.__getValue();
            const dy = newY - positions[j].y.__getValue();
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < ICON_SIZE) {
              const angle = Math.atan2(dy, dx);
              const force = 0.4;
              logo.vx += Math.cos(angle) * force;
              logo.vy += Math.sin(angle) * force;
              positions[j].vx -= Math.cos(angle) * force;
              positions[j].vy -= Math.sin(angle) * force;

              rotateLogo(i, 45);
              rotateLogo(j, -45);
            }
          }
        }

        logo.x.setValue(newX);
        logo.y.setValue(newY);
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    const rotateLogo = (i: number, amount: number) => {
      const logo = positions[i];
      logo.rotationAngle = (logo.rotationAngle + amount) % 360;

      Animated.timing(logo.rotation, {
        toValue: logo.rotationAngle,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    };

    animate();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [positions, animationReady]);

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
      const rotate = positions[i].rotation.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
      });

      return (
        <Animated.View
          key={i}
          style={[
            styles.floatingTouchable,
            {
              transform: [
                { translateX: positions[i].x },
                { translateY: positions[i].y },
                { rotate },
              ],
              opacity: animationReady ? 1 : 0,
            },
          ]}
        >
          <Image source={uri} style={styles.floatingIcon} />
        </Animated.View>
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
      <View style={StyleSheet.absoluteFill}>
        {renderFloatingLogos()}
        {!animationReady && (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <ActivityIndicator size="small" color="#3573D1" />
          </View>
        )}
      </View>

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
    backgroundColor: 'white',
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
    backgroundColor: 'white',
  },
  floatingIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    resizeMode: 'contain',
    opacity: 0.5,
  },
  floatingTouchable: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
