import 'react-native-reanimated';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Suppress non-critical API error banners from showing in the UI
LogBox.ignoreLogs([
  'AxiosError',
  'Request failed with status code',
  'Network Error',
]);

export const unstable_settings = {
  initialRouteName: '(tabs)',
};


export default function RootLayout() {
  // FORCE_BOOT_DEBUG: Set to true to bypass the entire app (Auth, Navigation, Tabs)
  // and render ONLY a basic native View/Text. This isolates native crashes from JS logic errors.
  const FORCE_BOOT_DEBUG = false; 

  if (FORCE_BOOT_DEBUG) {
    return (
      <View style={{ flex: 1, backgroundColor: 'red', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>BOOT DEBUG ACTIVE</Text>
      </View>
    );
  }

  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: '#050B18' }
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
          <StatusBar style="light" />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

