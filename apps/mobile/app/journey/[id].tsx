import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInRight, Layout, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { t } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import api from '@/lib/api';

/** Journey slide tipi */
interface JourneySlide {
    title: string;
    content: string;
    peekingQuestion?: {
        question: string;
    } | null;
}

/** Journey veri tipi */
interface Journey {
    id: string;
    title: string;
    slides: JourneySlide[];
}

/** Snapchat-style tek segment pill — animasyonlu dolum */
function StorySegment({ state, flex }: { state: 'done' | 'active' | 'empty'; flex: number }) {
    const fillWidth = useSharedValue(state === 'done' ? 100 : 0);

    useEffect(() => {
        if (state === 'active') {
            fillWidth.value = withTiming(100, { duration: 350 });
        } else if (state === 'done') {
            fillWidth.value = 100;
        } else {
            fillWidth.value = 0;
        }
    }, [state]);

    const fillStyle = useAnimatedStyle(() => ({
        width: `${fillWidth.value}%` as any,
    }));

    return (
        <View style={[styles.storySegment, { flex }]}>
            <Animated.View style={[styles.storySegmentFill, fillStyle]} />
        </View>
    );
}

export default function JourneyPlayerScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { language } = useLanguage();
    const [journey, setJourney] = useState<Journey | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchJourney = async () => {
            try {
                const response = await api.get(`/mobile/journeys/${id}`);
                setJourney(response.data.journey);
            } catch (error) {
                console.error('[JourneyPlayer] Failed to fetch journey:', error);
                setFetchError(true);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchJourney();
    }, [id]);

    /**
     * Slide ilerletme — progress'i backend'e kaydeder.
     * Kaydedme başarısız olsa bile kullanıcı deneyimini bozmaz (fire-and-forget).
     */
    const nextSlide = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!journey) return;

        // Progress'i backend'e kaydet (fire-and-forget, hata kullanıcıyı etkilemez)
        api.post(`/mobile/journeys/${id}/progress`, {
            slideIndex: currentIndex,
        }).catch(() => {
            // Sessizce geç — offline veya network sorunu
        });

        if (currentIndex < journey.slides.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            router.back();
        }
    }, [currentIndex, journey, router, id]);

    const prevSlide = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    if (loading) {
        return (
            <Screen style={styles.centered}>
                <BrandLoader size="lg" label={t('common.loading', language)} />
            </Screen>
        );
    }

    if (fetchError || !journey || !journey.slides || journey.slides.length === 0) {
        return (
            <Screen style={styles.centered}>
                <View style={styles.errorIconWrapper}>
                    <MaterialIcons
                        name={fetchError ? 'wifi-off' : 'playlist-remove'}
                        size={40}
                        color="#475569"
                    />
                </View>
                <Text style={styles.errorTitle}>
                    {fetchError ? 'Yolculuk Yüklenemedi' : 'Yolculuk İçeriği Bulunamadı'}
                </Text>
                <Text style={styles.errorDesc}>
                    {fetchError
                        ? 'İnternet bağlantınızı kontrol edin'
                        : 'Bu yolculuğa henüz içerik eklenmemiş'}
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={18} color="white" />
                    <Text style={styles.backButtonText}>Geri Dön</Text>
                </TouchableOpacity>
            </Screen>
        );
    }

    const currentSlide = journey.slides[currentIndex];

    return (
        <Screen style={styles.screen}>
            <StatusBar barStyle="light-content" />

            {/* ─── Snapchat-style Segmentli Progress Bar ─────────────────────────── */}
            <View style={styles.storyProgressRow}>
                {journey.slides.map((_, i) => (
                    <StorySegment
                        key={i}
                        state={i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'empty'}
                        flex={1}
                    />
                ))}
            </View>

            {/* Header */}
            <View style={styles.headerRow}>
                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.back();
                    }}
                    style={styles.iconBtn}
                >
                    <MaterialIcons name="close" size={24} color="white" />
                </TouchableOpacity>

                <Text style={styles.journeyTitle} numberOfLines={1}>{journey.title}</Text>

                <Text style={styles.progressText}>{currentIndex + 1}/{journey.slides.length}</Text>
            </View>

            {/* Slide Content */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24 }}>
                <Animated.View
                    key={currentIndex}
                    entering={SlideInRight.duration(400)}
                    exiting={FadeIn.duration(200)}
                    layout={Layout.springify()}
                    style={{ paddingVertical: 40 }}
                >
                    <Text style={styles.slideTitle}>{currentSlide.title}</Text>

                    <View style={styles.slideContentCard}>
                        <Text style={styles.slideContent}>{currentSlide.content}</Text>
                    </View>

                    {/* AI Sorusu — peekingQuestion varsa göster */}
                    {currentSlide.peekingQuestion && (
                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={styles.peekingCard}
                        >
                            <View style={styles.peekingHeader}>
                                <MaterialIcons name="auto-awesome" size={20} color="#00D2FF" />
                                <Text style={styles.peekingBadge}>AI SORUSU</Text>
                            </View>
                            <Text style={styles.peekingQuestion}>
                                {currentSlide.peekingQuestion.question}
                            </Text>
                            <Text style={styles.peekingHint}>Cevabı görmek için çalışmaya devam et</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </ScrollView>

            {/* Bottom Controls */}
            <View style={styles.controls}>
                <TouchableOpacity
                    onPress={prevSlide}
                    disabled={currentIndex === 0}
                    style={[styles.navBtn, currentIndex === 0 && { opacity: 0.25 }]}
                >
                    <MaterialIcons name="arrow-back" size={28} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={nextSlide}
                    activeOpacity={0.8}
                    style={styles.nextBtn}
                >
                    <Text style={styles.nextBtnText}>
                        {currentIndex === journey.slides.length - 1 ? 'BİTİR' : 'SIRADAKİ'}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={24} color="white" />
                </TouchableOpacity>

                {/* Simetri için placeholder */}
                <View style={[styles.navBtn, { opacity: 0 }]} />
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#050A14',
    },
    centered: {
        flex: 1,
        backgroundColor: '#050A14',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    // Header
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#090F1D',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#182234',
    },
    journeyTitle: {
        flex: 1,
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 0.5,
        paddingHorizontal: 8,
    },
    progressText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 11,
        fontWeight: '700',
        minWidth: 32,
        textAlign: 'right',
    },
    // Snapchat-style story progress
    storyProgressRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingTop: 16,
        gap: 4,
    },
    storySegment: {
        height: 3,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
        overflow: 'hidden',
    },
    storySegmentFill: {
        height: '100%',
        backgroundColor: '#00D2FF',
        borderRadius: 2,
    },
    // Slide content
    slideTitle: {
        color: '#F8FAFC',
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 24,
        letterSpacing: -0.5,
        lineHeight: 36,
    },
    slideContentCard: {
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        borderWidth: 1,
        borderColor: '#182234',
        borderRadius: 28,
        padding: 24,
        marginBottom: 24,
    },
    slideContent: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 17,
        lineHeight: 30,
        fontWeight: '500',
    },
    // Peeking question
    peekingCard: {
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.15)',
        borderRadius: 28,
        padding: 24,
    },
    peekingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    peekingBadge: {
        color: '#60A5FA',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginLeft: 8,
    },
    peekingQuestion: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        lineHeight: 26,
    },
    peekingHint: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    // Controls
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 24,
    },
    navBtn: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#090F1D',
        borderWidth: 1,
        borderColor: '#182234',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextBtn: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 28,
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    nextBtnText: {
        color: 'white',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginRight: 8,
    },
    // Hata ekranı
    errorIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#090F1D',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#182234',
    },
    errorTitle: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
        textAlign: 'center',
    },
    errorDesc: {
        color: '#64748B',
        fontSize: 13,
        marginBottom: 24,
        textAlign: 'center',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#090F1D',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#182234',
    },
    backButtonText: {
        color: '#F8FAFC',
        fontWeight: '700',
        fontSize: 15,
        marginLeft: 8,
    },
});
