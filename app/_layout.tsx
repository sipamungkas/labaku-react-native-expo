import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { initializeAuth } from '@/lib/supabase/client';
import { initializeRevenueCat } from '@/lib/revenuecat/client';
import { initializeDatabase } from '@/lib/database';
import { useAuthStore } from '@/lib/stores/authStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  
  const setLoading = useAuthStore((state) => state.setLoading);
  
  // Initialize app services
  useEffect(() => {
    async function initializeApp() {
      try {
        setLoading(true);
        
        console.log('🚀 Initializing Labaku app...');
        
        // Initialize database
        await initializeDatabase();
        console.log('✅ Database initialized');
        
        // Initialize authentication
        initializeAuth();
        console.log('✅ Authentication initialized');
        
        // Initialize RevenueCat
        await initializeRevenueCat();
        console.log('✅ RevenueCat initialized');
        
        console.log('🎉 App initialization complete!');
        
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      } finally {
        setLoading(false);
      }
    }
    
    initializeApp();
  }, [setLoading]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
