import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { initializeDatabase } from "@/lib/database";
import { initializeRevenueCat } from "@/lib/revenuecat/client";
import { useAuthStore } from "@/lib/stores/authStore";
import { initializeAuth } from "@/lib/supabase/client";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const setLoading = useAuthStore((state) => state.setLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Initialize app services
  useEffect(() => {
    async function initializeApp() {
      try {
        setLoading(true);

        console.log("🚀 Initializing Labaku app...");

        // Initialize database
        await initializeDatabase();
        console.log("✅ Database initialized");

        // Initialize authentication
        initializeAuth();
        console.log("✅ Authentication initialized");

        // Initialize RevenueCat
        await initializeRevenueCat();
        console.log("✅ RevenueCat initialized");

        console.log("🎉 App initialization complete!");
      } catch (error) {
        console.error("❌ App initialization failed:", error);
      } finally {
        setLoading(false);
      }
    }

    initializeApp();
  }, [setLoading]);

  // Handle authentication routing
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // User is authenticated, ensure they're on the main app
        router.replace("/(tabs)");
      } else {
        // User is not authenticated, redirect to login
        router.replace("/auth/login");
      }
    }
  }, [isAuthenticated, isLoading]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
