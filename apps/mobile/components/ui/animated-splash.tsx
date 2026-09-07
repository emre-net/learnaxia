import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withSpring,
    runOnJS,
    Easing
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as SplashScreen from 'expo-splash-screen';

interface AnimatedSplashProps {
    onComplete: () => void;
}

export function AnimatedSplash({ onComplete }: AnimatedSplashProps) {
    const scale = useSharedValue(0.85);
    const opacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(10);
    const containerOpacity = useSharedValue(1);

    useEffect(() => {
        // Hide native splash screen once AnimatedSplash mounts
        SplashScreen.hideAsync().catch(() => {});

        // 1. Entrance: Fade in logo with spring (300ms)
        opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
        scale.value = withSpring(1, { damping: 14, stiffness: 120 });

        // Brand text entrance (150ms delay)
        const t1 = setTimeout(() => {
            textOpacity.value = withTiming(1, { duration: 350 });
            textTranslateY.value = withSpring(0, { damping: 15 });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }, 150);

        // 2. Exit: Smooth fade out after 1100ms
        const t2 = setTimeout(() => {
            containerOpacity.value = withTiming(0, { duration: 350, easing: Easing.inOut(Easing.ease) }, (finished) => {
                if (finished) {
                    runOnJS(onComplete)();
                }
            });
        }, 1100);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [onComplete]);

    const imageStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }]
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }]
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <View style={styles.centerContent}>
                <Animated.Image
                    source={require('../../assets/images/logo.png')}
                    style={[styles.logo, imageStyle]}
                    resizeMode="contain"
                />

                <Animated.View style={[styles.textWrapper, textStyle]}>
                    <Text style={styles.brandText}>LEARNAXIA</Text>
                    <Text style={styles.tagline}>Learn Smart. Learn Fast.</Text>
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#050A14', // Exact app dark theme background
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    centerContent: {
        alignItems: 'center',
    },
    logo: {
        width: 140,
        height: 140,
        marginBottom: 20,
        borderRadius: 28,
    },
    textWrapper: {
        alignItems: 'center',
    },
    brandText: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: 2,
    },
    tagline: {
        color: '#3B82F6',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        marginTop: 6,
        textTransform: 'uppercase'
    }
});
