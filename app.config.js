import 'dotenv/config';

export default {
  expo: {
    name: 'Taggy',
    slug: 'taggy',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/taggy-logo-v3.png',
    scheme: 'taggy',
    privacy: 'hidden', // Prevents app visibility in some launchers
    jsEngine: 'hermes', // For better performance
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,

    updates: {
      url: "https://u.expo.dev/613b6096-e5c2-4e51-82c1-af485ab6848a"
    },

    androidStatusBar: {
      backgroundColor: '#ffffff',
      barStyle: 'dark-content',
    },

    ios: {
      supportsTablet: true,
    },

    android: {
      package: 'com.anonymous.taggy',
      adaptiveIcon: {
        foregroundImage: './assets/images/taggy-logo-v3.png',
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
              pathPrefix: "/oauth"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ],
      softwareKeyboardLayoutMode: "pan" // Prevents UI jumping during auth flows
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
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
          },
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
      eas: {
        projectId: "613b6096-e5c2-4e51-82c1-af485ab6848a",
      },
    },
  },
};
