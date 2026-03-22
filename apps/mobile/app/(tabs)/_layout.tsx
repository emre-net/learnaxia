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
        tabBarActiveTintColor: '#818cf8', // Indigo-400
        tabBarInactiveTintColor: '#475569', // Slate-600
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <View style={styles.tabBarBackground}>
            <View style={styles.tabBarTopBorder} />
          </View>
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
          letterSpacing: 0.3,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
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
            <View style={focused ? styles.activeIconContainer : undefined}>
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
            <View style={focused ? styles.activeIconContainer : undefined}>
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
            <View style={focused ? styles.activeIconContainer : undefined}>
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
    overflow: 'hidden',
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
  },
  tabBarTopBorder: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderRadius: 1,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: 12,
    padding: 6,
    marginTop: -2,
  },
});
