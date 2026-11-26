import 'react-native-reanimated';
import React, { useState } from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '@/hooks/use-language';
import { AnimatedSplash } from '@/components/ui/animated-splash';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const [isSplashComplete, setIsSplashComplete] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#09090B' }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: '#09090B' }}>
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider value={DarkTheme}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'fade',
                  contentStyle: { backgroundColor: '#09090B' },
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
                <Stack.Screen name="create" options={{ presentation: 'modal', title: 'Create' }} />
                <Stack.Screen name="study/[id]" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="study/daily" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="journey/[id]" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="journey/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="analytics" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="leaderboard" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="notes/[id]" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="notes/new" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="modules/[id]" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="modules/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="collections/[id]" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="collections/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              </Stack>

              {!isSplashComplete && (
                <AnimatedSplash onComplete={() => setIsSplashComplete(true)} />
              )}

              <StatusBar style="light" backgroundColor="#09090B" />
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
