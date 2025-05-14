import 'dotenv/config';

export default {
  expo: {
    name: 'taggy',
    slug: 'taggy',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'taggy',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      AUTHORIZATION_ENDPOINT: process.env.AUTHORIZATION_ENDPOINT,
      TOKEN_ENDPOINT: process.env.TOKEN_ENDPOINT,
      REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID,
    },
  },
};
