import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, View, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const scaleAnim = useSharedValue(1);

  useEffect(() => {
      scaleAnim.value = withRepeat(
          withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
      );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleAnim.value }],
  }));

  const handleCreatePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/create');
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#F8FAFC', // Saf Beyaz
        tabBarInactiveTintColor: '#475569', // Koyu Gri (Slate 600)
        headerShown: false,
        tabBarShowLabel: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0A0A0A', borderTopWidth: 1, borderTopColor: '#1E293B' }]} />
          )
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          borderTopWidth: Platform.OS === 'ios' ? 1 : 0,
          borderTopColor: '#1E293B',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="library"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons name={focused ? 'library' : 'library-outline'} size={24} color={color} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="create_placeholder"
        options={{
          tabBarIcon: () => (
            <Animated.View style={[styles.floatingButton, animatedStyle]}>
              <Ionicons name="add" size={28} color="#000000" />
            </Animated.View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[props.style, { transform: [{ translateY: -12 }] }]}
              onPress={handleCreatePress}
            >
              {props.children}
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: 40,
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F8FAFC',
  },
  floatingButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F8FAFC', // Beyaz minimal buton
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
