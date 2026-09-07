import 'react-native-reanimated';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '../context/AuthContext';

// Suppress non-critical API error banners from showing in the UI
LogBox.ignoreLogs([
  'AxiosError',
  'Request failed with status code',
  'Network Error',
]);

export const unstable_settings = {
  initialRouteName: '(tabs)',
};


import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { AnimatedSplash } from '@/components/ui/animated-splash';
import * as SplashScreen from 'expo-splash-screen';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isSplashComplete, setIsSplashComplete] = useState(false);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#000000' }}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: '#000000' } // Pure Black
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="create" options={{ presentation: 'modal', title: 'Create' }} />
            <Stack.Screen name="study/[id]" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="journey/[id]" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="analytics" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="notes/[id]" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="collections" options={{ animation: 'slide_from_right' }} />
          </Stack>

          {!isSplashComplete && (
            <AnimatedSplash onComplete={() => setIsSplashComplete(true)} />
          )}

          <StatusBar style="light" backgroundColor="#000000" />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

