import 'dotenv/config';

export default {
  expo: {
    name: 'Taggy',
    slug: 'taggy',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/taggy-logo-v3.png',
    scheme: 'taggy',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/taggy-logo-v3.png',
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
          image: './assets/images/taggy-logo-v3.png',
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
