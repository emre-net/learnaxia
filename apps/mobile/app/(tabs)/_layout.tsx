import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Platform, View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Sürekli nefes alan glow efekti
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Glow pulse — 2.5sn
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1250, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1250, useNativeDriver: true }),
      ])
    ).start();
    // İkon rotasyonu — 4sn
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.delay(3200),
      ])
    ).start();
  }, [glowAnim, rotateAnim]);

  const handleCreatePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, speed: 50 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    // Small delay so animation is visible before push
    setTimeout(() => router.push('/create'), 80);
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6', // Primary Blue
        tabBarInactiveTintColor: '#64748B', // Muted foreground
        headerShown: false,
        tabBarShowLabel: false, // Web doesn't have text labels
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }]} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(9, 15, 29, 0.98)', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }]} />
          )
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
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
              <Ionicons name={focused ? 'book' : 'book-outline'} size={24} color={color} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="create_placeholder"
        options={{
          tabBarIcon: () => (
            <Animated.View style={[styles.floatingButton, { transform: [{ scale: scaleAnim }] }]}>
              {/* Pulse glow ring */}
              <Animated.View style={[
                styles.glowRing,
                { opacity: glowAnim }
              ]} />
              {/* Gradient arkaplan */}
              <LinearGradient
                colors={['#3B82F6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Animated.View style={{
                transform: [{ rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '15deg']
                }) }]
              }}>
                <Ionicons name="sparkles" size={24} color="white" />
              </Animated.View>
            </Animated.View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              activeOpacity={1}
              style={[props.style, { transform: [{ translateY: -16 }] }]}
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
              <Ionicons name={focused ? 'compass' : 'compass-outline'} size={26} color={color} />
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
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3B82F6', // Primary Blue
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#050A14',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  glowRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#7C3AED',
    zIndex: -1,
  },
});
