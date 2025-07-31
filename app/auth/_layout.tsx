import { Stack } from 'expo-router';
import React from 'react';

/**
 * Authentication Layout
 * Stack navigation for auth screens
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}