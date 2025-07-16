import 'dotenv/config';

export default {
  expo: {
    name: 'taggy',
    slug: 'taggy',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon-1.png',
    scheme: 'taggy',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      package: 'com.abhishekvaddadi.taggy',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon-1.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "taggy",
              host: "redirect",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
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
          image: './assets/images/splash-1.png',
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
      "eas": {
        "projectId": "613b6096-e5c2-4e51-82c1-af485ab6848a"
      },
    },
  },
};
