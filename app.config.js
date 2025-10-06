import 'dotenv/config';
export default {
  expo: {
    name: process.env.EXPO_PUBLIC_APP_NAME || "CarWash Pro",
    slug: "carwash-pro",
    owner: process.env.EXPO_OWNER || "naqiago",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    description: "Professional car wash booking app - Find and book trusted car wash services near you",
    primaryColor: "#3b82f6",
    newArchEnabled: true,
    scheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'carwashpro',
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#3b82f6"
    },
    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "We use your location to show nearby car wash services and recenter the map."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      config: {
        googleMaps: {
          // Use only the raw key string from env (not a URL)
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID
        }
      },
      package: process.env.ANDROID_PACKAGE || "com.naqiago.carwashpro"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-secure-store",
      "expo-audio"
    ],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || 'd92b61b1-c9f0-44db-bec3-dd2b018b2583'
      }
    }
  }
};
