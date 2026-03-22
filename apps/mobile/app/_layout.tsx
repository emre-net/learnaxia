import 'react-native-reanimated';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import './global.css';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Suppress non-critical API error banners from showing in the UI
LogBox.ignoreLogs([
  'AxiosError',
  'Request failed with status code',
  'Network Error',
]);

export const unstable_settings = {
  anchor: '(tabs)',
};

function InitialRoot() {
  const { isLoading } = useAuth();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!isLoading) {
      // Small delay to ensure everything is painted before hiding splash
      const timer = setTimeout(() => {
        SplashScreen.hideAsync().catch(() => { });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="create" options={{ presentation: 'modal', title: 'Create', headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <InitialRoot />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
