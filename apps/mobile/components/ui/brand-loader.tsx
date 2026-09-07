import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';

interface BrandLoaderProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  /** 
   * showBlur prop şu an için ayrılmış, ileriki versiyonda 
   * BlurView ile entegre edilebilir.
   */
  showBlur?: boolean;
  className?: string;
}

export function BrandLoader({
  size = 'md',
  label,
  showBlur: _showBlur, // Destructure edildi, ileride kullanılacak
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

  return (
    <View className={className} style={styles.container}>
      <View style={{ width: finalSize, height: finalSize, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
        <Image source={logoSource} style={{ width: finalSize, height: finalSize, resizeMode: 'contain' }} />
        <ActivityIndicator size="large" color="#00D2FF" style={{ position: 'absolute' }} />
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  label: {
    color: '#00D2FF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
