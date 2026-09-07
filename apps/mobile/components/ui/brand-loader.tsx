import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';

interface BrandLoaderProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  showBlur?: boolean;
  className?: string;
}

export function BrandLoader({
  size = 'md',
  label,
  className
}: BrandLoaderProps) {
  const sizeMap = {
    sm: 24,
    md: 48,
    lg: 80,
    xl: 128
  };

  const finalSize = typeof size === 'number' ? size : sizeMap[size] || 48;
  const logoSource = require('@/assets/images/logo.png');

  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * 1.3 }],
    opacity: opacity.value * 0.15,
  }));

  return (
    <View className={className} style={styles.container}>
      <View style={{ width: finalSize, height: finalSize, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View style={[styles.glow, animatedGlowStyle, { width: finalSize * 0.8, height: finalSize * 0.8, borderRadius: finalSize / 2 }]} />
        <Animated.Image source={logoSource} style={[animatedLogoStyle, { width: finalSize, height: finalSize, resizeMode: 'contain' }]} />
      </View>
      {label && <Animated.Text style={[styles.label, { opacity: opacity.value }]}>{label}</Animated.Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  glow: {
    position: 'absolute',
    backgroundColor: '#F8FAFC',
    shadowColor: '#F8FAFC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  label: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
