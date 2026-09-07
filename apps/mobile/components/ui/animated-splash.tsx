import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withSequence, 
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
    const scale = useSharedValue(0.8);
    const opacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(15);
    const containerOpacity = useSharedValue(1);

    useEffect(() => {
        const runAnimation = async () => {
            // Native splash ekranını hemen gizle, kontrolü React Native'e al
            await SplashScreen.hideAsync().catch(() => {});

            // 1. Faz: Giriş (Fade In & Scale Up)
            opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
            scale.value = withSpring(1, { damping: 12, stiffness: 90 });
            
            // Marka metni biraz gecikmeli gelsin
            setTimeout(() => {
                textOpacity.value = withTiming(1, { duration: 600 });
                textTranslateY.value = withSpring(0, { damping: 15 });
            }, 300);

            // 2. Faz: Bekleme ve Kalp Atışı (Pulse)
            setTimeout(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                scale.value = withSequence(
                    withTiming(1.05, { duration: 150, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) })
                );
            }, 1200);

            // 3. Faz: Çıkış (Zoom Out & Fade Out)
            setTimeout(() => {
                scale.value = withTiming(10, { duration: 600, easing: Easing.in(Easing.exp) });
                opacity.value = withTiming(0, { duration: 400 });
                textOpacity.value = withTiming(0, { duration: 200 });
                containerOpacity.value = withTiming(0, { duration: 500 }, (finished) => {
                    if (finished) {
                        runOnJS(onComplete)();
                    }
                });
            }, 2200);
        };

        runAnimation();
    }, []);

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
                
                {/* Orijinal Logo */}
                <Animated.Image 
                    source={require('../../assets/images/logo.png')}
                    style={[styles.logo, imageStyle]}
                    resizeMode="contain"
                />

                {/* Marka Metni */}
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
        backgroundColor: '#000000', // Pure Black (App bg ile aynı)
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    centerContent: {
        alignItems: 'center',
    },
    logo: {
        width: 180,
        height: 180,
        marginBottom: 24,
        borderRadius: 40, // Eğer Logonun köşeleri kareyse biraz yuvarlatmak iyi durabilir
    },
    textWrapper: {
        alignItems: 'center',
    },
    brandText: {
        color: '#FFFFFF',
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: 2,
    },
    tagline: {
        color: '#2563EB',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        marginTop: 8,
        textTransform: 'uppercase'
    }
});
