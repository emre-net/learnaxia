import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate,
  Easing
} from 'react-native-reanimated';
import { Theme as SharedTheme } from '@learnaxia/shared';
import { Svg, Path } from 'react-native-svg';

interface BrandLoaderProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  showBlur?: boolean;
  className?: string; // Support for NativeWind if needed
}

export function BrandLoader({ 
  size = 'md', 
  label, 
  showBlur = true,
  className 
}: BrandLoaderProps) {
  // Map string sizes to numbers
  const sizeMap = {
    sm: 24,
    md: 48,
    lg: 64,
    xl: 96
  };
  
  const finalSize = typeof size === 'number' ? size : sizeMap[size] || 48;

  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);
  const strokeOffset = useSharedValue(100);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.ease }),
        withTiming(1, { duration: 1000, easing: Easing.ease })
      ),
      -1,
      true
    );
    strokeOffset.value = withRepeat(
      withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.2], [1, 0.8]),
  }));

  return (
    <View className={className} style={styles.container}>
      <View style={{ width: finalSize, height: finalSize, alignItems: 'center', justifyContent: 'center' }}>
        {/* Animated Background Ring */}
        <Animated.View 
          style={[
            styles.ring, 
            { width: finalSize, height: finalSize, borderRadius: finalSize / 2 },
            animatedRingStyle
          ]} 
        />
        
        {/* Glow Effect */}
        {showBlur && (
          <Animated.View 
            style={[
              styles.glow, 
              { width: finalSize - 10, height: finalSize - 10, borderRadius: (finalSize - 10) / 2 },
              animatedLogoStyle
            ]} 
          />
        )}

        {/* Logo Icon */}
        <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
          <Svg width={Math.round(finalSize * 0.5)} height={Math.round(finalSize * 0.5)} viewBox="0 0 24 24" fill="none">
            <Path
              d="M8 4V16C8 18 9 20 12 20H18"
              stroke="white"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M14 6L16 4L14 2"
              stroke={SharedTheme.colors.brandEmerald}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      </View>

      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: '#3b82f6',
    borderRightColor: '#a855f7',
  },
  glow: {
    position: 'absolute',
    backgroundColor: '#3b82f6',
    opacity: 0.15,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 16,
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
