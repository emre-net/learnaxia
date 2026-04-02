import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#00D2FF', // Ocean Cyan
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.3)',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <View style={styles.tabBarBackground} />
        ),
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 88 : 72,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? "bg-blue-500/10 p-2 rounded-xl" : "p-2"}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Kütüphane',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? "bg-blue-500/10 p-2 rounded-xl" : "p-2"}>
              <Ionicons name={focused ? 'library' : 'library-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? "bg-blue-500/10 p-2 rounded-xl" : "p-2"}>
              <Ionicons name={focused ? 'compass' : 'compass-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? "bg-blue-500/10 p-2 rounded-xl" : "p-2"}>
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 15, 25, 0.95)', // ocean-bg equivalent
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
});
