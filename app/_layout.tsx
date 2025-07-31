import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import * as Linking from "expo-linking";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { logEnvironmentStatus } from "@/lib/config/env";
import { initializeDatabase } from "@/lib/database";
import { initializeRevenueCat } from "@/lib/revenuecat/client";
import { useAuthStore } from "@/lib/stores/authStore";
import { initializeAuth, clearAllStoredSessions } from "@/lib/supabase/client";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const setLoading = useAuthStore((state) => state.setLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Initialization guard to prevent repeated calls
  const isInitialized = useRef(false);
  const hasInitializedAuth = useRef(false);

  // Initialize app services
  useEffect(() => {
    async function initializeApp() {
      // Prevent repeated initialization
      if (isInitialized.current) {
        return;
      }

      try {
        setLoading(true);
        isInitialized.current = true;

        console.log("🚀 Initializing Labaku app...");

        // Debug: Clear all sessions on fresh start (uncomment for testing)
        // await clearAllStoredSessions();

        // Log environment status once at startup
        logEnvironmentStatus();

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
        hasInitializedAuth.current = true;
      } catch (error) {
        console.error("❌ App initialization failed:", error);
        // Reset initialization flag on error to allow retry
        isInitialized.current = false;
      } finally {
        setLoading(false);
      }
    }

    initializeApp();
  }, [setLoading]);

  // Handle authentication routing
  useEffect(() => {
    // Only handle routing after initial auth setup is complete
    if (!isLoading && hasInitializedAuth.current) {
      if (isAuthenticated) {
        // User is authenticated, ensure they're on the main app
        router.replace("/(tabs)");
      } else {
        // User is not authenticated, redirect to login
        router.replace("/auth/login");
      }
    }
  }, [isAuthenticated, isLoading]);

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      console.log('🔗 Deep link received:', url);
      
      // Parse the URL
      const parsed = Linking.parse(url);
      
      // Handle email confirmation links
      if (parsed.path === 'auth/confirm') {
        console.log('📧 Email confirmation link detected');
        // Navigate to confirmation screen with query parameters
        const queryString = parsed.queryParams ? 
          Object.entries(parsed.queryParams)
            .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
            .join('&') : '';
        
        const confirmUrl = queryString ? `/auth/confirm?${queryString}` : '/auth/confirm';
        router.push(confirmUrl as any);
      }
      // Handle password reset links
      else if (parsed.path === 'reset-password') {
        console.log('🔑 Password reset link detected');
        // You can add password reset handling here if needed
        router.push('/auth/login');
      }
    };

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for incoming deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

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
