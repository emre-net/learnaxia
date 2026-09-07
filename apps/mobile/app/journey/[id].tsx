import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInRight, Layout, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { t } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import api from '@/lib/api';

interface JourneySlide {
    title: string;
    content: string;
    peekingQuestion?: {
        question: string;
    } | null;
}

interface Journey {
    id: string;
    title: string;
    slides: JourneySlide[];
}

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

    const nextSlide = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!journey) return;

        api.post(`/mobile/journeys/${id}/progress`, {
            slideIndex: currentIndex,
        }).catch(() => {});

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
                    <Ionicons
                        name={fetchError ? 'wifi-outline' : 'document-text-outline'}
                        size={32}
                        color="#64748B"
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
                    <Ionicons name="arrow-back" size={18} color="#F8FAFC" />
                    <Text style={styles.backButtonText}>Geri Dön</Text>
                </TouchableOpacity>
            </Screen>
        );
    }

    const currentSlide = journey.slides[currentIndex];

    return (
        <Screen style={styles.screen}>
            <StatusBar barStyle="light-content" />

            {/* Snapchat-style Segmentli Progress Bar */}
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
                    <Ionicons name="close" size={24} color="#F8FAFC" />
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

                    {/* AI Sorusu */}
                    {currentSlide.peekingQuestion && (
                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={styles.peekingCard}
                        >
                            <View style={styles.peekingHeader}>
                                <Ionicons name="sparkles" size={16} color="#F8FAFC" />
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
                    <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={nextSlide}
                    activeOpacity={0.8}
                    style={styles.nextBtn}
                >
                    <Text style={styles.nextBtnText}>
                        {currentIndex === journey.slides.length - 1 ? 'BİTİR' : 'SIRADAKİ'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#000000" />
                </TouchableOpacity>

                <View style={[styles.navBtn, { opacity: 0 }]} />
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#000000',
    },
    centered: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
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
        borderRadius: 99,
        backgroundColor: '#0A0A0A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#111111',
    },
    journeyTitle: {
        flex: 1,
        color: '#64748B',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 0.5,
        paddingHorizontal: 8,
        textTransform: 'uppercase',
    },
    progressText: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '700',
        minWidth: 32,
        textAlign: 'right',
    },
    storyProgressRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 4,
    },
    storySegment: {
        height: 4,
        borderRadius: 2,
        backgroundColor: '#1E293B',
        overflow: 'hidden',
    },
    storySegmentFill: {
        height: '100%',
        backgroundColor: '#F8FAFC',
        borderRadius: 2,
    },
    slideTitle: {
        color: '#F8FAFC',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 24,
        letterSpacing: -0.5,
        lineHeight: 36,
    },
    slideContentCard: {
        backgroundColor: '#0A0A0A',
        borderWidth: 1,
        borderColor: '#111111',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
    },
    slideContent: {
        color: '#F8FAFC',
        fontSize: 17,
        lineHeight: 28,
        fontWeight: '400',
    },
    peekingCard: {
        backgroundColor: '#0A0A0A',
        borderWidth: 1,
        borderColor: '#111111',
        borderRadius: 24,
        padding: 24,
    },
    peekingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    peekingBadge: {
        color: '#F8FAFC',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginLeft: 8,
    },
    peekingQuestion: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        lineHeight: 26,
    },
    peekingHint: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 48,
        paddingTop: 24,
    },
    navBtn: {
        width: 56,
        height: 56,
        borderRadius: 99,
        backgroundColor: '#0A0A0A',
        borderWidth: 1,
        borderColor: '#111111',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextBtn: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 32,
        height: 56,
        borderRadius: 99,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextBtnText: {
        color: '#000000',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginRight: 8,
    },
    errorIconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#0A0A0A',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#111111',
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
        backgroundColor: '#0A0A0A',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 99,
        borderWidth: 1,
        borderColor: '#111111',
    },
    backButtonText: {
        color: '#F8FAFC',
        fontWeight: '600',
        fontSize: 15,
        marginLeft: 8,
    },
});
