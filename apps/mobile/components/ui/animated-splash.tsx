import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withSequence, 
    withSpring, 
    runOnJS
} from 'react-native-reanimated';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as SplashScreen from 'expo-splash-screen';

interface AnimatedSplashProps {
    onComplete: () => void;
}

export function AnimatedSplash({ onComplete }: AnimatedSplashProps) {
    const sparkOpacity = useSharedValue(0);
    const sparkScale = useSharedValue(0.1);
    const bulbOpacity = useSharedValue(0);
    const armsOpacity = useSharedValue(0);
    const cardSpread = useSharedValue(0);
    const cardOpacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(20);
    const overallScale = useSharedValue(1);

    useEffect(() => {
        const runAnimation = async () => {
            await SplashScreen.hideAsync().catch(() => {});

            // Faz 1: Kıvılcım ve Ampul (Core)
            sparkOpacity.value = withTiming(1, { duration: 400 });
            sparkScale.value = withSpring(1, { damping: 8, stiffness: 120 });
            
            setTimeout(() => {
                bulbOpacity.value = withTiming(1, { duration: 500 });
            }, 250);

            // Faz 2: Kollar uzanır ve Kartlar açılır
            setTimeout(() => {
                armsOpacity.value = withTiming(1, { duration: 400 });
                cardOpacity.value = withTiming(1, { duration: 400 });
                cardSpread.value = withSpring(1, { damping: 14, stiffness: 90 });
            }, 600);

            // Faz 3: Kalp Atışı (Haptics)
            setTimeout(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                overallScale.value = withSequence(
                    withTiming(1.15, { duration: 150 }),
                    withTiming(1, { duration: 150 })
                );
                textOpacity.value = withTiming(1, { duration: 400 });
                textTranslateY.value = withSpring(0, { damping: 15 });
            }, 1400);

            // Faz 4: Çıkış
            setTimeout(() => {
                overallScale.value = withTiming(0, { duration: 400 }, (finished) => {
                    if (finished) {
                        runOnJS(onComplete)();
                    }
                });
            }, 2700);
        };

        runAnimation();
    }, []);

    // Stiller
    const sparkStyle = useAnimatedStyle(() => ({
        opacity: sparkOpacity.value,
        transform: [{ scale: sparkScale.value }],
    }));

    const bulbStyle = useAnimatedStyle(() => ({
        opacity: bulbOpacity.value,
    }));

    const armsStyle = useAnimatedStyle(() => ({
        opacity: armsOpacity.value,
    }));

    const leftCardStyle = useAnimatedStyle(() => ({
        opacity: cardOpacity.value,
        transform: [
            { translateX: -55 * cardSpread.value },
            { translateY: 10 * cardSpread.value },
            { rotate: `${-15 * cardSpread.value}deg` }
        ]
    }));

    const rightCardStyle = useAnimatedStyle(() => ({
        opacity: cardOpacity.value,
        transform: [
            { translateX: 55 * cardSpread.value },
            { translateY: 10 * cardSpread.value },
            { rotate: `${15 * cardSpread.value}deg` }
        ]
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }]
    }));

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: overallScale.value }]
    }));

    // Brand Colors
    const brandBlue = "#2563EB"; // Tech Blue
    const brandWhite = "#F8FAFC";

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.centerContent, containerStyle]}>
                
                {/* Vektörel Logo: Ampul ve Kartlar */}
                <View style={styles.logoContainer}>
                    
                    {/* KOLLAR (Arms) */}
                    <Animated.View style={[styles.absoluteCenter, armsStyle, { zIndex: 2 }]}>
                        <Svg width="140" height="40" viewBox="0 0 140 40" fill="none">
                            {/* Sol Kol */}
                            <Path d="M70 20 Q 35 20 10 0" stroke={brandWhite} strokeWidth="3" strokeLinecap="round" />
                            {/* Sağ Kol */}
                            <Path d="M70 20 Q 105 20 130 0" stroke={brandWhite} strokeWidth="3" strokeLinecap="round" />
                        </Svg>
                    </Animated.View>

                    {/* SOL KART */}
                    <Animated.View style={[styles.cardWrapper, leftCardStyle]}>
                        <Svg width="44" height="60" viewBox="0 0 44 60" fill="none">
                            {/* Kart Gövdesi */}
                            <Rect x="2" y="2" width="40" height="56" rx="6" fill="#0A0A0A" stroke={brandBlue} strokeWidth="2.5"/>
                            {/* Satırlar */}
                            <Rect x="10" y="14" width="16" height="3" rx="1.5" fill="#333333"/>
                            <Rect x="10" y="24" width="24" height="3" rx="1.5" fill="#333333"/>
                            <Rect x="10" y="34" width="20" height="3" rx="1.5" fill="#333333"/>
                            {/* El / Tutuş (Hand overlapping card) */}
                            <Circle cx="40" cy="50" r="4" fill={brandWhite} />
                        </Svg>
                    </Animated.View>
                    
                    {/* SAĞ KART */}
                    <Animated.View style={[styles.cardWrapper, rightCardStyle]}>
                        <Svg width="44" height="60" viewBox="0 0 44 60" fill="none">
                            <Rect x="2" y="2" width="40" height="56" rx="6" fill="#0A0A0A" stroke={brandBlue} strokeWidth="2.5"/>
                            <Rect x="10" y="14" width="24" height="3" rx="1.5" fill="#333333"/>
                            <Rect x="10" y="24" width="16" height="3" rx="1.5" fill="#333333"/>
                            <Rect x="10" y="34" width="20" height="3" rx="1.5" fill="#333333"/>
                            {/* El / Tutuş */}
                            <Circle cx="4" cy="50" r="4" fill={brandWhite} />
                        </Svg>
                    </Animated.View>

                    {/* MERKEZ: AMPUL */}
                    <View style={styles.bulbCenter}>
                        {/* Ampul Camı */}
                        <Animated.View style={[styles.absoluteCenter, bulbStyle, { zIndex: 3 }]}>
                            <Svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={brandWhite} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z"/>
                                <Path d="M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
                                {/* Yüz / İfade (Mascot feel) */}
                                <Circle cx="9" cy="11" r="1" fill={brandWhite} stroke="none" />
                                <Circle cx="15" cy="11" r="1" fill={brandWhite} stroke="none" />
                            </Svg>
                        </Animated.View>

                        {/* Kıvılcım (Zihin Işığı) */}
                        <Animated.View style={[styles.absoluteCenter, sparkStyle, { zIndex: 4, marginTop: -8 }]}>
                            <Svg width="22" height="22" viewBox="0 0 24 24" fill={brandBlue}>
                                <Path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6-6.2-4.5-6.2 4.5 2.4-7.6-6.2-4.5h7.6z" />
                            </Svg>
                            <View style={[styles.glowEffect, { backgroundColor: brandBlue }]} />
                        </Animated.View>
                    </View>
                    
                </View>

                {/* Marka Metni */}
                <Animated.View style={[styles.textWrapper, textStyle]}>
                    <Text style={styles.brandText}>LEARNAXIA</Text>
                    <Text style={styles.tagline}>Learn Smart. Learn Fast.</Text>
                </Animated.View>

            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    centerContent: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 180,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    bulbCenter: {
        position: 'absolute',
        width: 90,
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
        backgroundColor: '#000000', // Kolların/kartların merkezden görünmesini gizler
        borderRadius: 45,
    },
    absoluteCenter: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    glowEffect: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        opacity: 0.35,
        zIndex: -1,
    },
    cardWrapper: {
        position: 'absolute',
        zIndex: 1,
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
