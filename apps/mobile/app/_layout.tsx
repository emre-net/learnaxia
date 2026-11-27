import 'react-native-reanimated';
import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LanguageProvider } from '@/hooks/use-language';
import { TokenWalletProvider } from '@/hooks/use-token-wallet';
import { AnimatedSplash } from '@/components/ui/animated-splash';
import api from '@/lib/api';
import { OfflineStorageService } from '@/services/offline-storage.service';

export const unstable_settings = {
  initialRouteName: 'index',
};

function OfflineSyncObserver() {
  const { user } = useAuth();
  const lastSyncRef = useRef(0);

  useEffect(() => {
    if (!user?.id) return;

    const triggerSync = async () => {
      const now = Date.now();
      if (now - lastSyncRef.current < 10_000) return;
      const pending = await OfflineStorageService.getPendingQueueCount();
      if (pending === 0) return;
      lastSyncRef.current = now;
      await OfflineStorageService.processSyncQueue(api).catch(() => {});
    };

    const unsubscribeNet = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        triggerSync();
      }
    });

    const appSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        NetInfo.fetch()
          .then((s) => {
            if (s.isConnected && s.isInternetReachable !== false) {
              triggerSync();
            }
          })
          .catch(() => {});
      }
    });

    return () => {
      unsubscribeNet();
      appSub.remove();
    };
  }, [user?.id]);

  return null;
}

export default function RootLayout() {
  const [isSplashComplete, setIsSplashComplete] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#09090B' }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: '#09090B' }}>
        <AuthProvider>
          <TokenWalletProvider>
            <OfflineSyncObserver />
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
        </TokenWalletProvider>
      </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
